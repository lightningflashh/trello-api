import { describe, jest, it, expect, beforeEach } from '@jest/globals'
jest.mock('mongodb', () => {
  // Trả về một object class MongoClient thay thế cho package 'mongodb' thật
  return {
    MongoClient: jest.fn(() => ({
      connect: jest.fn().mockResolvedValue(undefined), // Không kết nối Database thật để tránh bị treo
      db: jest.fn(() => ({
        collection: jest.fn(() => ({ users: 'users' }))
      })),
      isConnected: jest.fn().mockReturnValue(true),
      close: jest.fn().mockResolvedValue(undefined)
    })),
    ServerApiVersion: {
      v1: '1'
    }
  }
})

describe('MongoDB Config', () => {
  const URI = 'mongodb://localhost:27017'

  beforeEach(() => {
    // Reset module state (để reset biến trelloDatabaseInstance)
    jest.resetModules()
    // Reset các mock trước mỗi test case
    jest.clearAllMocks()
  })

  it('should connect to the database and call 1 time the connect method', async () => {
    const { CONNECT_DB } = await import('~/config/mongodb')
    const { MongoClient } = await import('mongodb')
    await CONNECT_DB()
    await CONNECT_DB()

    expect(MongoClient).toHaveBeenCalledTimes(1)

    const mongoClient = MongoClient.mock.results[0].value

    expect(mongoClient.connect).toHaveBeenCalledTimes(1)
  })

  it('should return the database instance when calling GET_DB after CONNECT_DB', async () => {
    const { CONNECT_DB, GET_DB } = await import('~/config/mongodb')
    await CONNECT_DB()
    const dbInstance = GET_DB()

    expect(dbInstance).toBeDefined()
  })

  it('should throw an error when calling GET_DB before CONNECT_DB', async () => {
    const { GET_DB } = await import('~/config/mongodb')
    expect(() => GET_DB()).toThrow(
      'Database not connected. Call CONNECT_DB first.'
    )
  })

  it('should return users collection', async () => {
    const { CONNECT_DB, GET_DB } = await import('~/config/mongodb')

    await CONNECT_DB()

    const dbInstance = GET_DB()
    const usersCollection = dbInstance.collection('users')

    expect(usersCollection).toBeDefined()
  })

  it('should close MongoDB connection when connected', async () => {
    const { CONNECT_DB, CLOSE_DB } = await import('~/config/mongodb')
    const { MongoClient } = await import('mongodb')

    await CONNECT_DB()
    await CLOSE_DB()

    const mongoClient = MongoClient.mock.results[0].value

    expect(mongoClient.isConnected).toHaveBeenCalledTimes(1)
    expect(mongoClient.close).toHaveBeenCalledTimes(1)
  })

  it('should not close MongoDB connection when not connected', async () => {
    const { CONNECT_DB, CLOSE_DB } = await import('~/config/mongodb')
    const { MongoClient } = await import('mongodb')

    await CONNECT_DB()

    const mongoClient = MongoClient.mock.results[0].value
    mongoClient.isConnected.mockReturnValue(false)

    await CLOSE_DB()

    expect(mongoClient.isConnected).toHaveBeenCalledTimes(1)
    expect(mongoClient.close).not.toHaveBeenCalled()
  })
})
