# PRD – Website nhà sách **Mầm Chữ**

> *"Gieo chữ hôm nay, gặt tương lai ngày mai."*
> Product Requirements Document – đồ án cuối khóa Vibe Code. Tài liệu này chưa chứa code.

---

## 0. Đánh giá khả thi các ràng buộc (đọc trước)

Toàn bộ ràng buộc **làm được**. Có 8 điểm cần lưu ý, và PRD này đã điều chỉnh theo từng điểm.

| # | Ràng buộc / vấn đề | Mức độ | Kết luận và cách xử lý trong PRD |
|---|---|---|---|
| 1 | "Admin = người dùng đã đăng nhập" nhưng Supabase **mặc định cho phép ai cũng tự đăng ký**. Khi đó người lạ đăng ký xong là có toàn quyền sửa/xóa. | **Nghiêm trọng** | Bắt buộc **tắt "Allow new users to sign up"** trong Supabase Auth và tạo tài khoản admin thủ công trong Dashboard. Có thể thêm lớp bảo vệ: policy admin chỉ chấp nhận email nằm trong danh sách cho phép (xem mục 6.3). |
| 2 | Khách chèn `orders` mà **không có quyền đọc**. Nếu code gọi `.insert().select()` hoặc dùng `upsert`, Postgres cần quyền SELECT nên **sẽ lỗi RLS**. | Cao | Khả thi nếu chỉ gọi `.insert()` không kèm `.select()` (mặc định trả về "minimal"). Id đơn tạo bằng `crypto.randomUUID()` ở client. Màn hình xác nhận lấy dữ liệu từ giỏ hàng trên trình duyệt, không đọc lại từ DB. |
| 3 | Khách chèn `order_items` thì **không xác minh được đơn cha có tồn tại** vì policy không đọc được `orders`. Khóa ngoại thì vẫn được Postgres kiểm tra (FK check bỏ qua RLS). | Trung bình | Chấp nhận. Id đơn là UUID khó đoán nên rủi ro thấp. FK đảm bảo `order_id` phải trỏ tới đơn có thật. |
| 4 | **Khách tự gửi giá và trạng thái** nên có thể gửi `unit_price = 0` hoặc `status = 'hoan_tat'`. | Cao | Khắc phục bằng `WITH CHECK`: `status` chỉ được là `moi`; `unit_price` phải bằng giá hiện tại của sách (đọc từ `books`, khách có quyền đọc); `quantity` từ 1 đến 20. Bỏ cột tổng tiền ở `orders`, tính tổng bằng `SUM` từ `order_items` (xem mục 5.3). |
| 5 | **Tồn kho không tự giảm khi khách đặt hàng**, vì khách không có quyền UPDATE `books`. | Trung bình | Phương án đơn giản: **Admin tự cập nhật tồn kho ở tab Sách (F15)** sau khi xử lý đơn. Giỏ hàng không cho đặt quá số lượng tồn kho đọc được lúc đặt, và sách `stock = 0` không thêm được vào giỏ. Trigger `SECURITY DEFINER` tự trừ kho là tùy chọn, không bắt buộc. |
| 6 | **Spam và dữ liệu rác**: khách thêm được đơn và đánh giá không giới hạn, vì không đăng nhập. | Trung bình | Giảm thiểu bằng ràng buộc `CHECK` (độ dài, khoảng giá trị) và honeypot ở form. Không có CAPTCHA hay rate limit phía server. Với đồ án thì chấp nhận được. |
| 7 | **`<script type="module">` không chạy khi mở file bằng `file://`** (lỗi CORS). | Thấp | Khi phát triển phải chạy một static server cục bộ (ví dụ VS Code Live Server). Điều này không phải bước build. Khi deploy lên GitHub Pages thì không bị ảnh hưởng. |
| 8 | **Tailwind qua CDN** (Play CDN) chỉ là giải pháp "chưa tối ưu cho production": file lớn, có thể nháy giao diện ngắn khi tải. Ngoài ra, **Navbar/Footer dùng chung** không thể `include` mà không có build. | Thấp | Chấp nhận Tailwind CDN và ghim phiên bản. Navbar/Footer được **chèn bằng một module JS dùng chung** (`layout.js`), không dùng `fetch` file HTML để tránh lỗi `file://`. |

**Điểm khác cần biết:**
- `anon key` hiển thị công khai trong mã nguồn là bình thường (đây là "publishable key"). An toàn hoàn toàn dựa vào RLS. Vì vậy **không được** bỏ sót bảng nào chưa bật RLS.
- GitHub Pages phục vụ site tại `/<tên-repo>/` nên mọi đường dẫn phải **tương đối** (đúng như ràng buộc). Không dùng đường dẫn bắt đầu bằng `/`.
- Trang `admin.html` là file tĩnh nên ai cũng mở được. Bảo vệ thật sự nằm ở RLS và Auth, không phải việc "ẩn" trang.
- Gói Supabase miễn phí có thể **tạm dừng project sau thời gian dài không dùng**. Cần mở lại trước ngày chấm.
- Ảnh bìa sách: dùng **đường dẫn ảnh** (file trong repo hoặc URL). Không dùng Supabase Storage nên Admin chỉ nhập đường dẫn ảnh, không upload. Khi `cover_url` rỗng hoặc ảnh lỗi thì hiện `assets/covers/default.svg`.
- Phí vận chuyển: **không tính trong đơn hàng** (xem mục 1, "Ngoài phạm vi"), vì `orders` không lưu tổng tiền hay phí ship.

---

## 1. Mục tiêu

**Mục tiêu sản phẩm:** website bán sách cho thương hiệu hư cấu **Mầm Chữ**, giúp phụ huynh chọn sách đúng độ tuổi và đúng kỹ năng cho con, đặt hàng thanh toán khi nhận hàng, và để lại đánh giá.

