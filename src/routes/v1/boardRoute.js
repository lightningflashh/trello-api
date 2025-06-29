import express from 'express'
import { StatusCodes } from 'http-status-codes'
import { boardValidation } from '~/validations/boardValidation'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Board API is running smoothly',
      timestamp: new Date().toISOString()
    })
  })
  .post(boardValidation.createNew)

export const boardRoute = Router