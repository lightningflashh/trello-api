import Joi from 'joi'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'
import { BOARD_TYPES } from '~/utils/constants'

const createNew = async (req, res, next) => {
  const correctValidation = Joi.object({
    title: Joi.string().min(3).max(50).required().trim().strict().messages({
      'string.base': 'Title must be a string',
      'string.empty': 'Title cannot be empty',
      'string.min': 'Title must be at least {#limit} characters long',
      'string.max': 'Title must be at most {#limit} characters long',
      'string.trim': 'Title cannot have leading or trailing spaces',
      'any.required': 'Title is required'
    }),
    description: Joi.string().min(5).max(256).required().trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required()
  })

  try {
    // abortEarly: false allows all validation errors to be returned
    // This means that if there are multiple validation errors, they will all be returned
    await correctValidation.validateAsync(req.body, { abortEarly: false })
    next() // Proceed to the next middleware or controller if validation passes
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }

}

const update = async (req, res, next) => {
  const correctValidation = Joi.object({
    title: Joi.string().min(3).max(50).trim().strict(),
    description: Joi.string().min(5).max(256).trim().strict(),
    type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE)
  })

  try {
    await correctValidation.validateAsync(req.body, {
      abortEarly: false,
      allowUnknown: true
    })
    next()
  } catch (error) {
    next(new ApiError(StatusCodes.UNPROCESSABLE_ENTITY, new Error(error).message))
  }

}

export const boardValidation = {
  createNew, update
}

