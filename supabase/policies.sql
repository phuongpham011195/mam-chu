-- policies.sql – Mầm Chữ: bật RLS cho 5 bảng, cấp quyền bảng (GRANT) và tạo 11 policy.
-- Theo PRD.md mục 6. Chạy SAU schema.sql. Có thể chạy lại an toàn (drop policy if exists rồi tạo lại).
--
-- Hai vai trò:
--   anon          = khách (dùng anon/publishable key, chưa đăng nhập)
--   authenticated = admin (đã đăng nhập). An toàn chỉ khi ĐÃ TẮT đăng ký công khai
--                   (Authentication > Sign In / Providers > tắt "Allow new users to sign up").

-- ---------------------------------------------------------------- 1. Bật RLS
alter table public.categories  enable row level security;
alter table public.books       enable row level security;
alter table public.reviews     enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- ---------------------------------------------------------------- 2. Quyền bảng (GRANT)
-- Lớp bảo vệ thứ hai bên cạnh RLS: khách chỉ có đúng quyền cần dùng, không hơn.
-- (Hệ quả: khách đọc/sửa/xóa bảng không có quyền sẽ nhận lỗi "permission denied" thay vì 0 dòng.)
revoke all on public.categories, public.books, public.reviews, public.orders, public.order_items
  from anon, authenticated;

grant select          on public.categories, public.books, public.reviews to anon;
grant insert          on public.reviews, public.orders, public.order_items to anon;

grant select, insert, update, delete
  on public.categories, public.books, public.reviews, public.orders, public.order_items
  to authenticated;

-- ---------------------------------------------------------------- 3. Policy
-- Gỡ policy cũ (nếu chạy lại)
drop policy if exists categories_select_public  on public.categories;
drop policy if exists categories_admin_all      on public.categories;
drop policy if exists books_select_anon_active  on public.books;
drop policy if exists books_admin_all           on public.books;
drop policy if exists reviews_select_public     on public.reviews;
drop policy if exists reviews_insert_anon       on public.reviews;
drop policy if exists reviews_admin_all         on public.reviews;
drop policy if exists orders_insert_anon        on public.orders;
drop policy if exists orders_admin_all          on public.orders;
drop policy if exists order_items_insert_anon   on public.order_items;
drop policy if exists order_items_admin_all     on public.order_items;

-- #1  categories – Khách xem thể loại
create policy categories_select_public on public.categories
  for select to anon, authenticated
  using (true);

-- #2  categories – Admin toàn quyền
create policy categories_admin_all on public.categories
  for all to authenticated
  using (true) with check (true);

-- #3  books – Khách xem sách đang bán
create policy books_select_anon_active on public.books
  for select to anon
  using (is_active = true);

-- #4  books – Admin toàn quyền (thấy cả sách ẩn)
create policy books_admin_all on public.books
  for all to authenticated
  using (true) with check (true);

-- #5  reviews – Khách xem đánh giá
create policy reviews_select_public on public.reviews
  for select to anon, authenticated
  using (true);

-- #6  reviews – Khách viết đánh giá (rating 1–5, độ dài tên/nội dung, sách đang bán)
create policy reviews_insert_anon on public.reviews
  for insert to anon
  with check (
    rating between 1 and 5
    and char_length(reviewer_name) between 1 and 60
    and (comment is null or char_length(comment) <= 1000)
    and exists (
      select 1 from public.books b
      where b.id = reviews.book_id and b.is_active = true
    )
  );

-- #7  reviews – Admin toàn quyền
create policy reviews_admin_all on public.reviews
  for all to authenticated
  using (true) with check (true);

-- #8  orders – Khách tạo đơn (chỉ trạng thái "moi", chỉ thanh toán COD)
create policy orders_insert_anon on public.orders
  for insert to anon
  with check (status = 'moi' and payment_method = 'cod');

-- #9  orders – Admin toàn quyền
create policy orders_admin_all on public.orders
  for all to authenticated
  using (true) with check (true);

-- #10 order_items – Khách thêm dòng đơn (số lượng 1–20 và đơn giá = giá bán hiện tại của sách đang bán)
create policy order_items_insert_anon on public.order_items
  for insert to anon
  with check (
    quantity between 1 and 20
    and unit_price = (
      select b.price from public.books b
      where b.id = order_items.book_id and b.is_active = true
    )
  );

-- #11 order_items – Admin toàn quyền
create policy order_items_admin_all on public.order_items
  for all to authenticated
  using (true) with check (true);

-- Khách KHÔNG có policy SELECT/UPDATE/DELETE trên orders, order_items và
-- không có UPDATE/DELETE trên books, reviews, categories => các thao tác đó bị chặn.
