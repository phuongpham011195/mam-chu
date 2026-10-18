# Mầm Chữ – Website nhà sách

> *Gieo chữ hôm nay, gặt tương lai ngày mai.*

Mầm Chữ là thương hiệu **hư cấu** (đồ án cuối khóa Vibe Code). Website giúp phụ huynh chọn sách theo độ tuổi và kỹ năng cho con, đặt hàng thanh toán khi nhận hàng (COD) và để lại đánh giá. Chủ nhà sách quản lý đơn, đánh giá và sách ở trang quản trị.

- **Website:** `https://<tên-tài-khoản>.github.io/<tên-repo>/` *(điền sau khi deploy)*
- **Mã nguồn:** `https://github.com/<tên-tài-khoản>/<tên-repo>` *(điền sau khi đẩy lên)*
- **Dữ liệu trong site là dữ liệu mẫu:** sách, đánh giá, địa chỉ, số điện thoại và chính sách đều là hư cấu.

## Công nghệ

| Hạng mục | Lựa chọn |
|---|---|
| Giao diện | HTML + CSS + JavaScript thuần (ES Modules), nhiều file `.html`. Không framework, không bước build, không `package.json` |
| Định dạng | Tailwind CSS qua CDN (ghim `3.4.16`) + `assets/css/custom.css` |
| Dữ liệu | `supabase-js` `2.45.4` qua CDN (ghim phiên bản), chỉ dùng **anon key** |
| Database | Supabase (PostgreSQL), RLS bật cho cả 5 bảng |
| Xác thực | Supabase Auth, email và mật khẩu (chỉ admin, đã tắt đăng ký công khai) |
| Hosting | GitHub Pages, mọi đường dẫn là đường dẫn tương đối |

## Các trang

| Trang | File | Chức năng |
|---|---|---|
| Trang chủ | `index.html` | Hero, thể loại, sách nổi bật, cách đặt hàng, Góc phụ huynh |
| Danh mục sách | `books.html` | Lọc theo thể loại, tìm theo tên hoặc tác giả (không phân biệt dấu) |
| Chi tiết sách | `book.html?slug=...` | Thông tin sách, giá và giảm giá, xem và viết đánh giá, thêm vào giỏ |
| Giỏ hàng | `cart.html` | Giỏ lưu trong `localStorage`, đặt hàng COD, màn hình xác nhận |
| Về chúng tôi | `about.html` | Câu chuyện thương hiệu, liên hệ, Google Map |
| Chính sách | `chinh-sach.html` | Giao hàng, đổi trả, vận chuyển (trang tĩnh) |
| Quản trị | `admin.html` | Đăng nhập, quản lý đơn hàng, đánh giá và sách |

## Bốn thao tác với database

| Thao tác | Chức năng | Bảng |
|---|---|---|
| Đọc | Xem sách, thể loại, đánh giá, giỏ hàng, danh sách đơn (admin) | `books`, `categories`, `reviews`, `orders`, `order_items` |
| Thêm | Khách đặt hàng, khách viết đánh giá, admin thêm sách | `orders`, `order_items`, `reviews`, `books` |
| Sửa | Admin đổi trạng thái đơn, sửa giá, giá gốc, tồn kho, ẩn hoặc hiện sách | `orders`, `books` |
| Xóa | Admin xóa đơn, xóa đánh giá, xóa sách | `orders`, `order_items`, `reviews`, `books` |

## Cấu trúc thư mục

```
├── index.html, books.html, book.html, cart.html, about.html, chinh-sach.html, admin.html
├── .nojekyll
├── assets/
│   ├── css/custom.css
│   ├── brand/ banners/ covers/        logo, banner, ảnh bìa (SVG)
│   └── js/
│       ├── config.js                  SUPABASE_URL và anon key
│       ├── supabase.js  layout.js  cart.js  utils.js  icons.js
│       └── pages/                     mỗi trang một module: home, books, book, cart-page, about, admin
├── supabase/
│   ├── schema.sql  policies.sql       bảng, ràng buộc, RLS
│   ├── seed.sql  seed_reviews.sql  seed_orders.sql  books.sample.json
│   └── tests/rls-test.sql  rls-test.mjs
├── content/noi-dung-website.md        nội dung chữ mẫu
├── Prompts/                           các prompt đã dùng (báo cáo)
└── PRD.md  DESIGN.md  BAO_CAO.md  README.md
```

## Chạy trên máy

Module ES **không chạy khi mở bằng `file://`**, nên cần một static server (đây không phải bước build).

