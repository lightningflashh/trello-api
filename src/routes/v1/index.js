import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from '~/routes/v1/boardRoute'
import { columnRoute } from '~/routes/v1/columnRoute'
import { cardRoute } from '~/routes/v1/cardRoute'

const Router = express.Router()

Router.get('/status', (req, res) => {
  res.status(StatusCodes.OK).json({
    message: 'API is running smoothly',
    timestamp: new Date().toISOString()
  })
})

/**
 * Board Routes
 * @route /v1/boards
 * @description Handles all board-related operations
 */
Router.use('/boards', boardRoute)

Router.use('/columns', columnRoute)

Router.use('/cards', cardRoute)

export const APIs_V1 = Router