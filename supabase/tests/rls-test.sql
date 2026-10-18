-- rls-test.sql – Kiểm thử RLS theo PRD.md mục 6.4, chạy ngay trong Supabase SQL Editor (không cần khóa).
--
-- Cách làm: giả lập từng vai trò bằng "set local role anon / authenticated" rồi thử từng thao tác.
-- Chạy SAU schema.sql, policies.sql, seed.sql (và nên có seed_reviews.sql).
-- An toàn cho dữ liệu: thao tác phá hoại (update/delete) luôn bị hoàn tác ngay; các dòng thử nghiệm
-- (tên 'TEST-RLS') được xóa ở cuối. Kết quả là bảng PASS/FAIL ở câu SELECT cuối cùng.
-- Phần "Gọi signUp" không kiểm thử được bằng SQL: dùng rls-test.mjs hoặc kiểm tra tay (xem hướng dẫn).

create temp table t_results (
  n        serial,
  test     text,
  expected text,
  actual   text,
  pass     boolean
);

-- Chạy một câu lệnh dưới vai trò p_role. Trả về 'ok:<số dòng>' hoặc 'err:<mã lỗi>'.
-- keep = false: hoàn tác tác động của câu lệnh sau khi đo (an toàn cho thao tác phá hoại).
create or replace function pg_temp.try(p_role text, p_stmt text, p_keep boolean default false)
returns text language plpgsql as $$
declare n bigint;
begin
  execute format('set local role %I', p_role);
  begin
    execute p_stmt;
    get diagnostics n = row_count;
    if not p_keep then
      raise exception 'rollback' using errcode = 'XX999';
    end if;
    reset role;
    return 'ok:' || n;
  exception when others then
    reset role;
    if sqlstate = 'XX999' then
      return 'ok:' || n;
    end if;
    return 'err:' || sqlstate;
  end;
end $$;

-- Chạy và ghi kết quả. p_expected: ok>0 | ok0 | ok1 | err | blocked (0 dòng hoặc bị từ chối)
create or replace function pg_temp.t(p_test text, p_expected text, p_role text, p_stmt text, p_keep boolean default false)
returns void language plpgsql as $$
declare r text; ok boolean;
begin
  r := pg_temp.try(p_role, p_stmt, p_keep);
  ok := case p_expected
          when 'ok>0'    then r ~ '^ok:[1-9]'
          when 'ok0'     then r = 'ok:0'
          when 'ok1'     then r = 'ok:1'
          when 'err'     then r like 'err:%'
          when 'blocked' then r = 'ok:0' or r like 'err:%'
        end;
  insert into t_results (test, expected, actual, pass) values (p_test, p_expected, r, coalesce(ok, false));
end $$;

-- ---------------------------------------------------------------- Nhóm 0: cấu hình
insert into t_results (test, expected, actual, pass)
select 'RLS đã bật cho cả 5 bảng', '5', count(*)::text, count(*) = 5
from pg_class c join pg_namespace s on s.oid = c.relnamespace
where s.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
  and c.relname in ('categories', 'books', 'reviews', 'orders', 'order_items');

insert into t_results (test, expected, actual, pass)
select 'Có đủ 11 policy', '11', count(*)::text, count(*) = 11
from pg_policies where schemaname = 'public';

-- ---------------------------------------------------------------- Nhóm 1: khách đọc
select pg_temp.t('Khách đọc books',      'ok>0',    'anon', 'select * from public.books');
select pg_temp.t('Khách đọc categories', 'ok>0',    'anon', 'select * from public.categories');
select pg_temp.t('Khách đọc reviews',    'ok>0',    'anon', 'select * from public.reviews');
select pg_temp.t('Khách đọc orders (phải trống hoặc bị chặn)',      'blocked', 'anon', 'select * from public.orders');
select pg_temp.t('Khách đọc order_items (phải trống hoặc bị chặn)', 'blocked', 'anon', 'select * from public.order_items');

