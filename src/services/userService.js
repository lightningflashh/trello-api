
import { StatusCodes } from 'http-status-codes'
import { userModel } from '~/models/userModel'
import ApiError from '~/utils/ApiError'

import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { pickUser } from '~/utils/formatters'
import { WEBSITE_DOMAIN } from '~/utils/constants'
import { MailerSendProvider } from '~/providers/MailerSendProvider'

import { env } from '~/config/environment'
import { JwtProvider } from '~/providers/JwtProvider'

const createNew = async (reqBody) => {
  // eslint-disable-next-line no-useless-catch
  try {
    // Check xem đã có user nào với email này chưa
    const existingUser = await userModel.findOneByEmail({ email: reqBody.email })
    if (existingUser) {
      throw new ApiError(StatusCodes.CONFLICT, 'Email already exists')
    }

    // Tạo data lưu vào CSDL
    // Lấy cái tên trước cái @
    const nameFromEmail = reqBody.email.split('@')[0]

    const newUser = {
      email: reqBody.email,
      password: bcrypt.hashSync(reqBody.password, 8),
      username: nameFromEmail,
      displayName: nameFromEmail,
      verifyToken: uuidv4()
    }

    // Tạo user mới
    const createdUser = await userModel.createNew(newUser)

    const getNewUser = await userModel.findOneById(createdUser.insertedId)

    // Gửi mail xác nhận tài khoản
    const verificationUrl = `${WEBSITE_DOMAIN}/account/verification?email=${getNewUser.email}&token=${getNewUser.verifyToken}`
    const customSubject = 'Trello MERN Stack Advanced: Please verify your account'
    const htmlContent = `
      <h1>Welcome to Trello MERN Stack Advanced</h1>
      <p>To complete your registration, please verify your account by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Account</a>
    `
    const mailerSendResponse = await MailerSendProvider.sendEmail({
      to: getNewUser.email,
      toName: getNewUser.displayName,
      subject: customSubject,
      html: htmlContent
    })

    // return trả về dữ liệu user mới tạo
    return pickUser(getNewUser)
  } catch (error) { throw error }
}

const verifyAccount = async (reqBody) => {
  try {
    const existingUser = await userModel.findOneByEmail({ email: reqBody.email })
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    if (existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account already verified')
    if (reqBody.token !== existingUser.verifyToken) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid verification token')

    // Cập nhật trạng thái tài khoản
    const updatedUser = await userModel.update(existingUser._id, {
      isActive: true,
      verifyToken: null // Xoá token sau khi xác thực
    })

    return pickUser(updatedUser)

  } catch (error) {
    throw error
  }
}

const login = async (reqBody) => {
  try {
    const existingUser = await userModel.findOneByEmail({ email: reqBody.email })
    if (!existingUser) throw new ApiError(StatusCodes.NOT_FOUND, 'User not found')
    if (!existingUser.isActive) throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Account not verified')
    if (!bcrypt.compareSync(reqBody.password, existingUser.password)) {
      throw new ApiError(StatusCodes.NOT_ACCEPTABLE, 'Invalid password')
    }

    // Tạo access token và refresh token
    const accessToken = JwtProvider.generateToken(
      { userId: existingUser._id, email: existingUser.email },
      env.ACCESS_TOKEN_SECRET_SIGNATURE,
      env.ACCESS_TOKEN_LIFE
      // 5
    )

    const refreshToken = JwtProvider.generateToken(
      { userId: existingUser._id, email: existingUser.email },
      env.REFRESH_TOKEN_SECRET_SIGNATURE,
      env.REFRESH_TOKEN_LIFE
    )

    return { ...pickUser(existingUser), accessToken, refreshToken }

  } catch (error) {
    throw error
  }
}

export const userService = {
  createNew,
  verifyAccount,
  login
}