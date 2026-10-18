// cart-page.js – Giỏ hàng và đặt hàng COD (cart.html).
//   F07  Giỏ hàng: đổi số lượng, xóa; đối chiếu giá và tồn kho hiện tại; sách hết hàng không đặt được
//   F08  Đặt hàng COD: INSERT orders rồi INSERT order_items
//   F17  Giá gốc gạch ngang + badge giảm giá trong từng dòng
//
// LUỒNG 6 BƯỚC (PRD mục 7.1):
//   1. Giỏ lưu trong localStorage (book_id, slug, quantity, price đã thấy – chỉ để báo giá đổi). Xem cart.js.
//   2. Ở trang này đọc lại giá và tồn kho hiện tại từ `books`, báo nếu giá đổi hoặc hết hàng.   -> loadCart()/reconcile()
//   3. Khách điền họ tên, số điện thoại, địa chỉ, ghi chú. Thanh toán cố định COD.                -> form #order-form
//   4. Bấm "Đặt hàng": orderId = crypto.randomUUID(); INSERT orders; INSERT order_items (một lần,
//      nhiều dòng) với unit_price = giá vừa đọc.                                                   -> placeOrder()
//   5. Thành công: xóa giỏ, hiện màn hình xác nhận (mã đơn = 8 ký tự đầu của UUID) và tóm tắt lấy
//      từ dữ liệu giỏ trên trình duyệt.                                                           -> renderConfirmation()
//   6. Nếu INSERT order_items thất bại sau khi orders đã chèn: báo lỗi, GIỮ giỏ hàng để thử lại.
//      Khách không xóa được đơn mồ côi, Admin sẽ xóa. Khi thử lại với cùng thông tin thì dùng lại
//      đúng orderId cũ và chỉ chèn lại order_items (không tạo thêm đơn mồ côi mới).
//
// QUY TẮC QUAN TRỌNG: khách KHÔNG có quyền đọc bảng `orders`/`order_items`. Vì vậy ở mọi chỗ chèn đơn
// chỉ gọi .insert(...) và KHÔNG nối .select() (nối .select() sẽ đòi quyền đọc và bị RLS từ chối).
// Chống XSS: mọi dữ liệu đều qua esc() hoặc textContent (PRD mục 8).
import { initLayout, setDataStatus, showToast } from "../layout.js";
import { getCart, removeFromCart, setQuantity, setSeenPrices, clearCart, MAX_QTY } from "../cart.js";
import { icon } from "../icons.js";
import {
  esc, formatVND, discountPercent, safeImgUrl, bindImageFallback, errText,
  uuid, normalizePhone, setFieldError,
} from "../utils.js";

initLayout({ active: "cart" });

const root = document.getElementById("cart-root");
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const retryBtn = '<button type="button" class="btn btn-outline mt-4" data-retry>Thử lại</button>';

let sb = null;          // client Supabase
let lines = [];         // các dòng đã đối chiếu với database
let notes = [];         // thông báo giá đổi / số lượng bị điều chỉnh
let pending = null;     // đơn đã chèn nhưng chưa chèn xong order_items: { orderId, sig, inserted }
let submitting = false; // chặn bấm hai lần

// ---------------------------------------------------------------- Các khung trạng thái
function setPage(title, html, busy = false) {
  document.title = `${title} – Mầm Chữ`;
  root.setAttribute("aria-busy", String(busy));
  root.innerHTML = html;
}

function showSkeleton() {
  setPage("Giỏ hàng", `
    <h1>Giỏ hàng của bố mẹ</h1>
    <div class="mt-6 grid gap-3"><div class="skeleton h-32"></div><div class="skeleton h-32"></div></div>`, true);
}

function showBox(title, { hint = "", actions = "" } = {}) {
  setPage("Giỏ hàng", `
    <h1>Giỏ hàng của bố mẹ</h1>
    <div class="state-box mt-6">
      <img src="assets/brand/favicon.svg" alt="" width="88" height="88">
      <p class="font-semibold">${esc(title)}</p>
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ""}
      ${actions}
    </div>`);
}

