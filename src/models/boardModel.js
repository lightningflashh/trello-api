import Joi from 'joi'
import { ObjectId } from 'bson'
import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { BOARD_TYPES } from '~/utils/constants'

import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { userModel } from '~/models/userModel'

import { pagingSkipValue } from '~/utils/algorithms'

// Define the schema for a board
const BOARD_COLLECTION_NAME = 'boards'
const BOARD_COLLECTION_SCHEMA = Joi.object({
  title: Joi.string().min(3).max(50).required().trim().strict(),
  slug: Joi.string().min(3).required().trim().strict(),
  description: Joi.string().min(5).max(256).required().trim().strict(),
  type: Joi.string().valid(BOARD_TYPES.PUBLIC, BOARD_TYPES.PRIVATE).required(),
  columnOrderIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  ownerIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  memberIds: Joi.array().items(Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)).default([]),
  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroyed: Joi.boolean().default(false)
})
const INVALID_UPDATE_FIELDS = ['_id', 'createdAt']

const validateBoard = async (data) => {
  return await BOARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (userId, data) => {
  try {
    const validatedData = await validateBoard(data)
    return await GET_DB().collection(BOARD_COLLECTION_NAME).insertOne({
      ...validatedData,
      ownerIds: [new ObjectId(String(userId))]
    })
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

// aggregate function to get board details
const getDetails = async (userId, boardId) => {
  try {
    const queryCondition = [
      { _id: new ObjectId(String(boardId)) },
      { _destroyed: false },
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(String(userId))] } },
          { memberIds: { $all: [new ObjectId(String(userId))] } }
        ]
      }
    ]
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate([
      { $match: { $and: queryCondition } },
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
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'ownerIds',
          foreignField: '_id',
          as: 'owners',
          pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
        }
      },
      {
        $lookup: {
          from: userModel.USER_COLLECTION_NAME,
          localField: 'memberIds',
          foreignField: '_id',
          as: 'members',
          pipeline: [{ $project: { 'password': 0, 'verifyToken': 0 } }]
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

const pullColumnFromBoard = async (column) => {
  try {
    // Update the board to remove the column ID from the columnOrderIds array
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(column.boardId)) },
      { $pull: { columnOrderIds: String(column._id) } },
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
    if (updateData.columnOrderIds) {
      updateData.columnOrderIds = updateData.columnOrderIds.map(_id => new ObjectId(String(_id)))
    }
    return await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(boardId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

const getBoards = async (userId, page, itemsPerPage) => {
  try {
    const queryCondition = [
      // Điều kiện 01: Board chưa bị xóa
      { _destroyed: false },
      // client gửi request phải là 1 trong 2 mảng ownerIds hoặc memberIds của board, sử dụng $all của mongoDB
      {
        $or: [
          { ownerIds: { $all: [new ObjectId(String(userId))] } },
          { memberIds: { $all: [new ObjectId(String(userId))] } }
        ]
      }
    ]
    const query = await GET_DB().collection(BOARD_COLLECTION_NAME).aggregate(
      [
        { $match: { $and: queryCondition } },
        // Mặc định theo thứ tự bảng ASCII B sẽ nằm trước a => sử dụng collation bên dưới để fix
        { $sort: { title: 1 } },
        {
          $facet: {
            // Luồng 01: Query boards
            'queryBoards': [
              { $skip: pagingSkipValue(page, itemsPerPage) },
              { $limit: itemsPerPage }
            ],
            // Luồng 02: Query đếm tổng tất cả số lượng bản ghi trong db và trả về.
            'queryTotalBoards': [{ $count: 'countedAllBoards' }]
          }
        } // Xử lý nhiều luồng trong 1 query
      ],
      { collation: { locale: 'en' } }
    ).toArray()
    // console.log('query', query)

    const res = query[0]

    return {
      boards: res.queryBoards || [],
      totalBoards: res.queryTotalBoards[0]?.countedAllBoards || 0
    }
  } catch (error) { throw new Error(error) }
}

const pushMemberIds = async (boardId, userId) => {
  try {
    const result = await GET_DB().collection(BOARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(boardId)) },
      {
        $push: { memberIds: new ObjectId(String(userId)) }
      },
      { returnDocument: 'after' }
    )

    return result
  } catch (error) {
    throw new Error(error)
  }
}


export const boardModel = {
  BOARD_COLLECTION_NAME,
  BOARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  getDetails,
  pushColumnToBoard,
  pullColumnFromBoard,
  update,
  getBoards,
  pushMemberIds
}

