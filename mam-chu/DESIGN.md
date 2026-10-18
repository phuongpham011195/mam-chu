# DESIGN – Hệ thống thiết kế website **Mầm Chữ**

> *"Gieo chữ hôm nay, gặt tương lai ngày mai."*
> Tài liệu này mô tả giao diện, chưa chứa code. Dùng cùng `PRD.md`.

**Tinh thần thiết kế:** ấm áp, vui tươi, quan tâm, kiên nhẫn. Giao diện sáng, bo tròn, nhiều khoảng thở. Nhìn thân thiện với trẻ nhưng vẫn đủ gọn gàng và đáng tin để phụ huynh yên tâm mua.

---

## 1. Logo

### 1.1 Ý tưởng

Logo kể một câu chuyện ngắn: **một cuốn sách mở ra và từ gáy sách nảy lên một mầm cây hai lá.** Sách là "chữ", mầm là "trẻ đang lớn", khớp với tên Mầm Chữ và slogan "gieo chữ, gặt tương lai".

### 1.2 Thành phần

| Thành phần | Mô tả |
|---|---|
| **Biểu tượng (logo mark)** | Cuốn sách mở nhìn chính diện, hai trang bo tròn màu xanh ngọc. Từ giữa gáy sách mọc lên một thân mầm nhỏ với **hai lá**: một lá màu vàng nắng, một lá màu xanh lá nhạt. Hai lá tạo hình chữ **V** mở, nhìn gần giống dấu nâng đỡ. |
| **Chữ (wordmark)** | "Mầm Chữ" viết hoa chữ cái đầu mỗi từ, phông Baloo 2 đậm, màu xanh ngọc đậm. **Giữ nguyên dấu tiếng Việt** (dấu huyền trên "Mầm", dấu ngã trên "Chữ"). |
| **Slogan (tùy chọn)** | Dòng nhỏ dưới wordmark, phông Nunito thường, màu chữ phụ. Chỉ dùng ở bản logo dọc và ở trang chủ/Về chúng tôi, không dùng ở Navbar. |

### 1.3 Các phiên bản và tệp

| Phiên bản | Dùng ở đâu | Tệp (trong `assets/brand/`) |
|---|---|---|
| Ngang (biểu tượng + chữ), 600×160 | Navbar | `logo-horizontal.svg` |
| Ngang, bản trắng, 600×160 | Footer (nền xanh ngọc tối) | `logo-horizontal-white.svg` |
| Vuông (biểu tượng trên, chữ dưới), 512×512 | Trang chủ, trang Về chúng tôi, trang xác nhận đơn, ảnh đại diện | `logo.svg` |
| Chỉ biểu tượng, 64×64 (nền kem bo góc) | Favicon, thẻ tab trình duyệt | `favicon.svg` |

> Bản logo một màu và ảnh chia sẻ Open Graph (PNG) chưa được tạo, không bắt buộc cho đồ án. Bìa mặc định khi sách chưa có ảnh là `assets/covers/default.svg`. Màu lá xanh nhạt của biểu tượng là `#7BC47F`. Ảnh minh họa banner nằm ở `assets/banners/`, ảnh bìa sách ở `assets/covers/<slug>.svg`. Chữ trong SVG dùng font hệ thống làm dự phòng vì ảnh SVG nạp bằng `<img>` không tải được Google Fonts.

### 1.4 Quy tắc sử dụng

- **Vùng an toàn:** chừa xung quanh logo một khoảng trống bằng chiều rộng của chữ "M" trong wordmark.
- **Kích thước tối thiểu:** bản ngang cao tối thiểu 32 px; chỉ biểu tượng tối thiểu 24 px.
- **Nền:** đặt trên nền kem hoặc trắng dùng bản màu; đặt trên nền xanh ngọc đậm dùng bản trắng.
- **Không được:** kéo giãn, xoay, đổi màu tùy ý, thêm bóng đổ, bỏ dấu tiếng Việt, đặt trên nền ảnh rối.
- **Nhất quán:** dùng cùng một logo ở Navbar, Footer, trang Về chúng tôi, favicon và ảnh chia sẻ. Chỉ khác phiên bản, không khác hình.
- **Thuộc tính HTML:** logo luôn có `alt="Mầm Chữ – nhà sách cho bé"`; logo Navbar là liên kết về `index.html`.

---

## 2. Bảng màu

Màu chủ đạo: **xanh ngọc** (tin cậy, tươi mới) và **vàng nắng** (vui, ấm), nền **kem** dịu mắt, thêm các màu **pastel** để phân biệt thể loại.

### 2.1 Màu chính và màu phụ

