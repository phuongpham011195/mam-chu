// book.js – Chi tiết sách (book.html?slug=...).
//   F04  Xem chi tiết sách theo slug          SELECT books (kèm tên thể loại)
//   F05  Hiển thị đánh giá + điểm trung bình   SELECT reviews
//   F06  Viết đánh giá (chấm 1–5 sao)          INSERT reviews
//   F07  Thêm vào giỏ / Mua ngay (localStorage), chặn hết hàng và quá tồn kho
//   F17  Giá gốc gạch ngang + badge giảm giá
//
// Chống XSS (PRD mục 8): mọi dữ liệu từ database hay người dùng đều đi qua esc() trước khi vào chuỗi HTML;
// tên sách trong <title> đặt bằng document.title (text); slug trên URL được kiểm tra bằng regex rồi mới truy vấn
// (truy vấn có tham số, không nối chuỗi) và không bao giờ được in lại ra trang; cover_url qua safeImgUrl().
import { initLayout, setDataStatus, showToast } from "../layout.js";
import { addToCart, MAX_QTY } from "../cart.js";
import { icon, starIcon } from "../icons.js";
import {
  esc, formatVND, getParam, discountPercent, ageLabel, stockInfo, safeImgUrl,
  formatDate, starsHTML, bookCardHTML, bindImageFallback, errText, setFieldError,
} from "../utils.js";

initLayout({ active: "books" });

const root = document.getElementById("book-root");
const crumbEl = document.getElementById("breadcrumb");
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const slug = getParam("slug");
const LAST_REVIEW_KEY = "mamchu_last_review_at";

let sb = null;      // client Supabase
let book = null;    // sách đang xem
let category = null;

// ---------------------------------------------------------------- Breadcrumb
function setBreadcrumb(parts) {
  const last = parts.length - 1;
  const items = parts
    .map((p, i) => {
      const sep = i ? `<span aria-hidden="true">${icon("chevron-right", { size: 14 })}</span>` : "";
      let label;
      if (i === last) label = `<span aria-current="page">${esc(p.label)}</span>`;
      else if (p.href) label = `<a href="${esc(p.href)}">${esc(p.label)}</a>`;
      else label = `<span>${esc(p.label)}</span>`;
      return `<li>${sep}${label}</li>`;
    })
    .join("");
  crumbEl.innerHTML = `<ol>${items}</ol>`;
}
const BASE_CRUMB = [{ label: "Trang chủ", href: "index.html" }, { label: "Sách", href: "books.html" }];

// ---------------------------------------------------------------- Trạng thái: đang tải, không thấy, lỗi
function showSkeleton() {
  root.setAttribute("aria-busy", "true");
  root.innerHTML = `
    <div class="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
      <div class="skeleton mx-auto aspect-[2/3] w-full max-w-sm lg:max-w-none"></div>
      <div class="grid content-start gap-4">
        <div class="skeleton h-12 w-3/4"></div><div class="skeleton h-5 w-1/3"></div>
        <div class="skeleton h-14 w-1/2"></div><div class="skeleton h-28"></div>
      </div>
    </div>`;
}

function showBox({ title, hint = "", actions = "" }) {
  root.setAttribute("aria-busy", "false");
  root.innerHTML = `
    <div class="state-box">
      <img src="assets/brand/favicon.svg" alt="" width="88" height="88">
      <p class="font-semibold">${esc(title)}</p>
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ""}
      ${actions}
    </div>`;
}

function showNotFound() {
  document.title = "Không tìm thấy sách – Mầm Chữ";
  setBreadcrumb([...BASE_CRUMB, { label: "Không tìm thấy" }]);
  // Không in lại slug người dùng nhập để tránh chèn nội dung lạ vào trang
  showBox({
    title: "Ôi, Mầm Chữ không tìm thấy cuốn sách này.",
    actions: '<a class="btn btn-primary mt-4" href="books.html">Xem tất cả sách</a>',
  });
}

