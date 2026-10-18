// layout.js – Navbar, Footer, thông báo (toast) và nhãn "Dữ liệu: Supabase" dùng chung cho mọi trang (PRD F19).
// Không `fetch` file HTML mẫu (tránh lỗi khi mở bằng file://): Navbar và Footer được chèn bằng chuỗi HTML.
// Cách dùng trong mỗi trang:  initLayout({ active: "home" })  với active là: home | books | about | cart | policy | admin
import { icon, hydrateIcons } from "./icons.js";
import { cartCount, onCartChange } from "./cart.js";

/** Thông tin cửa hàng (DỮ LIỆU MẪU – content/noi-dung-website.md mục 4). Trang Về chúng tôi dùng lại. */
export const SITE = {
  name: "Mầm Chữ",
  shop: "Nhà sách Mầm Chữ",
  slogan: "Gieo chữ hôm nay, gặt tương lai ngày mai.",
  address: "25 Đường Hạt Mầm, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
  hotline: "0900 000 000",
  email: "xinchao@mamchu.example",
  hours: ["Thứ Hai – Thứ Sáu: 8:00 – 20:00", "Thứ Bảy, Chủ Nhật: 8:00 – 21:00"],
  support: "Mỗi ngày 8:00 – 20:00 (gọi hotline)",
};

const NAV = [
  { key: "home", href: "index.html", label: "Trang chủ" },
  { key: "books", href: "books.html", label: "Sách" },
  { key: "about", href: "about.html", label: "Về chúng tôi" },
];

// ---------------------------------------------------------------- Navbar
function headerHTML(active) {
  const links = NAV.map(
    (n) =>
      `<a href="${n.href}" class="nav-link${active === n.key ? " is-active" : ""}"${active === n.key ? ' aria-current="page"' : ""}>${n.label}</a>`
  ).join("");
  const drawerLinks = [...NAV, { key: "cart", href: "cart.html", label: "Giỏ hàng" }, { key: "policy", href: "chinh-sach.html", label: "Chính sách" }]
    .map(
      (n) =>
        `<a href="${n.href}" class="drawer__link${active === n.key ? " is-active" : ""}"${active === n.key ? ' aria-current="page"' : ""}>${n.label}</a>`
    )
    .join("");
  return `
<div class="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-4 px-4 sm:px-6 md:h-[72px]">
  <a href="index.html" class="shrink-0" aria-label="Mầm Chữ – về trang chủ">
    <img src="assets/brand/logo-horizontal.svg" alt="Mầm Chữ – nhà sách cho bé" width="150" height="40" class="h-9 w-auto md:h-10">
  </a>
  <nav class="hidden items-center gap-8 md:flex" aria-label="Menu chính">${links}</nav>
  <div class="flex items-center gap-1">
    <a href="cart.html" class="icon-btn${active === "cart" ? " is-active" : ""}" aria-label="Giỏ hàng">
      <span data-icon="cart"></span>
      <span class="cart-badge" data-cart-badge hidden>0</span>
    </a>
    <button type="button" class="icon-btn md:hidden" data-menu-open aria-label="Mở menu" aria-expanded="false" aria-controls="mobile-drawer">
      <span data-icon="menu"></span>
    </button>
  </div>
</div>
<div class="drawer" id="mobile-drawer" aria-hidden="true">
  <div class="drawer__overlay" data-menu-close></div>
  <aside class="drawer__panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="flex items-center justify-between">
      <span class="font-heading text-lg font-bold text-brand-dark">Menu</span>
      <button type="button" class="icon-btn" data-menu-close aria-label="Đóng menu"><span data-icon="x"></span></button>
    </div>
    <nav class="mt-4 flex flex-col" aria-label="Menu di động">${drawerLinks}</nav>
  </aside>
</div>`;
}

// ---------------------------------------------------------------- Footer
function footerHTML() {
  const q = [
    ["index.html", "Trang chủ"],
    ["books.html", "Sách"],
    ["about.html", "Về chúng tôi"],
    ["cart.html", "Giỏ hàng"],
    ["chinh-sach.html", "Chính sách"],
  ]
    .map(([href, label]) => `<li><a href="${href}">${label}</a></li>`)
    .join("");
  const tel = SITE.hotline.replace(/\s+/g, "");
  return `
<div class="mx-auto max-w-[1200px] px-4 py-12 sm:px-6">
  <div class="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
    <div>
      <img src="assets/brand/logo-horizontal-white.svg" alt="Mầm Chữ – nhà sách cho bé" width="188" height="50" class="h-[50px] w-auto">
      <p class="mt-4 text-sm leading-relaxed text-white/90">Mầm Chữ – nhà sách cho bé và cho cả bố mẹ. ${SITE.slogan}</p>
    </div>
    <div>
      <h4>Liên kết nhanh</h4>
      <ul class="footer-list">${q}</ul>
    </div>
    <div>
      <h4>Liên hệ</h4>
      <ul class="footer-list footer-list--icons">
        <li>${icon("pin", { size: 18 })}<span>${SITE.address}</span></li>
        <li>${icon("phone", { size: 18 })}<a href="tel:${tel}">${SITE.hotline}</a></li>
        <li>${icon("mail", { size: 18 })}<a href="mailto:${SITE.email}">${SITE.email}</a></li>
        <li>${icon("clock", { size: 18 })}<span>${SITE.hours.join("<br>")}</span></li>
      </ul>
      <p class="mt-2 text-xs text-white/70">Thông tin mẫu cho đồ án.</p>
    </div>
    <div>
      <h4>Tìm Mầm Chữ</h4>
      <p class="text-sm leading-relaxed text-white/90">Ghé cửa hàng hoặc xem đường đi trên bản đồ.</p>
      <a href="about.html#ban-do" class="footer-map-link">${icon("pin", { size: 18 })} Xem bản đồ</a>
    </div>
  </div>
  <div class="mt-10 flex flex-col gap-3 border-t border-white/20 pt-6 text-sm text-white/80 sm:flex-row sm:items-center sm:justify-between">
    <p>© 2026 Mầm Chữ. Đồ án minh họa, nội dung và dữ liệu là mẫu.</p>
    <div class="flex items-center gap-4">
      <span class="data-status" data-data-status data-state="idle" title="Chưa tải dữ liệu"><span aria-hidden="true">●</span> Dữ liệu: Supabase</span>
      <a href="admin.html" class="text-xs text-white/70 underline-offset-2 hover:underline">Quản trị</a>
    </div>
  </div>
</div>`;
}