| Vai trò | Tên | HEX | Dùng cho |
|---|---|---|---|
| **Chính** | Xanh ngọc đậm | `#0F766E` | Nút chính, liên kết, tiêu đề nhấn, Navbar active, wordmark |
| Chính – đậm hơn | Xanh ngọc tối | `#115E59` | Hover/active của nút chính, Footer nền đậm |
| Chính – nhạt | Xanh ngọc nhạt | `#CCEBE6` | Viền nhấn, nền thẻ được chọn |
| **Phụ** | Vàng nắng | `#F5B82E` | Nút phụ nổi bật (CTA), ngôi sao đánh giá, gạch chân nhấn |
| Phụ – đậm hơn | Vàng hổ phách | `#D99A0B` | Hover của nút phụ |
| Phụ – nhạt | Vàng kem | `#FFF1CC` | Nền khối nổi bật, nền badge cảnh báo nhẹ |

### 2.2 Màu pastel (dùng cho thể loại và minh họa)

| Tên | HEX | Gợi ý thể loại |
|---|---|---|
| Mint | `#E3F5EF` | Kỹ năng |
| Đào | `#FFE5D6` | Thiếu nhi |
| Trời | `#DFEEFF` | Kinh tế |
| Tím nhạt | `#EDE7FA` | Văn học |
| Hồng phấn | `#FDE4EC` | Dự phòng cho thể loại mới |

> Thể loại cụ thể do dữ liệu `categories` quyết định. Khi có thể loại mới thì lấy màu pastel theo vòng lặp.

### 2.3 Màu nền

| Tên | HEX | Dùng cho |
|---|---|---|
| Nền trang | `#FFFBF2` | `body` mọi trang |
| Bề mặt | `#FFFFFF` | Thẻ sách, form, bảng, hộp |
| Bề mặt nhấn | `#F6F1E4` | Khối xen kẽ, header bảng admin |
| Đường viền | `#E8E1D0` | Viền thẻ, đường kẻ, viền ô nhập |
| Lớp phủ | `#0F172A` ở 50% | Nền mờ phía sau menu mobile, hộp thoại |

### 2.4 Màu chữ

| Tên | HEX | Dùng cho | Ghi chú |
|---|---|---|---|
| Chữ chính | `#1F2937` | Tiêu đề, nội dung | Trên nền kem đạt tương phản cao |
| Chữ phụ | `#5B6472` | Mô tả ngắn, ghi chú, tác giả | Chỉ dùng trên nền trắng hoặc kem |
| Chữ mờ | `#8A93A0` | Placeholder | **Không** dùng cho thông tin quan trọng |
| Chữ trên nền xanh | `#FFFFFF` | Nút chính, Footer | |
| Chữ trên nền vàng | `#1F2937` | Nút phụ, ngôi sao | **Không dùng chữ trắng trên nền vàng** |
| Liên kết | `#0F766E` | Liên kết trong nội dung (có gạch chân) | Hover: `#115E59` |

### 2.5 Màu trạng thái

| Trạng thái | Chữ / biểu tượng | Nền nhạt | Dùng cho |
|---|---|---|---|
| Thành công | `#166534` | `#DCFCE7` | Đặt hàng thành công, còn hàng, trạng thái "Hoàn tất" |
| Cảnh báo | `#92400E` | `#FEF3C7` | Còn ít hàng, trạng thái "Đang giao" |
| Lỗi | `#B91C1C` | `#FEE2E2` | Lỗi form, hết hàng, nút xóa |
| Thông tin | `#1E40AF` | `#DBEAFE` | Trạng thái "Mới", thông báo chung |
| Giảm giá | chữ `#FFFFFF` | `#C2410C` | Badge giảm giá |

**Nguyên tắc dùng màu:** màu chính chiếm khoảng 10–15% giao diện, nền kem và trắng chiếm phần lớn, màu vàng chỉ để làm nổi một hành động mỗi màn hình. Không dùng màu làm tín hiệu duy nhất; trạng thái luôn kèm chữ hoặc biểu tượng.

---

## 3. Font chữ

Tải từ **Google Fonts**, hỗ trợ tiếng Việt (có bộ ký tự *vietnamese*), dùng `display=swap`.

| Vai trò | Font | Độ đậm | Lý do |
|---|---|---|---|
| **Tiêu đề, nút, logo** | **Baloo 2** | 600, 700 | Nét tròn vui mắt, hợp sách thiếu nhi, dấu tiếng Việt hiển thị rõ |
| **Nội dung, form, bảng** | **Nunito** | 400, 600, 700 | Dễ đọc, nét mềm, hỗ trợ tiếng Việt đầy đủ |

Dự phòng: `system-ui, -apple-system, "Segoe UI", sans-serif`.

### 3.1 Cỡ chữ