**Mục tiêu đồ án:**
- Thể hiện đủ 4 thao tác database (đọc, thêm, sửa, xóa), mỗi thao tác gắn với một chức năng thật.
- Dùng đúng công nghệ yêu cầu và deploy thành công lên GitHub Pages.
- Bảo mật bằng RLS, không lộ khóa bí mật (secret key, khóa quản trị của project).
- Giao diện thống nhất theo nhận diện Mầm Chữ (xem `DESIGN.md`).

**Chỉ số thành công (tự kiểm tra):**
- Khách đặt được 1 đơn hàng hoàn chỉnh từ trang chủ đến bước xác nhận mà không cần đăng nhập.
- Admin xử lý được một đơn từ "Mới" đến "Hoàn tất" và xóa được đánh giá không phù hợp.
- Mọi trang hoạt động trên URL GitHub Pages, tương thích điện thoại.

**Ngoài phạm vi:** thanh toán online, đăng ký tài khoản khách, theo dõi đơn của khách, gửi email, upload ảnh, tự động trừ tồn kho (trừ phần tùy chọn), **tính phí vận chuyển** (chính sách mẫu ghi "miễn phí vận chuyển toàn quốc", tổng đơn = tổng tiền sách), **quản lý thể loại trên giao diện** (4 thể loại cố định nạp bằng `seed.sql`, sửa qua Supabase Dashboard nếu cần), **bộ lọc theo độ tuổi** (độ tuổi chỉ hiển thị bằng chip trên từng sách).

## 2. Thương hiệu và người dùng mục tiêu

| Hạng mục | Nội dung |
|---|---|
| Tên | Mầm Chữ |
| Slogan | Gieo chữ hôm nay, gặt tương lai ngày mai. |
| Định vị | Nhà sách cho bé và cho cả bố mẹ, gồm 4 thể loại: **Thiếu nhi** (truyện tranh, sách khám phá cho bé 3–11 tuổi), **Văn học** (cho tuổi mới lớn 12–18 và cho người lớn), **Kinh tế** (tài chính gia đình, dạy con về tiền), **Kỹ năng** (làm cha mẹ, đồng hành cùng con). Mỗi sách có chip độ tuổi ("3–6 tuổi" hoặc "Dành cho phụ huynh"). Có khối "Góc phụ huynh" ở trang chủ dẫn tới thể loại Kỹ năng. |
| Tính cách | Ấm áp, vui tươi, quan tâm, kiên nhẫn. |
| Giọng văn | Thân thiện, dễ hiểu, hơi tinh nghịch. Xưng "Mầm Chữ" và gọi khách là "bố mẹ". |

**Nhóm người dùng**

| Nhóm | Mô tả | Nhu cầu chính |
|---|---|---|
| **Phụ huynh** (khách, nhóm chính) | 28–45 tuổi, có con nhỏ, dùng điện thoại là chủ yếu. | Tìm sách theo độ tuổi, xem đánh giá, đặt nhanh, trả tiền khi nhận hàng. |
| **Thầy cô, trường học** | Mua sách cho lớp học. | Xem danh mục, đặt số lượng nhiều. |
| **Admin** (chủ nhà sách) | 1–2 người, đã đăng nhập. | Xử lý đơn, kiểm duyệt đánh giá, thêm sách, chỉnh giá và tồn kho. |

## 3. Sơ đồ trang và liên kết

### 3.1 Danh sách trang

| Trang | Đường dẫn (tương đối) | Nội dung chính |
|---|---|---|
| Trang chủ | `index.html` | Hero với slogan, thẻ thể loại, sách nổi bật (`is_featured`), cách đặt hàng 3 bước (`#cach-dat-hang`), Góc phụ huynh, kêu gọi hành động. |
| Danh mục sách | `books.html` | Lưới sách, **lọc theo thể loại**, **ô tìm kiếm**, hiển thị giá và tình trạng còn hàng. |
| Chi tiết sách | `book.html?slug=<slug>` | Thông tin sách, nút "Thêm vào giỏ", **đánh giá** (xem và viết), điểm trung bình, breadcrumb. |
| Giỏ hàng | `cart.html` | Danh sách trong giỏ (`localStorage`), đổi số lượng, xóa, **form đặt hàng COD**, màn hình xác nhận. |
| Về chúng tôi | `about.html` | Logo, câu chuyện thương hiệu, sứ mệnh, giá trị, thông tin liên hệ, **nhúng Google Map**. |
| Chính sách | `chinh-sach.html` | Trang tĩnh: chính sách giao hàng, đổi trả, vận chuyển (dữ liệu mẫu). Không đọc database. |
| Quản trị | `admin.html` | Đăng nhập (email/mật khẩu), 3 tab: Đơn hàng, Đánh giá, Sách. |

### 3.2 Liên kết giữa các trang

```
                         ┌───────────── Navbar + Footer (mọi trang) ─────────────┐
                         │ Trang chủ · Sách · Về chúng tôi · Giỏ hàng (số lượng) │
                         └───────────────────────────────────────────────────────┘

index.html ──thẻ thể loại──▶ books.html?category=<slug>
index.html ──thẻ sách─────▶ book.html?slug=<slug>
index.html ──"Xem tất cả"──▶ books.html
index.html ──Góc phụ huynh──▶ books.html?category=ky-nang
index.html ──banner "Xem cách đặt hàng"──▶ #cach-dat-hang (cuộn tới khối 3 bước ngay trên trang chủ)
books.html ──thẻ sách─────▶ book.html?slug=<slug>
book.html  ──breadcrumb───▶ index.html › books.html › (thể loại) › tên sách
book.html  ──"Thêm vào giỏ"─▶ cập nhật localStorage, hiện thông báo, ở lại trang
book.html  ──"Mua ngay"────▶ cập nhật localStorage ─▶ cart.html
cart.html  ──"Đặt hàng"───▶ xác nhận đơn tại chỗ ─▶ "Tiếp tục mua sắm" ─▶ books.html
about.html ──"Xem sách"───▶ books.html
Footer     ──"Chính sách"──▶ chinh-sach.html
Footer     ──liên kết nhỏ "Quản trị"──▶ admin.html
admin.html ──đăng xuất────▶ index.html
```