function showEmpty() {
  showBox("Giỏ hàng đang trống. Mình cùng chọn sách cho bé nhé!", {
    actions: '<a class="btn btn-primary mt-4" href="books.html">Đi chọn sách</a>',
  });
}

function showConnectionError() {
  setDataStatus("error");
  showBox("Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", { actions: retryBtn });
}

// ---------------------------------------------------------------- Bước 2: đối chiếu giỏ với giá/tồn kho hiện tại
async function fetchBooks(ids) {
  const { data, error } = await sb
    .from("books")
    .select("id,slug,title,author,price,original_price,stock,cover_url")
    .in("id", ids);
  if (error) throw error;
  return data;
}

/** Ghép giỏ (localStorage) với dữ liệu mới từ database. Không tin giá lưu trong giỏ. */
function reconcile(cart, books) {
  const byId = new Map(books.map((b) => [b.id, b]));
  const out = [], found = [], seen = {}, clamps = [];
  for (const it of cart) {
    const b = byId.get(it.book_id);
    if (!b) { // đã xóa hoặc đã ẩn (RLS không cho khách thấy)
      out.push({ id: it.book_id, slug: it.slug, qty: it.quantity, status: "gone" });
      continue;
    }
    const cap = Math.min(MAX_QTY, Math.max(0, b.stock));
    let qty = it.quantity;
    let status = "ok";
    if (b.stock <= 0) status = "out";
    else if (qty > cap) {
      found.push({ type: "warn", text: `Cuốn "${b.title}" chỉ còn ${b.stock} cuốn nên Mầm Chữ đã điều chỉnh số lượng giúp bố mẹ.` });
      qty = cap;
      clamps.push([b.id, qty]);
    }
    if (Number.isFinite(it.price) && it.price !== b.price) {
      found.push({ type: "info", text: `Giá cuốn "${b.title}" đã đổi từ ${formatVND(it.price)} thành ${formatVND(b.price)}.` });
    }
    seen[b.id] = b.price;
    out.push({ id: b.id, slug: b.slug, title: b.title, author: b.author, cover: b.cover_url, price: b.price, original: b.original_price, stock: b.stock, qty, status });
  }
  return { lines: out, notes: found, seen, clamps };
}

const fingerprint = (ls) => ls.map((l) => [l.id, l.price, l.status, l.qty].join(":")).join("|");

/** Đọc giỏ, hỏi database, cập nhật lines/notes và lưu lại giỏ (số lượng đã kẹp, giá đã thấy). */
async function syncWithDatabase() {
  let cart = getCart();
  // Bỏ các dòng có book_id hỏng (giỏ bị sửa tay)
  cart.filter((i) => !UUID_RE.test(i.book_id)).forEach((i) => removeFromCart(i.book_id));
  cart = cart.filter((i) => UUID_RE.test(i.book_id));
  if (!cart.length) { lines = []; notes = []; return; }
  const books = await fetchBooks(cart.map((i) => i.book_id));
  const res = reconcile(cart, books);
  res.clamps.forEach(([id, qty]) => setQuantity(id, qty));
  if (Object.keys(res.seen).length) setSeenPrices(res.seen);
  lines = res.lines;
  notes = res.notes;
}

// ---------------------------------------------------------------- Vẽ giỏ hàng
const okLines = () => lines.filter((l) => l.status === "ok");
const badLines = () => lines.filter((l) => l.status !== "ok");
const totalOf = (ls) => ls.reduce((s, l) => s + l.price * l.qty, 0);

