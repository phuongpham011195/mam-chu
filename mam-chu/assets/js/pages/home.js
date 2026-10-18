// home.js – Trang chủ (index.html).
//   F01  Hiển thị thể loại            SELECT categories
//   F02  Hiển thị sách nổi bật        SELECT books (is_featured = true, tối đa 8)
//   F17  Giá gốc gạch ngang + badge giảm giá "-X%" (thể hiện trong thẻ sách, xem utils.js)
//   F19  Navbar, Footer, số giỏ hàng, nhãn "● Dữ liệu: Supabase" (layout.js)
import { initLayout, setDataStatus, showToast } from "../layout.js";
import { addToCart } from "../cart.js";
import { icon } from "../icons.js";
import { esc, bookCardHTML, bindImageFallback, errText } from "../utils.js";

initLayout({ active: "home" });

const catGrid = document.getElementById("categories-grid");
const bookGrid = document.getElementById("featured-grid");

const CAT_COLORS = { "van-hoc": "#EDE7FA", "kinh-te": "#DFEEFF", "ky-nang": "#E3F5EF", "thieu-nhi": "#FFE5D6" };
const CAT_FALLBACK = ["#FDE4EC", "#E3F5EF", "#DFEEFF", "#EDE7FA", "#FFE5D6"];

// ---------------------------------------------------------------- Khung xương, trạng thái lỗi
function showSkeletons() {
  catGrid.setAttribute("aria-busy", "true");
  bookGrid.setAttribute("aria-busy", "true");
  catGrid.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton h-40"></div>').join("");
  bookGrid.innerHTML = Array.from({ length: 4 }, () => '<div class="skeleton aspect-[2/3] sm:h-auto"></div>').join("");
}

function stateBox(grid, { title, hint = "", retry = false }) {
  grid.setAttribute("aria-busy", "false");
  grid.innerHTML = `
    <div class="state-box">
      <img src="assets/brand/favicon.svg" alt="" width="88" height="88">
      <p class="font-semibold">${esc(title)}</p>
      ${hint ? `<p class="hint">${esc(hint)}</p>` : ""}
      ${retry ? '<button type="button" class="btn btn-outline mt-4" data-retry>Thử lại</button>' : ""}
    </div>`;
}

// ---------------------------------------------------------------- Vẽ dữ liệu
function renderCategories(cats) {
  catGrid.setAttribute("aria-busy", "false");
  if (!cats.length) {
    stateBox(catGrid, { title: "Mầm Chữ đang cập nhật thể loại. Bố mẹ quay lại sau nhé!" });
    return;
  }
  catGrid.innerHTML = cats
    .map((c, i) => {
      const bg = CAT_COLORS[c.slug] || CAT_FALLBACK[i % CAT_FALLBACK.length];
      return `
      <a class="cat-card" style="--cat-bg:${bg}" href="books.html?category=${encodeURIComponent(c.slug)}">
        <span class="cat-card__icon">${icon("book", { size: 26 })}</span>
        <h3>${esc(c.name)}</h3>
        ${c.description ? `<p>${esc(c.description)}</p>` : ""}
        <span class="cat-card__more">Xem sách ${icon("chevron-right", { size: 16 })}</span>
      </a>`;
    })
    .join("");
}

function renderFeatured(books) {
  bookGrid.setAttribute("aria-busy", "false");
  if (!books.length) {
    stateBox(bookGrid, { title: "Chưa có sách nổi bật. Bố mẹ xem tất cả sách nhé!" });
    return;
  }
  bookGrid.innerHTML = books.map(bookCardHTML).join("");
}

// ---------------------------------------------------------------- Tải dữ liệu từ Supabase
async function load() {
  showSkeletons();
  let supabase, isConfigured;
  try {
    // Nạp động để nếu CDN supabase-js lỗi thì Navbar/Footer vẫn hoạt động
    ({ supabase, isConfigured } = await import("../supabase.js"));
  } catch (err) {
    console.error("[Mầm Chữ] Không nạp được supabase-js:", errText(err));
    setDataStatus("error");
    const t = { title: "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", retry: true };
    stateBox(catGrid, t);
    stateBox(bookGrid, t);
    return;
  }

  if (!isConfigured) {
    setDataStatus("error");
    const t = {
      title: "Mầm Chữ chưa kết nối được kho sách.",
      hint: "Nếu bạn là người dựng web: điền SUPABASE_URL và SUPABASE_ANON_KEY trong assets/js/config.js.",
    };
    stateBox(catGrid, t);
    stateBox(bookGrid, t);
    return;
  }

  try {
    const [cats, feat] = await Promise.all([
      supabase.from("categories").select("id,name,slug,description,sort_order").order("sort_order").order("name"),
      supabase
        .from("books")
        .select("id,slug,title,author,price,original_price,stock,cover_url,age_min,age_max")
        .eq("is_featured", true)
        .order("title")
        .limit(8),
    ]);
    if (cats.error) throw cats.error;
    if (feat.error) throw feat.error;
    renderCategories(cats.data);
    renderFeatured(feat.data);
    setDataStatus("ok");
  } catch (err) {
    console.error("[Mầm Chữ] Lỗi tải dữ liệu trang chủ:", errText(err));
    setDataStatus("error");
    const t = { title: "Kết nối đang hơi chậm. Bố mẹ thử lại giúp mình nhé.", retry: true };
    stateBox(catGrid, t);
    stateBox(bookGrid, t);
  }
}

// ---------------------------------------------------------------- Sự kiện
// Nút "Thêm vào giỏ" trên thẻ sách (event delegation) – chỉ ghi localStorage, không gọi database
bookGrid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn || btn.disabled) return;
  const stock = Number(btn.dataset.stock);
  const res = addToCart({ book_id: btn.dataset.id, slug: btn.dataset.slug, price: Number(btn.dataset.price) }, 1, stock);
  if (res.soldOut) showToast("Cuốn này tạm hết rồi, bố mẹ xem các sách khác nhé.", "error");
  else if (res.added === 0) showToast("Bố mẹ đã chọn hết số lượng còn lại của cuốn này.", "info");
  else showToast("Đã thêm vào giỏ.", "success");
});

// Nút "Thử lại" trong khung lỗi
document.addEventListener("click", (e) => {
  if (e.target.closest("[data-retry]")) load();
});

bindImageFallback(bookGrid);
load();
