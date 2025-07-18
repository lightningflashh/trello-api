/* eslint-disable no-console */
import express from 'express'
import cors from 'cors'
import exitHook from 'async-exit-hook'
import { CONNECT_DB, CLOSE_DB } from '~/config/mongodb'
import { env } from '~/config/environment'
import { APIs_V1 } from '~/routes/v1/index.js'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'

const START_SERVER = () => {
  const app = express()

  app.use((req, res, next) => {
    res.set('Cache-Control', 'no-store')
    next()
  })

  app.use(cookieParser())

  app.use(cors(corsOptions))

  // Middleware to parse JSON request bodies
  app.use(express.json())

  app.use('/v1', APIs_V1)

  // Middleware to handle errors
  app.use(errorHandlingMiddleware)

  // Create a server instance
  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })
  io.on('connection', socket => {
    inviteUserToBoardSocket(socket)
  })

  if (env.BUILD_MODE === 'production') {
    // Dùng server.listen() thay vì app.listen() vì server đã gồm cả app và socket.io
    server.listen(process.env.PORT, () => {
      console.log(`Running at production port ${process.env.PORT}`)
    })
  } else {
    server.listen(env.LOCAL_DEV_APP_PORT, env.LOCAL_DEV_APP_HOST, async () => {
      console.log(`Running at ${env.LOCAL_DEV_APP_HOST}:${env.LOCAL_DEV_APP_PORT}/`)
    })
  }

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
