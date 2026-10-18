-- seed_reviews.sql – 10 đánh giá DEMO cho Mầm Chữ (tên người đánh giá đều là tên giả).
-- Chạy SAU seed.sql (cần sách đã có trong bảng books). Chạy trong Supabase SQL Editor.
-- An toàn khi chạy lại: không thêm trùng (cùng sách và cùng tên người đánh giá).
-- Trên giao diện cần ghi: "Các đánh giá dưới đây là dữ liệu demo cho đồ án."

INSERT INTO reviews (book_id, reviewer_name, rating, comment, created_at)
SELECT b.id, v.reviewer_name, v.rating::smallint, v.comment,
       now() - make_interval(days => v.days_ago)
FROM (VALUES
  ('chu-soc-nho-tim-mua-thu', 'Chị Thu Hà', 5, 'Bé nhà mình 4 tuổi đòi đọc đi đọc lại mỗi tối. Tranh màu ấm, câu chữ ngắn nên bé nhớ và đọc theo được. Trò chơi tìm hạt dẻ cuối sách cũng được bé rất thích.', 2),
  ('muoi-phut-lang-nghe-con', 'Anh Quốc Bình', 5, 'Mình thử làm theo ba bước trong sách, tuần đầu hơi gượng nhưng sang tuần thứ hai thì con chủ động kể chuyện ở lớp cho mình nghe. Sách mỏng, dễ đọc, rất đáng thử.', 3),
  ('mam-dau-biet-noi', 'Cô Ngọc Lan', 4, 'Mình mua cho lớp mẫu giáo làm hoạt động gieo hạt. Các bé rất hào hứng. Sách hơi mỏng so với giá tiền nhưng tranh đẹp và nội dung vừa vặn cho bé nhỏ.', 5),
  ('nha-may-cau-vong-cua-bi', 'Chị Phương Anh', 5, 'Con trai 7 tuổi đọc xong liền đòi làm thí nghiệm cầu vồng với cốc nước. Các thí nghiệm trong sách an toàn, nguyên liệu dễ tìm. Cả nhà có một buổi cuối tuần vui.', 6),
  ('tien-nha-minh-bai-toan-nha-minh', 'Anh Tuấn Kiệt', 4, 'Cách chia thu nhập thành bốn khoản rất dễ nhớ. Vợ chồng mình ngồi làm bảng tính mẫu cùng nhau, đỡ cãi nhau chuyện tiền hơn hẳn. Giá ưu đãi nên mua thấy hợp lý.', 8),
  ('bi-mat-cua-chiec-cap-xanh', 'Chị Mai Hương', 3, 'Truyện vui và chữ to, hợp cho con tập đọc sách dài. Có đoạn giữa hơi chậm nên con mình hơi mất hứng, nhưng cuối truyện thì thích lại. Giao hàng nhanh, sách đẹp.', 9),
  ('con-duong-mua-thang-bay', 'Chị Bảo Châu', 5, 'Đọc xong mình ngồi lặng một lúc. Văn phong chậm rãi, có những đoạn rất nhớ nhà. Rất hợp để đọc vào buổi tối yên tĩnh sau khi con đã ngủ.', 11),
  ('binh-tinh-khi-con-noi-gian', 'Anh Hoàng Nam', 4, 'Mẫu câu nên nói lúc con nổi giận rất thực tế, mình áp dụng được ngay hôm sau. Mong sách có thêm ví dụ cho trẻ lớn hơn, nhưng nhìn chung rất hữu ích.', 13),
  ('nhung-ngon-den-o-cuoi-pho', 'Bạn Minh Anh', 5, 'Em 14 tuổi, tự mua đọc vì thấy bìa đẹp. Có truyện làm em khóc thật. Em cho mẹ đọc cùng và hai mẹ con nói chuyện nhiều hơn mọi khi.', 16),
  ('ngan-sach-nho-uoc-mo-lon', 'Chị Thanh Tâm', 4, 'Cuốn sách kể chuyện thật gần gũi, dễ đồng cảm. Phương pháp phong bì mình đang thử, tháng đầu tiên đã tiết kiệm được kha khá. Chữ in rõ, giấy tốt.', 19)
) AS v(slug, reviewer_name, rating, comment, days_ago)
JOIN books b ON b.slug = v.slug
WHERE NOT EXISTS (
  SELECT 1 FROM reviews r
  WHERE r.book_id = b.id AND r.reviewer_name = v.reviewer_name
);
