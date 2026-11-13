import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, jest } from '@jest/globals'

import { userController } from '~/controllers/userController'
import { userService } from '~/services/userService'

// Mock the userService methods used in the controller
jest.mock('~/services/userService', () => ({
  userService: {
    createNew: jest.fn(),
    verifyAccount: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    loginWithGoogle: jest.fn(),
    update: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn()
  }
}))

describe('userController', () => {
  const mockResponse = () => {
    const res = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    res.cookie = jest.fn().mockReturnValue(res)
    res.redirect = jest.fn().mockReturnValue(res)
    res.clearCookie = jest.fn().mockReturnValue(res)
    return res
  }

  describe('createNew', () => {
    it('should create a new user and return 201 status', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          username: 'test',
          password: 'Pwd@123'
        }
      }

      const res = mockResponse()

      const returnUser = {
        _id: 'id-auto-generated',
        username: 'test',
        email: 'test@example.com'
      }

      userService.createNew.mockResolvedValue(returnUser)

      await userController.createNew(req, res)

      expect(userService.createNew).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.CREATED)
      expect(res.json).toHaveBeenCalledWith(returnUser)
    })
  })

  describe('verifyAccount', () => {
    it('should verify account and return 200 status', async () => {
      const req = {
        body: {
          email: 'test@exmaple.com',
          token: '123456'
        }
      }

      const res = mockResponse()

      const returnResult = {
        message: 'Account verified successfully'
      }

      userService.verifyAccount.mockResolvedValue(returnResult)

      await userController.verifyAccount(req, res)

      expect(userService.verifyAccount).toHaveBeenCalledWith(req.body)
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(returnResult)
    })
  })

  describe('login', () => {
    it('should login user and return 200 status with tokens', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'Pwd@123'
        }
      }

      const res = mockResponse()

      const returnUser = {
        _id: 'id-auto-generated',
        username: 'test',
        email: 'test@example.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }

      userService.login.mockResolvedValue(returnUser)

      await userController.login(req, res)

      expect(userService.login).toHaveBeenCalledWith(req.body)
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        returnUser.accessToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: expect.any(Number)
        }
      )

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        returnUser.refreshToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: expect.any(Number)
        }
      )

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith({
        _id: returnUser._id,
        username: returnUser.username,
        email: returnUser.email,
        accessToken: returnUser.accessToken,
        refreshToken: returnUser.refreshToken
      })
    })
  })

  describe('loginWithGoogle', () => {
    it('should login user with Google and return 200 status with tokens', async () => {
      const req = {
        user: {
          id: 'google-id',
          displayName: 'Google User',
          emails: [{ value: 'test@gmail.com' }],
          photos: [{ value: 'avatar-url' }]
        }
      }

      const res = mockResponse()

      const returnUser = {
        _id: 'id-auto-generated',
        username: 'test',
        email: 'test@gmail.com',
        accessToken: 'access-token',
        refreshToken: 'refresh-token'
      }

      userService.loginWithGoogle.mockResolvedValue(returnUser)

      await userController.loginWithGoogle(req, res)

      expect(userService.loginWithGoogle).toHaveBeenCalledWith(req.user)
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        returnUser.accessToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: expect.any(Number)
        }
      )

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        returnUser.refreshToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: expect.any(Number)
        }
      )

      expect(res.redirect).toHaveBeenCalledWith(
        expect.stringContaining('/auth/google/success')
      )
    })
  })

  describe('refreshToken', () => {
    it('should return 200 status with new access token', async () => {
      const req = {
        cookies: {
          refreshToken: 'valid-refresh-token'
        }
      }

      const res = mockResponse()

      const returnResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      }

      userService.refreshToken.mockResolvedValue(returnResult)

      await userController.refreshToken(req, res)

      expect(userService.refreshToken).toHaveBeenCalledWith(
        req.cookies.refreshToken
      )
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        returnResult.accessToken,
        {
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: expect.any(Number)
        }
      )
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith(returnResult)
    })
  })

  describe('logout()', () => {
    it('should return logout successful', async () => {
      const req = {}
      const res = mockResponse()

      await userController.logout(req, res)

      expect(res.clearCookie).toHaveBeenCalledWith('accessToken')
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken')
      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Logged out successfully'
      })
    })
  })

  describe('update()', () => {
    it('should update user successfully', async () => {
      // Arrange
      const req = {
        body: {
          username: 'updatedUser',
          email: 'updatedUser@example.com'
        },
        file: {
          originalname: 'avatar.png'
        },
        jwtDecoded: {
          _id: 'user-id'
        }
      }

      const returnValue = {
        _id: 'user-id',
        username: 'updatedUser',
        email: 'updatedUser@example.com'
      }

      const res = mockResponse()

      userService.update.mockResolvedValue(returnValue)

      // Act
      await userController.update(req, res)

      // Assert
      expect(userService.update).toHaveBeenCalledWith(
        'user-id',
        req.body,
        req.file
      )

      expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)

      expect(res.json).toHaveBeenCalledWith(returnValue)
    })
  })
})
