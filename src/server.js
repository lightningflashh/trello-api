/* eslint-disable no-console */
import express from 'express'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'


const START_SERVER = () => {
  const app = express()

  app.get('/', async (req, res) => {
    res.end('<h1>Hello World!</h1><hr>')
  })

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
