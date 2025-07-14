import { StatusCodes } from 'http-status-codes'
import { JwtProvider } from '~/providers/JwtProvider'
import { env } from '~/config/environment'
import ApiError from '~/utils/ApiError'

// Xác thực JWT token từ request header (phía client) có hợp lệ hay không
const isAuthorized = async (req, res, next) => {
  //  Lấy access token từ request cookie phía client - withCredentials trên authorizedAxiosInstance
  const accessToken = req.cookies?.accessToken

  if (!accessToken) {
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'No access token provided'))
    return
  }

  try {
    // Giải mã access token
    const decoded = await JwtProvider.verifyToken(accessToken, env.ACCESS_TOKEN_SECRET_SIGNATURE)
    // Lưu thông tin user vào req để các middleware và route handler khác có thể sử dụng
    req.jwtDecoded = decoded

    next() // Tiếp tục xử lý request
  } catch (error) {
    // Nếu access token hết hạn (expired) thì trả về mã lỗi GONE (410) để phía client có thể refresh token
    if (error?.message?.includes('jwt expired')) {
      next(new ApiError(StatusCodes.GONE, 'Access token expired'))
      return
    }

    // Nếu token không hợp lệ thì trả về mã lỗi UNAUTHORIZED (401)
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid access token'))
  }
}

export const authMiddleware = {
  isAuthorized
}