**Quy tắc chung:** Navbar có biểu tượng giỏ hàng kèm số lượng (đọc từ `localStorage`). Footer có logo bản trắng, liên kết nhanh (gồm Chính sách), liên hệ, bản đồ thu nhỏ hoặc địa chỉ, và nhãn "● Dữ liệu: Supabase". Trang chi tiết sách có breadcrumb.

## 4. Công nghệ và cấu trúc thư mục

### 4.1 Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Giao diện | HTML5 + JavaScript thuần dùng **ES Modules** (`<script type="module">`), nhiều file `.html`. **Không framework, không build.** |
| Định dạng | **Tailwind CSS qua CDN** (ghim phiên bản) cộng một file `custom.css` nhỏ cho phần Tailwind không làm được. |
| Dữ liệu | **supabase-js v2 qua CDN** dạng ESM (ghim phiên bản). Chỉ dùng `anon key`. |
| Database | Supabase (PostgreSQL), **RLS bật cho cả 5 bảng**. |
| Xác thực | Supabase Auth (email/mật khẩu), tắt đăng ký công khai. |
| Hosting | GitHub Pages (repo public, đường dẫn tương đối). |
| Bản đồ | Google Maps `<iframe>` không cần API key, dạng `https://www.google.com/maps?q=10.7769,106.7009&z=15&output=embed` (tọa độ trung tâm Quận 1, `z=15` là mức phóng to cỡ vài khối phố). Đã thử: cách dùng tên địa danh kèm `z=` cho bản đồ trống, nên dùng tọa độ. Trỏ tới khu vực chung ở Quận 1 vì địa chỉ cửa hàng là mẫu. |
| Biểu tượng, hình minh họa | Biểu tượng là **SVG inline tự viết** trong `assets/js/icons.js` (kính lúp, giỏ hàng, trái tim, khiên, mầm cây, dấu tích, cảnh báo, đóng, menu). Hình minh họa cho trạng thái rỗng và thành công dùng lại `assets/brand/favicon.svg`. Không dùng thư viện biểu tượng bên ngoài. |

### 4.2 Cấu trúc thư mục

```
mam-chu/                      (gốc repo, cũng là gốc GitHub Pages)
├── index.html
├── books.html
├── book.html
├── cart.html
├── about.html
├── chinh-sach.html
├── admin.html
├── .nojekyll                 (tệp rỗng, tránh Jekyll xử lý)
├── assets/
│   ├── css/
│   │   └── custom.css
│   ├── brand/                (logo.svg, logo-horizontal.svg, logo-horizontal-white.svg, favicon.svg)
│   ├── banners/              (banner-1.svg: hero trang chủ; banner-2.svg: đầu trang Về chúng tôi)
│   ├── covers/               (ảnh bìa theo slug: <slug>.svg, và default.svg khi chưa có ảnh)
│   └── js/
│       ├── config.js         (SUPABASE_URL + ANON_KEY; không chứa khóa khác)
│       ├── supabase.js       (tạo client dùng chung)
│       ├── layout.js         (chèn Navbar, Footer, breadcrumb)
│       ├── cart.js           (đọc/ghi giỏ hàng localStorage)
│       ├── utils.js          (định dạng tiền VND, escape HTML, đọc query string, tạo slug)
│       ├── icons.js          (biểu tượng SVG inline)
│       └── pages/
│           ├── home.js
│           ├── books.js
│           ├── book.js
│           ├── cart-page.js
│           ├── about.js
│           └── admin.js
├── supabase/
│   ├── schema.sql            (tạo bảng + ràng buộc)
│   ├── policies.sql          (bật RLS + toàn bộ policy)
│   ├── seed.sql              (dữ liệu mẫu: 4 thể loại, 16 sách)
│   ├── seed_reviews.sql      (10 đánh giá demo, chạy sau seed.sql)
│   ├── seed_orders.sql       (3 đơn hàng demo để thử admin, chạy sau seed.sql)
│   ├── books.sample.json     (cùng dữ liệu 16 sách ở dạng JSON, tên trường theo mục 5.7)
│   └── tests/
│       ├── rls-test.sql      (kiểm thử RLS chạy trong SQL Editor, không cần khóa)
│       └── rls-test.mjs      (kiểm thử RLS qua API bằng anon key, Node 18+)
├── content/
│   └── noi-dung-website.md   (toàn bộ nội dung chữ mẫu cho các trang)
├── Prompts/                  (các prompt đã dùng, phục vụ báo cáo)
├── README.md
├── PRD.md
├── DESIGN.md
└── BAO_CAO.md
```

**Quy ước:** mọi `href`, `src`, `import` đều tương đối (ví dụ `./assets/js/layout.js`, `books.html`). Không dùng `/` ở đầu đường dẫn.

## 5. Cấu trúc database

Toàn bộ khóa chính dùng `uuid`. Tiền tệ lưu bằng số nguyên (VND, không có phần thập phân). Thời gian dùng `timestamptz`.

```
categories 1 ──< books 1 ──< reviews
                   │
                   └──< order_items >── 1 orders
```

