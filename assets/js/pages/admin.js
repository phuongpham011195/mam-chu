// admin.js – Trang quản trị (admin.html), dành cho chủ cửa hàng. Giọng văn: ngắn gọn, xưng "bạn".
//   F09  Đăng nhập / đăng xuất (Supabase Auth, email + mật khẩu)
//   F10  Xem đơn hàng kèm chi tiết và tổng tiền, lọc theo trạng thái      SELECT orders (+ order_items)
//   F11  Đổi trạng thái đơn: Mới -> Đang giao -> Hoàn tất                  UPDATE orders
//   F12  Xóa đơn (các dòng đơn xóa theo, nhờ ON DELETE CASCADE)            DELETE orders
//   F13  Xem và xóa đánh giá không phù hợp                                 SELECT, DELETE reviews
//   F14  Thêm sách                                                         INSERT books
//   F15  Sửa sách: giá bán, giá gốc, tồn kho (ngay trong dòng) và sửa chi tiết; ẩn/hiện   UPDATE books
//   F16  Xóa sách (đánh giá xóa theo; dòng đơn cũ giữ lại, book_id về rỗng)  DELETE books
//
// BẢO MẬT: trang này là file tĩnh nên ai cũng mở được. Việc "chưa đăng nhập thì chỉ thấy form đăng nhập" chỉ là
// giao diện; quyền thật nằm ở RLS (supabase/policies.sql): chỉ người đã đăng nhập mới đọc được orders/order_items
// và mới sửa/xóa được dữ liệu. Phải TẮT đăng ký công khai trong Supabase Auth (PRD mục 6.2).
// Khác với trang khách, ở đây admin có quyền đọc nên các lệnh sửa/xóa nối thêm .select('id') để xác nhận
// thật sự có đúng 1 dòng bị ảnh hưởng (PostgREST trả thành công kể cả khi 0 dòng khớp).
// Chống XSS: mọi dữ liệu đều qua esc() hoặc textContent (PRD mục 8).
import { initLayout, setDataStatus, showToast } from "../layout.js";
import { icon } from "../icons.js";
import { esc, formatVND, errText, slugify, safeImgUrl, DEFAULT_COVER, ageLabel, setFieldError, bindImageFallback } from "../utils.js";

initLayout({ active: "admin" });

const root = document.getElementById("admin-root");
const $ = (sel, scope = document) => scope.querySelector(sel);

const STATUS = {
  moi: { label: "Mới", next: "dang_giao", nextLabel: "Chuyển sang Đang giao" },
  dang_giao: { label: "Đang giao", next: "hoan_tat", nextLabel: "Hoàn tất đơn" },
  hoan_tat: { label: "Hoàn tất", next: null },
};
const FILTERS = [["all", "Tất cả"], ["moi", "Mới"], ["dang_giao", "Đang giao"], ["hoan_tat", "Hoàn tất"]];
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

let sb = null;
const S = { email: "", tab: "orders", orders: null, reviews: null, books: null, categories: null, orderFilter: "all", openOrder: null, editingId: null, slugTouched: false };

// ---------------------------------------------------------------- Tiện ích
const shortId = (id) => String(id).slice(0, 8).toUpperCase();
const orderTotal = (o) => (o.order_items || []).reduce((s, i) => s + i.quantity * i.unit_price, 0);
function fmtDateTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
const statusBadge = (st) => `<span class="badge badge-st-${esc(st)}">${esc(STATUS[st]?.label || st)}</span>`;

function setRoot(html, busy = false) {
  root.setAttribute("aria-busy", String(busy));
  root.innerHTML = html;
}

function showBox(title, { hint = "", actions = "" } = {}) {
  setRoot(`<div class="state-box mx-auto mt-6 max-w-xl">
      <img src="assets/brand/favicon.svg" alt="" width="88" height="88">
      <p class="font-semibold">${esc(title)}</p>
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ""}${actions}</div>`);
}

/** Lỗi do chưa đăng nhập hoặc phiên hết hạn */
const isAuthError = (e) => e && (e.status === 401 || e.code === "PGRST301" || /jwt|not authenticated/i.test(e.message || ""));

async function failAction(err, message) {
  console.error("[Mầm Chữ] Lỗi quản trị:", errText(err));
  if (isAuthError(err)) {
    showToast("Phiên đăng nhập đã hết hạn, bạn đăng nhập lại nhé.", "error");
    await sb.auth.signOut();
    return;
  }
  showToast(message, "error");
}

/** Hộp thoại xác nhận xóa. Trả về true nếu bấm nút xác nhận. Mặc định focus ở nút "Hủy". */
function confirmDialog({ title, message, extra = "", okText = "Xóa" }) {
  const dlg = $("#confirm-dialog");
  $("#cd-title").textContent = title;
  $("#cd-msg").textContent = message;
  $("#cd-extra").textContent = extra;
  $("#cd-ok").textContent = okText;
  dlg.returnValue = "";
  return new Promise((resolve) => {
    dlg.addEventListener("close", () => resolve(dlg.returnValue === "ok"), { once: true });
    dlg.showModal();
  });
}

