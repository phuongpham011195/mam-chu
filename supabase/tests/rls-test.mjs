// rls-test.mjs – Kiểm thử RLS theo PRD.md mục 6.4, gọi API thật bằng anon key (giống trình duyệt).
// Không cần cài thư viện. Cần Node 18 trở lên.
//
// Cách chạy (PowerShell), thay giá trị của bạn:
//   $env:SUPABASE_URL      = "https://xxxx.supabase.co"
//   $env:SUPABASE_ANON_KEY = "eyJ...hoặc sb_publishable_..."     # KHÔNG dùng khóa bí mật (secret) của project
//   $env:ADMIN_EMAIL       = "admin@example.com"                  # tài khoản admin đã tạo thủ công
//   $env:ADMIN_PASSWORD    = "mat-khau-admin"
//   node supabase/tests/rls-test.mjs
//
// - Có ADMIN_EMAIL/ADMIN_PASSWORD: chạy đủ bảng 6.4 (kể cả thêm dữ liệu thử rồi tự dọn, và đăng nhập admin sửa đơn).
// - Không có: chỉ chạy các phép thử không để lại dữ liệu (đọc, thêm bị từ chối, signUp).
// Dữ liệu thử có tên 'TEST-RLS' và được xóa ở cuối.

const BASE = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
const KEY = process.env.SUPABASE_ANON_KEY || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";

if (!BASE || !KEY) {
  console.error("Thiếu SUPABASE_URL hoặc SUPABASE_ANON_KEY. Xem hướng dẫn ở đầu file.");
  process.exit(2);
}
if (/^sb_secre[t]_/.test(KEY)) {
  console.error("Đây là khóa bí mật. Chỉ dùng anon/publishable key.");
  process.exit(2);
}
if (KEY.startsWith("eyJ")) {
  try {
    const role = JSON.parse(Buffer.from(KEY.split(".")[1], "base64url").toString()).role;
    if (role !== "anon") {
      console.error(`Khóa này có role "${role}", không phải "anon". Dừng lại.`);
      process.exit(2);
    }
  } catch { /* không đọc được thì bỏ qua */ }
}

const T_ORDER = "eeeeeeee-0000-4000-8000-0000000000a1";
const TEST_TAG = "TEST-RLS";
const results = [];

