import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, jest } from '@jest/globals'
import { userValidation } from '~/validations/userValidation'
import ApiError from '~/utils/ApiError'

describe('User Validation Tests', () => {
  describe('createNew()', () => {
    it('should call next() when validation passes', async () => {
      const req = {
        body: { email: 'test@example.com', password: 'Password123!' }
      }

      const res = {}
      const next = jest.fn()

      await userValidation.createNew(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)

      expect(next).toHaveBeenCalledWith()
    })

    it('should call next() with an error when validation fails', async () => {
      const req = {
        body: { email: 'invalid-email', password: 'short' }
      }

      const res = {}
      const next = jest.fn()

      await userValidation.createNew(req, res, next)

      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)

      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)

      expect(error.message).toContain('Email is invalid.')
    })
  })

  describe('verifyAccount()', () => {
    it('should call next() when validation passes', async () => {
      const req = {
        body: { email: 'test@example.com', token: 'valid-token' }
      }

      const res = {}
      const next = jest.fn()

      await userValidation.verifyAccount(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should call next() with an error when validation fails', async () => {
      const req = {
        body: { email: 'invalid-email', token: '' }
      }

      const res = {}
      const next = jest.fn()

      await userValidation.verifyAccount(req, res, next)

      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)

      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)

      expect(error.message).toContain('Email is invalid.')
    })

    it('should call next() with an error when token is missing', async () => {
      const req = {
        body: { email: 'test@ example.com' }
      }

      const res = {}
      const next = jest.fn()

      await userValidation.verifyAccount(req, res, next)
      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)

      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)

      expect(error.message).toMatch(/"token" is required/i)
    })
  })

  describe('login()', () => {
    it('should call next() when validation passes', async () => {
      const req = {
        body: { email: 'test@example.com', password: 'Password123!' }
      }
      const res = {}
      const next = jest.fn()

      await userValidation.login(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should call next() with an error when validation fails', async () => {
      const req = {
        body: { email: 'invalid-email', password: 'short' }
      }
      const res = {}
      const next = jest.fn()

      await userValidation.login(req, res, next)

      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(error.message).toMatch(/email is invalid/i)
    })

    it('should call next() with an error when password is missing', async () => {
      const req = {
        body: { email: 'wrong-email@example.com' }
      }
      const res = {}
      const next = jest.fn()

      await userValidation.login(req, res, next)

      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(error.message).toMatch(/"password" is required/i)
    })
  })

  describe('update()', () => {
    it('should call next() when validation passes', async () => {
      const req = {
        body: {
          displayName: 'New Name',
          currentPassword: 'CurrentPass123!',
          newPassword: 'NewPass123!'
        }
      }
      const res = {}
      const next = jest.fn()

      await userValidation.update(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
    })

    it('should call next() with an error when validation fails', async () => {
      const req = {
        body: {
          displayName: 'New Name',
          currentPassword: 'short',
          newPassword: 'short'
        }
      }
      const res = {}
      const next = jest.fn()

      await userValidation.update(req, res, next)
      const error = next.mock.calls[0][0]

      expect(error).toBeInstanceOf(ApiError)
      expect(error.statusCode).toBe(StatusCodes.UNPROCESSABLE_ENTITY)
      expect(error.message).toMatch(
        /include at least 1 letter, a number, and at least 8 characters/i
      )
    })
  })
})
