# Báo cáo đồ án – Website nhà sách Mầm Chữ

**Học viên:** *(điền họ tên)* · **Lớp:** Vibe Code · **Ngày nộp:** *(điền)*

- **Link website:** *(điền, dạng `https://<tên-tài-khoản>.github.io/<tên-repo>/`)*
- **Link GitHub:** *(điền, dạng `https://github.com/<tên-tài-khoản>/<tên-repo>`)*

> Các mục có dấu **[ẢNH]** cần chèn ảnh chụp màn hình từ website đã deploy (PRD mục 9E, bước 4). Tên file ảnh gợi ý nằm trong ngoặc.

---

## 1. Mô tả dự án

**Mầm Chữ** là thương hiệu nhà sách hư cấu, slogan *"Gieo chữ hôm nay, gặt tương lai ngày mai."* Website giúp phụ huynh chọn sách đúng độ tuổi và đúng kỹ năng cho con, đặt hàng thanh toán khi nhận hàng và để lại đánh giá. Chủ nhà sách (admin) xử lý đơn, kiểm duyệt đánh giá, thêm sách và chỉnh giá, tồn kho.

- 4 thể loại: Thiếu nhi, Văn học, Kinh tế, Kỹ năng. 16 cuốn sách hư cấu, 10 đánh giá demo, 3 đơn demo.
- Công nghệ: HTML + CSS + JavaScript thuần (ES Modules), Tailwind CSS qua CDN, `supabase-js` qua CDN, Supabase (PostgreSQL + Auth), GitHub Pages. Không framework, không bước build.
- Quy trình làm việc: toàn bộ tài liệu và code được tạo bằng prompt (vibe code). Các prompt được lưu nguyên văn trong thư mục `Prompts/`.

## 2. Logo và nhận diện

Bộ logo SVG tự tạo: `assets/brand/logo.svg` (dọc), `logo-horizontal.svg` (Navbar), `logo-horizontal-white.svg` (Footer, nền xanh ngọc tối), `favicon.svg`. Màu chủ đạo xanh ngọc `#0F766E`, điểm nhấn vàng nắng `#F5B82E`, nền kem `#FFFBF2`; font Baloo 2 (tiêu đề) và Nunito (nội dung). Chi tiết ở `DESIGN.md`.

**[ẢNH]** Logo các phiên bản (`anh/logo.png`).

## 3. Các trang và ảnh chụp

| Trang | Đường dẫn | Nội dung | Ảnh |
|---|---|---|---|
| Trang chủ | `index.html` | Hero, thể loại, sách nổi bật, 3 bước đặt hàng, Góc phụ huynh | **[ẢNH]** `anh/trang-chu.png` |
| Danh mục sách | `books.html` | Lọc thể loại, tìm kiếm không phân biệt dấu, badge giảm giá, "Hết hàng", "Chỉ còn N" | **[ẢNH]** `anh/danh-muc.png` |
| Chi tiết sách | `book.html?slug=...` | Thông tin, giá, đánh giá, thêm vào giỏ, breadcrumb | **[ẢNH]** `anh/chi-tiet.png` |
| Giỏ hàng | `cart.html` | Đổi số lượng, form COD, màn hình xác nhận | **[ẢNH]** `anh/gio-hang.png`, `anh/xac-nhan-don.png` |
| Về chúng tôi | `about.html` | Câu chuyện, liên hệ, Google Map | **[ẢNH]** `anh/ve-chung-toi.png` |
| Chính sách | `chinh-sach.html` | Giao hàng, đổi trả, vận chuyển | **[ẢNH]** `anh/chinh-sach.png` |
| Quản trị | `admin.html` | Đăng nhập; tab Đơn hàng, Đánh giá, Sách | **[ẢNH]** `anh/admin-dang-nhap.png`, `anh/admin-don-hang.png` |

Giao diện dùng được trên điện thoại (từ 360 px): **[ẢNH]** `anh/mobile.png`.

## 4. Cơ sở dữ liệu

