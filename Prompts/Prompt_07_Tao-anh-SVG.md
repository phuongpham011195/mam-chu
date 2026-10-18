# Prompt 07 – Tạo ảnh SVG (logo, banner, bìa sách)

Dựa trên DESIGN.md (bảng màu, font, phong cách) và danh sách sách trong supabase/seed.sql,
hãy TẠO TRỰC TIẾP các file ảnh dạng SVG (vector, viết bằng code, không dùng ảnh bên ngoài,
không dùng ảnh hay logo có bản quyền):

1. Logo
   - assets/brand/logo.svg: kích thước 512x512, tỉ lệ 1:1, gồm biểu tượng và tên thương hiệu
   - assets/brand/logo-horizontal.svg: kích thước 600x160, dùng cho Navbar
   - assets/brand/favicon.svg: kích thước 64x64, chỉ có biểu tượng

2. Hai banner Trang chủ
   - assets/banners/banner-1.svg và assets/banners/banner-2.svg
   - Kích thước 1920x640, tỉ lệ 3:1
   - Dùng hình minh họa trừu tượng về sách và đọc sách, chừa khoảng trống bên trái
     để đặt tiêu đề bằng HTML, không viết chữ vào ảnh

3. Mười sáu ảnh bìa sách
   - Lưu tại assets/covers/<slug>.svg, kích thước 600x900, tỉ lệ 2:3
   - Mỗi bìa có tên sách, tên tác giả, và họa tiết hoặc màu riêng theo thể loại:
     Văn học (màu ấm, họa tiết hoa lá), Kinh tế (màu lạnh, hình khối),
     Kỹ năng (màu tươi, biểu tượng mũi tên hoặc ngọn núi),
     Thiếu nhi (màu pastel, hình tròn và ngôi sao)
   - Chữ phải hiển thị đúng tiếng Việt có dấu
   - Slug phải khớp chính xác với cột slug trong seed.sql

Sau khi tạo xong:
- Cập nhật cột cover_image trong seed.sql thành assets/covers/<slug>.svg
- Liệt kê toàn bộ các file đã tạo
- Kiểm tra không có slug nào bị thiếu ảnh