function lineHTML(l) {
  const remove = `<button type="button" class="btn btn-ghost cart-remove" data-remove data-id="${esc(l.id)}" aria-label="Xóa ${esc(l.title || "cuốn này")} khỏi giỏ">${icon("x", { size: 18 })} Xóa</button>`;
  if (l.status === "gone") {
    return `
    <li class="cart-line cart-line--bad">
      <span class="cart-line__cover"><img src="assets/covers/default.svg" alt="" width="600" height="900"></span>
      <div>
        <h3 class="cart-line__title">Cuốn này hiện không còn bán</h3>
        <p class="mt-1 text-sm text-muted">Bố mẹ xóa cuốn này khỏi giỏ để đặt các cuốn còn lại nhé.</p>
      </div>
      <div class="cart-line__side"><span class="badge badge-out">Không còn bán</span>${remove}</div>
    </li>`;
  }
  const href = `book.html?slug=${encodeURIComponent(l.slug)}`;
  const pct = discountPercent(l.price, l.original);
  const cover = `<a class="cart-line__cover" href="${esc(href)}" tabindex="-1" aria-hidden="true"><img src="${esc(safeImgUrl(l.cover))}" alt="" width="600" height="900" loading="lazy"></a>`;
  const out = l.status === "out";
  const max = Math.min(MAX_QTY, l.stock);
  const priceHTML = `
    <div class="mt-2 flex flex-wrap items-baseline gap-x-2">
      <span class="price">${esc(formatVND(l.price))}</span>
      ${pct > 0 ? `<span class="price-old" style="margin-left:0">${esc(formatVND(l.original))}</span><span class="badge badge-sale">-${pct}%</span>` : ""}
    </div>`;
  const stockBadge = out ? '<span class="badge badge-out">Hết hàng</span>'
    : l.stock <= 5 ? `<span class="badge badge-low">Chỉ còn ${l.stock}</span>` : "";
  const side = out
    ? `<span class="text-sm font-semibold text-[#B91C1C]">Cuốn này tạm hết rồi, bố mẹ xóa khỏi giỏ để đặt các cuốn còn lại nhé.</span>${remove}`
    : `<div class="qty" role="group" aria-label="Số lượng ${esc(l.title)}">
         <button type="button" data-qty-minus data-id="${esc(l.id)}" aria-label="Giảm số lượng">${icon("minus", { size: 18 })}</button>
         <input type="number" inputmode="numeric" min="1" max="${max}" value="${l.qty}" data-qty-input data-id="${esc(l.id)}" aria-label="Số lượng">
         <button type="button" data-qty-plus data-id="${esc(l.id)}" aria-label="Tăng số lượng">${icon("plus", { size: 18 })}</button>
       </div>
       <span class="cart-line__total" aria-label="Thành tiền">${esc(formatVND(l.price * l.qty))}</span>
       ${remove}`;
  return `
    <li class="cart-line${out ? " cart-line--bad" : ""}">
      ${cover}
      <div>
        <h3 class="cart-line__title"><a href="${esc(href)}">${esc(l.title)}</a></h3>
        <p class="mt-1 text-sm text-muted">${esc(l.author)}</p>
        ${priceHTML}
        ${stockBadge ? `<div class="mt-2">${stockBadge}</div>` : ""}
      </div>
      <div class="cart-line__side">${side}</div>
    </li>`;
}

function renderNotes() {
  const el = document.getElementById("cart-notes");
  if (!el) return;
  el.innerHTML = notes
    .map((n) => `<div class="notice notice--${n.type === "warn" ? "warn" : "info"}">${icon(n.type === "warn" ? "alert" : "sprout", { size: 18 })}<span>${esc(n.text)}</span></div>`)
    .join("");
}

function renderList() {
  document.getElementById("cart-list").innerHTML = lines.map(lineHTML).join("");
}

function renderSummary() {
  const ok = okLines(), bad = badLines();
  const count = ok.reduce((s, l) => s + l.qty, 0);
  const total = totalOf(ok);
  document.getElementById("cart-summary").innerHTML = `
    <h2 id="sum-title" class="text-[22px] md:text-[24px]">Tóm tắt đơn</h2>
    <div class="mt-3">
      <div class="sum-row"><span>Tạm tính (${count} cuốn)</span><strong>${esc(formatVND(total))}</strong></div>
      <div class="sum-row"><span>Phí giao hàng</span><strong class="text-[#166534]">Miễn phí</strong></div>
      <div class="sum-row mt-2 items-baseline border-t border-line pt-3"><span class="font-semibold">Tổng cộng</span><span class="sum-total">${esc(formatVND(total))}</span></div>
    </div>
    <p class="mt-3 text-sm text-muted">Thanh toán khi nhận hàng (COD). Bố mẹ được xem hàng trước khi trả tiền. Miễn phí giao hàng toàn quốc (chính sách mẫu).</p>
    ${bad.length ? `<p class="mt-3 text-sm font-semibold text-[#B91C1C]">Giá trên chưa tính ${bad.length} cuốn hết hàng hoặc không còn bán.</p>` : ""}`;
  updateSubmitState();
}