```powershell
# Cách 1: VS Code → cài tiện ích Live Server → chuột phải index.html → Open with Live Server
# Cách 2: Python
py -m http.server 5500
# rồi mở http://localhost:5500/
```

## Thiết lập Supabase (làm một lần)

1. Tạo project Supabase mới.
2. **SQL Editor:** chạy lần lượt `supabase/schema.sql`, `policies.sql`, `seed.sql`, `seed_reviews.sql`. Muốn có đơn mẫu để thử trang admin thì chạy thêm `seed_orders.sql` (chạy một lần, không chạy lại).
3. **Table Editor:** cả 5 bảng phải hiện "RLS enabled".
4. **Authentication → Sign In / Providers → Email:** tắt **Allow new users to sign up**. Đây là bước bắt buộc, vì quyền admin là "bất kỳ người dùng đã đăng nhập".
5. **Authentication → Users → Add user:** tạo tài khoản admin (tick Auto Confirm User).
6. **Project Settings → API:** chép **Project URL** và khóa **anon / publishable** vào `assets/js/config.js`. Không chép khóa bí mật (secret).
7. Kiểm thử RLS (xem bên dưới).

## Kiểm thử RLS

```powershell
# 1) Trong SQL Editor: dán supabase/tests/rls-test.sql, kết quả phải là "TẤT CẢ PASS"

# 2) Qua API bằng anon key (giống trình duyệt), cần Node 18+:
$env:SUPABASE_URL      = "https://xxxx.supabase.co"
$env:SUPABASE_ANON_KEY = "<anon key>"
$env:ADMIN_EMAIL       = "<email admin>"        # có thể bỏ qua hai dòng này
$env:ADMIN_PASSWORD    = "<mật khẩu admin>"
node supabase/tests/rls-test.mjs
```

**Làm bước 4 (tắt đăng ký công khai) trước khi chạy:** bài test có thử `signUp`; nếu đăng ký còn mở thì nó sẽ tạo thêm một tài khoản thật trong project. Không có `ADMIN_EMAIL` thì bài test chỉ chạy các phép thử không để lại dữ liệu. Dữ liệu thử có nhãn `TEST-RLS` và tự được dọn ở cuối.

## Bảo mật

- Chỉ dùng **anon key** ở trình duyệt. Quyền thật nằm ở **RLS**: khách chỉ đọc sách, thể loại, đánh giá; chỉ thêm đơn, dòng đơn, đánh giá (có kiểm tra giá, số lượng, trạng thái); chỉ admin đã đăng nhập mới sửa và xóa.
- Dữ liệu người dùng nhập luôn được thoát ký tự hoặc gán bằng `textContent`, không chèn trực tiếp vào HTML. Đường dẫn ảnh được lọc, chặn `javascript:`.
- Việc ẩn `admin.html` khi chưa đăng nhập chỉ là giao diện. Bảo vệ thật là Auth và RLS.
- Kiểm tra trước khi đẩy mã lên: khóa trong `config.js` có `role` là `anon`, và không có khóa bí mật nào trong repo (xem PRD mục 9C).

## Hạn chế đã biết

- Đặt hàng là hai lệnh `INSERT` riêng (đơn, rồi dòng đơn) vì không có transaction phía client. Nếu lệnh thứ hai lỗi, giỏ vẫn được giữ, bấm đặt lại sẽ dùng lại đúng mã đơn. Đơn mồ côi (nếu có) do admin xóa.
- Tồn kho không tự trừ khi có đơn; admin cập nhật tay ở tab Sách.
- Không có CAPTCHA hay giới hạn tốc độ phía server (chỉ honeypot và giãn cách 15 giây ở trình duyệt).
- Gói Supabase miễn phí có thể tạm dừng project khi lâu không dùng; hãy mở lại trước ngày chấm.

## Tài liệu trong repo

| File | Nội dung |
|---|---|
| `PRD.md` | Yêu cầu sản phẩm: chức năng, database, RLS, luồng đặt hàng, deploy, tiêu chí hoàn thành |
| `DESIGN.md` | Logo, màu, font, bố cục từng trang, thành phần giao diện, responsive, giọng văn |
| `content/noi-dung-website.md` | Toàn bộ nội dung chữ mẫu |
| `BAO_CAO.md` | Báo cáo đồ án |
| `Prompts/` | Các prompt đã dùng, theo thứ tự (danh mục ở `Prompts/00_Danh-muc-prompt.md`) |
