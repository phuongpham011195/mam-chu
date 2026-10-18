-- schema.sql – Mầm Chữ: tạo 5 bảng, khóa chính, khóa ngoại, CHECK và chỉ mục.
-- Theo PRD.md mục 5. Chạy ĐẦU TIÊN trong Supabase SQL Editor, rồi tới policies.sql, seed.sql, seed_reviews.sql.
-- Có thể chạy lại an toàn: dùng IF NOT EXISTS, không xóa dữ liệu.
--
-- Muốn làm lại từ đầu (XÓA TOÀN BỘ dữ liệu), bỏ comment khối dưới đây rồi chạy:
--   drop table if exists public.order_items, public.reviews, public.orders, public.books, public.categories cascade;

-- ---------------------------------------------------------------- 5.1 categories
create table if not exists public.categories (
  id          uuid        primary key default gen_random_uuid(),
  name        text        not null unique
                          check (char_length(name) between 1 and 60),
  slug        text        not null unique
                          check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  sort_order  integer     not null default 0,
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------- 5.2 books
create table if not exists public.books (
  id             uuid        primary key default gen_random_uuid(),
  category_id    uuid        not null
                             references public.categories (id) on delete restrict,
  title          text        not null
                             check (char_length(title) between 1 and 200),
  slug           text        not null unique
                             check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  author         text        not null,
  description    text,
  publisher      text,
  publish_year   smallint    check (publish_year between 1900 and 2100),
  pages          integer     check (pages > 0),
  age_min        smallint    check (age_min between 0 and 18),
  age_max        smallint    check (age_max <= 18 and age_max >= age_min),
  price          integer     not null check (price >= 0),
  original_price integer     check (original_price is null or original_price >= price),
  stock          integer     not null default 0 check (stock >= 0),
  cover_url      text,
  is_featured    boolean     not null default false,
  is_active      boolean     not null default true,
  created_at     timestamptz not null default now(),
  -- age_min và age_max cùng rỗng (sách cho phụ huynh) hoặc cùng có giá trị
  constraint books_age_pair_chk check ((age_min is null) = (age_max is null))
);

-- ---------------------------------------------------------------- 5.3 orders
-- id do trình duyệt tạo bằng crypto.randomUUID(), nên KHÔNG có default.
-- Không có cột tổng tiền: tổng = SUM(quantity * unit_price) từ order_items.
create table if not exists public.orders (
  id             uuid        primary key,
  customer_name  text        not null
                             check (char_length(customer_name) between 1 and 100),
  phone          text        not null
                             check (phone ~ '^0[0-9]{9}$'),
  address        text        not null
                             check (char_length(address) between 5 and 300),
  note           text        check (char_length(note) <= 500),
  payment_method text        not null default 'cod'
                             check (payment_method = 'cod'),
  status         text        not null default 'moi'
                             check (status in ('moi', 'dang_giao', 'hoan_tat')),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- 5.4 order_items
create table if not exists public.order_items (
  id          uuid    primary key default gen_random_uuid(),
  order_id    uuid    not null
                      references public.orders (id) on delete cascade,
  book_id     uuid    references public.books (id) on delete set null,
  book_title  text    not null,
  quantity    integer not null check (quantity between 1 and 20),
  unit_price  integer not null check (unit_price >= 0)
);

-- ---------------------------------------------------------------- 5.5 reviews
create table if not exists public.reviews (
  id             uuid        primary key default gen_random_uuid(),
  book_id        uuid        not null
                             references public.books (id) on delete cascade,
  reviewer_name  text        not null
                             check (char_length(reviewer_name) between 1 and 60),
  rating         smallint    not null check (rating between 1 and 5),
  comment        text        check (char_length(comment) <= 1000),
  created_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------- 5.6 chỉ mục
-- books(slug) đã có chỉ mục tự động từ ràng buộc UNIQUE ở trên nên không tạo thêm.
create index if not exists books_category_id_idx  on public.books (category_id);
create index if not exists reviews_book_id_idx    on public.reviews (book_id);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists orders_created_at_idx  on public.orders (created_at);
