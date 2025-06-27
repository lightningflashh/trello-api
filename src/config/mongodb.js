import { MongoClient, ServerApiVersion } from 'mongodb'
import { env } from '~/config/environment'

let trelloDatabaseInstance = null

const mongoClientInstance = new MongoClient(env.MONGODB_URI, {
  // serverApi works with MongoDB 5.0 and later
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
})

export const CONNECT_DB = async () => {
  if (trelloDatabaseInstance) {
    return trelloDatabaseInstance
  }

  try {
    await mongoClientInstance.connect()
    trelloDatabaseInstance = mongoClientInstance.db(env.DATABASE_NAME)
    return trelloDatabaseInstance
  } catch (error) {
    console.error('Error connecting to MongoDB:', error)
    throw error
  }
}

export const GET_DB = () => {
  if (!trelloDatabaseInstance) throw new Error('Database not connected. Call CONNECT_DB first.')
  return trelloDatabaseInstance
}

export const CLOSE_DB = async () => {
  if (mongoClientInstance && mongoClientInstance.isConnected()) {
    await mongoClientInstance.close()
  }
}