| Cấp | Mobile (< 768 px) | Desktop (≥ 768 px) | Font / độ đậm | Dòng cách | Ghi chú |
|---|---|---|---|---|---|
| H1 (tiêu đề hero) | 32 px | 48 px | Baloo 2 / 700 | 1.15 | Mỗi trang chỉ có 1 H1 |
| H2 (tiêu đề khối) | 24 px | 32 px | Baloo 2 / 700 | 1.25 | |
| H3 (tiêu đề thẻ, mục con) | 20 px | 24 px | Baloo 2 / 600 | 1.3 | |
| H4 (nhãn nhóm) | 18 px | 20 px | Baloo 2 / 600 | 1.35 | |
| **Nội dung** | **16 px** | **17–18 px** | Nunito / 400 | **1.6** | Không dùng dưới 16 px trên mobile |
| Nội dung nhỏ (tác giả, ghi chú) | 14 px | 14 px | Nunito / 400 | 1.5 | |
| Nhãn form, nút | 16 px | 16 px | Nunito / 700 (nút: Baloo 2 / 600) | 1.2 | |
| Giá | 20 px | 24 px | Baloo 2 / 700 | 1.2 | Màu xanh ngọc đậm |
| Badge, chú thích nhỏ | 12–13 px | 13 px | Nunito / 700 | 1.2 | Chỉ cho nhãn ngắn |

**Quy tắc:** độ dài dòng nội dung tối đa khoảng 70 ký tự. Căn trái, không căn đều. Tiêu đề thẻ sách giới hạn 2 dòng.

### 3.2 Khoảng cách, bo góc, bóng

| Token | Giá trị |
|---|---|
| Khoảng cách cơ sở | Bội số của 4 px (4, 8, 12, 16, 24, 32, 48, 64) |
| Chiều rộng nội dung tối đa | 1200 px, lề hai bên 16 px (mobile) / 24 px (tablet) / auto (desktop) |
| Khoảng cách giữa các khối | 48 px (mobile) / 80 px (desktop) |
| Bo góc | Nút 12 px, thẻ 16 px, ảnh bìa 8 px, badge và chip "viên thuốc" (hoàn toàn tròn) |
| Bóng | Thẻ: nhẹ (mờ, độ lệch nhỏ); thẻ hover: đậm hơn một bậc. Không dùng bóng nặng |

---

## 4. Bố cục từng trang (từ trên xuống dưới)

Tất cả trang đều có **Navbar** ở đầu và **Footer** ở cuối (mục 5.5, 5.6). Dưới đây chỉ mô tả phần thân.

### 4.1 `index.html` – Trang chủ

1. **Hero** (nền kem, ảnh `assets/banners/banner-1.svg` đặt bên phải trên desktop, chữ là HTML nằm ở nửa trái)
   - H1: "Gieo chữ hôm nay, gặt tương lai ngày mai."
   - Dòng phụ 1–2 câu về sách chọn theo độ tuổi.
   - Hai nút: "Xem sách cho bé" (chính, dẫn tới `books.html`) và "Về Mầm Chữ" (viền, dẫn tới `about.html`).
2. **Thể loại** – H2 "Chọn sách theo thể loại": lưới thẻ thể loại màu pastel (đọc từ `categories`), mỗi thẻ dẫn tới `books.html?category=<slug>`.
3. **Sách nổi bật** – H2 "Sách nổi bật": lưới thẻ sách (các sách có `is_featured = true`, tối đa 8), nút "Xem tất cả sách".
4. **Đặt hàng 3 bước** (thẻ khối có `id="cach-dat-hang"` để nút banner cuộn tới) – ba thẻ có số và biểu tượng: "Chọn sách" → "Điền thông tin" → "Nhận sách, trả tiền khi giao". Nội dung chữ ở `content/noi-dung-website.md` mục 6.2.
5. **Góc phụ huynh** – khối nền vàng kem: câu ngắn về đọc cùng con (mục 6.1 của file nội dung), liên kết "Xem sách kỹ năng làm cha mẹ" tới `books.html?category=ky-nang`.
6. **Kêu gọi hành động** – nền xanh ngọc đậm, chữ trắng, một nút vàng "Chọn sách ngay".

### 4.2 `books.html` – Danh mục sách

1. **Tiêu đề trang** – H1 "Tất cả sách" và số lượng kết quả ("Có 24 cuốn").
2. **Thanh công cụ** (dính phía trên khi cuộn trên desktop)
   - Ô tìm kiếm có biểu tượng kính lúp, placeholder "Tìm tên sách, tác giả...".
   - Hàng **chip thể loại** (chọn một): "Tất cả" + từng thể loại; chip đang chọn nền xanh ngọc, chữ trắng.
   - Nút "Xóa lọc" khi đang lọc.