### 5.1 Bảng `categories` (thể loại)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | **PK**, default `gen_random_uuid()` | |
| `name` | text | NOT NULL, UNIQUE, độ dài 1–60 | Ví dụ "Kỹ năng" |
| `slug` | text | NOT NULL, UNIQUE, CHECK khớp `^[a-z0-9]+(-[a-z0-9]+)*$` | Dùng cho `books.html?category=`. Bốn giá trị: `van-hoc`, `kinh-te`, `ky-nang`, `thieu-nhi` |
| `description` | text | | Mô tả ngắn |
| `sort_order` | integer | NOT NULL, default 0 | Thứ tự hiển thị |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

### 5.2 Bảng `books` (sách)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | **PK**, default `gen_random_uuid()` | |
| `category_id` | uuid | **FK → `categories(id)`**, NOT NULL, `ON DELETE RESTRICT` | Không xóa thể loại còn sách |
| `title` | text | NOT NULL, độ dài 1–200 | |
| `slug` | text | NOT NULL, UNIQUE, CHECK khớp `^[a-z0-9]+(-[a-z0-9]+)*$` | Dùng cho `book.html?slug=`. Chỉ gồm chữ thường không dấu, số và dấu gạch ngang. Form Admin tự sinh từ tên sách (bỏ dấu) và cho sửa |
| `author` | text | NOT NULL | |
| `description` | text | | Giới thiệu sách |
| `publisher` | text | Cho phép NULL | Nhà xuất bản |
| `publish_year` | smallint | Cho phép NULL, CHECK 1900–2100 | Năm xuất bản |
| `pages` | integer | Cho phép NULL, CHECK `> 0` | Số trang |
| `age_min` | smallint | Cho phép NULL, CHECK 0–18 | Độ tuổi tối thiểu. NULL = sách dành cho phụ huynh/người lớn |
| `age_max` | smallint | Cho phép NULL, CHECK `>= age_min` và `<= 18` | Độ tuổi tối đa. Có thêm CHECK bảng: `(age_min IS NULL) = (age_max IS NULL)` (cùng rỗng hoặc cùng có giá trị) |
| `price` | integer | NOT NULL, CHECK `>= 0` | Giá bán hiện tại (VND) |
| `original_price` | integer | Cho phép NULL, CHECK `original_price IS NULL OR original_price >= price` | Giá gốc (VND). NULL = không giảm giá. Khi `original_price > price` giao diện hiện giá gốc gạch ngang và badge giảm giá "-X%" |
| `stock` | integer | NOT NULL, default 0, CHECK `>= 0` | Tồn kho |
| `cover_url` | text | | Đường dẫn ảnh (tương đối hoặc URL) |
| `is_featured` | boolean | NOT NULL, default `false` | `true` = hiện ở khối "Sách nổi bật" trên trang chủ |
| `is_active` | boolean | NOT NULL, default `true` | `false` = ẩn khỏi khách |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

### 5.3 Bảng `orders` (đơn hàng)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | **PK** | **Do trình duyệt tạo bằng `crypto.randomUUID()`**, không phụ thuộc giá trị mặc định |
| `customer_name` | text | NOT NULL, độ dài 1–100 | |
| `phone` | text | NOT NULL, CHECK khớp `^0[0-9]{9}$` | Số điện thoại VN: 10 chữ số, bắt đầu bằng 0, không dấu cách. Form tự bỏ khoảng trắng và dấu chấm trước khi gửi |
| `address` | text | NOT NULL, độ dài 5–300 | |
| `note` | text | độ dài ≤ 500 | |
| `payment_method` | text | NOT NULL, default `'cod'`, CHECK = `'cod'` | Chỉ thanh toán khi nhận hàng |
| `status` | text | NOT NULL, default `'moi'`, CHECK IN (`'moi'`, `'dang_giao'`, `'hoan_tat'`) | Hiển thị: Mới / Đang giao / Hoàn tất |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

> **Không có cột tổng tiền** để khách không thể gửi tổng sai. Admin xem tổng bằng `SUM(quantity * unit_price)` từ `order_items`, tính ở JS hoặc qua một view `security_invoker` chỉ đọc được khi đã đăng nhập.

### 5.4 Bảng `order_items` (chi tiết đơn)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | **PK**, default `gen_random_uuid()` | |
| `order_id` | uuid | **FK → `orders(id)`**, NOT NULL, `ON DELETE CASCADE` | Xóa đơn thì xóa luôn các dòng |
| `book_id` | uuid | **FK → `books(id)`**, `ON DELETE SET NULL` | Cho phép xóa sách cũ mà không mất lịch sử đơn |
| `book_title` | text | NOT NULL | Ảnh chụp tên sách lúc đặt |
| `quantity` | integer | NOT NULL, CHECK 1–20 | |
| `unit_price` | integer | NOT NULL, CHECK `>= 0` | Giá lúc đặt (phải khớp giá hiện tại, xem policy) |

### 5.5 Bảng `reviews` (đánh giá)

| Cột | Kiểu | Ràng buộc | Ghi chú |
|---|---|---|---|
| `id` | uuid | **PK**, default `gen_random_uuid()` | |
| `book_id` | uuid | **FK → `books(id)`**, NOT NULL, `ON DELETE CASCADE` | Xóa sách thì xóa đánh giá |
| `reviewer_name` | text | NOT NULL, độ dài 1–60 | |
| `rating` | smallint | NOT NULL, CHECK 1–5 | |
| `comment` | text | độ dài ≤ 1000 | |
| `created_at` | timestamptz | NOT NULL, default `now()` | |

### 5.6 Chỉ mục gợi ý

`books(slug)`, `books(category_id)`, `reviews(book_id)`, `order_items(order_id)`, `orders(created_at)`.

