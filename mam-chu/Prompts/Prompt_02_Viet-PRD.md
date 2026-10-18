# Prompt 02 – Viết PRD.md cho website Mầm Chữ

Tôi chọn phương án [C. Mầm Chữ]. Hãy viết PRD.md cho website bán sách với các ràng buộc sau:

CÔNG NGHỆ (bắt buộc)
- HTML + CSS + JavaScript thuần (ES Modules), nhiều trang .html, KHÔNG dùng framework
  và KHÔNG có bước build.
- Tailwind CSS và supabase-js đều nạp qua CDN.
- Deploy lên GitHub Pages: chỉ dùng đường dẫn tương đối, không dùng server riêng.
- Database: Supabase (PostgreSQL), bật Row Level Security (RLS) cho mọi bảng.
- Phía giao diện chỉ dùng anon key. Tuyệt đối không đưa service_role key vào code.
  Mọi giới hạn quyền đều thực hiện bằng RLS policy.

CÁC TRANG
- index.html: Trang chủ
- books.html: Danh mục sách, có lọc theo thể loại và ô tìm kiếm
- book.html?slug=...: Chi tiết sách, có đánh giá
- cart.html: Giỏ hàng (lưu bằng localStorage) và form đặt hàng
  (thanh toán khi nhận hàng, không tích hợp thanh toán online)
- about.html: Về chúng tôi, có nhúng Google Map
- admin.html: Đăng nhập bằng Supabase Auth (email/mật khẩu), quản lý đơn hàng,
  đánh giá và sách
- Navbar và Footer dùng chung trên mọi trang. Trang chi tiết có breadcrumb.

DATABASE VÀ PHÂN QUYỀN
- Các bảng: categories, books, orders, order_items, reviews.
- Bảng quyền bắt buộc:
  - Khách: xem categories, books và reviews; thêm orders, order_items và reviews.
  - Admin (người dùng đã đăng nhập): toàn quyền thêm, sửa, xóa trên mọi bảng.
- Khi khách đặt hàng: tạo id đơn hàng bằng crypto.randomUUID() ngay trên trình duyệt,
  để chèn orders và order_items mà không cần quyền đọc bảng orders.
- Phải có đủ 4 thao tác, mỗi thao tác gắn với chức năng cụ thể:
  - Đọc: hiển thị sách và đánh giá
  - Thêm: đặt hàng, viết đánh giá; Admin thêm sách
  - Sửa: Admin đổi trạng thái đơn (Mới → Đang giao → Hoàn tất), sửa giá và tồn kho sách
  - Xóa: Admin xóa đơn, xóa đánh giá không phù hợp

NỘI DUNG PRD
Mục tiêu, người dùng mục tiêu, sơ đồ trang và liên kết giữa các trang, cấu trúc thư mục,
cấu trúc từng bảng (tên cột, kiểu dữ liệu, khóa chính, khóa ngoại), danh sách RLS policy,
bảng chức năng gắn với thao tác database và trang tương ứng, các bước deploy lên
GitHub Pages, tiêu chí hoàn thành.

Chỉ xuất nội dung Markdown, chưa viết code.
Nếu thấy ràng buộc nào không khả thi, hãy nêu ra trước.