3. **Lưới sách** – dùng thẻ sách (mục 5.2).
4. **Trạng thái đặc biệt:** đang tải (khung xương), không có kết quả (hình minh họa + "Mầm Chữ chưa tìm thấy cuốn nào. Thử từ khóa khác nhé!"), lỗi tải (thông báo + nút "Thử lại").

### 4.3 `book.html?slug=...` – Chi tiết sách

1. **Breadcrumb:** Trang chủ › Sách › [Thể loại] › Tên sách.
2. **Khối thông tin chính** (2 cột trên desktop, 1 cột trên mobile)
   - Trái: ảnh bìa lớn.
   - Phải: H1 tên sách, tác giả, chip độ tuổi, điểm đánh giá trung bình và số lượt, giá (kèm giá gốc và badge giảm giá nếu có), tình trạng còn hàng, chọn số lượng, nút "Thêm vào giỏ" (chính, giữ nguyên trang và hiện toast "Đã thêm vào giỏ") và "Mua ngay" (phụ, thêm vào giỏ rồi chuyển sang `cart.html`). Khi hết hàng cả hai nút bị vô hiệu hóa.
3. **Giới thiệu sách** – H2 "Về cuốn sách này": mô tả, độ tuổi phù hợp, thể loại.
4. **Đánh giá của bố mẹ** – H2:
   - Tóm tắt: điểm trung bình lớn và số sao.
   - Danh sách đánh giá (tên, sao, ngày, nội dung), mới nhất ở trên.
   - Dòng chú thích nhỏ dưới danh sách: "Các đánh giá dưới đây là dữ liệu demo cho đồ án, không phải ý kiến của khách hàng thật."
   - Form "Viết đánh giá" (mục 5.3).
5. **Sách cùng thể loại** – lưới tối đa 4 thẻ sách.
6. **Trạng thái đặc biệt:** `slug` không tồn tại hiện "Ôi, Mầm Chữ không tìm thấy cuốn sách này" kèm nút về danh mục.

### 4.4 `cart.html` – Giỏ hàng và đặt hàng

1. **Tiêu đề** – H1 "Giỏ hàng của bố mẹ".
2. **Giỏ trống:** hình minh họa + "Giỏ hàng đang trống" + nút "Đi chọn sách".
3. **Khi có hàng** (2 cột trên desktop: danh sách ở trái, tóm tắt ở phải; 1 cột trên mobile)
   - Danh sách: ảnh nhỏ, tên, giá, ô số lượng (− / +), nút xóa; cảnh báo nếu giá đổi hoặc hết hàng.
   - Tóm tắt đơn: tạm tính, dòng chữ "Phí giao hàng: Miễn phí" (chỉ là chữ, không tính tiền), tổng cộng (= tạm tính), ghi chú "Thanh toán khi nhận hàng (COD)".
4. **Form đặt hàng:** họ tên, số điện thoại, địa chỉ, ghi chú; nút "Đặt hàng" (chính, rộng hết cột trên mobile).
5. **Màn hình xác nhận** (thay thế nội dung sau khi đặt thành công): biểu tượng thành công, "Mầm Chữ đã nhận đơn của bố mẹ!", mã đơn rút gọn, tóm tắt các cuốn đã đặt, nút "Tiếp tục mua sắm".

### 4.5 `about.html` – Về chúng tôi

1. **Giới thiệu** – nền kem với ảnh `assets/banners/banner-2.svg` bên phải; bên trái là logo vuông `logo.svg` (cỡ vừa), H1 "Về Mầm Chữ" và slogan.
2. **Câu chuyện thương hiệu** – 2–3 đoạn ngắn kèm hình minh họa.
3. **Sứ mệnh và tầm nhìn** – hai thẻ cạnh nhau.
4. **Giá trị cốt lõi** – bốn thẻ nhỏ có biểu tượng (ví dụ: Chọn lọc, Ấm áp, Đáng tin, Cùng lớn lên).
5. **Liên hệ và bản đồ** – cột trái: địa chỉ, điện thoại, email, giờ mở cửa và dòng nhỏ "Thông tin mẫu cho đồ án"; cột phải: **Google Map nhúng** (tỉ lệ 16:9 hoặc cao tối thiểu 320 px); mobile xếp bản đồ dưới thông tin.
6. **Kêu gọi hành động** – nút "Xem sách" dẫn tới `books.html`.

### 4.6 `admin.html` – Quản trị

