import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, jest } from '@jest/globals'
import ApiError from '~/utils/ApiError.js'

import { errorHandlingMiddleware } from '~/middlewares/errorHandlingMiddleware.js'

describe('errorHandlingMiddleware', () => {
  it('Case Base: ApiError > return statusCode, message, stack', () => {
    // Mock Response of ExpressJS
    const res = {
      status: jest.fn().mockReturnThis(), // allow chaining of .json() after .status()
      json: jest.fn().mockReturnThis()
    } // Example: status(400).json({ message: "Bad Request" })

    // Create instance of ApiError
    const error = ApiError.BadRequest('Custom Bad Request Message')

    // Call the middleware with the error
    errorHandlingMiddleware(error, {}, res, () => {})

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Custom Bad Request Message'
    })
  })

  it('Case Unknown Error: return statusCode 500, message, stack', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    const error = new Error('Unknown Error')

    errorHandlingMiddleware(error, {}, res, () => {})

    expect(res.status).toHaveBeenCalledWith(500)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      message: 'Unknown Error'
    })
  })

  it('Case No Message: return statusCode, default message, stack', () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    }

    const error = ApiError.BadRequest()

    errorHandlingMiddleware(error, {}, res, () => {})

    expect(res.status).toHaveBeenCalledWith(400)
    expect(res.json).toHaveBeenCalledWith({
      statusCode: StatusCodes.BAD_REQUEST,
      message: 'Bad Request'
    })
  })
})