const retryBtn = '<button type="button" class="btn btn-outline mt-4" data-retry>Thử lại</button>';

function showConnectionError() {
  setDataStatus("error");
  setBreadcrumb([...BASE_CRUMB, { label: "Đang tải…" }]);
  showBox({ title: "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", actions: retryBtn });
}

// ---------------------------------------------------------------- Giao diện chi tiết sách
function paragraphs(text) {
  const parts = String(text ?? "").split(/\r?\n\r?\n+/).map((s) => s.trim()).filter(Boolean);
  return parts.map((p) => `<p>${esc(p).replace(/\r?\n/g, "<br>")}</p>`).join("");
}

function specRow(label, valueHTML) {
  return valueHTML ? `<dt>${label}</dt><dd>${valueHTML}</dd>` : "";
}

function viewHTML(b, cat) {
  const pct = discountPercent(b.price, b.original_price);
  const st = stockInfo(b.stock);
  const out = st.state === "out";
  const maxQty = out ? 0 : Math.min(MAX_QTY, b.stock);
  const catLink = cat ? `<a class="text-link" href="books.html?category=${encodeURIComponent(cat.slug)}">${esc(cat.name)}</a>` : "";

  const stockHTML = out
    ? `<span class="badge badge-out">Hết hàng</span>
       <p class="mt-2 text-muted">Cuốn này tạm hết rồi, bố mẹ xem các sách cùng thể loại nhé. <a class="text-link" href="#cung-the-loai">Xem sách cùng thể loại</a></p>`
    : st.state === "low"
      ? `<span class="badge badge-low">Chỉ còn ${b.stock}</span> <span class="text-muted">Chỉ còn ${b.stock} cuốn, bố mẹ nhanh tay nhé!</span>`
      : '<span class="badge badge-ok">Còn hàng</span>';

  const qtyHTML = out
    ? ""
    : `<div class="mt-5">
         <label class="field-label" for="qty">Số lượng</label>
         <div class="qty mt-1" role="group" aria-label="Chọn số lượng">
           <button type="button" data-qty-minus aria-label="Giảm số lượng">${icon("minus", { size: 18 })}</button>
           <input id="qty" type="number" inputmode="numeric" min="1" max="${maxQty}" value="1">
           <button type="button" data-qty-plus aria-label="Tăng số lượng">${icon("plus", { size: 18 })}</button>
         </div>
       </div>`;

  return `
<div class="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-12">
  <div class="mx-auto w-full max-w-sm lg:max-w-none">
    <div class="relative aspect-[2/3] overflow-hidden rounded-2xl border border-line bg-paper shadow-card">
      <img src="${esc(safeImgUrl(b.cover_url))}" alt="${esc(b.title)}" width="600" height="900" class="h-full w-full object-cover${out ? " opacity-60" : ""}">
      ${pct > 0 ? `<span class="badge badge-sale absolute left-3 top-3">-${pct}%</span>` : ""}
    </div>
  </div>

  <div>
    <h1>${esc(b.title)}</h1>
    <p class="mt-2 text-lg text-muted">Tác giả: <span class="font-semibold text-ink">${esc(b.author)}</span></p>
    <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
      <span class="badge badge-age">${esc(ageLabel(b.age_min, b.age_max))}</span>
      <span id="top-rating" class="text-sm text-muted"></span>
    </div>

    <div class="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span class="price-lg">${esc(formatVND(b.price))}</span>
      ${pct > 0 ? `<span class="price-lg-old">${esc(formatVND(b.original_price))}</span><span class="badge badge-sale">-${pct}%</span>` : ""}
    </div>
    <div class="mt-3">${stockHTML}</div>
    ${qtyHTML}

    <!-- Trên điện thoại: thanh nút dính sát đáy màn hình -->
    <div class="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-line bg-white p-3 shadow-[0_-6px_18px_rgba(0,0,0,0.08)] lg:static lg:z-auto lg:mt-6 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
      <button type="button" class="btn btn-primary flex-1" data-act="add"${out ? " disabled" : ""}>${icon("cart", { size: 20 })} Thêm vào giỏ</button>
      <button type="button" class="btn btn-sun flex-1" data-act="buy"${out ? " disabled" : ""}>Mua ngay</button>
    </div>

    <dl class="spec-list mt-8">
      ${specRow("Thể loại", catLink)}
      ${specRow("Độ tuổi", esc(ageLabel(b.age_min, b.age_max)))}
      ${specRow("Nhà xuất bản", b.publisher ? esc(b.publisher) : "")}
      ${specRow("Năm xuất bản", b.publish_year ? esc(b.publish_year) : "")}
      ${specRow("Số trang", b.pages ? esc(b.pages) : "")}
    </dl>
  </div>
</div>

${b.description ? `<section class="mt-12" aria-labelledby="about-title"><h2 id="about-title">Về cuốn sách này</h2><div class="prose-desc mt-4">${paragraphs(b.description)}</div></section>` : ""}

<section id="danh-gia" class="mt-12 scroll-mt-24" aria-labelledby="reviews-title">
  <h2 id="reviews-title">Đánh giá của bố mẹ</h2>
  <div class="mt-5 grid gap-6 lg:grid-cols-[300px_1fr] lg:gap-10">
    <div id="reviews-summary"></div>
    <div>
      <div id="reviews-list" class="grid gap-3" aria-live="polite"></div>
      <p class="mt-4 text-sm text-faint">Các đánh giá dưới đây là dữ liệu demo cho đồ án, không phải ý kiến của khách hàng thật.</p>
    </div>
  </div>

  <form id="review-form" class="panel mt-8" novalidate>
    <h3>Viết đánh giá</h3>
    <p class="mt-1 text-sm text-muted">Đánh giá của bố mẹ giúp các gia đình khác chọn sách.</p>
    <div class="mt-5 grid gap-5 sm:grid-cols-2">
      <div class="field">
        <label for="rv-name">Tên của bố mẹ <span class="req" aria-hidden="true">*</span><span class="sr-only">(bắt buộc)</span></label>
        <input id="rv-name" class="input" type="text" maxlength="60" autocomplete="name" placeholder="Ví dụ: Chị Thu Hà" aria-describedby="rv-name-err">
        <p id="rv-name-err" class="field-error"></p>
      </div>
      <div class="field">
        <span class="field-label" id="rv-rating-label">Chấm mấy sao? <span class="req" aria-hidden="true">*</span><span class="sr-only">(bắt buộc)</span></span>
        <div class="star-input" role="radiogroup" aria-labelledby="rv-rating-label" aria-describedby="rv-rating-err">
          ${[5, 4, 3, 2, 1]
            .map((n) => `<input type="radio" name="rating" id="rv-star-${n}" value="${n}"><label for="rv-star-${n}" aria-label="${n} trên 5 sao" title="${n} sao">${starIcon(false, 30)}</label>`)
            .join("")}
        </div>
        <p id="rv-rating-err" class="field-error"></p>
      </div>
    </div>
    <div class="field mt-5">
      <label for="rv-comment">Nhận xét <span class="font-normal text-muted">(không bắt buộc)</span></label>
      <textarea id="rv-comment" class="input" rows="4" maxlength="1000" placeholder="Bố mẹ thấy cuốn sách thế nào?" aria-describedby="rv-comment-err rv-count"></textarea>
      <div id="rv-count" class="field-hint">0/1000</div>
      <p id="rv-comment-err" class="field-error"></p>
    </div>
    <div class="hp-field" aria-hidden="true"><label>Website <input id="rv-website" type="text" tabindex="-1" autocomplete="off"></label></div>
    <button type="submit" class="btn btn-primary mt-6 w-full sm:w-auto" id="rv-submit">Gửi đánh giá</button>
  </form>
</section>

<section id="cung-the-loai" class="mt-12 scroll-mt-24" aria-labelledby="related-title" hidden>
  <h2 id="related-title">Sách cùng thể loại</h2>
  <div id="related-grid" class="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4"></div>
</section>`;
}

