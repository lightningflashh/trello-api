import { describe, it, expect, jest } from '@jest/globals'
import bcrypt from 'bcryptjs'

import { StatusCodes } from 'http-status-codes'

import { userModel } from '~/models/userModel'
import { userService } from '~/services/userService'
import { MailerSendProvider } from '~/providers/MailerSendProvider'
import { JwtProvider } from '~/providers/JwtProvider'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

jest.mock('bcryptjs', () => ({
  hashSync: jest.fn(),
  compareSync: jest.fn()
}))

jest.mock('~/models/userModel', () => ({
  userModel: {
    createNew: jest.fn(),
    findOneById: jest.fn(),
    findOneByEmail: jest.fn(),
    update: jest.fn(),
    findOneByGoogleId: jest.fn()
  }
}))

jest.mock('~/providers/MailerSendProvider', () => ({
  MailerSendProvider: {
    sendEmail: jest.fn()
  }
}))

jest.mock('~/providers/JwtProvider', () => ({
  JwtProvider: {
    generateToken: jest.fn(),
    verifyToken: jest.fn()
  }
}))

jest.mock('~/providers/CloudinaryProvider', () => ({
  CloudinaryProvider: {
    streamUpload: jest.fn()
  }
}))

describe('userService', () => {
  describe('createNew', () => {
    it('should throw error 409 when an email already was existing', async () => {
      const mockUserResponse = {
        _id: 'userId-123',
        email: 'admin@gmail.com',
        username: 'admin'
      }
      userModel.findOneByEmail.mockResolvedValueOnce(mockUserResponse)

      const requestUser = {
        email: 'admin@gmail.com',
        password: 'Pwd@123'
      }

      const promise = userService.createNew(requestUser)

      // promise.catch((error) => console.log(error));

      await expect(promise).rejects.toMatchObject({
        statusCode: StatusCodes.CONFLICT,
        message: 'Email already exists'
      })

      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(userModel.findOneByEmail).toHaveBeenCalledWith(requestUser.email)
      expect(bcrypt.hashSync).not.toHaveBeenCalled()
      expect(userModel.createNew).not.toHaveBeenCalled()
    })

    it('should create new user successfully', async () => {
      const payload = {
        email: 'newUser@gmail.com',
        password: 'Pwd@123'
      }

      const emailUsername = 'newUser'

      const mockedHashedPassword = 'hash-password-example@123'

      const mockedCreatedUser = {
        insertedId: 'user-id-01'
      }

      const mockedUserResponse = {
        _id: 'user-id-01',
        email: 'newUser@gmail.com',
        username: emailUsername,
        displayName: emailUsername,
        verifyToken: 'mock-verify-token'
      }

      bcrypt.hashSync.mockReturnValue(mockedHashedPassword)

      userModel.findOneByEmail.mockResolvedValue(null)

      userModel.createNew.mockResolvedValue(mockedCreatedUser)

      userModel.findOneById.mockResolvedValue(mockedUserResponse)

      MailerSendProvider.sendEmail.mockResolvedValue({
        message: 'Email sent successfully'
      })

      const result = await userService.createNew(payload)

      // Check email existence
      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)
      expect(userModel.findOneByEmail).toHaveBeenCalledWith(payload.email)

      // Check password hashing
      expect(bcrypt.hashSync).toHaveBeenCalledTimes(1)
      expect(bcrypt.hashSync).toHaveBeenCalledWith(payload.password, 8)

      // Check user creation
      expect(userModel.createNew).toHaveBeenCalledTimes(1)

      expect(userModel.createNew).toHaveBeenCalledWith({
        email: payload.email,
        password: mockedHashedPassword,
        username: emailUsername,
        displayName: emailUsername,
        verifyToken: expect.any(String)
      })

      // Check fetching created user
      expect(userModel.findOneById).toHaveBeenCalledTimes(1)
      expect(userModel.findOneById).toHaveBeenCalledWith(
        mockedCreatedUser.insertedId
      )

      // Check sending verification email
      expect(MailerSendProvider.sendEmail).toHaveBeenCalledTimes(1)

      expect(MailerSendProvider.sendEmail).toHaveBeenCalledWith({
        to: mockedUserResponse.email,
        toName: mockedUserResponse.displayName,
        subject: 'Trello MERN Stack Advanced: Please verify your account',
        html: expect.stringContaining(mockedUserResponse.verifyToken)
      })

      // Check returned user
      expect(result).toEqual(
        expect.objectContaining({
          _id: mockedUserResponse._id,
          email: mockedUserResponse.email,
          username: mockedUserResponse.username,
          displayName: mockedUserResponse.displayName
        })
      )
    })
  })

  describe('verifyAccount', () => {
    it('should throw error 404 when user not found', async () => {
      const requestBody = {
        email: 'notFounded@gmail.com',
        token: 'uuid-v4-example'
      }

      userModel.findOneByEmail.mockResolvedValue(null)
      const promise = userService.verifyAccount(requestBody)
      await expect(promise).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'User not found'
      })

      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should throw error 406 when an account is already actvating', async () => {
      const requestBody = {
        email: 'activated@gmail.com',
        token: 'uuid-v4-example'
      }

      const existingUser = {
        email: 'activated@gmail.com',
        token: null,
        isActive: true
      }

      userModel.findOneByEmail.mockResolvedValue(existingUser)

      const promise = userService.verifyAccount(requestBody)
      await expect(promise).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'Account already verified'
      })

      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should throw error 401 when reqBody.token is not equal with existingUser.verifyToken', async () => {
      const requestBody = {
        email: 'activated@gmail.com',
        token: 'uuid-v4-example'
      }

      const existingUser = {
        email: 'activated@gmail.com',
        token: 'uuid-v4-not-match-example',
        isActive: false
      }

      userModel.findOneByEmail.mockResolvedValue(existingUser)

      const promise = userService.verifyAccount(requestBody)
      await expect(promise).rejects.toMatchObject({
        statusCode: StatusCodes.UNAUTHORIZED,
        message: 'Invalid verification token'
      })

      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should return response after verifyAccount successfully', async () => {
      const requestBody = {
        email: 'inactivated@gmail.com',
        token: 'uuid-v4-example'
      }

      const existingUser = {
        _id: 'user-id',
        email: 'inactivated@gmail.com',
        verifyToken: 'uuid-v4-example',
        isActive: false
      }

      const mockedUpdatedUser = {
        ...existingUser,
        isActive: true,
        verifyToken: null
      }

      userModel.findOneByEmail.mockResolvedValue(existingUser)

      userModel.update.mockResolvedValue(mockedUpdatedUser)

      const result = await userService.verifyAccount(requestBody)

      expect(userModel.findOneByEmail).toHaveBeenCalledTimes(1)

      expect(userModel.findOneByEmail).toHaveBeenCalledWith(requestBody.email)

      expect(userModel.update).toHaveBeenCalledTimes(1)

      expect(userModel.update).toHaveBeenCalledWith(existingUser._id, {
        isActive: true,
        verifyToken: null
      })

      delete mockedUpdatedUser.verifyToken
      expect(result).toEqual(mockedUpdatedUser)
    })

    describe('login', () => {
      it('should throw error 404 when user not found', async () => {
        const requestBody = {
          email: 'notfound@gmail.com',
          password: 'Pwd@123'
        }

        userModel.findOneByEmail.mockResolvedValue(null)

        await expect(userService.login(requestBody)).rejects.toMatchObject({
          statusCode: StatusCodes.NOT_FOUND,
          message: 'User not found'
        })

        expect(userModel.findOneByEmail).toHaveBeenCalledWith(
          requestBody.email
        )

        expect(bcrypt.compareSync).not.toHaveBeenCalled()
        expect(JwtProvider.generateToken).not.toHaveBeenCalled()
      })

      it('should throw error 406 when account not verified', async () => {
        const requestBody = {
          email: 'inactive@gmail.com',
          password: 'Pwd@123'
        }

        const existingUser = {
          _id: 'user-id',
          email: requestBody.email,
          password: 'hashed-password',
          isActive: false
        }

        userModel.findOneByEmail.mockResolvedValue(existingUser)

        await expect(userService.login(requestBody)).rejects.toMatchObject({
          statusCode: StatusCodes.NOT_ACCEPTABLE,
          message: 'Account not verified'
        })

        expect(bcrypt.compareSync).not.toHaveBeenCalled()
        expect(JwtProvider.generateToken).not.toHaveBeenCalled()
      })

      it('should throw error 406 when password is invalid', async () => {
        const requestBody = {
          email: 'admin@gmail.com',
          password: 'WrongPassword'
        }

        const existingUser = {
          _id: 'user-id',
          email: requestBody.email,
          password: 'hashed-password',
          isActive: true
        }

        userModel.findOneByEmail.mockResolvedValue(existingUser)

        bcrypt.compareSync.mockReturnValue(false)

        await expect(userService.login(requestBody)).rejects.toMatchObject({
          statusCode: StatusCodes.NOT_ACCEPTABLE,
          message: 'Invalid password'
        })

        expect(bcrypt.compareSync).toHaveBeenCalledWith(
          requestBody.password,
          existingUser.password
        )

        expect(JwtProvider.generateToken).not.toHaveBeenCalled()
      })

      it('should login successfully and return accessToken and refreshToken', async () => {
        const requestBody = {
          email: 'admin@gmail.com',
          password: 'Pwd@123'
        }

        const existingUser = {
          _id: 'user-id',
          email: requestBody.email,
          username: 'admin',
          displayName: 'admin',
          password: 'hashed-password',
          isActive: true
        }

        userModel.findOneByEmail.mockResolvedValue(existingUser)

        bcrypt.compareSync.mockReturnValue(true)

        JwtProvider.generateToken
          .mockResolvedValueOnce('mock-access-token')
          .mockResolvedValueOnce('mock-refresh-token')

        const result = await userService.login(requestBody)

        expect(userModel.findOneByEmail).toHaveBeenCalledWith(
          requestBody.email
        )

        expect(bcrypt.compareSync).toHaveBeenCalledWith(
          requestBody.password,
          existingUser.password
        )

        expect(JwtProvider.generateToken).toHaveBeenCalledTimes(2)

        expect(JwtProvider.generateToken).toHaveBeenNthCalledWith(
          1,
          {
            _id: existingUser._id,
            email: existingUser.email
          },
          expect.any(String),
          expect.any(String)
        )

        expect(JwtProvider.generateToken).toHaveBeenNthCalledWith(
          2,
          {
            _id: existingUser._id,
            email: existingUser.email
          },
          expect.any(String),
          expect.any(String)
        )

        expect(result).toEqual(
          expect.objectContaining({
            _id: existingUser._id,
            email: existingUser.email,
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          })
        )
      })
    })

    describe('refreshToken', () => {
      it('should generate new accessToken successfully', async () => {
        const clientRefreshToken = 'mock-refresh-token'

        const mockedDecodedToken = {
          _id: 'user-id',
          email: 'admin@gmail.com'
        }

        JwtProvider.verifyToken.mockResolvedValue(mockedDecodedToken)

        JwtProvider.generateToken.mockResolvedValue('new-access-token')

        const result = await userService.refreshToken(clientRefreshToken)

        expect(JwtProvider.verifyToken).toHaveBeenCalledTimes(1)

        expect(JwtProvider.verifyToken).toHaveBeenCalledWith(
          clientRefreshToken,
          expect.any(String)
        )

        expect(JwtProvider.generateToken).toHaveBeenCalledTimes(1)

        expect(JwtProvider.generateToken).toHaveBeenCalledWith(
          {
            _id: mockedDecodedToken._id,
            email: mockedDecodedToken.email
          },
          expect.any(String),
          expect.any(String)
        )

        expect(result).toEqual({
          accessToken: 'new-access-token'
        })
      })

      it('should throw error when refreshToken is invalid', async () => {
        const clientRefreshToken = 'invalid-refresh-token'

        JwtProvider.verifyToken.mockRejectedValue(new Error('Invalid token'))

        await expect(
          userService.refreshToken(clientRefreshToken)
        ).rejects.toThrow('Invalid token')

        expect(JwtProvider.verifyToken).toHaveBeenCalledWith(
          clientRefreshToken,
          expect.any(String)
        )

        expect(JwtProvider.generateToken).not.toHaveBeenCalled()
      })
    })
  })

  describe('update', () => {
    const userId = 'user-id-123'

    const existingUser = {
      _id: userId,
      email: 'admin@gmail.com',
      username: 'admin',
      displayName: 'admin',
      password: 'hashed-password',
      avatar: 'old-avatar.png',
      isActive: true
    }

    it('should throw error 404 when user not found', async () => {
      userModel.findOneById.mockResolvedValue(null)

      await expect(userService.update(userId, {}, null)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'User not found'
      })

      expect(userModel.findOneById).toHaveBeenCalledWith(userId)

      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should throw error 406 when account not verified', async () => {
      userModel.findOneById.mockResolvedValue({
        ...existingUser,
        isActive: false
      })

      await expect(userService.update(userId, {}, null)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'Account not verified'
      })

      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should throw error 406 when current password is incorrect', async () => {
      const requestBody = {
        current_password: 'WrongPassword',
        new_password: 'NewPwd@123'
      }

      userModel.findOneById.mockResolvedValue(existingUser)

      bcrypt.compareSync.mockReturnValue(false)

      await expect(
        userService.update(userId, requestBody, null)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_ACCEPTABLE,
        message: 'Current password is incorrect'
      })

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        requestBody.current_password,
        existingUser.password
      )

      expect(bcrypt.hashSync).not.toHaveBeenCalled()
      expect(userModel.update).not.toHaveBeenCalled()
    })

    it('should update password successfully', async () => {
      const requestBody = {
        current_password: 'OldPwd@123',
        new_password: 'NewPwd@123'
      }

      const mockedHashedPassword = 'new-hashed-password'

      const mockedUpdatedUser = {
        ...existingUser,
        password: mockedHashedPassword
      }

      userModel.findOneById.mockResolvedValue(existingUser)

      bcrypt.compareSync.mockReturnValue(true)

      bcrypt.hashSync.mockReturnValue(mockedHashedPassword)

      userModel.update.mockResolvedValue(mockedUpdatedUser)

      const result = await userService.update(userId, requestBody, null)

      expect(bcrypt.compareSync).toHaveBeenCalledWith(
        requestBody.current_password,
        existingUser.password
      )

      expect(bcrypt.hashSync).toHaveBeenCalledWith(
        requestBody.new_password,
        10
      )

      expect(userModel.update).toHaveBeenCalledWith(existingUser._id, {
        password: mockedHashedPassword
      })

      expect(result).toEqual(
        expect.objectContaining({
          _id: userId,
          email: existingUser.email
        })
      )
    })

    it('should upload avatar successfully', async () => {
      const userAvatarFile = {
        buffer: Buffer.from('mock-image')
      }

      const mockedUploadResult = {
        secure_url: 'https://cloudinary.com/avatar.png'
      }

      const mockedUpdatedUser = {
        ...existingUser,
        avatar: mockedUploadResult.secure_url
      }

      userModel.findOneById.mockResolvedValue(existingUser)

      CloudinaryProvider.streamUpload.mockResolvedValue(mockedUploadResult)

      userModel.update.mockResolvedValue(mockedUpdatedUser)

      const result = await userService.update(userId, {}, userAvatarFile)

      expect(CloudinaryProvider.streamUpload).toHaveBeenCalledTimes(1)

      expect(CloudinaryProvider.streamUpload).toHaveBeenCalledWith(
        userAvatarFile.buffer,
        'users'
      )

      expect(userModel.update).toHaveBeenCalledWith(existingUser._id, {
        avatar: mockedUploadResult.secure_url
      })

      expect(result).toEqual(
        expect.objectContaining({
          _id: userId,
          avatar: mockedUploadResult.secure_url
        })
      )
    })

    it('should update user information successfully', async () => {
      const requestBody = {
        displayName: 'New Display Name',
        username: 'newUsername'
      }

      const mockedUpdatedUser = {
        ...existingUser,
        ...requestBody
      }

      userModel.findOneById.mockResolvedValue(existingUser)

      userModel.update.mockResolvedValue(mockedUpdatedUser)

      const result = await userService.update(userId, requestBody, null)

      expect(userModel.update).toHaveBeenCalledTimes(1)

      expect(userModel.update).toHaveBeenCalledWith(
        existingUser._id,
        requestBody
      )

      expect(result).toEqual(
        expect.objectContaining({
          _id: userId,
          displayName: requestBody.displayName,
          username: requestBody.username
        })
      )

      expect(CloudinaryProvider.streamUpload).not.toHaveBeenCalled()
    })
  })

  describe('loginWithGoogle', () => {
    const googleProfile = {
      id: 'google-id-123',
      displayName: 'Google User',
      emails: [
        {
          value: 'google@gmail.com'
        }
      ],
      photos: [
        {
          value: 'https://google.com/avatar.png'
        }
      ]
    }

    const mockedUser = {
      _id: 'user-id-123',
      email: 'google@gmail.com',
      username: 'google',
      displayName: 'Google User',
      googleId: 'google-id-123',
      avatar: 'https://google.com/avatar.png',
      isActive: true
    }

    const mockGenerateTokens = () => {
      JwtProvider.generateToken
        .mockResolvedValueOnce('mock-access-token')
        .mockResolvedValueOnce('mock-refresh-token')
    }

    it('should throw error 400 when Google profile has no email', async () => {
      const invalidProfile = {
        id: 'google-id-123',
        displayName: 'Google User',
        emails: [],
        photos: []
      }

      await expect(
        userService.loginWithGoogle(invalidProfile)
      ).rejects.toMatchObject({
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Email not found in Google profile'
      })

      expect(userModel.findOneByGoogleId).not.toHaveBeenCalled()
      expect(userModel.findOneByEmail).not.toHaveBeenCalled()
      expect(userModel.createNew).not.toHaveBeenCalled()
      expect(JwtProvider.generateToken).not.toHaveBeenCalled()
    })

    it('should login successfully when Google ID already exists', async () => {
      userModel.findOneByGoogleId.mockResolvedValue(mockedUser)

      mockGenerateTokens()

      const result = await userService.loginWithGoogle(googleProfile)

      expect(userModel.findOneByGoogleId).toHaveBeenCalledWith(
        googleProfile.id
      )

      expect(userModel.findOneByEmail).not.toHaveBeenCalled()
      expect(userModel.createNew).not.toHaveBeenCalled()
      expect(userModel.update).not.toHaveBeenCalled()

      expect(JwtProvider.generateToken).toHaveBeenCalledTimes(2)

      expect(result).toEqual(
        expect.objectContaining({
          _id: mockedUser._id,
          email: mockedUser.email,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        })
      )
    })

    it('should link Google account to existing user successfully', async () => {
      const existingUser = {
        _id: 'existing-user-id',
        email: googleProfile.emails[0].value,
        username: 'google',
        displayName: 'Google User',
        isActive: true
      }

      userModel.findOneByGoogleId.mockResolvedValue(null)

      userModel.findOneByEmail.mockResolvedValue(existingUser)

      userModel.update.mockResolvedValue({
        ...existingUser,
        googleId: googleProfile.id
      })

      userModel.findOneById.mockResolvedValue(mockedUser)

      mockGenerateTokens()

      const result = await userService.loginWithGoogle(googleProfile)

      expect(userModel.findOneByGoogleId).toHaveBeenCalledWith(
        googleProfile.id
      )

      expect(userModel.findOneByEmail).toHaveBeenCalledWith(
        googleProfile.emails[0].value
      )

      expect(userModel.update).toHaveBeenCalledWith(existingUser._id, {
        googleId: googleProfile.id
      })

      expect(userModel.findOneById).toHaveBeenCalledWith(existingUser._id)

      expect(userModel.createNew).not.toHaveBeenCalled()

      expect(JwtProvider.generateToken).toHaveBeenCalledTimes(2)

      expect(result).toEqual(
        expect.objectContaining({
          _id: mockedUser._id,
          email: mockedUser.email,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        })
      )
    })

    it('should create new user when Google ID and email do not exist', async () => {
      userModel.findOneByGoogleId.mockResolvedValue(null)

      userModel.findOneByEmail.mockResolvedValue(null)

      userModel.createNew.mockResolvedValue({
        insertedId: 'new-user-id'
      })

      userModel.findOneById.mockResolvedValue(mockedUser)

      mockGenerateTokens()

      const result = await userService.loginWithGoogle(googleProfile)

      expect(userModel.findOneByGoogleId).toHaveBeenCalledWith(
        googleProfile.id
      )

      expect(userModel.findOneByEmail).toHaveBeenCalledWith(
        googleProfile.emails[0].value
      )

      expect(userModel.createNew).toHaveBeenCalledWith({
        email: googleProfile.emails[0].value,
        googleId: googleProfile.id,
        username: 'google',
        displayName: googleProfile.displayName,
        avatar: googleProfile.photos[0].value,
        isActive: true
      })

      expect(userModel.findOneById).toHaveBeenCalledWith('new-user-id')

      expect(JwtProvider.generateToken).toHaveBeenCalledTimes(2)

      expect(result).toEqual(
        expect.objectContaining({
          _id: mockedUser._id,
          email: mockedUser.email,
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token'
        })
      )
    })

    it('should create new user with empty avatar when Google profile has no photo', async () => {
      const profileWithoutPhoto = {
        ...googleProfile,
        photos: []
      }

      userModel.findOneByGoogleId.mockResolvedValue(null)

      userModel.findOneByEmail.mockResolvedValue(null)

      userModel.createNew.mockResolvedValue({
        insertedId: 'new-user-id'
      })

      userModel.findOneById.mockResolvedValue(mockedUser)

      mockGenerateTokens()

      await userService.loginWithGoogle(profileWithoutPhoto)

      expect(userModel.createNew).toHaveBeenCalledWith(
        expect.objectContaining({
          avatar: ''
        })
      )
    })
  })

  describe('getCurrentUser', () => {
    const userInfo = {
      _id: 'user-id-123',
      email: 'admin@gmail.com'
    }

    it('should throw error 404 when user not found', async () => {
      userModel.findOneById.mockResolvedValue(null)

      await expect(userService.getCurrentUser(userInfo)).rejects.toMatchObject({
        statusCode: StatusCodes.NOT_FOUND,
        message: 'User not found'
      })

      expect(userModel.findOneById).toHaveBeenCalledTimes(1)

      expect(userModel.findOneById).toHaveBeenCalledWith(userInfo._id)
    })

    it('should return current user successfully', async () => {
      const mockedUser = {
        _id: userInfo._id,
        email: userInfo.email,
        username: 'admin',
        displayName: 'Admin',
        password: 'hashed-password',
        isActive: true
      }

      userModel.findOneById.mockResolvedValue(mockedUser)

      const result = await userService.getCurrentUser(userInfo)

      expect(userModel.findOneById).toHaveBeenCalledTimes(1)

      expect(userModel.findOneById).toHaveBeenCalledWith(userInfo._id)

      expect(result).toEqual(
        expect.objectContaining({
          _id: mockedUser._id,
          email: mockedUser.email,
          username: mockedUser.username,
          displayName: mockedUser.displayName
        })
      )

      expect(result).not.toHaveProperty('password')
    })
  })
})