5 bảng, khóa chính `uuid`, tiền tệ lưu số nguyên VND, đều bật RLS.

```
categories 1 ──< books 1 ──< reviews
                   └──< order_items >── 1 orders
```

| Bảng | Cột chính | Khóa ngoại và ràng buộc nổi bật |
|---|---|---|
| `categories` | `id`, `name`, `slug`, `description`, `sort_order` | `name`, `slug` duy nhất; `slug` đúng mẫu `a-b-c` |
| `books` | `id`, `category_id`, `title`, `slug`, `author`, `description`, `publisher`, `publish_year`, `pages`, `age_min`, `age_max`, `price`, `original_price`, `stock`, `cover_url`, `is_featured`, `is_active` | FK `category_id → categories` (RESTRICT); `price ≥ 0`; `original_price ≥ price` hoặc rỗng; `stock ≥ 0`; tuổi 0–18 |
| `orders` | `id`, `customer_name`, `phone`, `address`, `note`, `payment_method`, `status`, `created_at` | `phone` khớp `^0[0-9]{9}$`; `payment_method` chỉ `cod`; `status` ∈ {`moi`, `dang_giao`, `hoan_tat`}; không có cột tổng tiền (tính bằng `SUM` ở JS) |
| `order_items` | `id`, `order_id`, `book_id`, `book_title`, `quantity`, `unit_price` | FK `order_id → orders` (CASCADE); FK `book_id → books` (SET NULL); `quantity` 1–20 |
| `reviews` | `id`, `book_id`, `reviewer_name`, `rating`, `comment`, `created_at` | FK `book_id → books` (CASCADE); `rating` 1–5 |

**RLS (11 policy):** khách (`anon`) chỉ đọc sách đang bán, thể loại, đánh giá; chỉ thêm `orders` (trạng thái `moi`, thanh toán `cod`), `order_items` (đơn giá phải bằng giá hiện tại của sách, số lượng 1–20) và `reviews`. Người dùng đã đăng nhập (admin) có toàn quyền đọc, sửa, xóa. Kiểm thử: `supabase/tests/rls-test.sql` và `rls-test.mjs`.

**[ẢNH]** Table Editor hiện "RLS enabled" ở cả 5 bảng (`anh/rls-enabled.png`) và kết quả "TẤT CẢ PASS" (`anh/rls-test-pass.png`).

## 5. Chức năng và thao tác database

| Mã | Chức năng | Thao tác | Bảng | Trang |
|---|---|---|---|---|
| F02–F04 | Xem sách nổi bật, danh mục, chi tiết; lọc và tìm kiếm | **Đọc** | `books`, `categories` | `index`, `books`, `book` |
| F05 | Xem đánh giá, điểm trung bình | **Đọc** | `reviews` | `book` |
| F06 | Viết đánh giá 1–5 sao (honeypot, giãn cách 15 giây) | **Thêm** | `reviews` | `book` |
| F07 | Giỏ hàng, đối chiếu giá và tồn kho | Đọc | `books` | `book`, `cart` |
| F08 | Đặt hàng COD (id đơn tạo bằng `crypto.randomUUID()`) | **Thêm** | `orders`, `order_items` | `cart` |
| F09 | Đăng nhập, đăng xuất admin | Supabase Auth | `auth.users` | `admin` |
| F10 | Xem đơn kèm chi tiết, tổng tiền, lọc theo trạng thái | **Đọc** | `orders`, `order_items` | `admin` |
| F11 | Đổi trạng thái Mới → Đang giao → Hoàn tất | **Sửa** | `orders` | `admin` |
| F12 | Xóa đơn (xóa luôn dòng đơn) | **Xóa** | `orders`, `order_items` | `admin` |
| F13 | Xem và xóa đánh giá không phù hợp | **Đọc, Xóa** | `reviews` | `admin` |
| F14 | Thêm sách mới (slug tự sinh, kiểm tra trùng) | **Thêm** | `books` | `admin` |
| F15 | Sửa giá, giá gốc, tồn kho; ẩn/hiện sách | **Sửa** | `books` | `admin` |
| F16 | Xóa sách (có hộp thoại xác nhận) | **Xóa** | `books`, `reviews` | `admin` |
| F17 | Giá gốc gạch ngang và badge "-X%" | Đọc | `books` | nhiều trang |
| F18–F20 | Google Map, Navbar/Footer, trang Chính sách | — | — | nhiều trang |

