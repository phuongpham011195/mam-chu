# Danh mục prompt – Đồ án website nhà sách Mầm Chữ

Các prompt được lưu nguyên văn theo thứ tự thực hiện. Đây là phần chuẩn bị tài liệu và tài nguyên
trước khi vibe code giao diện.

| # | File | Mục đích | Kết quả tạo ra |
|---|---|---|---|
| 01 | `Prompt_01_De-xuat-thuong-hieu.md` | Đề xuất 3 phương án thương hiệu để chọn | Bảng so sánh; chọn phương án C "Mầm Chữ" |
| 02 | `Prompt_02_Viet-PRD.md` | Viết tài liệu yêu cầu sản phẩm | `PRD.md` |
| 03 | `Prompt_03_Viet-DESIGN.md` | Viết hệ thống thiết kế | `DESIGN.md` |
| 04 | `Prompt_04_Du-lieu-mau-sach.md` | Dữ liệu mẫu 10 sách (**đã được Prompt 06 thay thế**) | Bản đầu của `supabase/books.sample.json`, `supabase/seed.sql` |
| 05 | `Prompt_05_Viet-noi-dung-website.md` | Nội dung chữ: Về chúng tôi, banner, chính sách, liên hệ, đánh giá | `content/noi-dung-website.md`, `supabase/seed_reviews.sql` |
| 06 | `Prompt_06_Du-lieu-mau-16-sach.md` | Dữ liệu mẫu 16 sách (**thay Prompt 04**) | `supabase/books.sample.json`, `supabase/seed.sql` (16 sách) |
| 07 | `Prompt_07_Tao-anh-SVG.md` | Tạo logo, banner, 16 ảnh bìa dạng SVG | Thư mục `assets/brand`, `assets/banners`, `assets/covers` |
| 08 | `Prompt_08_Doi-chieu-tai-lieu.md` | Đối chiếu các tài liệu và dữ liệu, chỉ báo cáo | Danh sách điểm chưa khớp |
| 09 | `Prompt_09_Chinh-sua-cho-khop.md` | Chỉnh tài liệu và dữ liệu cho khớp theo phương án đơn giản | Cập nhật PRD, DESIGN, nội dung, dữ liệu, ảnh |

| 10 | `Prompt_10_Schema-RLS-va-kiem-thu.md` | Tạo schema, policy RLS, hướng dẫn thiết lập Supabase và kiểm thử RLS | `supabase/schema.sql`, `supabase/policies.sql`, `supabase/tests/rls-test.sql`, `supabase/tests/rls-test.mjs` |

| 11 | `Prompt_11_Dung-phan-dung-chung-va-trang-chu.md` | Dựng phần dùng chung (Navbar, Footer, giỏ hàng, tiện ích) và Trang chủ | `.nojekyll`, `assets/css/custom.css`, `assets/js/*.js`, `assets/js/pages/home.js`, `index.html` |

| 12 | `Prompt_12_Dung-books-va-book.md` | Dựng trang Danh mục sách và Chi tiết sách (lọc, tìm, đánh giá, giỏ hàng) | `books.html`, `book.html`, `assets/js/pages/books.js`, `assets/js/pages/book.js` |

| 13 | `Prompt_13_Dung-cart.md` | Dựng trang Giỏ hàng và đặt hàng COD theo luồng 6 bước | `cart.html`, `assets/js/pages/cart-page.js` |

| 14 | `Prompt_14_Dung-about-va-chinh-sach.md` | Dựng trang Về chúng tôi (có Google Map) và trang Chính sách | `about.html`, `assets/js/pages/about.js`, `chinh-sach.html` |

| 15 | `Prompt_15_Dung-admin.md` | Dựng trang quản trị: đăng nhập, quản lý đơn hàng, đánh giá và sách | `admin.html`, `assets/js/pages/admin.js` |

| 16 | `Prompt_16_Doi-chieu-checklist-README-va-deploy.md` | Đối chiếu checklist mục 10 của PRD, quét khóa bí mật, viết README, hướng dẫn deploy 9C–9E | `README.md`, `BAO_CAO.md` (bản nháp), `.gitignore`; sửa `PRD.md`, `config.js`, `rls-test.mjs` |

| 17 | `Prompt_17_Viet-BAO_CAO.md` | Viết báo cáo theo cấu trúc bài mẫu, chừa chỗ chèn ảnh chụp | `BAO_CAO.md`, thư mục `anh/` |

| 18 | `Prompt_18_Doc-de-bai-va-lam-bao-cao-PDF.md` | Đọc đề bài cuối khóa, làm báo cáo PDF tương tự bài mẫu | `BAO_CAO.md` (thêm mục prompt), `BAO_CAO.pdf`, 22 ảnh trong `anh/`; sửa CSS `.field` |

**Ghi chú:** Prompt 04 và 06 cùng tạo dữ liệu mẫu sách. Prompt 06 mở rộng từ 10 lên 16 cuốn (giữ nguyên 10 cuốn đầu) nên dữ liệu hiện hành là của Prompt 06.
