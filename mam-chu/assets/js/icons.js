// icons.js – Biểu tượng SVG inline tự viết (DESIGN mục 5.7): nét tròn, viền 2 px, đồng nhất.
// Không dùng thư viện biểu tượng bên ngoài.

const PATHS = {
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.7 12.4a1 1 0 0 0 1 .8h8.8a1 1 0 0 0 1-.8L20 7H6"/>',
  heart: '<path d="M12 20s-7-4.4-9-9.2C1.8 7.6 3.6 4.5 6.8 4.5c1.9 0 3.3 1 5.2 3 1.9-2 3.3-3 5.2-3 3.2 0 5 3.1 3.8 6.3C19 15.6 12 20 12 20z"/>',
  shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z"/><path d="m9 12 2 2 4-4"/>',
  sprout: '<path d="M12 21v-8"/><path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z"/><path d="M12 11c0-3 2-5.5 6-5.5 0 3.2-2.4 5.5-6 5.5z"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  alert: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4"/><path d="M12 17.5v.01"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
  "arrow-right": '<path d="M5 12h14M13 6l6 6-6 6"/>',
  book: '<path d="M4 5.5C6.5 4 9.5 4 12 5.5c2.5-1.5 5.5-1.5 8 0V19c-2.5-1.5-5.5-1.5-8 0-2.5-1.5-5.5-1.5-8 0z"/><path d="M12 5.5V19"/>',
  "chevron-right": '<path d="m9 6 6 6-6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  star: '<path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 3 1.1-6.1L3.2 9.6l6.1-.8z"/>',
};

/** Ngôi sao đánh giá: filled = true thì tô đặc (màu theo currentColor). */
export function starIcon(filled, size = 18) {
  const body = PATHS.star;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="${filled ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linecap="round" ` +
    `stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`
  );
}

/**
 * Trả về chuỗi SVG của biểu tượng.
 * @param {string} name   tên trong PATHS
 * @param {{size?: number, className?: string}} [opts]
 */
export function icon(name, { size = 24, className = "" } = {}) {
  const body = PATHS[name];
  if (!body) return "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ` +
    `fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ` +
    `aria-hidden="true" focusable="false"${className ? ` class="${className}"` : ""}>${body}</svg>`
  );
}

/**
 * Thay mọi phần tử có thuộc tính data-icon="tên" bằng SVG tương ứng.
 * Kích thước lấy từ data-icon-size (mặc định 24).
 */
export function hydrateIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((el) => {
    const size = parseInt(el.getAttribute("data-icon-size") || "24", 10);
    el.innerHTML = icon(el.getAttribute("data-icon"), { size });
    el.removeAttribute("data-icon");
  });
}
