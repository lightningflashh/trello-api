import Joi from 'joi'
import { ObjectId } from 'bson'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { BOARD_TYPES } from '~/utils/constants'
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'

// Define the schema for a board
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  slug: Joi.string().min(3).required().trim().strict(),
  description: Joi.string().min(5).max(256).required().trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroyed: Joi.boolean().default(false)
})
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBoard = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validatedData = await validateBoard(data)
    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne(validatedData)
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

// aggregate function to get board details
const getDetails = async (id) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      {
        $match: {
          _id: new ObjectId(String(id)),
          _destroyed: false
        }
      },
      {
        $lookup: {
          from: columnModel.COLUMN_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'columns'
        }
      },
      {
        $lookup: {
          from: cardModel.CARD_COLLECTION_NAME,
          localField: '_id',
          foreignField: 'boardId',
          as: 'cards'
        }
      }
    ]).toArray()
    return result[0] || null
  } catch (error) { throw new Error(error) }
}

const pushColumnToBoard = async (column) => {
  try {
    // Update the board to include the new column ID in the columnOrderIds array
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(column.boardId)) },
      { $push: { columnOrderIds: String(column._id) } },
      { returnDocument: 'after' } // 'after' returns the updated document
    )
  } catch (error) { throw new Error(error) }
}

const update = async (boardId, updateData) => {
  try {
    // Validate the update data against the schema
    Object.keys(updateData).forEach(field => {
      if (INVALID_UPDATE_FIELDS.includes(field)) {
        delete updateData[field]
      }
    })
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(boardId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnToBoard,
  update
}

