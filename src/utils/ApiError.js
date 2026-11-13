import { StatusCodes } from 'http-status-codes'
/**
 * Định nghĩa riêng một Class ApiError kế thừa class Error sẵn (điều này cần thiết và là Best Practice vì class Error nó là class built-in sẵn)
 */
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message)

    // Tên của cái custom Error này, nếu không set thì mặc định nó sẽ kế thừa là "Error"
    this.name = 'ApiError'

    // Gán thêm http status code của chúng ta ở đây
    this.statusCode = statusCode

    Object.setPrototypeOf(this, new.target.prototype) // Tránh lỗi prototype chain khi kế thừa class Error sẵn có của JS

    Error.captureStackTrace(this, this.constructor) // Ghi lại Stack Trace (dấu vết ngăn xếp) để thuận tiện cho việc debug
  }

  static BadRequest(msg = 'Bad Request') {
    return new ApiError(StatusCodes.BAD_REQUEST, msg)
  }
}

export default ApiError
