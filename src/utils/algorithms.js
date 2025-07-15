export const pagingSkipValue = (page, itemsPerPage) => {
  // Luôn đảm bảo nếu giá trị không hợp lệ thì return về 0 hết
  if (!page || !itemsPerPage) return 0
  if (page <= 0 || itemsPerPage <= 0) return 0

  /**
   * Giải thích công thức đơn giản dễ hiểu:
   * Ví dụ trường hợp mỗi page hiển thị 12 sản phẩm (itemsPerPage = 12)
   * Case 01: User đứng ở page 1 => (1 - 1) * 12 = 0 (không skip gì hết)
   * Case 02: page 2 => (2 - 1) * 12 = 12 (bỏ qua 12 item trước đó)
   * Case 03: page 5 => (5 - 1) * 12 = 48 (bỏ qua 48 item)
   */
  return (page - 1) * itemsPerPage
}