async function mutate(query) {
  const { data, error } = await query.select("id");
  if (error) throw error;
  if (!data || data.length !== 1) throw new Error("Không có dòng nào bị thay đổi");
  return data[0];
}

// ---------------------------------------------------------------- F09: đăng nhập
function renderLogin() {
  document.title = "Đăng nhập quản trị – Mầm Chữ";
  setRoot(`
<div class="mx-auto mt-4 max-w-md">
  <div class="panel">
    <div class="flex flex-col items-center text-center">
      <img src="assets/brand/logo.svg" alt="Mầm Chữ" width="96" height="96" class="h-24 w-24">
      <h1 style="font-size:28px" class="mt-2">Đăng nhập quản trị</h1>
      <p class="mt-1 text-sm text-muted">Dành cho chủ cửa hàng Mầm Chữ.</p>
    </div>
    <form id="login-form" class="mt-6 grid gap-4" novalidate>
      <div class="field">
        <label for="lg-email">Email</label>
        <input id="lg-email" class="input" type="email" autocomplete="username" inputmode="email" aria-describedby="lg-email-err">
        <p id="lg-email-err" class="field-error"></p>
      </div>
      <div class="field">
        <label for="lg-pass">Mật khẩu</label>
        <input id="lg-pass" class="input" type="password" autocomplete="current-password" aria-describedby="lg-pass-err">
        <p id="lg-pass-err" class="field-error"></p>
      </div>
      <p id="login-error" class="notice notice--error" role="alert" hidden></p>
      <button type="submit" class="btn btn-primary btn-block" id="login-submit">Đăng nhập</button>
    </form>
  </div>
</div>`);
  $("#lg-email").focus();
}

async function onLogin() {
  const email = $("#lg-email").value.trim();
  const password = $("#lg-pass").value;
  const err = $("#login-error");
  err.hidden = true;
  setFieldError("lg-email", "lg-email-err", "");
  setFieldError("lg-pass", "lg-pass-err", "");
  let bad = null;
  if (!email || !email.includes("@")) { setFieldError("lg-email", "lg-email-err", "Bạn nhập email giúp nhé."); bad = bad || "lg-email"; }
  if (!password) { setFieldError("lg-pass", "lg-pass-err", "Bạn nhập mật khẩu giúp nhé."); bad = bad || "lg-pass"; }
  if (bad) return document.getElementById(bad).focus();

  const btn = $("#login-submit");
  btn.disabled = true;
  btn.classList.add("is-loading");
  btn.textContent = "Đang đăng nhập...";
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    startApp(data.user?.email || email);
  } catch (e) {
    console.error("[Mầm Chữ] Lỗi đăng nhập:", errText(e));
    const credentials = e && (e.status === 400 || e.status === 401 || /invalid/i.test(e.message || ""));
    err.textContent = credentials ? "Email hoặc mật khẩu chưa đúng, bạn thử lại nhé."
      : e && e.status === 429 ? "Bạn thử quá nhiều lần, vui lòng chờ một lúc rồi thử lại."
      : "Kết nối đang hơi chậm, bạn thử lại nhé.";
    err.hidden = false;
    $("#lg-pass").value = "";
    $("#lg-pass").focus();
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = "Đăng nhập";
  }
}

// ---------------------------------------------------------------- Khung quản trị
const TABS = [["orders", "Đơn hàng"], ["reviews", "Đánh giá"], ["books", "Sách"]];

function startApp(email) {
  S.email = email;
  document.title = "Quản trị – Mầm Chữ";
  setRoot(`
<div class="flex flex-wrap items-center justify-between gap-3">
  <div>
    <h1 style="font-size:28px">Quản trị cửa hàng</h1>
    <p class="mt-1 text-sm text-muted">Đang đăng nhập: <strong id="admin-email"></strong></p>
  </div>
  <button type="button" class="btn btn-outline btn-sm" id="logout-btn">${icon("x", { size: 16 })} Đăng xuất</button>
</div>
<div class="tabs mt-6" role="tablist" aria-label="Khu vực quản trị">
  ${TABS.map(([k, label]) => `<button type="button" class="tab" role="tab" id="tab-${k}" data-tab="${k}" aria-controls="panel" aria-selected="false" tabindex="-1">${label}</button>`).join("")}
</div>
<section id="panel" class="mt-6" role="tabpanel" tabindex="0" aria-live="polite"></section>`);
  $("#admin-email").textContent = email;
  selectTab(S.tab);
}