function renderBook() {
  document.title = `${book.title} – Mầm Chữ`;
  const desc = String(book.description || "").replace(/\s+/g, " ").trim().slice(0, 150);
  document.querySelector('meta[name="description"]')?.setAttribute("content", desc || `Chi tiết sách "${book.title}" tại Mầm Chữ.`);
  const crumbs = [...BASE_CRUMB];
  if (category) crumbs.push({ label: category.name, href: `books.html?category=${encodeURIComponent(category.slug)}` });
  crumbs.push({ label: book.title });
  setBreadcrumb(crumbs);
  root.innerHTML = viewHTML(book, category);
  root.setAttribute("aria-busy", "false");
}

// ---------------------------------------------------------------- Đánh giá (F05) và sách cùng thể loại
function reviewHTML(r) {
  const rating = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 1)));
  return `
  <article class="review-card">
    <div class="flex flex-wrap items-center justify-between gap-2">
      <strong>${esc(r.reviewer_name)}</strong>
      <time datetime="${esc(r.created_at)}">${esc(formatDate(r.created_at))}</time>
    </div>
    <div class="mt-1">${starsHTML(rating, 18)}</div>
    ${r.comment ? `<p>${esc(r.comment)}</p>` : ""}
  </article>`;
}

function renderReviews(list) {
  const n = list.length;
  const avg = n ? list.reduce((s, r) => s + (Number(r.rating) || 0), 0) / n : 0;
  const avgText = avg.toFixed(1).replace(".", ",");
  document.getElementById("reviews-summary").innerHTML = n
    ? `<div class="review-summary"><div class="review-summary__avg">${avgText}</div><div class="mt-1">${starsHTML(avg, 22)}</div><p class="mt-1 text-sm text-muted">${n} đánh giá</p></div>`
    : '<div class="review-summary"><p class="m-0">Chưa có đánh giá nào. Bố mẹ là người đầu tiên nhé?</p></div>';
  document.getElementById("reviews-list").innerHTML = list.map(reviewHTML).join("");
  document.getElementById("top-rating").innerHTML = n
    ? `${starsHTML(avg, 18)} <a class="text-link ml-1" href="#danh-gia">${avgText} (${n} đánh giá)</a>`
    : '<a class="text-link" href="#danh-gia">Chưa có đánh giá</a>';
}