### 5.7 Quy ước tên trường: JSON mẫu và database

`supabase/books.sample.json` dùng tên trường theo đề bài dữ liệu mẫu; `seed.sql` đổi sang tên cột database như sau. **Lưu ý riêng cho `price`: ý nghĩa ngược nhau.**

| JSON (`books.sample.json`) | Cột database (`books`) | Ghi chú |
|---|---|---|
| `id` | `id` | Giống nhau |
| `slug`, `title`, `author`, `publisher`, `pages`, `description`, `stock`, `is_featured`, `age_min`, `age_max` | cùng tên | Giống nhau |
| `year` | `publish_year` | Đổi tên |
| `category` (tên thể loại, ví dụ "Kỹ năng") | `category_id` (uuid) | `seed.sql` tra `categories.id` theo slug thể loại |
| `cover_image` | `cover_url` | Đổi tên |
| `price` (**giá gốc**) và `sale_price` (giá khi giảm, có thể null) | `price` (**giá bán thực tế**) và `original_price` | Nếu `sale_price` có: `price` = `sale_price`, `original_price` = `price` JSON. Nếu `sale_price` null: `price` = `price` JSON, `original_price` = NULL |
| (không có) | `is_active`, `created_at` | `seed.sql` đặt `is_active = true`, `created_at` lấy mặc định |

Khi viết code giao diện **chỉ dùng tên cột database**; file JSON chỉ là dữ liệu mẫu để xem và đối chiếu.

## 6. RLS policy

**Nguyên tắc:** `ENABLE ROW LEVEL SECURITY` cho cả 5 bảng. Không có policy cho thao tác nào thì thao tác đó bị chặn. Có hai vai trò: **khách** (role `anon`) và **admin** (role `authenticated`).

### 6.1 Danh sách policy

| # | Bảng | Tên policy | Thao tác | Vai trò | Điều kiện |
|---|---|---|---|---|---|
| 1 | `categories` | Khách xem thể loại | SELECT | anon, authenticated | `USING (true)` |
| 2 | `categories` | Admin toàn quyền | ALL | authenticated | `USING (true) WITH CHECK (true)` |
| 3 | `books` | Khách xem sách đang bán | SELECT | anon | `USING (is_active = true)` |
| 4 | `books` | Admin toàn quyền | ALL | authenticated | `USING (true) WITH CHECK (true)` (thấy cả sách ẩn) |
| 5 | `reviews` | Khách xem đánh giá | SELECT | anon, authenticated | `USING (true)` |
| 6 | `reviews` | Khách viết đánh giá | INSERT | anon | `WITH CHECK`: `rating` 1–5, tên và nội dung đúng độ dài, `book_id` thuộc sách đang bán |
| 7 | `reviews` | Admin toàn quyền | ALL | authenticated | `USING (true) WITH CHECK (true)` |
| 8 | `orders` | Khách tạo đơn | INSERT | anon | `WITH CHECK (status = 'moi' AND payment_method = 'cod')` |
| 9 | `orders` | Admin toàn quyền | ALL | authenticated | `USING (true) WITH CHECK (true)` |
| 10 | `order_items` | Khách thêm dòng đơn | INSERT | anon | `WITH CHECK`: `quantity` 1–20 **và** `unit_price` bằng `price` hiện tại của sách đang bán có `id = book_id` |
| 11 | `order_items` | Admin toàn quyền | ALL | authenticated | `USING (true) WITH CHECK (true)` |

**Hệ quả quan trọng:**
- Khách **không có** policy SELECT, UPDATE, DELETE trên `orders` và `order_items`. Vì vậy khách không đọc được đơn của ai, kể cả đơn của mình.
- Khách **không có** UPDATE, DELETE trên `reviews` và `books`.
- Khách đặt hàng chỉ dùng `.insert()` không kèm `.select()`.
- Policy #3 và #4 cùng là SELECT cho role khác nhau nên không xung đột.
- Policy #10 đọc bảng `books` ngay trong `WITH CHECK`. Điều này chạy được vì khách có quyền SELECT sách đang bán (policy #3).

### 6.2 Bảo vệ vai trò Admin (bắt buộc)

1. Trong Supabase: **Authentication → Providers → Email → tắt "Allow new users to sign up"**.
2. Tạo tài khoản admin thủ công trong Dashboard (**Authentication → Users → Add user**).
3. Kiểm tra: dùng anon key gọi `signUp` phải bị từ chối.

### 6.3 Lớp bảo vệ tùy chọn

Nếu muốn chắc chắn hơn, đổi điều kiện của các policy "Admin toàn quyền" từ `true` thành "email trong JWT nằm trong danh sách admin cho phép". Cách này không cần thêm bảng và vẫn hợp với ràng buộc "mọi giới hạn bằng RLS".

### 6.4 Kiểm thử policy (bằng anon key)

| Kiểm thử | Kết quả mong đợi |
|---|---|
| Đọc `books`, `categories`, `reviews` | Thành công |
| Đọc `orders`, `order_items` | Không đọc được: trả về rỗng (0 dòng) **hoặc** lỗi "permission denied" (với `policies.sql` hiện tại là lỗi 42501, HTTP 401/403) |
| Thêm `orders` với `status = 'hoan_tat'` | **Bị từ chối** |
| Thêm `order_items` với `unit_price = 0` | **Bị từ chối** |
| Thêm `reviews` với `rating = 6` | **Bị từ chối** |
| UPDATE hoặc DELETE bất kỳ bảng nào | Không có dòng nào bị ảnh hưởng (0 dòng hoặc bị từ chối) |
| Đăng nhập admin rồi UPDATE `orders.status` | Thành công |
| Gọi `signUp` | **Bị từ chối** |