Giao diện đơn giản, chức năng trước, ít trang trí.
1. **Chưa đăng nhập:** thẻ giữa màn hình gồm logo, ô email, ô mật khẩu, nút "Đăng nhập", thông báo lỗi sai thông tin.
2. **Đã đăng nhập:**
   - Thanh trên cùng: logo nhỏ, email đang đăng nhập, nút "Đăng xuất".
   - **Ba tab:** "Đơn hàng", "Đánh giá", "Sách".
   - **Tab Đơn hàng:** bộ lọc trạng thái; bảng đơn (mã, khách, điện thoại, tổng tiền, ngày, trạng thái); bấm dòng để mở chi tiết các cuốn đã đặt; nút đổi trạng thái (Mới → Đang giao → Hoàn tất) và nút "Xóa" có hộp thoại xác nhận.
   - **Tab Đánh giá:** bảng (sách, người đánh giá, số sao, nội dung, ngày) và nút "Xóa" có xác nhận.
   - **Tab Sách:** bảng sách (ảnh nhỏ, tên, giá, tồn kho, trạng thái hiển thị), sửa nhanh giá bán, giá gốc và tồn kho ngay trong dòng (tồn kho do Admin cập nhật tay sau khi xử lý đơn), nút "Xóa" có hộp thoại xác nhận (xóa luôn đánh giá của sách đó), nút "Thêm sách" mở biểu mẫu (tên, slug, tác giả, nhà xuất bản, năm, số trang, thể loại, độ tuổi (có thể để trống), giá bán, giá gốc (tùy chọn), tồn kho, đường dẫn ảnh, mô tả).
3. Mọi thao tác ghi đều có thông báo thành công hoặc lỗi dạng toast.

### 4.7 `chinh-sach.html` – Chính sách

Trang tĩnh, không đọc database. Nội dung ở `content/noi-dung-website.md` mục 3 và 6.5.
1. **Tiêu đề trang** – H1 "Chính sách của Mầm Chữ", một câu mở đầu, dòng chú thích "Nội dung là dữ liệu mẫu cho đồ án".
2. **Mục lục nhanh** – ba liên kết neo: Giao hàng · Đổi trả · Vận chuyển.
3. **Ba khối nội dung** – mỗi khối một H2, danh sách gạch đầu dòng ngắn, nền trắng, bo góc.
4. **Kêu gọi hành động** – nút "Xem sách cho bé" tới `books.html`.
5. Cột nội dung rộng tối đa khoảng 720 px, căn giữa; mobile một cột.

---

## 5. Thành phần giao diện

### 5.1 Nút

| Loại | Giao diện | Dùng cho |
|---|---|---|
| **Chính** | Nền `#0F766E`, chữ trắng, Baloo 2 / 600, bo 12 px | Hành động chính của màn hình: "Thêm vào giỏ", "Đặt hàng" |
| **Phụ nổi bật** | Nền `#F5B82E`, chữ `#1F2937` | Một CTA nổi bật mỗi khối: "Chọn sách ngay", "Mua ngay" |
| **Viền** | Nền trong suốt, viền 2 px `#0F766E`, chữ `#0F766E` | Hành động phụ: "Về Mầm Chữ", "Xóa lọc" |
| **Chữ (ghost)** | Không viền, chữ `#0F766E`, gạch chân khi hover | "Xem tất cả", liên kết hành động |
| **Nguy hiểm** | Nền `#B91C1C`, chữ trắng | "Xóa" trong admin, luôn kèm xác nhận |

- **Kích thước:** cao tối thiểu **44 px** (vùng chạm), padding ngang 20 px; bản nhỏ cao 36 px (chỉ dùng trong bảng admin).
- **Trạng thái:** hover tối hơn một bậc (xem bảng màu); focus có vòng 3 px `#0F766E` ở 40% cách nút 2 px; vô hiệu hóa nền `#E5E7EB`, chữ `#8A93A0`; đang xử lý hiện vòng xoay và chữ "Đang gửi...", đồng thời khóa nút để tránh bấm hai lần.
- Nút có biểu tượng: biểu tượng đứng trước chữ, cách 8 px.

### 5.2 Thẻ sách

Cấu trúc từ trên xuống:
1. **Ảnh bìa** tỉ lệ **2:3** (đúng với ảnh bìa 600×900, không bị cắt), bo 8 px; khi `cover_url` rỗng hoặc ảnh lỗi thì hiện `assets/covers/default.svg`; có `alt` là tên sách. Góc trên trái đặt badge giảm giá (nếu có); góc trên phải đặt chip độ tuổi.
2. **Tên sách** – Baloo 2 / 600, tối đa 2 dòng, cắt bằng dấu "…".
3. **Tác giả** – Nunito 14 px, màu chữ phụ.
4. **Không có dòng đánh giá trên thẻ** – sao và số lượt đánh giá chỉ hiện ở trang chi tiết sách (nhờ vậy trang chủ và danh mục không phải đọc bảng `reviews`).
5. **Giá** – Baloo 2 / 700, màu xanh ngọc; nếu giảm giá thì thêm giá gốc gạch ngang màu chữ phụ.
6. **Nút** "Thêm vào giỏ" (chính, cỡ nhỏ, rộng hết thẻ). Khi hết hàng: nút vô hiệu hóa, chữ "Hết hàng", ảnh phủ lớp mờ.