async function loadReviews() {
  const listEl = document.getElementById("reviews-list");
  if (!listEl) return;
  listEl.innerHTML = '<div class="skeleton h-24"></div><div class="skeleton h-24"></div>';
  try {
    const { data, error } = await sb
      .from("reviews")
      .select("id,reviewer_name,rating,comment,created_at")
      .eq("book_id", book.id)
      .order("created_at", { ascending: false });
    if (error) throw error;
    renderReviews(data);
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải đánh giá:", errText(err));
    document.getElementById("reviews-summary").innerHTML = "";
    document.getElementById("top-rating").textContent = "";
    listEl.innerHTML = `<div class="state-box"><p class="font-semibold">Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.</p><button type="button" class="btn btn-outline mt-4" data-retry-reviews>Thử lại</button></div>`;
  }
}

async function loadRelated() {
  const section = document.getElementById("cung-the-loai");
  const gridEl = document.getElementById("related-grid");
  if (!section || !book.category_id) return;
  try {
    const { data, error } = await sb
      .from("books")
      .select("id,slug,title,author,price,original_price,stock,cover_url,age_min,age_max")
      .eq("category_id", book.category_id)
      .neq("id", book.id)
      .order("is_featured", { ascending: false })
      .order("title")
      .limit(4);
    if (error) throw error;
    if (!data.length) return;
    gridEl.innerHTML = data.map(bookCardHTML).join("");
    section.hidden = false;
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải sách cùng thể loại:", errText(err)); // khối phụ: lỗi thì ẩn, không làm hỏng trang
  }
}

