// books.js – Danh mục sách (books.html).
//   F03  Lọc theo thể loại và tìm theo tên/tác giả (không phân biệt hoa thường và dấu)  SELECT books
//   F02  Lưới sách (nổi bật trước, rồi theo tên A–Z)
//   F17  Giá gốc gạch ngang + badge giảm giá (trong thẻ sách)
//   F07  Nút "Thêm vào giỏ" trên thẻ sách (chỉ ghi localStorage)
//
// Cách lọc: tải một lần toàn bộ sách đang bán rồi lọc ngay trong trình duyệt. Với vài chục đến vài trăm
// cuốn thì nhanh hơn và cho phép gõ "mua thang bay" vẫn ra "Mưa Tháng Bảy" (ilike của database không bỏ dấu).
// Chống XSS: nội dung người dùng gõ (ô tìm kiếm) chỉ được dùng để so khớp, không bao giờ chèn vào HTML;
// dữ liệu từ database luôn đi qua esc() (trong utils.js).
import { initLayout, setDataStatus, showToast } from "../layout.js";
import { addToCart } from "../cart.js";
import { esc, bookCardHTML, bindImageFallback, foldText, getParam, errText } from "../utils.js";

initLayout({ active: "books" });

const grid = document.getElementById("books-grid");
const countEl = document.getElementById("result-count");
const chipRow = document.getElementById("chip-row");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const clearBtn = document.getElementById("clear-filter");

let categories = [];
let books = [];
let loaded = false;
const state = { category: "", q: "" }; // category = slug thể loại ("" là tất cả)

// ---------------------------------------------------------------- Trạng thái
function showSkeletons() {
  loaded = false;
  grid.setAttribute("aria-busy", "true");
  countEl.textContent = "";
  grid.innerHTML = Array.from({ length: 8 }, () => '<div class="skeleton aspect-[2/3]"></div>').join("");
}

function stateBox({ title, hint = "", button = "" }) {
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = `
    <div class="state-box">
      <img src="assets/brand/favicon.svg" alt="" width="88" height="88">
      <p class="font-semibold">${esc(title)}</p>
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ""}
      ${button}
    </div>`;
}

const retryBtn = '<button type="button" class="btn btn-outline mt-4" data-retry>Thử lại</button>';
const clearInBox = '<button type="button" class="btn btn-outline mt-4" data-clear>Xóa lọc</button>';

// ---------------------------------------------------------------- Lọc và vẽ
function matches(book) {
  if (state.category) {
    const cat = categories.find((c) => c.slug === state.category);
    if (!cat || book.category_id !== cat.id) return false;
  }
  if (state.q) {
    const hay = foldText(`${book.title} ${book.author}`);
    return foldText(state.q).split(" ").every((term) => hay.includes(term));
  }
  return true;
}

// Dựng chip một lần; về sau chỉ đổi trạng thái để không mất vị trí focus của người dùng bàn phím
function renderChips() {
  const items = [{ slug: "", name: "Tất cả" }, ...categories];
  chipRow.innerHTML = items
    .map((c) => `<button type="button" class="chip" data-cat="${esc(c.slug)}" aria-pressed="false">${esc(c.name)}</button>`)
    .join("");
}

function updateChips() {
  chipRow.querySelectorAll("[data-cat]").forEach((chip) => {
    const active = chip.dataset.cat === state.category;
    chip.classList.toggle("is-active", active);
    chip.setAttribute("aria-pressed", String(active));
  });
}

function syncUrl() {
  const p = new URLSearchParams();
  if (state.category) p.set("category", state.category);
  if (state.q) p.set("q", state.q);
  const qs = p.toString();
  try { history.replaceState(null, "", qs ? `?${qs}` : "books.html"); } catch { /* bỏ qua */ }
}

function render() {
  if (!loaded) return;
  const filtering = Boolean(state.category || state.q);
  clearBtn.hidden = !filtering;
  updateChips();
  const list = books.filter(matches);
  countEl.textContent = list.length ? `Có ${list.length} cuốn` : "";
  grid.setAttribute("aria-busy", "false");
  if (!list.length) {
    if (!books.length) stateBox({ title: "Mầm Chữ đang cập nhật sách. Bố mẹ quay lại sau nhé!" });
    else stateBox({ title: "Mầm Chữ chưa tìm thấy cuốn nào. Thử từ khóa khác nhé!", button: filtering ? clearInBox : "" });
    return;
  }
  grid.innerHTML = list.map(bookCardHTML).join("");
}

function resetFilters() {
  state.category = "";
  state.q = "";
  searchInput.value = "";
  syncUrl();
  render();
}

// ---------------------------------------------------------------- Tải dữ liệu
async function load() {
  showSkeletons();
  let supabase, isConfigured;
  try {
    ({ supabase, isConfigured } = await import("../supabase.js"));
  } catch (err) {
    console.error("[Mầm Chữ] Không nạp được supabase-js:", errText(err));
    setDataStatus("error");
    stateBox({ title: "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", button: retryBtn });
    return;
  }
  if (!isConfigured) {
    setDataStatus("error");
    stateBox({
      title: "Mầm Chữ chưa kết nối được kho sách.",
      hint: "Nếu bạn là người dựng web: điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js.",
    });
    return;
  }
  try {
    const [cats, bks] = await Promise.all([
      supabase.from("categories").select("id,name,slug").order("sort_order").order("name"),
      supabase
        .from("books")
        .select("id,slug,title,author,price,original_price,stock,cover_url,age_min,age_max,category_id,is_featured")
        .order("is_featured", { ascending: false })
        .order("title"),
    ]);
    if (cats.error) throw cats.error;
    if (bks.error) throw bks.error;
    categories = cats.data;
    books = bks.data;
    loaded = true;
    // Áp dụng tham số trên URL (vd. từ thẻ thể loại ở trang chủ): chỉ nhận slug có thật trong danh sách
    const wantCat = getParam("category");
    state.category = categories.some((c) => c.slug === wantCat) ? wantCat : "";
    state.q = (getParam("q") || "").slice(0, 60);
    searchInput.value = state.q;
    renderChips();
    render();
    setDataStatus("ok");
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải danh sách sách:", errText(err));
    setDataStatus("error");
    stateBox({ title: "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", button: retryBtn });
  }
}

// ---------------------------------------------------------------- Sự kiện
searchInput.addEventListener("input", () => {
  state.q = searchInput.value.replace(/\s+/g, " ").trimStart().slice(0, 60);
  syncUrl();
  render();
});
searchForm.addEventListener("submit", (e) => e.preventDefault());

chipRow.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-cat]");
  if (!chip) return;
  state.category = chip.dataset.cat;
  syncUrl();
  render();
});

clearBtn.addEventListener("click", resetFilters);

grid.addEventListener("click", (e) => {
  if (e.target.closest("[data-retry]")) return load();
  if (e.target.closest("[data-clear]")) return resetFilters();
  const btn = e.target.closest("[data-add]");
  if (!btn || btn.disabled) return;
  const res = addToCart({ book_id: btn.dataset.id, slug: btn.dataset.slug, price: Number(btn.dataset.price) }, 1, Number(btn.dataset.stock));
  if (res.soldOut) showToast("Cuốn này tạm hết rồi, bố mẹ xem các sách khác nhé.", "error");
  else if (res.added === 0) showToast("Bố mẹ đã chọn hết số lượng còn lại của cuốn này.", "info");
  else showToast("Đã thêm vào giỏ.", "success");
});

bindImageFallback(grid);
load();
