import Joi from 'joi'

// Define the schema for a board
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  slug: Joi.string().min(3).required().trim().strict(),
  description: Joi.string().min(5).max(256).required().trim().strict(),
  columnOrderIds: Joi.array().items.items(Joi.string()).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now()),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroyed: Joi.boolean().default(false)
})

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA
}