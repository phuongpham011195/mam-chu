// cart.js – Giỏ hàng lưu trong localStorage (PRD mục 7.1).
// Mỗi dòng lưu book_id, slug, quantity và `price` (giá khách nhìn thấy lúc thêm vào giỏ).
// `price` CHỈ dùng để báo "giá đã đổi" ở trang giỏ hàng, TUYỆT ĐỐI không dùng để tính tiền:
// giá thật luôn được đọc lại từ database khi đặt hàng (PRD mục 7.1, bước 2 và 4).

const KEY = "mamchu_cart_v1";
export const MAX_QTY = 20; // khớp CHECK quantity 1–20 của bảng order_items

let memoryCart = null; // dự phòng khi trình duyệt chặn localStorage

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const arr = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(arr)) return [];
    return arr
      .filter((i) => i && typeof i.book_id === "string" && typeof i.slug === "string" && Number.isInteger(i.quantity) && i.quantity > 0)
      .map((i) => {
        const line = { book_id: i.book_id, slug: i.slug, quantity: Math.min(i.quantity, MAX_QTY) };
        if (Number.isFinite(i.price) && i.price >= 0) line.price = i.price;
        return line;
      });
  } catch {
    return memoryCart ? memoryCart.map((i) => ({ ...i })) : [];
  }
}

function write(items) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
    memoryCart = null;
  } catch {
    memoryCart = items.map((i) => ({ ...i }));
  }
  window.dispatchEvent(new CustomEvent("cart:change"));
}

/** Danh sách dòng trong giỏ: [{ book_id, slug, quantity }] */
export function getCart() {
  return read();
}

/** Tổng số cuốn trong giỏ (cộng số lượng các dòng). */
export function cartCount() {
  return read().reduce((sum, i) => sum + i.quantity, 0);
}

/**
 * Thêm sách vào giỏ.
 * @param {{book_id: string, slug: string, price?: number}} book  price = giá đang hiển thị (chỉ để báo giá đổi)
 * @param {number} qty   số lượng muốn thêm (mặc định 1)
 * @param {number} stock tồn kho hiện biết; sách hết hàng (<= 0) không thêm được
 * @returns {{ added: number, quantity: number, capped: boolean, soldOut: boolean }}
 */
export function addToCart(book, qty = 1, stock = Infinity) {
  if (!(stock > 0)) return { added: 0, quantity: 0, capped: true, soldOut: true };
  const limit = Math.min(MAX_QTY, stock);
  const items = read();
  const line = items.find((i) => i.book_id === book.book_id);
  const before = line ? line.quantity : 0;
  const after = Math.min(before + Math.max(1, Math.floor(qty)), limit);
  const hasPrice = Number.isFinite(book.price) && book.price >= 0;
  const priceChanged = hasPrice && (!line || line.price !== book.price);
  if (line) {
    line.quantity = after;
    if (hasPrice) line.price = book.price;
  } else {
    const fresh = { book_id: book.book_id, slug: book.slug, quantity: after };
    if (hasPrice) fresh.price = book.price;
    items.push(fresh);
  }
  if (after !== before || priceChanged) write(items);
  return { added: after - before, quantity: after, capped: after >= limit, soldOut: false };
}

/** Cập nhật "giá đã thấy" của các dòng sau khi trang giỏ hàng đã báo giá đổi. map: { book_id: giá hiện tại } */
export function setSeenPrices(map) {
  const items = read().map((i) => (i.book_id in map ? { ...i, price: map[i.book_id] } : i));
  write(items);
}

/** Đặt số lượng của một dòng (0 hoặc nhỏ hơn thì xóa dòng). */
export function setQuantity(bookId, qty) {
  const q = Math.floor(qty);
  const items = read()
    .map((i) => (i.book_id === bookId ? { ...i, quantity: Math.min(q, MAX_QTY) } : i))
    .filter((i) => i.quantity > 0);
  write(items);
}

/** Xóa một dòng khỏi giỏ. */
export function removeFromCart(bookId) {
  write(read().filter((i) => i.book_id !== bookId));
}

/** Xóa sạch giỏ (sau khi đặt hàng thành công). */
export function clearCart() {
  write([]);
}

/** Gọi callback mỗi khi giỏ đổi (kể cả khi đổi ở tab khác). Trả về hàm hủy đăng ký. */
export function onCartChange(callback) {
  const onStorage = (e) => { if (e.key === KEY || e.key === null) callback(); };
  window.addEventListener("cart:change", callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener("cart:change", callback);
    window.removeEventListener("storage", onStorage);
  };
}