// ---------------------------------------------------------------- Thêm vào giỏ (F07)
function currentQty() {
  const input = document.getElementById("qty");
  const max = Math.min(MAX_QTY, Math.max(0, book.stock)) || 1;
  let n = Math.floor(Number(input?.value));
  if (!Number.isFinite(n) || n < 1) n = 1;
  n = Math.min(n, max);
  if (input) input.value = String(n);
  return n;
}

function addCurrentBook(goToCart) {
  const qty = currentQty();
  const res = addToCart({ book_id: book.id, slug: book.slug, price: book.price }, qty, book.stock);
  if (res.soldOut) return showToast("Cuốn này tạm hết rồi, bố mẹ xem các sách cùng thể loại nhé.", "error");
  if (goToCart) { window.location.href = "cart.html"; return; }
  if (res.added === 0) showToast("Bố mẹ đã chọn hết số lượng còn lại của cuốn này.", "info");
  else if (res.added < qty) showToast(`Đã thêm ${res.added} cuốn. Bố mẹ đã chọn hết số lượng còn lại của cuốn này.`, "info");
  else showToast("Đã thêm vào giỏ.", "success");
}

// ---------------------------------------------------------------- Viết đánh giá (F06)
const setError = setFieldError; // hàm dùng chung trong utils.js

async function submitReview(form) {
  const nameEl = form.querySelector("#rv-name");
  const commentEl = form.querySelector("#rv-comment");
  const name = nameEl.value.replace(/\s+/g, " ").trim();
  const comment = commentEl.value.trim();
  const checked = form.querySelector('input[name="rating"]:checked');
  const rating = checked ? Number(checked.value) : 0;

  // Kiểm tra dữ liệu: hiện lỗi đầu tiên và đưa con trỏ về ô đó
  const errs = [];
  setError("rv-name", "rv-name-err", "");
  setError("rv-comment", "rv-comment-err", "");
  setError(null, "rv-rating-err", "");
  if (!name) errs.push(["rv-name", "rv-name-err", "Bố mẹ cho Mầm Chữ biết tên nhé."]);
  else if (name.length > 60) errs.push(["rv-name", "rv-name-err", "Tên hơi dài, bố mẹ rút gọn dưới 60 ký tự nhé."]);
  if (!(rating >= 1 && rating <= 5)) errs.push(["rv-star-5", "rv-rating-err", "Bố mẹ chấm giúp mình mấy sao nhé."]);
  if (comment.length > 1000) errs.push(["rv-comment", "rv-comment-err", "Nhận xét hơi dài, bố mẹ rút gọn dưới 1000 ký tự nhé."]);
  if (errs.length) {
    errs.forEach(([id, errId, msg]) => setError(id === "rv-star-5" ? null : id, errId, msg));
    document.getElementById(errs[0][0])?.focus();
    return;
  }

  // Ô chống spam (honeypot): người thật không thấy ô này. Nếu bị điền thì làm như đã gửi nhưng bỏ qua.
  if (form.querySelector("#rv-website").value.trim()) {
    showToast("Cảm ơn bố mẹ đã chia sẻ!", "success");
    form.reset();
    return;
  }
  // Giãn cách tối thiểu 15 giây giữa hai lần gửi từ cùng trình duyệt
  try {
    const last = Number(localStorage.getItem(LAST_REVIEW_KEY) || 0);
    if (Date.now() - last < 15000) return showToast("Bố mẹ chờ vài giây rồi gửi tiếp nhé.", "info");
  } catch { /* bỏ qua */ }

  const btn = form.querySelector("#rv-submit");
  btn.disabled = true;
  btn.classList.add("is-loading");
  btn.textContent = "Đang gửi...";
  try {
    // Chỉ INSERT, không kèm .select(): khách không có quyền đọc lại dòng vừa thêm ngoài bảng reviews công khai
    const { error } = await sb.from("reviews").insert({
      book_id: book.id,
      reviewer_name: name,
      rating,
      comment: comment || null,
    });
    if (error) throw error;
    try { localStorage.setItem(LAST_REVIEW_KEY, String(Date.now())); } catch { /* bỏ qua */ }
    showToast("Cảm ơn bố mẹ đã chia sẻ! Đánh giá của bố mẹ giúp các gia đình khác chọn sách.", "success");
    form.reset();
    document.getElementById("rv-count").textContent = "0/1000";
    await loadReviews();
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi gửi đánh giá:", errText(err));
    showToast("Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", "error");
  } finally {
    btn.disabled = false;
    btn.classList.remove("is-loading");
    btn.textContent = "Gửi đánh giá";
  }
}