function check(name, expected, pass, detail = "") {
  results.push({ name, expected, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}  [${expected}]${detail ? "  -> " + detail : ""}`);
}
function skip(name, why) {
  console.log(`SKIP  ${name}  (${why})`);
}

function headers(token, extra = {}) {
  const h = { apikey: KEY, "Content-Type": "application/json", ...extra };
  // Khóa kiểu cũ (JWT) gửi kèm Authorization; khóa publishable mới chỉ gửi qua apikey.
  const bearer = token || (KEY.startsWith("eyJ") ? KEY : null);
  if (bearer) h.Authorization = `Bearer ${bearer}`;
  return h;
}

async function rest(method, path, { token, body, prefer } = {}) {
  const res = await fetch(`${BASE}/rest/v1/${path}`, {
    method,
    headers: headers(token, prefer ? { Prefer: prefer } : {}),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const isErr = (r) => r.status >= 400;
const isEmptyList = (r) => r.status >= 200 && r.status < 300 && Array.isArray(r.data) && r.data.length === 0;
const blocked = (r) => isErr(r) || isEmptyList(r); // bị từ chối hoặc không dòng nào bị ảnh hưởng
const short = (r) => `HTTP ${r.status}${r.data && r.data.code ? " " + r.data.code : ""}`;

// ------------------------------------------------------------------ chuẩn bị
const hasAdmin = Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
let adminToken = null;
if (hasAdmin) {
  const res = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  const j = await res.json().catch(() => ({}));
  adminToken = j.access_token || null;
  if (!adminToken) {
    console.error(`Đăng nhập admin thất bại (HTTP ${res.status}). Kiểm tra email/mật khẩu rồi chạy lại.`);
    process.exit(2);
  }
  console.log("Đã đăng nhập admin.\n");
} else {
  console.log("Không có ADMIN_EMAIL/ADMIN_PASSWORD: chạy bản rút gọn.\n");
}

// ------------------------------------------------------------------ 1. Khách đọc
const books = await rest("GET", "books?select=id,title,price&slug=eq.chu-soc-nho-tim-mua-thu");
const book = Array.isArray(books.data) ? books.data[0] : null;
check("Khách đọc books", "thành công, có dòng", books.status === 200 && Boolean(book), short(books));

const cats = await rest("GET", "categories?select=id&limit=5");
check("Khách đọc categories", "thành công, có dòng", cats.status === 200 && cats.data.length > 0, short(cats));

const revs = await rest("GET", "reviews?select=id&limit=5");
check("Khách đọc reviews", "thành công", revs.status === 200 && Array.isArray(revs.data), short(revs) + ` (${revs.data?.length ?? 0} dòng)`);

const ord = await rest("GET", "orders?select=id");
check("Khách đọc orders", "trống hoặc bị chặn", blocked(ord), short(ord));
const oit = await rest("GET", "order_items?select=id");
check("Khách đọc order_items", "trống hoặc bị chặn", blocked(oit), short(oit));

if (!book) {
  console.error("\nKhông tìm thấy sách mẫu 'chu-soc-nho-tim-mua-thu'. Hãy chạy seed.sql trước.");
  process.exit(2);
}

const orderBody = (over = {}) => ({
  id: T_ORDER, customer_name: TEST_TAG, phone: "0900000098", address: "Dia chi thu nghiem RLS",
  payment_method: "cod", status: "moi", ...over,
});
const itemBody = (over = {}) => ({
  order_id: T_ORDER, book_id: book.id, book_title: book.title, quantity: 1, unit_price: book.price, ...over,
});
const reviewBody = (over = {}) => ({
  book_id: book.id, reviewer_name: TEST_TAG, rating: 5, comment: "Kiem thu RLS", ...over,
});

// ------------------------------------------------------------------ 2. Khách thêm: các phép phải bị TỪ CHỐI
// (dùng id đơn khác để không đụng đơn thử nghiệm hợp lệ)
const bad1 = await rest("POST", "orders", { body: orderBody({ id: "eeeeeeee-0000-4000-8000-0000000000b1", status: "hoan_tat" }), prefer: "return=minimal" });
check("Khách thêm orders với status = hoan_tat", "bị từ chối", isErr(bad1), short(bad1));

const bad2 = await rest("POST", "reviews", { body: reviewBody({ rating: 6 }), prefer: "return=minimal" });
check("Khách thêm reviews với rating = 6", "bị từ chối", isErr(bad2), short(bad2));

const bad3 = await rest("POST", "orders", { body: orderBody({ id: "eeeeeeee-0000-4000-8000-0000000000b2", payment_method: "card" }), prefer: "return=minimal" });
check("Khách thêm orders với payment_method = card", "bị từ chối", isErr(bad3), short(bad3));

// ------------------------------------------------------------------ 3. Khách thêm: đối chứng dương + order_items sai giá
// (cần admin để dọn dữ liệu thử)
let testReviewId = null, testBookId = null, testCatId = null;
if (hasAdmin) {
  const okOrder = await rest("POST", "orders", { body: orderBody(), prefer: "return=minimal" });
  check("Khách thêm orders hợp lệ", "thành công", okOrder.status === 201, short(okOrder));

  const okItem = await rest("POST", "order_items", { body: itemBody(), prefer: "return=minimal" });
  check("Khách thêm order_items hợp lệ (đúng giá)", "thành công", okItem.status === 201, short(okItem));

  const badItem = await rest("POST", "order_items", { body: itemBody({ unit_price: 0 }), prefer: "return=minimal" });
  check("Khách thêm order_items với unit_price = 0", "bị từ chối", isErr(badItem), short(badItem));

  const badQty = await rest("POST", "order_items", { body: itemBody({ quantity: 21 }), prefer: "return=minimal" });
  check("Khách thêm order_items với quantity = 21", "bị từ chối", isErr(badQty), short(badQty));

  const okRev = await rest("POST", "reviews", { body: reviewBody(), prefer: "return=minimal" });
  check("Khách thêm reviews hợp lệ", "thành công", okRev.status === 201, short(okRev));

  const lookup = await rest("GET", `reviews?select=id&reviewer_name=eq.${TEST_TAG}`);
  testReviewId = Array.isArray(lookup.data) && lookup.data[0] ? lookup.data[0].id : null;

  // Admin tạo sách và thể loại thử nghiệm để khách thử sửa/xóa lên chính chúng
  const c = await rest("POST", "categories", { token: adminToken, body: { name: `${TEST_TAG} the loai`, slug: "test-rls-cat" }, prefer: "return=representation" });
  testCatId = c.data?.[0]?.id ?? null;
  const b = await rest("POST", "books", { token: adminToken, body: { category_id: testCatId, title: "Sach thu nghiem", slug: "test-rls-sach", author: TEST_TAG, price: 1000 }, prefer: "return=representation" });
  testBookId = b.data?.[0]?.id ?? null;
  check("Admin thêm books và categories", "thành công", Boolean(testCatId && testBookId), `${short(c)}, ${short(b)}`);
} else {
  skip("Khách thêm orders/order_items/reviews hợp lệ, order_items sai giá", "cần tài khoản admin để dọn dữ liệu thử");
}

// ------------------------------------------------------------------ 4. Khách UPDATE/DELETE: chỉ nhắm vào dòng thử nghiệm
if (hasAdmin && testBookId) {
  const tests = [
    ["books", `id=eq.${testBookId}`, { title: "DA-BI-SUA" }],
    ["categories", `id=eq.${testCatId}`, { name: "DA-BI-SUA" }],
    ["reviews", `id=eq.${testReviewId}`, { rating: 1 }],
    ["orders", `id=eq.${T_ORDER}`, { status: "hoan_tat" }],
    ["order_items", `order_id=eq.${T_ORDER}`, { quantity: 20 }],
  ];
  for (const [table, filter, patch] of tests) {
    const u = await rest("PATCH", `${table}?${filter}`, { body: patch, prefer: "return=representation" });
    check(`Khách UPDATE ${table}`, "không dòng nào bị ảnh hưởng", blocked(u), short(u));
    const d = await rest("DELETE", `${table}?${filter}`, { prefer: "return=representation" });
    check(`Khách DELETE ${table}`, "không dòng nào bị ảnh hưởng", blocked(d), short(d));
  }

  // Xác nhận chắc chắn bằng quyền admin: dữ liệu thử còn nguyên, không bị đổi
  const [o, i, r, bk, ct] = await Promise.all([
    rest("GET", `orders?select=status&id=eq.${T_ORDER}`, { token: adminToken }),
    rest("GET", `order_items?select=quantity&order_id=eq.${T_ORDER}`, { token: adminToken }),
    rest("GET", `reviews?select=rating&id=eq.${testReviewId}`, { token: adminToken }),
    rest("GET", `books?select=title&id=eq.${testBookId}`, { token: adminToken }),
    rest("GET", `categories?select=name&id=eq.${testCatId}`, { token: adminToken }),
  ]);
  const intact = o.data?.[0]?.status === "moi" && i.data?.[0]?.quantity === 1 && r.data?.[0]?.rating === 5
    && bk.data?.[0]?.title === "Sach thu nghiem" && ct.data?.length === 1;
  check("Dữ liệu thử còn nguyên sau khi khách thử sửa/xóa", "không đổi", intact);
} else if (!hasAdmin) {
  skip("Khách UPDATE/DELETE mọi bảng", "cần tài khoản admin để tạo dòng thử nghiệm");
}

// ------------------------------------------------------------------ 5. Admin đăng nhập, UPDATE orders.status
if (hasAdmin) {
  const up = await rest("PATCH", `orders?id=eq.${T_ORDER}`, { token: adminToken, body: { status: "dang_giao" }, prefer: "return=representation" });
  check("Đăng nhập admin rồi UPDATE orders.status", "thành công", up.status === 200 && up.data?.[0]?.status === "dang_giao", short(up));
}

// ------------------------------------------------------------------ 6. signUp phải bị từ chối
const email = `rls-test-${Date.now()}@example.com`;
const su = await fetch(`${BASE}/auth/v1/signup`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: "Test-12345-xyz" }),
});
const suBody = await su.json().catch(() => ({}));
check("Gọi signUp", "bị từ chối", su.status >= 400, `HTTP ${su.status} ${suBody.error_code || suBody.msg || ""}`);
if (su.status < 400) {
  console.log(`\n!!! signUp ĐANG MỞ: đã tạo tài khoản ${email}. Hãy tắt "Allow new users to sign up" và xóa tài khoản này trong Authentication > Users.\n`);
}

// ------------------------------------------------------------------ Dọn dẹp (bằng quyền admin)
if (hasAdmin) {
  await rest("DELETE", `reviews?reviewer_name=eq.${TEST_TAG}`, { token: adminToken });
  await rest("DELETE", `orders?id=eq.${T_ORDER}`, { token: adminToken });           // order_items xóa theo (CASCADE)
  if (testBookId) await rest("DELETE", `books?id=eq.${testBookId}`, { token: adminToken });
  if (testCatId) await rest("DELETE", `categories?id=eq.${testCatId}`, { token: adminToken });
  const left = await rest("GET", `orders?select=id&id=eq.${T_ORDER}`, { token: adminToken });
  check("Đã dọn dữ liệu thử", "không còn dòng TEST-RLS", Array.isArray(left.data) && left.data.length === 0);
}

// ------------------------------------------------------------------ Tổng kết
const failed = results.filter((r) => !r.pass);
console.log(`\nTổng kết: ${results.length - failed.length}/${results.length} PASS`);
if (failed.length) {
  console.log("Các phép thử FAIL:");
  failed.forEach((f) => console.log(" - " + f.name));
  process.exit(1);
}
console.log("TẤT CẢ PASS");