-- ---------------------------------------------------------------- Nhóm 2: khách thêm
-- Đối chứng dương: đặt hàng hợp lệ phải thành công (đơn và dòng đơn được giữ lại để Admin thử ở nhóm 4)
select pg_temp.t('Khách thêm orders hợp lệ', 'ok1', 'anon',
  $q$insert into public.orders (id, customer_name, phone, address, payment_method, status)
     values ('eeeeeeee-0000-4000-8000-000000000001', 'TEST-RLS', '0900000099', 'Dia chi thu nghiem RLS', 'cod', 'moi')$q$, true);

select pg_temp.t('Khách thêm orders với status = hoan_tat', 'err', 'anon',
  $q$insert into public.orders (id, customer_name, phone, address, payment_method, status)
     values ('eeeeeeee-0000-4000-8000-000000000002', 'TEST-RLS', '0900000099', 'Dia chi thu nghiem RLS', 'cod', 'hoan_tat')$q$);

select pg_temp.t('Khách thêm orders với payment_method = card', 'err', 'anon',
  $q$insert into public.orders (id, customer_name, phone, address, payment_method, status)
     values ('eeeeeeee-0000-4000-8000-000000000003', 'TEST-RLS', '0900000099', 'Dia chi thu nghiem RLS', 'card', 'moi')$q$);

select pg_temp.t('Khách thêm order_items hợp lệ (đúng giá)', 'ok1', 'anon',
  $q$insert into public.order_items (order_id, book_id, book_title, quantity, unit_price)
     select 'eeeeeeee-0000-4000-8000-000000000001'::uuid, id, title, 1, price
     from public.books where slug = 'chu-soc-nho-tim-mua-thu'$q$, true);

select pg_temp.t('Khách thêm order_items với unit_price = 0', 'err', 'anon',
  $q$insert into public.order_items (order_id, book_id, book_title, quantity, unit_price)
     select 'eeeeeeee-0000-4000-8000-000000000001'::uuid, id, title, 1, 0
     from public.books where slug = 'chu-soc-nho-tim-mua-thu'$q$);

select pg_temp.t('Khách thêm order_items với quantity = 21', 'err', 'anon',
  $q$insert into public.order_items (order_id, book_id, book_title, quantity, unit_price)
     select 'eeeeeeee-0000-4000-8000-000000000001'::uuid, id, title, 21, price
     from public.books where slug = 'chu-soc-nho-tim-mua-thu'$q$);

select pg_temp.t('Khách thêm reviews hợp lệ', 'ok1', 'anon',
  $q$insert into public.reviews (book_id, reviewer_name, rating, comment)
     select id, 'TEST-RLS', 5, 'Kiem thu RLS' from public.books where slug = 'chu-soc-nho-tim-mua-thu'$q$, true);

select pg_temp.t('Khách thêm reviews với rating = 6', 'err', 'anon',
  $q$insert into public.reviews (book_id, reviewer_name, rating, comment)
     select id, 'TEST-RLS', 6, 'Kiem thu RLS' from public.books where slug = 'chu-soc-nho-tim-mua-thu'$q$);

-- ---------------------------------------------------------------- Nhóm 3: khách sửa/xóa (mọi bảng)
select pg_temp.t('Khách UPDATE books',       'blocked', 'anon', 'update public.books set price = 0');
select pg_temp.t('Khách DELETE books',       'blocked', 'anon', 'delete from public.books');
select pg_temp.t('Khách UPDATE categories',  'blocked', 'anon', 'update public.categories set name = ''x''');
select pg_temp.t('Khách DELETE categories',  'blocked', 'anon', 'delete from public.categories');
select pg_temp.t('Khách UPDATE reviews',     'blocked', 'anon', 'update public.reviews set rating = 1');
select pg_temp.t('Khách DELETE reviews',     'blocked', 'anon', 'delete from public.reviews');
select pg_temp.t('Khách UPDATE orders',      'blocked', 'anon', 'update public.orders set status = ''hoan_tat''');
select pg_temp.t('Khách DELETE orders',      'blocked', 'anon', 'delete from public.orders');
select pg_temp.t('Khách UPDATE order_items', 'blocked', 'anon', 'update public.order_items set quantity = 1');
select pg_temp.t('Khách DELETE order_items', 'blocked', 'anon', 'delete from public.order_items');

