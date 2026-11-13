import { StatusCodes } from 'http-status-codes'
import { describe, it, expect, jest } from '@jest/globals'

import ApiError from '~/utils/ApiError'

describe('ApiError', () => {
  it('Consructor should set statusCode and message properties', () => {
    const statusCode = StatusCodes.BAD_REQUEST
    const message = 'Bad Request'
    const error = new ApiError(statusCode, message)

    expect(error.statusCode).toBe(statusCode)
    expect(error.message).toBe(message)
  })

  it('should be an instance of Error and ApiError', () => {
    const error = new ApiError(StatusCodes.BAD_REQUEST, 'Bad Request')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ApiError)
  })

  it('should have stack trace', () => {
    const error = new ApiError(StatusCodes.GONE, 'Gone')

    expect(typeof error.stack).toBe('string')
    expect(error.stack).toContain('ApiError')
  })

  it('should have the static BadRequest method that returns an ApiError instance', () => {
    const error = ApiError.BadRequest('Custom Bad Request Message')
    expect(error).toBeInstanceOf(ApiError)
    expect(error.statusCode).toBe(StatusCodes.BAD_REQUEST)
    expect(error.message).toBe('Custom Bad Request Message')
  })

  it('should have the name property set to \'ApiError\'', () => {
    const error = new ApiError(StatusCodes.BAD_REQUEST, 'Bad Request')
    expect(error.name).toBe('ApiError')
  })
})
