import express from 'express'
import cors from 'cors'
import { APIs_V1 } from '~/routes/v1/index.js'
import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware'
import { corsOptions } from './config/cors'
import cookieParser from 'cookie-parser'
import socketIo from 'socket.io'
import http from 'http'
import { inviteUserToBoardSocket } from '~/sockets/inviteUserToBoardSocket'
import passport from '~/config/passport'

export const createApp = () => {
  const app = express()

  app.set('trust proxy', true)

  app.disable('etag')

  app.use((_req, res, next) => {
    res.set('Cache-Control', 'no-store, must-revalidate, no-cache')
    res.set('Pragma', 'no-cache')
    res.set('Expires', '0')

    next()
  })

  app.use(cookieParser())

  app.use((req, res, next) => {
    const isGoogleOAuthRoute = [
      '/v1/users/auth/google',
      '/v1/users/auth/google/callback',
      '/health'
    ].includes(req.path)

    if (isGoogleOAuthRoute) {
      return next()
    }

    return cors(corsOptions)(req, res, next)
  })

  // Middleware to parse JSON request bodies
  app.use(express.json())

  app.use(passport.initialize())

  app.use('/v1', APIs_V1)

  app.get('/health', (_req, res) => res.json({ status: 'ok' }))

  // Middleware to handle errors
  app.use(errorHandlingMiddleware)

  return app
}

export const createServer = () => {
  const app = createApp()
  const server = http.createServer(app)
  const io = socketIo(server, { cors: corsOptions })

  io.on('connection', (socket) => {
    inviteUserToBoardSocket(socket)
  })

  return server
}