Hành vi: cả thẻ (ảnh và tên) là liên kết tới `book.html?slug=...`. Hover (desktop): nâng nhẹ 2–4 px, bóng đậm hơn. Thẻ nền trắng, viền `#E8E1D0`, bo 16 px. Trạng thái đang tải: khung xương cùng kích thước thẻ.

### 5.3 Form

| Phần tử | Quy cách |
|---|---|
| Nhãn | Nunito / 700, 16 px, nằm **phía trên** ô nhập; trường bắt buộc có dấu `*` đỏ và chữ "bắt buộc" cho trình đọc màn hình |
| Ô nhập | Cao 48 px, nền trắng, viền 1.5 px `#E8E1D0`, bo 12 px, chữ 16 px (tránh iOS tự phóng to) |
| Focus | Viền `#0F766E`, vòng sáng 3 px màu xanh ngọc nhạt |
| Lỗi | Viền `#B91C1C`, dòng thông báo màu `#B91C1C` ngay dưới ô, kèm biểu tượng cảnh báo; thông báo viết bằng giọng thân thiện (mục 7) |
| Văn bản dài | `textarea` tối thiểu 4 dòng, có bộ đếm ký tự khi có giới hạn |
| **Chọn sao** | Năm ngôi sao bấm được, nhãn "Chấm mấy sao?"; sao chọn màu `#F5B82E`, sao chưa chọn viền xám; dùng được bằng bàn phím (mũi tên) và có nhãn đọc "3 trên 5 sao" |
| Ô chống spam | Một ô ẩn (honeypot) không hiện với người dùng và trình đọc màn hình; nếu bị điền thì bỏ qua gửi |
| Nút gửi | Nút chính, đặt cuối form |

Các form chính: **Đặt hàng** (họ tên, số điện thoại, địa chỉ, ghi chú), **Viết đánh giá** (tên, số sao, nội dung), **Đăng nhập admin**, **Thêm/sửa sách**. Kiểm tra dữ liệu khi rời ô và khi gửi; hiển thị lỗi đầu tiên và đưa con trỏ về ô đó.

### 5.4 Badge và chip

| Badge | Giao diện | Điều kiện hiển thị |
|---|---|---|
| **Giảm giá** | Hình viên thuốc, nền `#C2410C`, chữ trắng Nunito 700, dạng "-20%" | Chỉ khi `giá gốc > giá bán`; phần trăm = làm tròn (1 − giá bán ÷ giá gốc) × 100 |
| Vị trí badge trên thẻ | — | Mỗi thẻ chỉ có tối đa **một badge ở góc trên trái** (giảm giá); góc trên phải luôn là chip độ tuổi. Không có badge "Mới" (dữ liệu mẫu nạp cùng lúc nên không phân biệt được) |
| Độ tuổi | Nền `#FFF1CC`, chữ `#92400E`, dạng "3–6 tuổi" | Luôn hiện. Nếu `age_min` và `age_max` rỗng thì hiện "Dành cho phụ huynh" |
| Còn ít hàng | Nền `#FEF3C7`, chữ `#92400E`, "Chỉ còn 3" | Tồn kho từ 1 đến 5 |
| Hết hàng | Nền `#FEE2E2`, chữ `#B91C1C` | Tồn kho bằng 0 |
| Trạng thái đơn | Mới: `#DBEAFE`/`#1E40AF`; Đang giao: `#FEF3C7`/`#92400E`; Hoàn tất: `#DCFCE7`/`#166534` | Bảng đơn trong admin |

> **Dữ liệu:** badge giảm giá dùng cột `books.original_price` (số nguyên, cho phép rỗng; rỗng nghĩa là không giảm giá), đã có trong `PRD.md` mục 5.2. Phần trăm được tính ở trình duyệt từ `price` và `original_price`, không lưu vào database. Giá thực tế khách trả luôn là `price`.

### 5.5 Navbar