// ---------------------------------------------------------------- Toast
function ensureToastRoot() {
  let root = document.getElementById("toast-root");
  if (!root) {
    root = document.createElement("div");
    root.id = "toast-root";
    root.className = "toast-root";
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "false");
    document.body.appendChild(root);
  }
  return root;
}

/**
 * Hiện thông báo góc dưới màn hình, tự tắt sau 4 giây (DESIGN mục 5.7).
 * @param {string} message nội dung (text thường, không phải HTML)
 * @param {'success'|'error'|'info'} type
 */
export function showToast(message, type = "success", timeout = 4000) {
  const root = ensureToastRoot();
  const el = document.createElement("div");
  el.className = `toast toast--${type}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  const iconName = type === "error" ? "alert" : type === "info" ? "sprout" : "check";
  const msg = document.createElement("span");
  msg.className = "toast__msg";
  msg.textContent = message;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast__close";
  close.setAttribute("aria-label", "Đóng thông báo");
  close.innerHTML = icon("x", { size: 18 });
  el.innerHTML = `<span class="toast__icon">${icon(iconName, { size: 20 })}</span>`;
  el.append(msg, close);
  const remove = () => { el.classList.add("is-leaving"); setTimeout(() => el.remove(), 200); };
  close.addEventListener("click", remove);
  root.appendChild(el);
  if (timeout > 0) setTimeout(remove, timeout);
  return el;
}

// ---------------------------------------------------------------- Nhãn "● Dữ liệu: Supabase"
/** state: 'ok' (xanh) | 'error' (xám) | 'idle' (xám) */
export function setDataStatus(state) {
  const el = document.querySelector("[data-data-status]");
  if (!el) return;
  el.dataset.state = state;
  el.title = state === "ok" ? "Dữ liệu đã tải từ Supabase" : state === "error" ? "Chưa tải được dữ liệu" : "Chưa tải dữ liệu";
}

// ---------------------------------------------------------------- Số lượng giỏ hàng trên Navbar
export function updateCartBadge() {
  const n = cartCount();
  document.querySelectorAll("[data-cart-badge]").forEach((b) => {
    b.textContent = n > 99 ? "99+" : String(n);
    b.hidden = n === 0;
    b.parentElement?.setAttribute("aria-label", n > 0 ? `Giỏ hàng, ${n} cuốn` : "Giỏ hàng");
  });
}

// ---------------------------------------------------------------- Menu di động (ngăn kéo)
function bindDrawer() {
  const drawer = document.getElementById("mobile-drawer");
  const opener = document.querySelector("[data-menu-open]");
  if (!drawer || !opener) return;
  const setOpen = (open) => {
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    opener.setAttribute("aria-expanded", String(open));
    document.documentElement.classList.toggle("no-scroll", open);
    if (open) drawer.querySelector(".drawer__panel [data-menu-close]")?.focus();
    else opener.focus({ preventScroll: true });
  };
  opener.addEventListener("click", () => setOpen(true));
  drawer.querySelectorAll("[data-menu-close]").forEach((el) => el.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer.classList.contains("is-open")) setOpen(false);
  });
  // Quay lại màn hình rộng thì tự đóng ngăn kéo
  window.matchMedia("(min-width: 768px)").addEventListener("change", (m) => {
    if (m.matches && drawer.classList.contains("is-open")) setOpen(false);
  });
}

// ---------------------------------------------------------------- Khởi tạo
/**
 * Chèn Navbar + Footer vào #site-header và #site-footer, gắn sự kiện, cập nhật số giỏ hàng.
 * @param {{active?: string}} options
 */
export function initLayout({ active = "" } = {}) {
  const header = document.getElementById("site-header");
  const footer = document.getElementById("site-footer");
  if (header) { header.innerHTML = headerHTML(active); header.classList.add("site-header"); }
  if (footer) { footer.innerHTML = footerHTML(); footer.classList.add("site-footer"); }
  hydrateIcons(document);
  bindDrawer();
  ensureToastRoot();
  updateCartBadge();
  onCartChange(updateCartBadge);
}
