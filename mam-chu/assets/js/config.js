// config.js – Cấu hình kết nối Supabase.
//
// CÁCH ĐIỀN (Supabase Dashboard > Project Settings > API):
//   SUPABASE_URL      = "Project URL", dạng  https://abcdxyz.supabase.co
//   SUPABASE_ANON_KEY = khóa "anon public" (bắt đầu bằng eyJ...) hoặc "publishable" (sb_publishable_...)
//
// QUY TẮC AN TOÀN:
//   - File này được đưa lên GitHub công khai. CHỈ điền anon/publishable key.
//   - TUYỆT ĐỐI KHÔNG điền khóa bí mật ("secret") hay khóa quản trị của project vào đây
//     (hay bất kỳ file nào trong repo).
//   - Anon key công khai là bình thường: quyền thật được giới hạn bằng RLS (supabase/policies.sql).
//
// Để trống 2 giá trị dưới đây thì website vẫn mở được, nhưng các khối dữ liệu sẽ báo "chưa kết nối".

export const SUPABASE_URL = "https://brcwtqwbrctroxqxakbi.supabase.co";       // ví dụ: "https://abcdxyz.supabase.co"
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyY3d0cXdicmN0cm94cXhha2JpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyODY5NDEsImV4cCI6MjEwNzg2Mjk0MX0.d9EhPI3K4ixvmY4CPxO4n44bXhCnHITkrIBdRPR45LE";  // ví dụ: "eyJhbGciOi..." hoặc "sb_publishable_..."