function updateSubmitState() {
  const btn = document.getElementById("order-submit");
  const hint = document.getElementById("order-hint");
  if (!btn) return;
  const problem = badLines().length > 0 ? "Bố mẹ xóa các cuốn hết hàng hoặc không còn bán khỏi giỏ để đặt hàng nhé."
    : okLines().length === 0 ? "Giỏ hàng chưa có cuốn nào để đặt." : "";
  btn.disabled = Boolean(problem) || submitting;
  if (hint) hint.textContent = problem;
}

function renderCart() {
  setPage("Giỏ hàng", `
<h1 id="cart-title" tabindex="-1">Giỏ hàng của bố mẹ</h1>
<div id="cart-notes" class="mt-4 grid gap-2" aria-live="polite"></div>
<div class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-8">
  <section class="lg:col-start-1 lg:row-start-1" aria-labelledby="list-title">
    <h2 id="list-title" class="sr-only">Các cuốn trong giỏ</h2>
    <ul id="cart-list" class="grid gap-3" role="list"></ul>
  </section>

  <aside id="cart-summary" class="panel lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-24 lg:self-start" aria-labelledby="sum-title"></aside>

  <section class="lg:col-start-1 lg:row-start-2" aria-labelledby="form-title">
    <form id="order-form" class="panel" novalidate>
      <h2 id="form-title">Thông tin nhận hàng</h2>
      <div class="mt-5 grid gap-5 sm:grid-cols-2">
        <div class="field">
          <label for="o-name">Họ tên người nhận <span class="req" aria-hidden="true">*</span><span class="sr-only">(bắt buộc)</span></label>
          <input id="o-name" class="input" type="text" maxlength="100" autocomplete="name" aria-describedby="o-name-err">
          <p id="o-name-err" class="field-error"></p>
        </div>
        <div class="field">
          <label for="o-phone">Số điện thoại <span class="req" aria-hidden="true">*</span><span class="sr-only">(bắt buộc)</span></label>
          <input id="o-phone" class="input" type="tel" inputmode="tel" maxlength="20" autocomplete="tel" placeholder="Ví dụ: 0908 123 456" aria-describedby="o-phone-err">
          <p id="o-phone-err" class="field-error"></p>
        </div>
      </div>
      <div class="field mt-5">
        <label for="o-address">Địa chỉ nhận sách <span class="req" aria-hidden="true">*</span><span class="sr-only">(bắt buộc)</span></label>
        <textarea id="o-address" class="input" rows="3" maxlength="300" autocomplete="street-address" placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành" aria-describedby="o-address-err"></textarea>
        <p id="o-address-err" class="field-error"></p>
      </div>
      <div class="field mt-5">
        <label for="o-note">Ghi chú <span class="font-normal text-muted">(không bắt buộc)</span></label>
        <textarea id="o-note" class="input" rows="3" maxlength="500" placeholder="Ví dụ: giao giờ hành chính" aria-describedby="o-note-err o-count"></textarea>
        <div id="o-count" class="field-hint">0/500</div>
        <p id="o-note-err" class="field-error"></p>
      </div>
      <div class="hp-field" aria-hidden="true"><label>Website <input id="o-website" type="text" tabindex="-1" autocomplete="off"></label></div>
      <p class="mt-5 rounded-xl bg-brand-light/50 p-3 text-sm">Phương thức thanh toán: <strong>Thanh toán khi nhận hàng (COD)</strong>.</p>
      <div id="order-alert" class="mt-4" role="alert"></div>
      <button type="submit" id="order-submit" class="btn btn-primary btn-block mt-5" aria-describedby="order-hint">Đặt hàng</button>
      <p id="order-hint" class="mt-2 text-sm font-semibold text-[#B91C1C]"></p>
    </form>
  </section>
</div>`);
  renderNotes();
  renderList();
  renderSummary();
}