**Hai bộ kiểm thử có sẵn trong `supabase/tests/`:**
- `rls-test.sql`: dán vào SQL Editor và chạy, không cần khóa. Giả lập vai trò khách và admin, thử toàn bộ bảng trên và một số phép thử thêm (sách đã ẩn, số lượng 21, thanh toán không phải COD). Thao tác phá hoại luôn được hoàn tác. Không kiểm thử được `signUp`.
- `rls-test.mjs`: chạy bằng Node 18+, gọi API thật bằng anon key như trình duyệt, gồm cả `signUp`. Cách chạy ở đầu file.

### 6.5 Quyền bảng (GRANT)

Ngoài RLS, `policies.sql` thu hồi mọi quyền mặc định rồi cấp lại đúng mức cần thiết: khách (`anon`) chỉ có SELECT trên `categories`, `books`, `reviews` và INSERT trên `reviews`, `orders`, `order_items`; admin (`authenticated`) có toàn quyền trên 5 bảng. Nhờ vậy khách thử đọc `orders` sẽ nhận lỗi "permission denied" (không chỉ là danh sách rỗng), và mọi bảng mới tạo sau này không tự mở cho khách.

## 7. Chức năng, thao tác database và trang tương ứng

| ID | Chức năng | Thao tác DB | Bảng | Trang | Vai trò |
|---|---|---|---|---|---|
| F01 | Hiển thị thể loại | **SELECT** | `categories` | `index.html`, `books.html` | Khách |
| F02 | Hiển thị sách nổi bật (`is_featured`, tối đa 8) ở trang chủ và lưới sách ở danh mục (sắp mặc định: nổi bật trước, rồi theo tên A–Z). Thẻ sách **không** hiện sao đánh giá | **SELECT** | `books` | `index.html`, `books.html` | Khách |
| F03 | Lọc theo thể loại và tìm kiếm theo tên/tác giả (không phân biệt hoa thường **và dấu**: gõ "mua thang bay" vẫn ra "Mưa Tháng Bảy"). Cách làm: tải một lần các sách đang bán (SELECT, sắp nổi bật trước rồi A–Z) rồi lọc ngay trong trình duyệt; bộ lọc được ghi trên URL (`?category=`, `?q=`) | **SELECT** | `books`, `categories` | `books.html` | Khách |
| F04 | Xem chi tiết sách theo `slug` | **SELECT** | `books`, `categories` | `book.html` | Khách |
| F05 | Hiển thị đánh giá và điểm trung bình (tính ở JS). Chỉ hiện ở trang chi tiết; có ghi chú "dữ liệu demo" | **SELECT** | `reviews` | `book.html` | Khách |
| F06 | Viết đánh giá, chấm 1–5 sao. Có ô chống spam (honeypot) và giãn cách tối thiểu 15 giây giữa hai lần gửi từ cùng trình duyệt | **INSERT** | `reviews` | `book.html` | Khách |
| F07 | Giỏ hàng: thêm, đổi số lượng, xóa; sách `stock = 0` không thêm được; đối chiếu giá và tồn kho hiện tại trước khi đặt, không cho đặt quá tồn kho | **SELECT** (giỏ lưu `localStorage`) | `books` | `book.html`, `cart.html` | Khách |
| F08 | Đặt hàng COD: tạo `id` đơn bằng `crypto.randomUUID()`, chèn đơn rồi chèn các dòng | **INSERT** | `orders`, `order_items` | `cart.html` | Khách |
| F09 | Đăng nhập, đăng xuất admin | Supabase Auth | `auth.users` | `admin.html` | Admin |
| F10 | Xem danh sách đơn kèm chi tiết và tổng tiền, lọc theo trạng thái | **SELECT** | `orders`, `order_items` | `admin.html` | Admin |
| F11 | Đổi trạng thái đơn: Mới → Đang giao → Hoàn tất | **UPDATE** | `orders` | `admin.html` | Admin |
| F12 | Xóa đơn (xóa luôn các dòng đơn) | **DELETE** | `orders`, `order_items` | `admin.html` | Admin |
| F13 | Xem và xóa đánh giá không phù hợp | **SELECT**, **DELETE** | `reviews` | `admin.html` | Admin |
| F14 | Thêm sách mới (gồm giá bán và giá gốc tùy chọn; slug tự sinh từ tên sách, kiểm tra không trùng) | **INSERT** | `books` | `admin.html` | Admin |
| F15 | Sửa giá bán, giá gốc (đặt giảm giá) và tồn kho (Admin cập nhật tay sau khi xử lý đơn); ẩn/hiện sách | **UPDATE** | `books` | `admin.html` | Admin |
| F16 | Xóa sách (có hộp thoại xác nhận). Đánh giá của sách bị xóa theo (CASCADE); dòng đơn cũ giữ lại với `book_id` rỗng | **DELETE** | `books`, `reviews` | `admin.html` | Admin |
| F17 | Hiển thị giá gốc gạch ngang và badge giảm giá "-X%" khi `original_price > price` (tính ở JS) | **SELECT** | `books` | `index.html`, `books.html`, `book.html`, `cart.html` | Khách |
| F18 | Nhúng Google Map (khu vực chung ở Quận 1) | — | — | `about.html`, Footer | Khách |
| F19 | Navbar, Footer (có liên kết Chính sách), breadcrumb, số lượng giỏ hàng, nhãn "● Dữ liệu: Supabase" (xanh nếu truy vấn dữ liệu của trang thành công, xám nếu lỗi; không có truy vấn riêng) | — | — | Mọi trang | Khách |
| F20 | Trang Chính sách tĩnh (giao hàng, đổi trả, vận chuyển miễn phí; dữ liệu mẫu) | — | — | `chinh-sach.html` | Khách |