// ---------------------------------------------------------------- Tải trang
async function load() {
  showSkeleton();
  setBreadcrumb([...BASE_CRUMB, { label: "Đang tải…" }]);

  // Slug sai định dạng thì coi như không tồn tại, không cần hỏi database
  if (!slug || slug.length > 120 || !SLUG_RE.test(slug)) return showNotFound();

  let isConfigured;
  try {
    ({ supabase: sb, isConfigured } = await import("../supabase.js"));
  } catch (err) {
    console.error("[Mầm Chữ] Không nạp được supabase-js:", errText(err));
    return showConnectionError();
  }
  if (!isConfigured) {
    setDataStatus("error");
    return showBox({
      title: "Mầm Chữ chưa kết nối được kho sách.",
      hint: "Nếu bạn là người dựng web: điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js.",
    });
  }

  try {
    const { data, error } = await sb
      .from("books")
      .select("id,slug,title,author,description,publisher,publish_year,pages,age_min,age_max,price,original_price,stock,cover_url,category_id,categories(name,slug)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    if (!data) return showNotFound(); // không có, hoặc sách đã ẩn (RLS không cho khách thấy)
    book = data;
    category = data.categories || null;
    renderBook();
    setDataStatus("ok");
    loadReviews();
    loadRelated();
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải chi tiết sách:", errText(err));
    showConnectionError();
  }
}

// ---------------------------------------------------------------- Sự kiện (event delegation trên #book-root)
root.addEventListener("click", (e) => {
  if (e.target.closest("[data-retry]")) return load();
  if (e.target.closest("[data-retry-reviews]")) return loadReviews();
  if (e.target.closest("[data-qty-minus]")) {
    const i = document.getElementById("qty");
    i.value = String(Math.max(1, (Number(i.value) || 1) - 1));
    return;
  }
  if (e.target.closest("[data-qty-plus]")) {
    const i = document.getElementById("qty");
    i.value = String((Number(i.value) || 1) + 1);
    currentQty(); // kẹp về số lượng tối đa cho phép
    return;
  }
  const act = e.target.closest("[data-act]");
  if (act && !act.disabled) return addCurrentBook(act.dataset.act === "buy");
  // Nút "Thêm vào giỏ" trên thẻ sách cùng thể loại
  const add = e.target.closest("[data-add]");
  if (add && !add.disabled) {
    const res = addToCart({ book_id: add.dataset.id, slug: add.dataset.slug, price: Number(add.dataset.price) }, 1, Number(add.dataset.stock));
    if (res.soldOut) showToast("Cuốn này tạm hết rồi, bố mẹ xem các sách khác nhé.", "error");
    else if (res.added === 0) showToast("Bố mẹ đã chọn hết số lượng còn lại của cuốn này.", "info");
    else showToast("Đã thêm vào giỏ.", "success");
  }
});

root.addEventListener("change", (e) => {
  if (e.target.id === "qty") currentQty();
});

root.addEventListener("input", (e) => {
  if (e.target.id === "rv-comment") document.getElementById("rv-count").textContent = `${e.target.value.length}/1000`;
});

root.addEventListener("submit", (e) => {
  if (e.target.id !== "review-form") return;
  e.preventDefault();
  submitReview(e.target);
});

bindImageFallback(root);
load();