/** Vẽ lại danh sách và tóm tắt (không đụng vào form để không mất chữ khách đã gõ). */
function refreshView() {
  if (!lines.length) return showEmpty();
  if (!document.getElementById("order-form")) return renderCart();
  renderNotes();
  renderList();
  renderSummary();
}

// ---------------------------------------------------------------- Tải trang (bước 1–2)
async function loadCart() {
  if (!getCart().length) return showEmpty();
  showSkeleton();
  let isConfigured;
  try {
    ({ supabase: sb, isConfigured } = await import("../supabase.js"));
  } catch (err) {
    console.error("[Mầm Chữ] Không nạp được supabase-js:", errText(err));
    return showConnectionError();
  }
  if (!isConfigured) {
    setDataStatus("error");
    return showBox("Mầm Chữ chưa kết nối được kho sách.", {
      hint: "Nếu bạn là người dựng web: điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js.",
    });
  }
  try {
    await syncWithDatabase();
    setDataStatus("ok");
    if (!lines.length) return showEmpty();
    renderCart();
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải giỏ hàng:", errText(err));
    showConnectionError();
  }
}

// ---------------------------------------------------------------- Bước 3: đọc và kiểm tra form
function readForm() {
  const v = (id) => document.getElementById(id).value;
  return {
    name: v("o-name").replace(/\s+/g, " ").trim(),
    phone: normalizePhone(v("o-phone")),
    address: v("o-address").replace(/[ \t]+/g, " ").trim(),
    note: v("o-note").trim(),
    website: v("o-website").trim(),
  };
}

function validate(d) {
  const errs = [];
  if (!d.name) errs.push(["o-name", "Bố mẹ cho Mầm Chữ biết tên người nhận nhé."]);
  else if (d.name.length > 100) errs.push(["o-name", "Tên hơi dài, bố mẹ rút gọn dưới 100 ký tự nhé."]);
  if (!/^0\d{9}$/.test(d.phone)) errs.push(["o-phone", "Số điện thoại chưa đúng, bố mẹ kiểm tra giúp mình nhé."]);
  if (d.address.length < 5) errs.push(["o-address", "Bố mẹ cho Mầm Chữ biết địa chỉ nhận sách (ít nhất 5 ký tự) nhé."]);
  else if (d.address.length > 300) errs.push(["o-address", "Địa chỉ hơi dài, bố mẹ rút gọn dưới 300 ký tự nhé."]);
  if (d.note.length > 500) errs.push(["o-note", "Ghi chú hơi dài, bố mẹ rút gọn dưới 500 ký tự nhé."]);
  return errs;
}

function setBusy(busy) {
  const btn = document.getElementById("order-submit");
  if (!btn) return;
  btn.classList.toggle("is-loading", busy);
  btn.textContent = busy ? "Đang gửi..." : "Đặt hàng";
  if (busy) btn.disabled = true;
  else updateSubmitState();
}

function showOrderAlert(message) {
  const el = document.getElementById("order-alert");
  if (!el) return;
  el.innerHTML = message ? `<div class="notice notice--error">${icon("alert", { size: 18 })}<span></span></div>` : "";
  if (message) el.querySelector("span").textContent = message;
}

