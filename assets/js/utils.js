// utils.js – Hàm tiện ích dùng chung: tiền VND, escape HTML, query string, tạo slug,
// nhãn độ tuổi, giảm giá, tồn kho và thẻ sách.

import { starIcon, icon } from "./icons.js";

export const DEFAULT_COVER = "assets/covers/default.svg";

/**
 * Chỉ cho phép đường dẫn ảnh tương đối hoặc http(s). Chặn javascript:, data:, // ... (chống XSS qua cover_url).
 * Rỗng hoặc không hợp lệ thì dùng bìa mặc định.
 */
export function safeImgUrl(url) {
  const u = String(url ?? "").trim();
  if (!u) return DEFAULT_COVER;
  if (/^https?:\/\//i.test(u)) return u;
  if (/^[a-z][a-z0-9+.-]*:/i.test(u) || u.startsWith("//")) return DEFAULT_COVER;
  return u;
}

/** Bỏ dấu tiếng Việt, hạ chữ thường, gom khoảng trắng: "Mưa Tháng Bảy" -> "mua thang bay" (để tìm kiếm không phân biệt dấu). */
export function foldText(s) {
  return String(s ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** "2026-10-05T..." -> "05/10/2026" */
export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** Hàng 5 ngôi sao: tô đặc `Math.round(value)` sao đầu. Giá trị được ép về 0–5. */
export function starsHTML(value, size = 18) {
  const full = Math.max(0, Math.min(5, Math.round(Number(value) || 0)));
  let out = "";
  for (let i = 1; i <= 5; i++) out += `<span class="${i <= full ? "star-on" : "star-off"}">${starIcon(i <= full, size)}</span>`;
  return `<span class="stars" role="img" aria-label="${full} trên 5 sao">${out}</span>`;
}

/** Chuỗi mô tả lỗi dễ đọc cho console (lỗi của Supabase là object có message và code). */
export function errText(err) {
  if (err && typeof err === "object" && "message" in err) return err.code ? `${err.message} (${err.code})` : String(err.message);
  return String(err);
}

/** Escape HTML để chèn text của người dùng/database vào chuỗi HTML an toàn (chống XSS). */
export function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** 109000 -> "109.000 ₫" */
export function formatVND(amount) {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("vi-VN").format(Math.round(n)) + " ₫";
}

/** Đọc một tham số trên URL: getParam("slug") với ?slug=abc -> "abc" */
export function getParam(name, search = window.location.search) {
  return new URLSearchParams(search).get(name);
}

/** UUID v4 cho id đơn hàng: dùng crypto.randomUUID() (PRD mục 7.1), có dự phòng cho trình duyệt cũ. */
export function uuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** Chuẩn hóa số điện thoại VN: bỏ khoảng trắng, dấu chấm, gạch, ngoặc; "+84908..." hoặc "84908..." thành "0908...". */
export function normalizePhone(raw) {
  let p = String(raw ?? "").replace(/[\s.\-()]/g, "");
  if (p.startsWith("+84")) p = "0" + p.slice(3);
  else if (/^84\d{9}$/.test(p)) p = "0" + p.slice(2);
  return p;
}

/** "Dạy Con Giữ Tiền!" -> "day-con-giu-tien" (khớp CHECK slug của database) */
export function slugify(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Phần trăm giảm giá làm tròn; 0 nếu không giảm giá. (PRD F17) */
export function discountPercent(price, originalPrice) {
  const p = Number(price);
  const o = Number(originalPrice);
  if (!Number.isFinite(p) || !Number.isFinite(o) || o <= p || o <= 0) return 0;
  return Math.round((1 - p / o) * 100);
}

/** "3–6 tuổi", "8 tuổi" hoặc "Dành cho phụ huynh" khi độ tuổi để trống. */
export function ageLabel(min, max) {
  if (min == null || max == null) return "Dành cho phụ huynh";
  return min === max ? `${min} tuổi` : `${min}–${max} tuổi`;
}

/** Trạng thái tồn kho: { state: 'out' | 'low' | 'ok', label } (DESIGN mục 5.4) */
export function stockInfo(stock) {
  const n = Number(stock);
  if (!(n > 0)) return { state: "out", label: "Hết hàng" };
  if (n <= 5) return { state: "low", label: `Chỉ còn ${n}` };
  return { state: "ok", label: "Còn hàng" };
}

/**
 * HTML của một thẻ sách (DESIGN mục 5.2). Mọi dữ liệu đều được escape.
 * Nút "Thêm vào giỏ" mang data-add, data-id, data-slug, data-stock để trang bắt sự kiện (event delegation).
 */
export function bookCardHTML(book) {
  const pct = discountPercent(book.price, book.original_price);
  const stock = stockInfo(book.stock);
  const out = stock.state === "out";
  const href = `book.html?slug=${encodeURIComponent(book.slug)}`;
  const cover = safeImgUrl(book.cover_url);
  const priceOld = pct > 0 ? `<span class="price-old">${esc(formatVND(book.original_price))}</span>` : "";
  const stockBadge =
    stock.state === "low" ? `<span class="badge badge-low">${esc(stock.label)}</span>`
    : out ? `<span class="badge badge-out">${esc(stock.label)}</span>` : "";
  return `
<article class="book-card${out ? " is-soldout" : ""}">
  <a class="book-card__cover" href="${esc(href)}" tabindex="-1" aria-hidden="true">
    <img src="${esc(cover)}" alt="${esc(book.title)}" width="600" height="900" loading="lazy">
    ${pct > 0 ? `<span class="badge badge-sale book-card__sale">-${pct}%</span>` : ""}
    <span class="badge badge-age book-card__age">${esc(ageLabel(book.age_min, book.age_max))}</span>
  </a>
  <div class="book-card__body">
    <h3 class="book-card__title"><a href="${esc(href)}">${esc(book.title)}</a></h3>
    <p class="book-card__author">${esc(book.author)}</p>
    <div class="book-card__price">
      <span class="price">${esc(formatVND(book.price))}</span>${priceOld}
    </div>
    <div class="book-card__stock">${stockBadge}</div>
    <button type="button" class="btn btn-primary btn-block" data-add data-id="${esc(book.id)}" data-slug="${esc(book.slug)}" data-stock="${esc(book.stock)}" data-price="${esc(book.price)}"${out ? " disabled" : ""}>
      ${out ? "Hết hàng" : "Thêm vào giỏ"}
    </button>
  </div>
</article>`;
}

/**
 * Hiện hoặc xóa thông báo lỗi dưới một ô nhập (DESIGN mục 5.3). Nội dung lỗi đặt bằng textContent.
 * @param {string|null} inputId id ô nhập (để gắn aria-invalid), có thể null
 * @param {string} errId id phần tử hiển thị lỗi
 * @param {string} message rỗng nghĩa là xóa lỗi
 */
export function setFieldError(inputId, errId, message) {
  const err = document.getElementById(errId);
  if (!err) return;
  err.innerHTML = message ? `${icon("alert", { size: 16 })}<span></span>` : "";
  if (message) err.querySelector("span").textContent = message;
  err.classList.toggle("is-visible", Boolean(message));
  const input = inputId ? document.getElementById(inputId) : null;
  if (input) input.setAttribute("aria-invalid", message ? "true" : "false");
}

/** Khi ảnh bìa lỗi thì thay bằng bìa mặc định. Gắn một lần lên phần tử cha (bắt sự kiện error ở pha capture). */
export function bindImageFallback(root) {
  root.addEventListener(
    "error",
    (e) => {
      const img = e.target;
      if (img && img.tagName === "IMG" && !img.dataset.fallback) {
        img.dataset.fallback = "1";
        img.src = DEFAULT_COVER;
      }
    },
    true
  );
}