- **Vị trí:** dính phía trên (sticky), nền trắng, viền dưới 1 px `#E8E1D0`, cao 64 px (mobile) / 72 px (desktop).
- **Bố cục desktop:** trái là logo ngang (bấm về trang chủ); giữa là các liên kết **Trang chủ · Sách · Về chúng tôi**; phải là **biểu tượng giỏ hàng kèm số lượng** (chấm tròn vàng chứa số).
- **Liên kết:** Baloo 2 / 600; trang hiện tại có gạch chân dày 3 px màu vàng và chữ xanh ngọc đậm.
- **Mobile:** logo bên trái; bên phải là biểu tượng giỏ hàng và nút menu (hamburger). Menu mở ra dạng ngăn kéo từ phải với lớp phủ mờ, các liên kết xếp dọc, mỗi dòng cao 48 px; đóng bằng nút X, bấm lớp phủ hoặc phím Esc.
- Số lượng giỏ hàng cập nhật ngay khi thêm sách, không cần tải lại trang.

### 5.6 Footer

- Nền **xanh ngọc tối** `#115E59`, chữ trắng, liên kết có gạch chân khi hover.
- **Bốn cột trên desktop** (xếp chồng trên mobile): (1) logo bản trắng (`logo-horizontal-white.svg`), slogan, một câu giới thiệu; (2) liên kết nhanh: Trang chủ, Sách, Về chúng tôi, Giỏ hàng, **Chính sách**; (3) liên hệ: địa chỉ, điện thoại, email, giờ mở cửa; (4) bản đồ thu nhỏ hoặc liên kết "Xem bản đồ".
- **Dải dưới cùng:** "© 2026 Mầm Chữ", nhãn nhỏ **"● Dữ liệu: Supabase"** (chấm xanh lá khi tải dữ liệu thành công, chấm xám khi lỗi), và liên kết nhỏ "Quản trị" dẫn tới `admin.html`.

### 5.7 Thành phần khác

| Thành phần | Quy cách |
|---|---|
| **Breadcrumb** | Chữ 14 px, phân tách bằng ">", mục cuối là chữ đậm không có liên kết; trên mobile cho phép cuộn ngang hoặc chỉ hiện "‹ Quay lại" |
| **Thông báo (toast)** | Góc dưới màn hình (mobile: sát đáy, desktop: góc phải); màu theo trạng thái; tự tắt sau 4 giây; có nút đóng |
| **Hộp thoại xác nhận** | Dùng cho thao tác xóa trong admin: tiêu đề rõ, hai nút "Hủy" (viền) và "Xóa" (nguy hiểm) |
| **Khung xương (skeleton)** | Khối xám nhạt `#F1ECDD` nhấp nháy nhẹ trong lúc tải dữ liệu |
| **Trạng thái rỗng** | Hình minh họa là `assets/brand/favicon.svg` cỡ lớn (khoảng 96 px), một câu thân thiện, một nút hành động. Dùng cho giỏ trống, không có kết quả, đặt hàng thành công |
| **Bảng admin** | Tiêu đề nền `#F6F1E4`, dòng kẻ ngang `#E8E1D0`, dòng xen kẽ không bắt buộc |
| **Biểu tượng** | SVG inline tự viết trong `assets/js/icons.js`, nét tròn, viền 2 px, đồng nhất: kính lúp, giỏ hàng, trái tim, khiên, mầm cây, dấu tích, cảnh báo, đóng, menu. Không dùng thư viện biểu tượng bên ngoài và không trộn nhiều bộ |

---

## 6. Responsive (ưu tiên điện thoại)

Thiết kế **mobile-first**: viết giao diện cho 360 px trước, sau đó mở rộng.

| Điểm ngắt | Chiều rộng | Ghi chú |
|---|---|---|
| Mobile | < 640 px | 1 cột, lề 16 px |
| Tablet nhỏ (`sm`) | ≥ 640 px | 2–3 cột cho lưới sách |
| Tablet (`md`) | ≥ 768 px | Hiện Navbar đầy đủ, tăng cỡ chữ |
| Desktop (`lg`) | ≥ 1024 px | Bố cục 2 cột, lưới 4 cột |
| Màn rộng (`xl`) | ≥ 1280 px | Nội dung giữ tối đa 1200 px, căn giữa |

| Thành phần | Mobile | Desktop |
|---|---|---|
| Lưới sách | 2 cột (khoảng cách 12 px) | 3 cột ở `md`, 4 cột ở `lg` |
| Lưới thể loại (trang chủ) | 2 cột | 4–5 cột |
| Navbar | Logo + giỏ + hamburger, menu dạng ngăn kéo | Đầy đủ liên kết ngang |
| Hero | Xếp dọc: chữ trước, hình sau, nút rộng hết cột | 2 cột: chữ trái, hình phải |
| Chip thể loại (`books.html`) | Một hàng cuộn ngang | Xuống dòng tự nhiên |
| Chi tiết sách | 1 cột; thanh "Thêm vào giỏ" dính sát đáy màn hình | 2 cột; nút nằm trong khối thông tin |
| Giỏ hàng | Mỗi sản phẩm là một thẻ dọc; form nằm dưới danh sách | 2 cột: danh sách + tóm tắt dính bên phải |
| Google Map | Nằm dưới thông tin liên hệ, cao 280 px | Cạnh thông tin liên hệ, cao 360 px |
| Bảng admin | Chuyển thành danh sách thẻ hoặc cuộn ngang trong khung | Bảng đầy đủ |
| Footer | Các cột xếp chồng | 4 cột |