// ---------------------------------------------------------------- Bước 4–6: đặt hàng
async function placeOrder() {
  if (submitting) return;
  const form = readForm();

  ["o-name", "o-phone", "o-address", "o-note"].forEach((id) => setFieldError(id, `${id}-err`, ""));
  showOrderAlert("");
  const errs = validate(form);
  if (errs.length) {
    errs.forEach(([id, msg]) => setFieldError(id, `${id}-err`, msg));
    document.getElementById(errs[0][0]).focus();
    return;
  }
  // Ô chống spam (honeypot): người thật không thấy ô này. Nếu bị điền thì bỏ qua, không ghi gì lên database.
  if (form.website) {
    showToast("Mầm Chữ đã nhận đơn của bố mẹ!", "success");
    return;
  }

  submitting = true;
  setBusy(true);
  try {
    // Đọc lại giá và tồn kho ngay trước khi đặt. Nếu có gì đổi thì dừng để khách xem lại.
    const before = fingerprint(lines);
    await syncWithDatabase();
    if (!lines.length) return showEmpty();
    if (fingerprint(lines) !== before) {
      refreshView();
      showToast("Giá hoặc số lượng vừa thay đổi, bố mẹ xem lại giỏ rồi đặt lại nhé.", "info");
      return;
    }
    const items = okLines();
    if (badLines().length || !items.length) {
      refreshView();
      return;
    }

    // Bước 4a: orders. Dùng lại orderId cũ nếu thông tin giữ nguyên và đơn đã được chèn ở lần trước.
    const sig = JSON.stringify([form.name, form.phone, form.address, form.note]);
    if (!pending || pending.sig !== sig) pending = { orderId: uuid(), sig, inserted: false };
    if (!pending.inserted) {
      // CHỈ insert, KHÔNG .select(): khách không có quyền đọc bảng orders.
      const { error } = await sb.from("orders").insert({
        id: pending.orderId,
        customer_name: form.name,
        phone: form.phone,
        address: form.address,
        note: form.note || null,
        payment_method: "cod",
        status: "moi",
      });
      if (error && error.code !== "23505") { // 23505 = đơn này đã có (lần gửi trước), coi như đã chèn
        console.error("[Mầm Chữ] Lỗi chèn orders:", errText(error));
        const rejected = ["23514", "42501", "22P02"].includes(error.code);
        showToast(rejected
          ? "Mầm Chữ chưa nhận được đơn. Bố mẹ kiểm tra lại thông tin giúp mình nhé."
          : "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", "error");
        return; // giỏ hàng giữ nguyên
      }
      pending.inserted = true;
    }

    // Bước 4b: order_items, một lần nhiều dòng, unit_price = giá vừa đọc. Cũng KHÔNG .select().
    const rows = items.map((l) => ({
      order_id: pending.orderId,
      book_id: l.id,
      book_title: l.title,
      quantity: l.qty,
      unit_price: l.price,
    }));
    const { error: itemsError } = await sb.from("order_items").insert(rows);
    if (itemsError) {
      // Bước 6: orders đã chèn nhưng order_items thất bại. Giữ giỏ, báo lỗi, cho thử lại.
      console.error("[Mầm Chữ] Lỗi chèn order_items:", errText(itemsError));
      showOrderAlert("Mầm Chữ đã nhận thông tin của bố mẹ nhưng chưa lưu được các cuốn sách trong đơn. Giỏ hàng vẫn còn nguyên, bố mẹ bấm \"Đặt hàng\" lần nữa giúp mình nhé.");
      showToast("Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", "error");
      return;
    }

    // Bước 5: thành công. Tóm tắt lấy từ dữ liệu giỏ trên trình duyệt, không đọc lại từ database.
    const snapshot = { shortId: pending.orderId.slice(0, 8).toUpperCase(), items: items.map((l) => ({ ...l })), total: totalOf(items), customer: form };
    pending = null;
    clearCart();
    lines = [];
    notes = [];
    renderConfirmation(snapshot);
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi đặt hàng:", errText(err));
    showToast("Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", "error");
  } finally {
    submitting = false;
    if (document.getElementById("order-form")) setBusy(false);
  }
}