**Đối chiếu yêu cầu 4 thao tác**

| Thao tác | Chức năng gắn kèm |
|---|---|
| **Đọc** | F02, F05 (hiển thị sách và đánh giá) |
| **Thêm** | F08 (đặt hàng), F06 (viết đánh giá), F14 (Admin thêm sách) |
| **Sửa** | F11 (đổi trạng thái đơn), F15 (sửa giá, giá gốc và tồn kho) |
| **Xóa** | F12 (xóa đơn), F13 (xóa đánh giá không phù hợp), F16 (xóa sách) |

### 7.1 Luồng đặt hàng (F07 → F08)

1. Khách thêm sách vào giỏ. Giỏ lưu trong `localStorage` gồm `book_id`, `slug`, `quantity` và `price` (giá khách nhìn thấy lúc thêm). `price` **chỉ dùng để so sánh và báo "giá đã đổi"**, không bao giờ dùng để tính tiền hay gửi lên database.
2. Ở `cart.html`, hệ thống **đọc lại giá và tồn kho hiện tại** từ `books`, báo nếu giá đổi (so với `price` trong giỏ), tự điều chỉnh số lượng nếu vượt tồn kho, và đánh dấu sách hết hàng hoặc không còn bán (khóa nút "Đặt hàng" cho tới khi khách xóa các dòng đó). Ngay trước khi gửi đơn, hệ thống đọc lại một lần nữa; nếu giá hoặc tồn kho vừa đổi thì dừng để khách xem lại.
3. Khách điền họ tên, số điện thoại, địa chỉ, ghi chú. Phương thức thanh toán cố định "Thanh toán khi nhận hàng".
4. Khi bấm "Đặt hàng": tạo `orderId = crypto.randomUUID()`, **INSERT `orders`**, rồi **INSERT `order_items`** (một lần, nhiều dòng) với `unit_price` bằng giá vừa đọc.
5. Thành công: xóa giỏ, hiện màn hình xác nhận với mã đơn rút gọn (8 ký tự đầu của UUID) và tóm tắt lấy từ dữ liệu giỏ trên trình duyệt.
6. Nếu chèn `order_items` thất bại sau khi `orders` đã chèn thì báo lỗi, giữ giỏ hàng để khách thử lại. Khách không xóa được đơn mồ côi, Admin sẽ xóa. Đây là điểm yếu đã biết khi không có transaction phía client. Để không sinh thêm đơn mồ côi, khi khách bấm "Đặt hàng" lại **với cùng thông tin** thì dùng lại đúng `orderId` cũ và chỉ chèn lại `order_items`; chỉ khi khách đổi thông tin nhận hàng mới tạo đơn mới (đơn cũ ở lại cho Admin xóa).

**Quy tắc cứng:** ở cả hai lệnh chèn chỉ gọi `.insert(...)`, **không nối `.select()`** (khách không có quyền đọc `orders`/`order_items`). Số điện thoại được chuẩn hóa trước khi gửi (bỏ khoảng trắng, dấu chấm, gạch; `+84908…` thành `0908…`). `crypto.randomUUID()` có dự phòng cho trình duyệt cũ.

## 8. Yêu cầu phi chức năng

| Nhóm | Yêu cầu |
|---|---|
| **Bảo mật** | Chỉ dùng `anon key` trong `config.js`. Không có khóa bí mật (secret key, khóa quản trị "service role") ở bất kỳ file nào, kể cả lịch sử Git. RLS bật cho cả 5 bảng. |
| **Chống XSS** | Tên, bình luận, địa chỉ do người dùng nhập khi hiển thị phải dùng `textContent` hoặc hàm escape. **Không** gán thẳng vào `innerHTML`. |
| **Hiển thị** | Responsive, ưu tiên điện thoại (từ 360 px). Có trạng thái đang tải, trạng thái rỗng, và thông báo lỗi dễ hiểu (tiếng Việt). |
| **Hiệu năng** | Trang đầu tải dưới 3 giây trên mạng thường. Chỉ tải `supabase-js` ở trang cần dùng. |
| **Khả dụng** | Có `alt` cho ảnh, nhãn cho ô nhập, tương phản màu đủ đọc, dùng được bằng bàn phím. |
| **Tương thích** | Chrome, Edge, Safari, Firefox bản mới (cần hỗ trợ ES Modules). |
| **Khả bảo trì** | Mỗi trang một module JS riêng, dùng chung `supabase.js`, `layout.js`, `cart.js`, `utils.js`. |

## 9. Các bước deploy lên GitHub Pages

**A. Chuẩn bị Supabase**
1. Tạo project Supabase mới.
2. Mở **SQL Editor** và chạy lần lượt `schema.sql`, `policies.sql`, `seed.sql`, `seed_reviews.sql`. Nếu muốn có đơn mẫu để thử trang admin thì chạy thêm `seed_orders.sql` (xóa đơn demo trước khi nộp nếu không muốn giữ).
3. Kiểm tra trong **Table Editor** rằng cả 5 bảng đều hiện "RLS enabled".
4. **Authentication → Providers → Email**: tắt đăng ký công khai (mục 6.2).
5. **Authentication → Users → Add user**: tạo tài khoản admin.
6. **Project Settings → API**: chép **Project URL** và **anon public key** (tuyệt đối không chép khóa bí mật `secret` / "service role").
7. Chạy kiểm thử RLS: dán `supabase/tests/rls-test.sql` vào SQL Editor (kết quả phải là "TẤT CẢ PASS"), và chạy `supabase/tests/rls-test.mjs` bằng Node (kiểm tra cả `signUp`). Cách chạy ở mục 6.4.

