import Joi from 'joi'
import { StatusCodes } from 'http-status-codes'

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
    description: Joi.string().min(5).max(256).required().trim().strict()
  })

  try {
    console.log(req.body)

    // abortEarly: false allows all validation errors to be returned
    // This means that if there are multiple validation errors, they will all be returned
    await correctValidation.validateAsync(req.body, { abortEarly: false })

    // next()

    res.status(StatusCodes.CREATED).json({ message: 'Board created successfully from validation' })
  } catch (error) {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      errors: new Error(error).message
    })
  }

}
export const boardValidation = {
  createNew
}

