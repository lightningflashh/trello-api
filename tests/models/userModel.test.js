import { ObjectId } from 'mongodb'
import { GET_DB } from '~/config/mongodb'
import { EMAIL_RULE_MESSAGE } from '~/utils/validators'
import { userModel } from '~/models/userModel'
import {
  describe,
  beforeEach,
  it,
  expect,
  jest,
  beforeAll
} from '@jest/globals'

jest.mock('~/config/mongodb', () => ({
  GET_DB: jest.fn()
}))

describe('User Model', () => {
  const validId = '507f1f77bcf86cd799439011'
  const insertOne = jest.fn()
  const findOne = jest.fn()
  const findOneAndUpdate = jest.fn()

  beforeAll(() => {
    GET_DB.mockReturnValue({
      collection: jest.fn().mockReturnValue({
        insertOne,
        findOne,
        findOneAndUpdate
      })
    })
  })

  describe('findOneById()', () => {
    it('should return a user when a valid ID is provided', async () => {
      const mockUser = {
        _id: validId,
        username: 'testuser',
        email: 'testuser@gmail.com'
      }
      findOne.mockResolvedValue(mockUser)

      const result = await userModel.findOneById(validId)

      expect(GET_DB).toHaveBeenCalled()
      expect(findOne).toHaveBeenCalledWith({
        _id: new ObjectId(validId)
      })
      /**
       * findOne.mock.calls is an array of all the calls made to the findOne function.
       * [0] is the first call, and [0][0] is the first argument of that call.
       */
      const resultId = findOne.mock.calls[0][0]
      expect(resultId).toEqual({ _id: new ObjectId(validId) })
      expect(result).toEqual(mockUser)
    })

    it('should throw an error when an invalid ID is provided', async () => {
      const invalidId = 'invalid-id'

      await expect(userModel.findOneById(invalidId)).rejects.toThrow(
        'BSONError: input must be a 24 character hex string, 12 byte Uint8Array, or an integer'
      )
    })
  })

  describe('createNew()', () => {
    const validUserData = {
      email: 'testuser@gmail.com',
      password: '123456',
      username: 'testuser',
      displayName: 'Test User'
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should create a new user with valid data', async () => {
      const mockResult = {
        acknowledged: true,
        insertedId: new ObjectId(validId)
      }

      insertOne.mockResolvedValue(mockResult)

      const result = await userModel.createNew(validUserData)

      expect(GET_DB).toHaveBeenCalled()
      expect(insertOne).toHaveBeenCalledWith(
        expect.objectContaining({
          ...validUserData,
          avatar: null,
          role: 'client',
          isActive: false,
          updatedAt: null,
          _destroy: false
        })
      )

      expect(result).toEqual(mockResult)
    })

    it('should apply default values when optional fields are omitted', async () => {
      insertOne.mockResolvedValue({
        acknowledged: true,
        insertedId: new ObjectId(validId)
      })

      await userModel.createNew(validUserData)

      const insertedUser = insertOne.mock.calls[0][0]

      expect(insertedUser.avatar).toBeNull()
      expect(insertedUser.role).toBe('client')
      expect(insertedUser.isActive).toBe(false)
      expect(insertedUser.updatedAt).toBeNull()
      expect(insertedUser._destroy).toBe(false)
      expect(insertedUser.createdAt).toEqual(expect.any(Number))
    })

    it('should throw an error when required fields are missing', async () => {
      const invalidData = {
        email: 'testuser@gmail.com',
        username: 'testuser'
      }

      await expect(userModel.createNew(invalidData)).rejects.toThrow()

      expect(insertOne).not.toHaveBeenCalled()
    })

    it('should throw an error when email is invalid', async () => {
      const invalidData = {
        ...validUserData,
        email: 'invalid-email'
      }

      await expect(userModel.createNew(invalidData)).rejects.toThrow(
        EMAIL_RULE_MESSAGE
      )

      expect(insertOne).not.toHaveBeenCalled()
    })

    it('should throw an error when database operation fails', async () => {
      insertOne.mockRejectedValue(new Error('Database error'))

      await expect(userModel.createNew(validUserData)).rejects.toThrow(
        'Database error'
      )
    })
  })

  describe('findOneByEmail()', () => {
    it('should return a user when a valid email is provided', async () => {
      const mockUser = {
        _id: validId,
        username: 'testuser',
        email: 'testuser@gmail.com'
      }
      findOne.mockResolvedValue(mockUser)

      const result = await userModel.findOneByEmail('testuser@gmail.com')

      expect(GET_DB).toHaveBeenCalled()
      expect(findOne).toHaveBeenCalledWith({
        email: 'testuser@gmail.com'
      })
      expect(result).toEqual(mockUser)
    })

    it('should return null when no user is found with the provided email', async () => {
      findOne.mockResolvedValue(null)

      const result = await userModel.findOneByEmail('testuser@gmail.com')

      expect(GET_DB).toHaveBeenCalled()
      expect(findOne).toHaveBeenCalledWith({
        email: 'testuser@gmail.com'
      })
      expect(result).toBeNull()
    })

    it('should throw an error when the database operation fails', async () => {
      const mockError = new Error('Database error')
      findOne.mockRejectedValue(mockError)

      await expect(
        userModel.findOneByEmail('testuser@gmail.com')
      ).rejects.toThrow('Database error')
    })
  })

  describe('update()', () => {
    const updateData = {
      username: 'updateduser',
      displayName: 'Updated User',
      email: 'updated@gmail.com'
    }

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should update a user with valid data', async () => {
      const mockUpdatedUser = {
        _id: new ObjectId(validId),
        ...updateData
      }

      findOneAndUpdate.mockResolvedValue(mockUpdatedUser)

      const result = await userModel.update(validId, { ...updateData })

      expect(GET_DB).toHaveBeenCalled()
      expect(findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(validId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
      expect(result).toEqual(mockUpdatedUser)
    })

    it('should remove invalid fields before updating', async () => {
      const data = {
        ...updateData,
        _id: 'another-id',
        boardId: 'board-id',
        createdAt: new Date()
      }

      findOneAndUpdate.mockResolvedValue({
        _id: new ObjectId(validId),
        ...updateData
      })

      await userModel.update(validId, data)

      expect(findOneAndUpdate).toHaveBeenCalledWith(
        { _id: new ObjectId(validId) },
        { $set: updateData },
        { returnDocument: 'after' }
      )
    })

    it('should return null when no user is found', async () => {
      findOneAndUpdate.mockResolvedValue(null)

      const result = await userModel.update(validId, { ...updateData })

      expect(result).toBeNull()
    })

    it('should throw an error when an invalid ID is provided', async () => {
      await expect(
        userModel.update('invalid-id', { ...updateData })
      ).rejects.toThrow()

      expect(findOneAndUpdate).not.toHaveBeenCalled()
    })

    it('should throw an error when database operation fails', async () => {
      findOneAndUpdate.mockRejectedValue(new Error('Database error'))

      await expect(
        userModel.update(validId, { ...updateData })
      ).rejects.toThrow('Database error')
    })
  })
})