-- ---------------------------------------------------------------- Nhóm 4: sách ẩn
do $$
declare hid uuid;
begin
  select id into hid from public.books where slug = 'ngan-sach-nho-uoc-mo-lon';
  update public.books set is_active = false where id = hid;
  perform pg_temp.t('Khách không thấy sách đã ẩn', 'ok0', 'anon',
    format('select * from public.books where id = %L', hid));
  perform pg_temp.t('Khách không đánh giá được sách đã ẩn', 'err', 'anon',
    format($q$insert into public.reviews (book_id, reviewer_name, rating) values (%L, 'TEST-RLS', 5)$q$, hid));
  perform pg_temp.t('Admin vẫn thấy sách đã ẩn', 'ok1', 'authenticated',
    format('select * from public.books where id = %L', hid));
  update public.books set is_active = true where id = hid;
end $$;

-- ---------------------------------------------------------------- Nhóm 5: Admin (đã đăng nhập)
select pg_temp.t('Admin đọc đơn vừa tạo', 'ok1', 'authenticated',
  $q$select * from public.orders where id = 'eeeeeeee-0000-4000-8000-000000000001'$q$);

select pg_temp.t('Admin UPDATE orders.status (Mới -> Đang giao)', 'ok1', 'authenticated',
  $q$update public.orders set status = 'dang_giao' where id = 'eeeeeeee-0000-4000-8000-000000000001'$q$, true);

select pg_temp.t('Admin UPDATE books (giá, tồn kho)', 'ok1', 'authenticated',
  $q$update public.books set price = price, stock = stock where slug = 'chu-soc-nho-tim-mua-thu'$q$);

select pg_temp.t('Admin INSERT books', 'ok1', 'authenticated',
  $q$insert into public.books (category_id, title, slug, author, price)
     select id, 'Sach thu nghiem', 'test-rls-sach', 'TEST-RLS', 1000 from public.categories limit 1$q$);

select pg_temp.t('Admin DELETE reviews (đánh giá thử nghiệm)', 'ok1', 'authenticated',
  $q$delete from public.reviews where reviewer_name = 'TEST-RLS'$q$, true);

select pg_temp.t('Admin DELETE orders', 'ok1', 'authenticated',
  $q$delete from public.orders where id = 'eeeeeeee-0000-4000-8000-000000000001'$q$, true);

insert into t_results (test, expected, actual, pass)
select 'Xóa đơn kéo theo xóa các dòng đơn (CASCADE)', '0', count(*)::text, count(*) = 0
from public.order_items where order_id = 'eeeeeeee-0000-4000-8000-000000000001';

-- ---------------------------------------------------------------- Dọn dẹp (phòng khi có bước lỗi)
delete from public.reviews where reviewer_name = 'TEST-RLS';
delete from public.orders  where customer_name = 'TEST-RLS';
delete from public.books   where slug = 'test-rls-sach';

-- ---------------------------------------------------------------- Kết quả (câu SELECT cuối cùng)
select n, test as "Kiểm thử", expected as "Mong đợi", actual as "Thực tế",
       case when pass then 'PASS' else 'FAIL' end as "Kết quả"
from t_results
union all
select 9999, 'TỔNG KẾT', '', count(*) filter (where pass) || '/' || count(*),
       case when bool_and(pass) then 'TẤT CẢ PASS' else 'CÓ LỖI' end
from t_results
order by n;
