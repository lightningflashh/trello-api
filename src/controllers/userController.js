import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

import ms from 'ms'
import ApiError from '~/utils/ApiError'

const createNew = async (req, res, next) => {
  try {
    const createdUser = await userService.createNew(req.body)
    return res.status(StatusCodes.CREATED).json(createdUser)
  } catch (error) { next(error) }
}

const verifyAccount = async (req, res, next) => {
  try {
    const result = await userService.verifyAccount(req.body)
    res.status(StatusCodes.OK).json(result)
  } catch (error) { next(error) }
}

const login = async (req, res, next) => {
  try {
    const user = await userService.login(req.body)
    res.cookie('accessToken', user.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days') // Thời gian cookie tồn tại
    })

    res.cookie('refreshToken', user.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })
    return res.status(StatusCodes.OK).json(user)
  } catch (error) { next(error) }
}

const logout = async (req, res, next) => {
  try {
    res.clearCookie('accessToken')
    res.clearCookie('refreshToken')
    return res.status(StatusCodes.OK).json({ message: 'Logged out successfully' })
  } catch (error) { next(error) }
}

const refreshToken = async (req, res, next) => {
  try {
    const result = await userService.refreshToken(req.cookies?.refreshToken)
    res.cookie('accessToken', result.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: ms('14 days')
    })

    return res.status(StatusCodes.OK).json(result)
  } catch (error) { next(new ApiError(StatusCodes.FORBIDDEN, 'Invalid refresh token, please login again')) }
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  logout,
  refreshToken
}