function selectTab(name) {
  S.tab = name;
  root.querySelectorAll("[data-tab]").forEach((t) => {
    const on = t.dataset.tab === name;
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  $("#panel").setAttribute("aria-labelledby", `tab-${name}`);
  if (name === "orders") S.orders ? renderOrders() : loadOrders();
  if (name === "reviews") S.reviews ? renderReviews() : loadReviews();
  if (name === "books") S.books ? renderBooks() : loadBooks();
}

const panel = () => $("#panel");
const panelSkeleton = () => { const p = panel(); if (p) p.innerHTML = '<div class="grid gap-3"><div class="skeleton h-12"></div><div class="skeleton h-48"></div></div>'; };
function panelError(retryKey) {
  setDataStatus("error");
  const p = panel();
  if (p) p.innerHTML = `<div class="state-box"><img src="assets/brand/favicon.svg" alt="" width="88" height="88"><p class="font-semibold">Kết nối đang hơi chậm, bạn thử lại nhé.</p><button type="button" class="btn btn-outline mt-4" data-reload="${retryKey}">Thử lại</button></div>`;
}
const emptyBox = (text) => `<div class="state-box"><img src="assets/brand/favicon.svg" alt="" width="88" height="88"><p class="font-semibold">${esc(text)}</p></div>`;

// ---------------------------------------------------------------- F10: đơn hàng
async function loadOrders() {
  panelSkeleton();
  try {
    const { data, error } = await sb
      .from("orders")
      .select("id,customer_name,phone,address,note,payment_method,status,created_at,order_items(id,book_title,quantity,unit_price)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    S.orders = data;
    setDataStatus("ok");
    if (S.tab === "orders") renderOrders();
  } catch (e) {
    console.error("[Mầm Chữ] Lỗi tải đơn hàng:", errText(e));
    if (isAuthError(e)) return failAction(e, "");
    panelError("orders");
  }
}

function orderRowHTML(o) {
  const open = S.openOrder === o.id;
  const st = STATUS[o.status];
  const items = (o.order_items || [])
    .map((i) => `<li class="flex justify-between gap-3 py-1"><span>${esc(i.book_title)} <span class="text-muted">× ${i.quantity}</span></span><span class="whitespace-nowrap">${esc(formatVND(i.unit_price))} → <strong>${esc(formatVND(i.quantity * i.unit_price))}</strong></span></li>`)
    .join("");
  const detail = open ? `
    <tr class="detail"><td colspan="7">
      <div class="grid gap-4 md:grid-cols-2">
        <div>
          <h3 class="text-[17px]">Các cuốn trong đơn</h3>
          ${items ? `<ul class="m-0 mt-2 list-none p-0">${items}</ul>` : '<p class="mt-2 text-muted">Đơn chưa có dòng sách nào (có thể do lỗi khi khách đặt hàng). Bạn có thể xóa đơn này.</p>'}
          <p class="mt-2 text-right font-bold">Tổng cộng: ${esc(formatVND(orderTotal(o)))}</p>
        </div>
        <div>
          <h3 class="text-[17px]">Thông tin nhận hàng</h3>
          <dl class="spec-list mt-2">
            <dt>Người nhận</dt><dd>${esc(o.customer_name)}</dd>
            <dt>Điện thoại</dt><dd><a class="text-link" href="tel:${esc(o.phone)}">${esc(o.phone)}</a></dd>
            <dt>Địa chỉ</dt><dd class="whitespace-pre-line">${esc(o.address)}</dd>
            ${o.note ? `<dt>Ghi chú</dt><dd class="whitespace-pre-line">${esc(o.note)}</dd>` : ""}
            <dt>Thanh toán</dt><dd>${o.payment_method === "cod" ? "Khi nhận hàng (COD)" : esc(o.payment_method)}</dd>
          </dl>
          ${o.status === "moi" ? '<p class="mt-3 text-sm text-muted">Nhớ trừ tồn kho ở tab Sách khi chuyển đơn sang "Đang giao".</p>' : ""}
        </div>
      </div>
    </td></tr>` : "";
  return `
    <tr data-order="${esc(o.id)}">
      <td><button type="button" class="link-btn" data-order-toggle="${esc(o.id)}" aria-expanded="${open}">#${esc(shortId(o.id))}</button></td>
      <td>${esc(o.customer_name)}</td>
      <td>${esc(o.phone)}</td>
      <td class="num">${esc(formatVND(orderTotal(o)))}</td>
      <td class="whitespace-nowrap">${esc(fmtDateTime(o.created_at))}</td>
      <td>${statusBadge(o.status)}</td>
      <td><div class="flex flex-wrap gap-2">
        ${st && st.next ? `<button type="button" class="btn btn-primary btn-sm" data-order-next="${esc(o.id)}">${esc(st.nextLabel)}</button>` : ""}
        <button type="button" class="btn btn-danger btn-sm" data-order-del="${esc(o.id)}" aria-label="Xóa đơn #${esc(shortId(o.id))}">Xóa</button>
      </div></td>
    </tr>${detail}`;
}

function renderOrders() {
  const p = panel();
  if (!p) return;
  const all = S.orders || [];
  const count = (k) => (k === "all" ? all.length : all.filter((o) => o.status === k).length);
  const list = S.orderFilter === "all" ? all : all.filter((o) => o.status === S.orderFilter);
  p.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="chip-row" role="group" aria-label="Lọc đơn theo trạng thái">
        ${FILTERS.map(([k, label]) => `<button type="button" class="chip${S.orderFilter === k ? " is-active" : ""}" data-order-filter="${k}" aria-pressed="${S.orderFilter === k}">${label}<span class="chip-count">${count(k)}</span></button>`).join("")}
      </div>
      <button type="button" class="btn btn-outline btn-sm" data-reload="orders">Tải lại</button>
    </div>
    <div class="mt-4">
      ${list.length ? `<div class="table-wrap"><table class="admin-table" style="min-width:860px">
        <thead><tr><th>Mã đơn</th><th>Khách</th><th>Điện thoại</th><th class="num">Tổng tiền</th><th>Ngày đặt</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>${list.map(orderRowHTML).join("")}</tbody></table></div>`
        : emptyBox(all.length ? "Không có đơn nào ở trạng thái này." : "Chưa có đơn hàng nào.")}
    </div>`;
}

async function advanceOrder(id) {
  const o = S.orders.find((x) => x.id === id);
  const next = o && STATUS[o.status]?.next;
  if (!next) return;
  try {
    await mutate(sb.from("orders").update({ status: next }).eq("id", id)); // F11
    o.status = next;
    showToast(`Đã chuyển đơn #${shortId(id)} sang "${STATUS[next].label}".`, "success");
    renderOrders();
  } catch (e) {
    failAction(e, "Chưa cập nhật được trạng thái đơn, bạn thử lại nhé.");
  }
}

async function deleteOrder(id) {
  const o = S.orders.find((x) => x.id === id);
  if (!o) return;
  const yes = await confirmDialog({
    title: "Xóa đơn hàng?",
    message: `Xóa đơn #${shortId(id)} của ${o.customer_name}? Hành động này không hoàn tác được.`,
    extra: "Các dòng sách trong đơn cũng bị xóa.",
  });
  if (!yes) return;
  try {
    await mutate(sb.from("orders").delete().eq("id", id)); // F12
    S.orders = S.orders.filter((x) => x.id !== id);
    if (S.openOrder === id) S.openOrder = null;
    showToast(`Đã xóa đơn #${shortId(id)}.`, "success");
    renderOrders();
  } catch (e) {
    failAction(e, "Chưa xóa được đơn, bạn thử lại nhé.");
  }
}

// ---------------------------------------------------------------- F13: đánh giá
async function loadReviews() {
  panelSkeleton();
  try {
    const { data, error } = await sb
      .from("reviews")
      .select("id,reviewer_name,rating,comment,created_at,books(title)")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw error;
    S.reviews = data;
    setDataStatus("ok");
    if (S.tab === "reviews") renderReviews();
  } catch (e) {
    console.error("[Mầm Chữ] Lỗi tải đánh giá:", errText(e));
    if (isAuthError(e)) return failAction(e, "");
    panelError("reviews");
  }
}

function renderReviews() {
  const p = panel();
  if (!p) return;
  const list = S.reviews || [];
  const rows = list
    .map((r) => `
    <tr data-review="${esc(r.id)}">
      <td>${esc(r.books?.title || "(sách đã xóa)")}</td>
      <td>${esc(r.reviewer_name)}</td>
      <td class="whitespace-nowrap" aria-label="${esc(r.rating)} sao">${esc(r.rating)} ★</td>
      <td style="min-width:260px;white-space:pre-line">${esc(r.comment || "")}</td>
      <td class="whitespace-nowrap">${esc(fmtDateTime(r.created_at))}</td>
      <td><button type="button" class="btn btn-danger btn-sm" data-review-del="${esc(r.id)}" aria-label="Xóa đánh giá của ${esc(r.reviewer_name)}">Xóa</button></td>
    </tr>`)
    .join("");
  p.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="m-0 text-muted">${list.length} đánh giá</p>
      <button type="button" class="btn btn-outline btn-sm" data-reload="reviews">Tải lại</button>
    </div>
    <div class="mt-4">
      ${list.length ? `<div class="table-wrap"><table class="admin-table" style="min-width:760px">
        <thead><tr><th>Sách</th><th>Người đánh giá</th><th>Số sao</th><th>Nội dung</th><th>Ngày</th><th>Thao tác</th></tr></thead>
        <tbody>${rows}</tbody></table></div>` : emptyBox("Chưa có đánh giá nào.")}
    </div>`;
}

async function deleteReview(id) {
  const r = S.reviews.find((x) => x.id === id);
  if (!r) return;
  const yes = await confirmDialog({
    title: "Xóa đánh giá?",
    message: `Xóa đánh giá ${r.rating} sao của ${r.reviewer_name} cho sách "${r.books?.title || ""}"? Hành động này không hoàn tác được.`,
  });
  if (!yes) return;
  try {
    await mutate(sb.from("reviews").delete().eq("id", id)); // F13
    S.reviews = S.reviews.filter((x) => x.id !== id);
    showToast("Đã xóa đánh giá.", "success");
    renderReviews();
  } catch (e) {
    failAction(e, "Chưa xóa được đánh giá, bạn thử lại nhé.");
  }
}

// ---------------------------------------------------------------- F14–F16: sách
async function loadBooks() {
  panelSkeleton();
  try {
    const [cats, bks] = await Promise.all([
      sb.from("categories").select("id,name,slug").order("sort_order").order("name"),
      sb
        .from("books")
        .select("id,slug,title,author,description,publisher,publish_year,pages,age_min,age_max,price,original_price,stock,cover_url,is_featured,is_active,category_id,categories(name)")
        .order("title"),
    ]);
    if (cats.error) throw cats.error;
    if (bks.error) throw bks.error;
    S.categories = cats.data;
    S.books = bks.data;
    setDataStatus("ok");
    if (S.tab === "books") renderBooks();
  } catch (e) {
    console.error("[Mầm Chữ] Lỗi tải sách:", errText(e));
    if (isAuthError(e)) return failAction(e, "");
    panelError("books");
  }
}

function bookRowHTML(b) {
  const id = esc(b.id);
  const num = (field, value, min = 0) => `<input class="input input-sm" style="width:116px" type="number" inputmode="numeric" min="${min}" data-quick="${field}" data-id="${id}" data-initial="${esc(value ?? "")}" value="${esc(value ?? "")}" aria-label="${field === "price" ? "Giá bán" : field === "original" ? "Giá gốc" : "Tồn kho"} của ${esc(b.title)}">`;
  return `
    <tr data-book="${id}" class="${b.is_active ? "" : "is-hidden-book"}">
      <td>
        <div class="flex items-center gap-3" style="min-width:260px">
          <img class="admin-thumb" src="${esc(safeImgUrl(b.cover_url))}" alt="" width="44" height="66" loading="lazy">
          <div>
            <strong>${esc(b.title)}</strong>
            <div class="text-sm text-muted">${esc(b.author)} · ${esc(b.categories?.name || "")}</div>
            <div class="text-xs text-faint">/${esc(b.slug)} · ${esc(ageLabel(b.age_min, b.age_max))}</div>
            <div class="mt-1 flex flex-wrap gap-1">${b.is_featured ? '<span class="badge badge-age">Nổi bật</span>' : ""}${b.is_active ? "" : '<span class="badge badge-low">Đang ẩn</span>'}</div>
          </div>
        </div>
      </td>
      <td>${num("price", b.price)}</td>
      <td>${num("original", b.original_price)}</td>
      <td>${num("stock", b.stock)}</td>
      <td><button type="button" class="btn btn-outline btn-sm" data-book-toggle="${id}" aria-pressed="${!b.is_active}">${b.is_active ? "Ẩn" : "Hiện"}</button></td>
      <td><div class="flex flex-wrap gap-2" style="min-width:190px">
        <button type="button" class="btn btn-primary btn-sm" data-book-save="${id}" disabled>Lưu</button>
        <button type="button" class="btn btn-outline btn-sm" data-book-edit="${id}">Sửa</button>
        <button type="button" class="btn btn-danger btn-sm" data-book-del="${id}" aria-label="Xóa sách ${esc(b.title)}">Xóa</button>
      </div></td>
    </tr>`;
}

function renderBooks() {
  const p = panel();
  if (!p) return;
  const list = S.books || [];
  p.innerHTML = `
    <div class="flex flex-wrap items-center justify-between gap-3">
      <p class="m-0 text-muted">${list.length} cuốn · tồn kho do bạn cập nhật tay sau khi xử lý đơn</p>
      <div class="flex gap-2">
        <button type="button" class="btn btn-outline btn-sm" data-reload="books">Tải lại</button>
        <button type="button" class="btn btn-primary btn-sm" data-book-add>${icon("plus", { size: 16 })} Thêm sách</button>
      </div>
    </div>
    <div class="mt-4">
      ${list.length ? `<div class="table-wrap"><table class="admin-table" style="min-width:980px">
        <thead><tr><th>Sách</th><th>Giá bán (₫)</th><th>Giá gốc (₫)</th><th>Tồn kho</th><th>Hiển thị</th><th>Thao tác</th></tr></thead>
        <tbody>${list.map(bookRowHTML).join("")}</tbody></table></div>` : emptyBox("Chưa có cuốn sách nào. Bấm \"Thêm sách\" để bắt đầu.")}
    </div>`;
}

// ---- Sửa nhanh giá bán, giá gốc, tồn kho ngay trong dòng (F15)
const toInt = (s) => (String(s).trim() === "" ? null : Number(s));
const isInt = (n) => Number.isInteger(n);

function quickDirty(tr) {
  const inputs = [...tr.querySelectorAll("[data-quick]")];
  const dirty = inputs.some((i) => i.value.trim() !== i.dataset.initial);
  tr.querySelector("[data-book-save]").disabled = !dirty;
}

async function saveQuick(id) {
  const b = S.books.find((x) => x.id === id);
  const tr = root.querySelector(`tr[data-book="${CSS.escape(id)}"]`);
  if (!b || !tr) return;
  const v = (f) => tr.querySelector(`[data-quick="${f}"]`).value;
  const price = toInt(v("price")), original = toInt(v("original")), stock = toInt(v("stock"));
  let msg = "";
  if (price === null || !isInt(price) || price < 0) msg = "Giá bán phải là số nguyên từ 0 trở lên.";
  else if (original !== null && (!isInt(original) || original < price)) msg = "Giá gốc phải lớn hơn hoặc bằng giá bán, hoặc để trống nếu không giảm giá.";
  else if (stock === null || !isInt(stock) || stock < 0) msg = "Tồn kho phải là số nguyên từ 0 trở lên.";
  if (msg) return showToast(msg, "error");
  const btn = tr.querySelector("[data-book-save]");
  btn.disabled = true;
  try {
    await mutate(sb.from("books").update({ price, original_price: original, stock }).eq("id", id)); // F15
    Object.assign(b, { price, original_price: original, stock });
    tr.outerHTML = bookRowHTML(b);
    showToast(`Đã cập nhật "${b.title}".`, "success");
  } catch (e) {
    btn.disabled = false;
    failAction(e, "Chưa lưu được, bạn thử lại nhé.");
  }
}

async function toggleBook(id) {
  const b = S.books.find((x) => x.id === id);
  if (!b) return;
  try {
    await mutate(sb.from("books").update({ is_active: !b.is_active }).eq("id", id)); // F15: ẩn/hiện
    b.is_active = !b.is_active;
    root.querySelector(`tr[data-book="${CSS.escape(id)}"]`).outerHTML = bookRowHTML(b);
    showToast(b.is_active ? `Đã hiện lại "${b.title}" cho khách.` : `Đã ẩn "${b.title}" khỏi khách.`, "success");
  } catch (e) {
    failAction(e, "Chưa đổi được trạng thái hiển thị, bạn thử lại nhé.");
  }
}

async function deleteBook(id) {
  const b = S.books.find((x) => x.id === id);
  if (!b) return;
  const yes = await confirmDialog({
    title: "Xóa sách?",
    message: `Xóa sách "${b.title}"? Các đánh giá của sách này cũng bị xóa. Hành động này không hoàn tác được.`,
    extra: 'Đơn hàng cũ vẫn giữ nguyên tên sách. Nếu chỉ muốn tạm ngừng bán, hãy dùng nút "Ẩn".',
  });
  if (!yes) return;
  try {
    await mutate(sb.from("books").delete().eq("id", id)); // F16
    S.books = S.books.filter((x) => x.id !== id);
    S.reviews = null; // đánh giá của sách đã xóa theo: nạp lại khi mở tab Đánh giá
    S.orders = null;  // dòng đơn cũ giờ có book_id rỗng
    showToast(`Đã xóa sách "${b.title}".`, "success");
    renderBooks();
  } catch (e) {
    failAction(e, "Chưa xóa được sách, bạn thử lại nhé.");
  }
}

// ---- Hộp thoại thêm / sửa sách (F14, F15)
const bk = (id) => document.getElementById(`bk-${id}`);
const BK_ERRORS = [["title"], ["slug"], ["author"], ["category"], ["year"], ["pages"], ["age"], ["price"], ["original"], ["stock"], ["cover"]];

function openBookDialog(book = null) {
  S.editingId = book ? book.id : null;
  S.slugTouched = Boolean(book);
  $("#bk-title-head").textContent = book ? "Sửa sách" : "Thêm sách";
  $("#bk-save").textContent = book ? "Lưu thay đổi" : "Lưu sách";
  BK_ERRORS.forEach(([k]) => setFieldError(null, `bk-${k}-err`, ""));
  $("#bk-form-error").classList.remove("is-visible");
  $("#bk-form-error").textContent = "";
  bk("category").innerHTML = '<option value="">Chọn thể loại</option>' + (S.categories || []).map((c) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join("");
  const b = book || {};
  bk("title").value = b.title || "";
  bk("slug").value = b.slug || "";
  bk("author").value = b.author || "";
  bk("category").value = b.category_id || "";
  bk("publisher").value = b.publisher || "";
  bk("year").value = b.publish_year ?? "";
  bk("pages").value = b.pages ?? "";
  bk("age-min").value = b.age_min ?? "";
  bk("age-max").value = b.age_max ?? "";
  bk("price").value = b.price ?? "";
  bk("original").value = b.original_price ?? "";
  bk("stock").value = b.stock ?? 0;
  bk("cover").value = b.cover_url || "";
  bk("desc").value = b.description || "";
  bk("featured").checked = Boolean(b.is_featured);
  bk("active").checked = book ? Boolean(b.is_active) : true;
  bk("cover-preview").src = safeImgUrl(b.cover_url);
  $("#book-dialog").showModal();
  bk("title").focus();
}

function readBookForm() {
  const val = (id) => bk(id).value.trim();
  const errors = {};
  const out = {};
  out.title = val("title").replace(/\s+/g, " ");
  if (!out.title) errors.title = "Bạn nhập tên sách giúp nhé.";
  else if (out.title.length > 200) errors.title = "Tên sách tối đa 200 ký tự.";
  out.slug = val("slug");
  if (!out.slug) errors.slug = "Bạn nhập slug giúp nhé.";
  else if (!SLUG_RE.test(out.slug) || out.slug.length > 120) errors.slug = "Slug chỉ gồm chữ thường không dấu, số và dấu gạch ngang (ví dụ: sach-hay-so-1).";
  out.author = val("author").replace(/\s+/g, " ");
  if (!out.author) errors.author = "Bạn nhập tên tác giả giúp nhé.";
  out.category_id = bk("category").value;
  if (!out.category_id) errors.category = "Bạn chọn thể loại giúp nhé.";
  out.publisher = val("publisher") || null;
  const yearRaw = val("year"); out.publish_year = yearRaw === "" ? null : Number(yearRaw);
  if (out.publish_year !== null && (!isInt(out.publish_year) || out.publish_year < 1900 || out.publish_year > 2100)) errors.year = "Năm xuất bản từ 1900 đến 2100.";
  const pagesRaw = val("pages"); out.pages = pagesRaw === "" ? null : Number(pagesRaw);
  if (out.pages !== null && (!isInt(out.pages) || out.pages <= 0)) errors.pages = "Số trang phải là số nguyên lớn hơn 0.";
  const aMinRaw = val("age-min"), aMaxRaw = val("age-max");
  out.age_min = aMinRaw === "" ? null : Number(aMinRaw);
  out.age_max = aMaxRaw === "" ? null : Number(aMaxRaw);
  if ((out.age_min === null) !== (out.age_max === null)) errors.age = "Hãy nhập cả hai ô độ tuổi, hoặc để trống cả hai (sách cho phụ huynh).";
  else if (out.age_min !== null && (!isInt(out.age_min) || !isInt(out.age_max) || out.age_min < 0 || out.age_max > 18 || out.age_min > out.age_max)) errors.age = "Độ tuổi từ 0 đến 18 và 'từ' không lớn hơn 'đến'.";
  const priceRaw = val("price"); out.price = priceRaw === "" ? null : Number(priceRaw);
  if (out.price === null || !isInt(out.price) || out.price < 0) errors.price = "Giá bán phải là số nguyên từ 0 trở lên.";
  const origRaw = val("original"); out.original_price = origRaw === "" ? null : Number(origRaw);
  if (out.original_price !== null && (!isInt(out.original_price) || (out.price !== null && out.original_price < out.price))) errors.original = "Giá gốc phải lớn hơn hoặc bằng giá bán, hoặc để trống.";
  const stockRaw = val("stock"); out.stock = stockRaw === "" ? null : Number(stockRaw);
  if (out.stock === null || !isInt(out.stock) || out.stock < 0) errors.stock = "Tồn kho phải là số nguyên từ 0 trở lên.";
  const cover = val("cover");
  if (cover && (cover.length > 300 || (safeImgUrl(cover) === DEFAULT_COVER && cover !== DEFAULT_COVER))) errors.cover = "Đường dẫn ảnh phải là đường dẫn tương đối (assets/covers/...) hoặc bắt đầu bằng http(s)://.";
  out.cover_url = cover || null;
  out.description = bk("desc").value.trim() || null;
  out.is_featured = bk("featured").checked;
  out.is_active = bk("active").checked;
  return { out, errors };
}

async function submitBook() {
  BK_ERRORS.forEach(([k]) => setFieldError(null, `bk-${k}-err`, ""));
  const { out, errors } = readBookForm();
  const keys = Object.keys(errors);
  const idOf = { age: "bk-age-min", original: "bk-original" };
  if (keys.length) {
    keys.forEach((k) => setFieldError(null, `bk-${k}-err`, errors[k]));
    (document.getElementById(idOf[keys[0]] || `bk-${keys[0]}`) || bk("title")).focus();
    return;
  }
  const btn = $("#bk-save");
  const label = btn.textContent;
  btn.disabled = true;
  btn.classList.add("is-loading");
  btn.textContent = "Đang lưu...";
  try {
    if (S.editingId) await mutate(sb.from("books").update(out).eq("id", S.editingId)); // F15
    else {
      const { error } = await sb.from("books").insert(out); // F14
      if (error) throw error;
    }
    $("#book-dialog").close();
    showToast(S.editingId ? "Đã lưu thay đổi." : `Đã thêm sách "${out.title}".`, "success");
    S.books = null;
    if (S.tab === "books") loadBooks();
  } catch (e) {
    console.error("[Mầm Chữ] Lỗi lưu sách:", errText(e));
    if (isAuthError(e)) { $("#book-dialog").close(); return failAction(e, ""); }
    if (e && e.code === "23505") setFieldError(null, "bk-slug-err", "Slug này đã có sách khác dùng, bạn đổi giúp một chút nhé.");
    else {
      const box = $("#bk-form-error");
      box.textContent = e && e.code === "23514" ? "Dữ liệu chưa hợp lệ với quy định của cơ sở dữ liệu, bạn kiểm tra lại các ô nhé." : "Kết nối đang hơi chậm, bạn thử lại nhé.";
      box.classList.add("is-visible");
    }
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = label;
  }
}

// ---------------------------------------------------------------- Sự kiện
root.addEventListener("click", (e) => {
  const t = (sel) => e.target.closest(sel);
  if (t("#logout-btn")) {
    sb.auth.signOut().finally(() => { window.location.href = "index.html"; });
    return;
  }
  const tab = t("[data-tab]");
  if (tab) return selectTab(tab.dataset.tab);
  const reload = t("[data-reload]");
  if (reload) {
    const k = reload.dataset.reload;
    if (k === "orders") { S.orders = null; return loadOrders(); }
    if (k === "reviews") { S.reviews = null; return loadReviews(); }
    if (k === "books") { S.books = null; return loadBooks(); }
  }
  const filter = t("[data-order-filter]");
  if (filter) { S.orderFilter = filter.dataset.orderFilter; return renderOrders(); }
  const toggle = t("[data-order-toggle]");
  if (toggle) { const id = toggle.dataset.orderToggle; S.openOrder = S.openOrder === id ? null : id; return renderOrders(); }
  const next = t("[data-order-next]");
  if (next) return advanceOrder(next.dataset.orderNext);
  const od = t("[data-order-del]");
  if (od) return deleteOrder(od.dataset.orderDel);
  const rd = t("[data-review-del]");
  if (rd) return deleteReview(rd.dataset.reviewDel);
  if (t("[data-book-add]")) return openBookDialog(null);
  const edit = t("[data-book-edit]");
  if (edit) return openBookDialog(S.books.find((b) => b.id === edit.dataset.bookEdit));
  const save = t("[data-book-save]");
  if (save && !save.disabled) return saveQuick(save.dataset.bookSave);
  const tg = t("[data-book-toggle]");
  if (tg) return toggleBook(tg.dataset.bookToggle);
  const bd = t("[data-book-del]");
  if (bd) return deleteBook(bd.dataset.bookDel);
});

root.addEventListener("input", (e) => {
  if (e.target.matches("[data-quick]")) quickDirty(e.target.closest("tr"));
});

root.addEventListener("keydown", (e) => {
  if (e.target.matches("[data-quick]") && e.key === "Enter") {
    e.preventDefault();
    const btn = e.target.closest("tr").querySelector("[data-book-save]");
    if (!btn.disabled) btn.click();
  }
  // Mũi tên trái/phải để chuyển tab (mẫu truy cập chuẩn cho tablist)
  if (e.target.matches("[data-tab]") && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
    const keys = TABS.map(([k]) => k);
    const i = keys.indexOf(e.target.dataset.tab);
    const nextKey = keys[(i + (e.key === "ArrowRight" ? 1 : keys.length - 1)) % keys.length];
    selectTab(nextKey);
    $(`#tab-${nextKey}`).focus();
  }
});