**Quy tắc chung**
- Vùng chạm tối thiểu **44 × 44 px**, khoảng cách giữa hai nút kề nhau tối thiểu 8 px.
- Ô nhập chữ tối thiểu 16 px để iOS không tự phóng to.
- Không có thanh cuộn ngang ở cấp trang. Ảnh dùng `max-width: 100%` và có tỉ lệ cố định để tránh nhảy bố cục.
- Ảnh bìa tải lười (`loading="lazy"`), trừ ảnh đầu trang.
- Hỗ trợ `prefers-reduced-motion`: tắt hiệu ứng nâng thẻ và nhấp nháy khi người dùng bật giảm chuyển động.
- Kiểm tra tại 360, 390, 768, 1024 và 1440 px.

**Khả năng tiếp cận:** thứ tự tiêu đề H1→H2→H3 hợp lý; vòng focus luôn nhìn thấy; ảnh có `alt`; không dùng màu làm tín hiệu duy nhất; chữ và nền đạt tương phản tối thiểu 4.5:1 (cặp màu đã chọn ở mục 2 theo nguyên tắc này, cần kiểm tra lại bằng công cụ khi dựng giao diện).

---

## 7. Giọng văn trên giao diện

**Nguyên tắc:** thân thiện, dễ hiểu, hơi tinh nghịch. Xưng **"Mầm Chữ"** hoặc **"mình"**, gọi khách là **"bố mẹ"**. Câu ngắn, tích cực, nói rõ bước tiếp theo. Có thể dùng một biểu tượng cảm xúc đơn giản, tối đa một cái mỗi thông báo. Không trách người dùng, không dùng thuật ngữ kỹ thuật.

| Tình huống | Nên viết | Tránh |
|---|---|---|
| Slogan | Gieo chữ hôm nay, gặt tương lai ngày mai. | Mua sách giá rẻ nhất thị trường |
| Nút thêm vào giỏ | Thêm vào giỏ | Submit |
| Nút đặt hàng | Đặt hàng | Xác nhận thanh toán |
| Tìm kiếm | Tìm tên sách, tác giả... | Nhập từ khóa |
| Giỏ trống | Giỏ hàng đang trống. Mình cùng chọn sách cho bé nhé! | Không có dữ liệu |
| Không có kết quả | Mầm Chữ chưa tìm thấy cuốn nào. Thử từ khóa khác nhé! | 0 results |
| Hết hàng | Cuốn này tạm hết rồi, bố mẹ xem các sách cùng thể loại nhé. | Out of stock |
| Còn ít hàng | Chỉ còn 3 cuốn, bố mẹ nhanh tay nhé! | Sắp hết hàng!!! |
| Đặt hàng thành công | Mầm Chữ đã nhận đơn của bố mẹ! Mã đơn: #A1B2C3D4. | Giao dịch thành công |
| Lỗi thiếu tên | Bố mẹ cho Mầm Chữ biết tên người nhận nhé. | Trường này là bắt buộc |
| Lỗi số điện thoại | Số điện thoại chưa đúng, bố mẹ kiểm tra giúp mình nhé. | Định dạng không hợp lệ |
| Lỗi mạng | Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé. | Lỗi 500 |
| Gửi đánh giá | Cảm ơn bố mẹ đã chia sẻ! Đánh giá của bố mẹ giúp các gia đình khác chọn sách. | Đã gửi |
| Chưa có đánh giá | Chưa có đánh giá nào. Bố mẹ là người đầu tiên nhé? | Trống |
| Không tìm thấy sách | Ôi, Mầm Chữ không tìm thấy cuốn sách này. | 404 |
| Đăng nhập admin sai | Email hoặc mật khẩu chưa đúng, bạn thử lại nhé. | Authentication failed |
| Xác nhận xóa (admin) | Xóa đơn này? Hành động này không hoàn tác được. | Bạn có chắc không? |

**Giọng ở khu vực admin:** ngắn gọn, trung tính, xưng "bạn", ưu tiên rõ ràng hơn tinh nghịch. Vẫn dùng tiếng Việt có dấu đầy đủ.

**Định dạng hiển thị:** tiền theo kiểu Việt Nam, ví dụ `120.000 ₫`; ngày theo kiểu `18/10/2026`; độ tuổi dạng `3–6 tuổi`; số điện thoại giữ nguyên dạng khách nhập.
