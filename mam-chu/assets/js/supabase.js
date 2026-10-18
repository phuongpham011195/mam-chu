// supabase.js – Tạo một client Supabase dùng chung cho mọi trang.
// supabase-js v2 nạp qua CDN (dạng ES Module), ghim phiên bản. Chỉ dùng anon key (xem config.js).
//
// Trang nào cần dữ liệu thì nạp file này (nên nạp bằng `await import('../supabase.js')` trong try/catch
// để nếu CDN lỗi thì Navbar, Footer vẫn hiển thị bình thường).
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config.js";

/** true khi đã điền đủ URL và anon key trong config.js */
export const isConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

/** Client Supabase, hoặc null nếu chưa cấu hình. */
export const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

if (!isConfigured) {
  console.warn(
    "[Mầm Chữ] Chưa cấu hình Supabase. Hãy điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js."
  );
}
