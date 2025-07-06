import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'bson'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),
  updatedAt: Joi.date().timestamp('javascript').default(null),
  _destroy: Joi.boolean().default(false)
})
const INVALID_UPDATE_FIELDS = ['_id', 'boardId', 'createdAt']

const validateCard = async (data) => {
  return await CARD_COLLECTION_SCHEMA.validateAsync(data, { abortEarly: false })
}

const createNew = async (data) => {
  try {
    const validatedData = await validateCard(data)
    return await GET_DB()
      .collection(CARD_COLLECTION_NAME)
      .insertOne({ ...validatedData, boardId: new ObjectId(String(validatedData.boardId)), columnId: new ObjectId(String(validatedData.columnId)) })
  } catch (error) { throw new Error(error) }
}

const findOneById = async (id) => {
  try {
    return await GET_DB().collection(CARD_COLLECTION_NAME).findOne({ _id: new ObjectId(String(id)) })
  } catch (error) { throw new Error(error) }
}

const update = async (cardId, updateData) => {
  try {
    // Validate the update data against the schema
    Object.keys(updateData).forEach(field => {
      if (INVALID_UPDATE_FIELDS.includes(field)) {
        delete updateData[field]
      }
    })

    if (updateData.columnId) {
      updateData.columnId = new ObjectId(String(updateData.columnId))
    }

    return await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(cardId)) },
      { $set: updateData },
      { returnDocument: 'after' }
    )
  } catch (error) { throw new Error(error) }
}

const deleteManyByColumnId = async (columnId) => {
  try {
    return await GET_DB().collection(CARD_COLLECTION_NAME).deleteMany({ columnId: new ObjectId(String(columnId)) })
  } catch (error) { throw new Error(error) }
}

export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteManyByColumnId
}