import JWT from 'jsonwebtoken'

const generateToken = async (payload, secretKey, tokenLife) => {
  // payload là cái object chứa thông tin người dùng
  try {
    return JWT.sign(payload, secretKey, { algorithm: 'HS256', expiresIn: tokenLife })
  } catch (error) {
    throw new Error(error)
  }
}

const verifyToken = async (token, secretKey) => {
  try {
    return JWT.verify(token, secretKey)
  } catch (error) {
    throw new Error(error)
  }
}

export const JwtProvider = {
  generateToken,
  verifyToken
}
