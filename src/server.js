/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1/index.js'


const START_SERVER = () => {
  const app = express()

  // Middleware to parse JSON request bodies
  app.use(express.json())

  app.use('/v1', APIs_V1)

  app.listen(env.APP_PORT, env.APP_HOST, async () => {
    console.log(`Running at ${env.APP_HOST}:${env.APP_PORT}/`)
  })

  exitHook(() => {
    CLOSE_DB()
  })
}

(async () => {
  try {
    await CONNECT_DB()
    console.log('Database connected successfully')
    START_SERVER()
    console.log('Server started successfully')
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(0)
  }
})()
