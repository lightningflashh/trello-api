import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardRoute } from '~/routes/v1/boardRoute'

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

export const APIs_V1 = Router