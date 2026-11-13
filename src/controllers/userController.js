import { StatusCodes } from 'http-status-codes'
import { userService } from '~/services/userService'

import ms from 'ms'
import ApiError from '~/utils/ApiError'
import { env } from '~/config/environment'

const createNew = async (req, res) => {
  const createdUser = await userService.createNew(req.body)
  return res.status(StatusCodes.CREATED).json(createdUser)
}

const verifyAccount = async (req, res) => {
  const result = await userService.verifyAccount(req.body)
  res.status(StatusCodes.OK).json(result)
}

const login = async (req, res) => {
  const user = await userService.login(req.body)
  res.cookie('accessToken', user.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })

  res.cookie('refreshToken', user.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })
  return res.status(StatusCodes.OK).json(user)
}

const loginWithGoogle = async (req, res) => {
  const result = await userService.loginWithGoogle(req.user)

  res.cookie('accessToken', result.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })

  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: ms('14 days')
  })

  const domain =
    env.BUILD_MODE === 'production'
      ? env.WEBSITE_DOMAIN_PRODUCTION
      : env.WEBSITE_DOMAIN_DEVELOPMENT

  return res.redirect(`${domain}/auth/google/success`)
}

const logout = async (_req, res) => {
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  return res
    .status(StatusCodes.OK)
    .json({ message: 'Logged out successfully' })
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
  } catch (error) {
    next(
      new ApiError(
        StatusCodes.FORBIDDEN,
        'Invalid refresh token, please login again'
      )
    )
  }
}

const update = async (req, res, next) => {
  const updatedUser = await userService.update(
    req.jwtDecoded._id,
    req.body,
    req.file
  )
  return res.status(StatusCodes.OK).json(updatedUser)
}

const getCurrentUser = async (req, res, _next) => {
  const user = await userService.getCurrentUser(req.jwtDecoded)

  return res.status(StatusCodes.OK).json(user)
}

export const userController = {
  createNew,
  verifyAccount,
  login,
  loginWithGoogle,
  logout,
  refreshToken,
  update,
  getCurrentUser
}
