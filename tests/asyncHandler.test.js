import { asyncHandler } from '~/asyncHandler'

import { describe, it, expect, jest } from '@jest/globals'

describe('asyncHandler', () => {
  it('should call the handler and pass the request, response, and next function', async () => {
    const mockHandler = jest.fn().mockResolvedValue('Success')
    const mockReq = {}
    const mockRes = {}
    const mockNext = jest.fn()

    const wrappedHandler = asyncHandler(mockHandler)
    await wrappedHandler(mockReq, mockRes, mockNext)

    expect(mockHandler).toHaveBeenCalledWith(mockReq, mockRes, mockNext)
  })

  it('should call next with the error if the handler throws an error', async () => {
    const mockError = new Error('Test error')
    const mockHandler = jest.fn().mockRejectedValue(mockError)
    const mockReq = {}
    const mockRes = {}
    const mockNext = jest.fn()

    const wrappedHandler = asyncHandler(mockHandler)
    await wrappedHandler(mockReq, mockRes, mockNext)

    expect(mockNext).toHaveBeenCalledWith(mockError)
  })
})
