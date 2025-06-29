import e from 'express'
import express from 'express'
import { StatusCodes } from 'http-status-codes'

const Router = express.Router()

Router.route('/')
  .get((req, res) => {
    res.status(StatusCodes.OK).json({
      message: 'Board API is running smoothly',
      timestamp: new Date().toISOString()
    })
  })
  .post((req, res) => {
    res.status(StatusCodes.CREATED).json({
      message: 'Board created successfully',
      timestamp: new Date().toISOString()
    })
  })

export const boardRoutes = Router