function renderConfirmation(s) {
  const c = s.customer;
  const rows = s.items
    .map((l) => `<li class="flex items-start justify-between gap-3 border-b border-line py-3 last:border-0">
        <span>${esc(l.title)} <span class="text-muted">× ${l.qty}</span></span>
        <strong class="whitespace-nowrap">${esc(formatVND(l.price * l.qty))}</strong>
      </li>`)
    .join("");
  setPage("Đặt hàng thành công", `
<div class="mx-auto max-w-2xl text-center">
  <div class="success-mark mx-auto">${icon("check", { size: 40 })}</div>
  <h1 id="cart-title" tabindex="-1" class="mt-4">Mầm Chữ đã nhận đơn của bố mẹ!</h1>
  <p class="mt-2 text-lg">Mã đơn: <strong class="font-heading text-brand-dark">#${esc(s.shortId)}</strong></p>
  <p class="mt-1 text-muted">Mầm Chữ sẽ gọi điện xác nhận trong giờ làm việc để chắc rằng địa chỉ và số điện thoại đúng.</p>
</div>
<div class="mx-auto mt-8 grid max-w-2xl gap-5">
  <section class="panel" aria-labelledby="conf-items">
    <h2 id="conf-items" class="text-[22px]">Các cuốn đã đặt</h2>
    <ul class="mt-2 list-none p-0">${rows}</ul>
    <div class="sum-row mt-2 items-baseline border-t border-line pt-3"><span class="font-semibold">Tổng cộng (thanh toán khi nhận hàng)</span><span class="sum-total">${esc(formatVND(s.total))}</span></div>
    <div class="sum-row"><span>Phí giao hàng</span><strong class="text-[#166534]">Miễn phí</strong></div>
  </section>
  <section class="panel" aria-labelledby="conf-ship">
    <h2 id="conf-ship" class="text-[22px]">Thông tin nhận hàng</h2>
    <dl class="spec-list mt-3">
      <dt>Người nhận</dt><dd>${esc(c.name)}</dd>
      <dt>Số điện thoại</dt><dd>${esc(c.phone)}</dd>
      <dt>Địa chỉ</dt><dd class="whitespace-pre-line">${esc(c.address)}</dd>
      ${c.note ? `<dt>Ghi chú</dt><dd class="whitespace-pre-line">${esc(c.note)}</dd>` : ""}
      <dt>Thanh toán</dt><dd>Thanh toán khi nhận hàng (COD)</dd>
    </dl>
  </section>
  <div class="flex flex-col justify-center gap-3 sm:flex-row">
    <a href="books.html" class="btn btn-primary">Tiếp tục mua sắm</a>
    <a href="index.html" class="btn btn-outline">Về trang chủ</a>
  </div>
</div>`);
  window.scrollTo({ top: 0 });
  document.getElementById("cart-title")?.focus({ preventScroll: true });
}

// ---------------------------------------------------------------- Sự kiện (event delegation)
function lineById(id) {
  return lines.find((l) => l.id === id);
}

function changeQty(id, wanted) {
  const l = lineById(id);
  if (!l || l.status !== "ok") return;
  const cap = Math.min(MAX_QTY, l.stock);
  let n = Math.floor(Number(wanted));
  if (!Number.isFinite(n) || n < 1) n = 1;
  if (n > cap) {
    n = cap;
    showToast("Bố mẹ đã chọn hết số lượng còn lại của cuốn này.", "info");
  }
  l.qty = n;
  setQuantity(id, n);
  refreshView();
}

root.addEventListener("click", (e) => {
  if (e.target.closest("[data-retry]")) return loadCart();
  const minus = e.target.closest("[data-qty-minus]");
  if (minus) { const l = lineById(minus.dataset.id); if (l) changeQty(l.id, l.qty - 1); return; }
  const plus = e.target.closest("[data-qty-plus]");
  if (plus) { const l = lineById(plus.dataset.id); if (l) changeQty(l.id, l.qty + 1); return; }
  const rm = e.target.closest("[data-remove]");
  if (rm) {
    removeFromCart(rm.dataset.id);
    lines = lines.filter((l) => l.id !== rm.dataset.id);
    notes = [];
    showToast("Đã xóa khỏi giỏ.", "info");
    refreshView();
  }
});

root.addEventListener("change", (e) => {
  if (e.target.matches("[data-qty-input]")) changeQty(e.target.dataset.id, e.target.value);
});

root.addEventListener("input", (e) => {
  if (e.target.id === "o-note") document.getElementById("o-count").textContent = `${e.target.value.length}/500`;
});

root.addEventListener("submit", (e) => {
  if (e.target.id !== "order-form") return;
  e.preventDefault();
  placeOrder();
});

bindImageFallback(root);
loadCart();
