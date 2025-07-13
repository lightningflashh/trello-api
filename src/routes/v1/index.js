import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from '~/routes/v1/boardRoute'
import { columnRoute } from '~/routes/v1/columnRoute'
import { cardRoute } from '~/routes/v1/cardRoute'
import { userRoute } from '~/routes/v1/userRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'API is running smoothly',
    timestamp: new Date().toISOString()
  })
})

Router.use('/boards', boardRoute)

Router.use('/columns', columnRoute)

Router.use('/cards', cardRoute)

Router.use('/users', userRoute)

export const APIs_V1 = Router