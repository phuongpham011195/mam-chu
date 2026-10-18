-- seed_orders.sql – 3 đơn hàng DEMO (khách giả) để thử trang admin: Mới, Đang giao, Hoàn tất.
-- Chạy SAU seed.sql. Chạy trong Supabase SQL Editor (vai trò postgres, không bị RLS chặn).
-- An toàn khi chạy lại (id cố định, ON CONFLICT DO NOTHING).
-- Xóa các đơn demo này trước khi nộp nếu không muốn giữ.
-- Giá mỗi dòng lấy đúng giá bán hiện tại của sách (cột price), khớp quy tắc policy order_items.

BEGIN;

INSERT INTO orders (id, customer_name, phone, address, note, payment_method, status, created_at) VALUES
  ('7a1d0c02-5e2b-4f3a-8c10-000000000001', 'Khách demo 1', '0900000001',
   'Địa chỉ mẫu, Quận 1, TP. Hồ Chí Minh', 'Đơn demo – giao giờ hành chính', 'cod', 'moi', now() - interval '1 day'),
  ('3e5b9a64-5e2b-4f3a-8c10-000000000002', 'Khách demo 2', '0900000002',
   'Địa chỉ mẫu, Quận 3, TP. Hồ Chí Minh', 'Đơn demo', 'cod', 'dang_giao', now() - interval '3 days'),
  ('b81f27d0-5e2b-4f3a-8c10-000000000003', 'Khách demo 3', '0900000003',
   'Địa chỉ mẫu, Quận Cầu Giấy, Hà Nội', NULL, 'cod', 'hoan_tat', now() - interval '8 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (id, order_id, book_id, book_title, quantity, unit_price)
SELECT v.id::uuid, v.order_id::uuid, b.id, b.title, v.qty, b.price
FROM (VALUES
  ('c3e9a5d4-1b6f-4a82-9d30-000000000001', '7a1d0c02-5e2b-4f3a-8c10-000000000001', 'chu-soc-nho-tim-mua-thu', 2),
  ('c3e9a5d4-1b6f-4a82-9d30-000000000002', '7a1d0c02-5e2b-4f3a-8c10-000000000001', 'muoi-phut-lang-nghe-con', 1),
  ('c3e9a5d4-1b6f-4a82-9d30-000000000003', '3e5b9a64-5e2b-4f3a-8c10-000000000002', 'tien-nha-minh-bai-toan-nha-minh', 1),
  ('c3e9a5d4-1b6f-4a82-9d30-000000000004', 'b81f27d0-5e2b-4f3a-8c10-000000000003', 'nha-may-cau-vong-cua-bi', 1),
  ('c3e9a5d4-1b6f-4a82-9d30-000000000005', 'b81f27d0-5e2b-4f3a-8c10-000000000003', 'mam-dau-biet-noi', 2)
) AS v(id, order_id, slug, qty)
JOIN books b ON b.slug = v.slug
ON CONFLICT (id) DO NOTHING;

COMMIT;