**B. Cấu hình mã nguồn**
1. Điền URL và `anon key` vào `assets/js/config.js`.
2. Kiểm tra mọi đường dẫn đều tương đối.
3. Chạy thử cục bộ bằng static server (không mở bằng `file://`). Đi qua toàn bộ tiêu chí ở mục 10.

**C. Đẩy lên GitHub**
1. Tạo repo **public** trên GitHub.
2. Rà soát: tìm trong repo tên khóa quản trị và tiền tố khóa bí mật mới của Supabase, kết quả phải bằng 0 (trừ thư mục `Prompts/`, nơi lưu nguyên văn prompt có nhắc tên khóa). Lệnh gợi ý: `Select-String -Pattern "service_ro[l]e|sb_secre[t]_" -Path (Get-ChildItem -Recurse -File -Exclude *.pdf | Where-Object FullName -notmatch "\\Prompts\\")` (cặp `[l]` để chính dòng lệnh không bị tính là kết quả). Kiểm thêm khóa trong `config.js` có `role` là `anon` (giải mã phần giữa của JWT).
3. `git init`, `git add`, `git commit`, `git remote add origin ...`, `git push` lên nhánh `main`.

**D. Bật GitHub Pages**
1. Repo → **Settings → Pages**.
2. **Source:** Deploy from a branch → nhánh `main`, thư mục `/ (root)` → Save.
3. Chờ 1–2 phút. Địa chỉ có dạng `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

**E. Kiểm tra sau deploy**
1. Mở từng trang trên URL thật và kiểm tra Console không có lỗi 404 hoặc CORS.
2. Chạy lại bảng kiểm thử policy (mục 6.4) với anon key.
3. Đặt thử một đơn thật, đăng nhập admin xử lý đơn đó, rồi xóa đơn thử.
4. Chụp ảnh màn hình cho báo cáo.

## 10. Tiêu chí hoàn thành

**Công nghệ và deploy**
- [ ] Toàn bộ là HTML, CSS, JS thuần (ES Modules), không framework, không bước build, không `package.json` bắt buộc.
- [ ] Tailwind và `supabase-js` nạp qua CDN, có ghim phiên bản.
- [ ] Mọi đường dẫn tương đối. Site chạy đúng tại `https://<user>.github.io/<repo>/`.
- [ ] Repo GitHub public, có `README.md`, `PRD.md`, `DESIGN.md`, `BAO_CAO.md`, thư mục `supabase/` và `Prompts/`.

**Trang và giao diện**
- [ ] Đủ 7 trang theo mục 3 (6 trang chính + `chinh-sach.html`). `book.html` đọc đúng `slug` từ query string; slug không tồn tại thì hiện thông báo thân thiện.
- [ ] Navbar và Footer giống nhau trên mọi trang. Số lượng giỏ hàng cập nhật đúng. Trang chi tiết có breadcrumb.
- [ ] Logo dùng thống nhất (Navbar, Footer, trang Về chúng tôi, favicon).
- [ ] `about.html` nhúng Google Map hiển thị được.
- [ ] Dữ liệu mẫu (đánh giá, thông tin liên hệ, chính sách) có ghi chú "dữ liệu mẫu/demo" trên giao diện.
- [ ] Footer có liên kết Chính sách; logo bản trắng hiển thị rõ trên nền xanh ngọc tối.
- [ ] Sách hết hàng (`stock = 0`) hiện "Hết hàng" và không thêm được vào giỏ; sách còn 1–5 cuốn hiện "Chỉ còn N".
- [ ] Dùng được trên điện thoại (360 px) và máy tính.

**Database và bảo mật**
- [ ] Đủ 5 bảng đúng cấu trúc mục 5, có khóa chính, khóa ngoại và ràng buộc `CHECK`.
- [ ] RLS bật cho cả 5 bảng. Bảng kiểm thử policy (mục 6.4) cho kết quả đúng 100%.
- [ ] Không có khóa bí mật (secret / "service role") ở bất kỳ đâu trong repo; khóa trong `config.js` có `role` là `anon`.
- [ ] Đã tắt đăng ký công khai. Chỉ tài khoản admin tạo thủ công đăng nhập được.
- [ ] Nội dung người dùng nhập không thể chèn HTML hay script.

**Chức năng (4 thao tác)**
- [ ] **Đọc:** trang chủ, danh mục và chi tiết hiển thị sách và đánh giá từ Supabase. Lọc thể loại và tìm kiếm chạy đúng.
- [ ] **Thêm:** khách đặt hàng được (`orders` và `order_items`, id tạo bằng `crypto.randomUUID()`, không cần quyền đọc `orders`); khách viết được đánh giá; Admin thêm được sách.
- [ ] **Sửa:** Admin đổi trạng thái đơn Mới → Đang giao → Hoàn tất; Admin sửa được giá, giá gốc và tồn kho.
- [ ] Sách có `original_price > price` hiện giá gốc gạch ngang và badge giảm giá đúng phần trăm; sách không có giá gốc thì không hiện badge.
- [ ] **Xóa:** Admin xóa được đơn (kèm các dòng đơn), xóa được đánh giá không phù hợp và xóa được sách.
- [ ] Giỏ hàng giữ nguyên sau khi tải lại trang; đặt hàng thành công thì giỏ được xóa.

**Báo cáo**
- [ ] `BAO_CAO.md` và file PDF có đủ: mô tả dự án, logo, các trang kèm ảnh chụp, bảng database, danh sách chức năng gắn thao tác DB (có ảnh minh họa đọc, thêm, sửa, xóa), mô tả các file `.md`, link GitHub và link website.
- [ ] Các prompt đã dùng được lưu trong thư mục `Prompts/`.