**Ảnh minh họa bốn thao tác**

| Thao tác | Việc làm | Ảnh |
|---|---|---|
| **Đọc** | Mở `books.html`, lọc thể loại, tìm "mua thang bay" | **[ẢNH]** `anh/doc.png` |
| **Thêm** | Đặt một đơn ở `cart.html`; xem đơn xuất hiện ở Table Editor hoặc tab Đơn hàng | **[ẢNH]** `anh/them-don.png`, `anh/them-sach.png` |
| **Sửa** | Admin đổi trạng thái đơn; sửa giá sách rồi xem ở trang khách | **[ẢNH]** `anh/sua-trang-thai.png`, `anh/sua-gia.png` |
| **Xóa** | Admin xóa đơn thử qua hộp thoại xác nhận | **[ẢNH]** `anh/xoa-xac-nhan.png`, `anh/xoa-xong.png` |

## 6. Bảo mật

- Chỉ dùng `anon key` trong `assets/js/config.js`; không có khóa bí mật nào trong repo (đã quét, kể cả giải mã khóa JWT: `role = anon`).
- Đã tắt đăng ký công khai; tài khoản admin tạo thủ công. **[ẢNH]** `anh/tat-dang-ky.png`.
- Chống XSS: dữ liệu người dùng nhập luôn được thoát ký tự hoặc gán bằng `textContent`; đường dẫn ảnh được lọc.
- Chống gian lận khi đặt hàng: policy kiểm tra giá, số lượng và trạng thái ngay trong database, không tin dữ liệu trình duyệt.

## 7. Các file tài liệu (`.md`)

| File | Mô tả |
|---|---|
| `README.md` | Giới thiệu, cách chạy, thiết lập Supabase, kiểm thử |
| `PRD.md` | Yêu cầu sản phẩm: đánh giá khả thi, chức năng, database, RLS, luồng đặt hàng, deploy, tiêu chí hoàn thành |
| `DESIGN.md` | Hệ thống thiết kế: logo, màu, font, bố cục, thành phần, responsive, giọng văn |
| `content/noi-dung-website.md` | Nội dung chữ mẫu cho các trang |
| `Prompts/` | 16 prompt đã dùng theo thứ tự thực hiện, kèm `00_Danh-muc-prompt.md` |
| `BAO_CAO.md` | Báo cáo này |

## 8. Kiểm thử đã thực hiện

- **RLS:** 35 phép thử trong `rls-test.sql` đều đạt; chạy lại bằng `rls-test.mjs` với anon key. **[ẢNH]** `anh/rls-test-pass.png`.
- **Giao diện:** kiểm thử tự động bằng trình duyệt không giao diện trên cơ sở dữ liệu giả lập đúng schema và policy: trang chủ, danh mục, chi tiết, giỏ hàng, giới thiệu, chính sách, quản trị (hơn 340 kiểm tra), kể cả trường hợp mất kết nối và chuỗi XSS.
- **Sau deploy:** mở từng trang trên URL thật, Console không có lỗi 404 hay CORS; đặt một đơn thật, admin xử lý rồi xóa đơn thử.

## 9. Hạn chế

- Đặt hàng gồm hai lệnh `INSERT` riêng vì không có transaction phía client (đã giảm thiểu bằng việc dùng lại mã đơn khi thử lại).
- Tồn kho do admin cập nhật tay; không có CAPTCHA hay giới hạn tốc độ phía server.
- Không có thanh toán online, tài khoản khách, email, upload ảnh.