root.addEventListener("submit", (e) => {
  if (e.target.id !== "login-form") return;
  e.preventDefault();
  onLogin();
});

// Hộp thoại sách
$("#book-form").addEventListener("submit", (e) => { e.preventDefault(); submitBook(); });
$("#bk-cancel").addEventListener("click", () => $("#book-dialog").close());
bk("title").addEventListener("input", () => { if (!S.slugTouched) bk("slug").value = slugify(bk("title").value).slice(0, 120); });
bk("slug").addEventListener("input", () => { S.slugTouched = true; });
bk("cover").addEventListener("input", () => { bk("cover-preview").src = safeImgUrl(bk("cover").value); });
bindImageFallback(root);
bindImageFallback($("#book-dialog"));

// ---------------------------------------------------------------- Khởi động
async function init() {
  let isConfigured;
  try {
    ({ supabase: sb, isConfigured } = await import("../supabase.js"));
  } catch (err) {
    console.error("[Mầm Chữ] Không nạp được supabase-js:", errText(err));
    setDataStatus("error");
    return showBox("Kết nối đang hơi chậm, bạn thử lại nhé.", { actions: '<button type="button" class="btn btn-outline mt-4" onclick="location.reload()">Thử lại</button>' });
  }
  if (!isConfigured) {
    setDataStatus("error");
    return showBox("Chưa kết nối được Supabase.", { hint: "Điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js." });
  }
  // Khi đăng xuất (hoặc phiên hết hạn không làm mới được) thì quay về form đăng nhập, xóa dữ liệu đã nạp
  sb.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") {
      Object.assign(S, { orders: null, reviews: null, books: null, categories: null, openOrder: null, email: "" });
      renderLogin();
    }
  });
  const { data } = await sb.auth.getSession();
  if (data && data.session) startApp(data.session.user.email);
  else renderLogin();
}

init();
