// about.js – Trang Về chúng tôi (about.html).
//   F18  Nhúng Google Map: iframe có sẵn trong about.html (không cần API key, trỏ tới khu vực chung ở Quận 1).
//   F19  Navbar, Footer (layout.js).
// Trang này không đọc database. Thông tin liên hệ lấy từ SITE (layout.js) để Footer và trang này luôn giống nhau.
import { initLayout, SITE } from "../layout.js";
import { icon } from "../icons.js";
import { esc } from "../utils.js";

initLayout({ active: "about" });

const tel = SITE.hotline.replace(/\s+/g, "");
const rows = [
  { ic: "book", label: "Cửa hàng", html: esc(SITE.shop) },
  { ic: "pin", label: "Địa chỉ", html: esc(SITE.address) },
  { ic: "phone", label: "Hotline", html: `<a href="tel:${esc(tel)}">${esc(SITE.hotline)}</a>` },
  { ic: "mail", label: "Email", html: `<a href="mailto:${esc(SITE.email)}">${esc(SITE.email)}</a>` },
  { ic: "clock", label: "Giờ mở cửa", html: SITE.hours.map(esc).join("<br>") },
  { ic: "heart", label: "Hỗ trợ đặt hàng", html: esc(SITE.support) },
];

document.getElementById("contact-list").innerHTML = rows
  .map((r) => `<li><span class="icon-chip">${icon(r.ic, { size: 24 })}</span><div><strong>${r.label}</strong><span>${r.html}</span></div></li>`)
  .join("");
