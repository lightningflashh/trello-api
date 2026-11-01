import Joi from 'joi'
import { ObjectId } from 'bson'

import { GET_DB } from '~/config/mongodb'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE } from '~/utils/validators'

// Define Collection
const ATTACHMENT_COLLECTION_NAME = 'attachments'

const ATTACHMENT_COLLECTION_SCHEMA = Joi.object({
  cardId: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  uploadedBy: Joi.string()
    .required()
    .pattern(OBJECT_ID_RULE)
    .message(OBJECT_ID_RULE_MESSAGE),

  fileName: Joi.string().required().trim(),

  storageKey: Joi.string().required(),

  mimeType: Joi.string().required(),

  size: Joi.number().integer().min(0).required(),

  fileUrl: Joi.string().uri().required(),

  createdAt: Joi.date().timestamp('javascript').default(Date.now),

  updatedAt: Joi.date().timestamp('javascript').default(null),

  _destroy: Joi.boolean().default(false)
})

const validateAttachment = async (data) => {
  return await ATTACHMENT_COLLECTION_SCHEMA.validateAsync(data, {
    abortEarly: false
  })
}

/**

* Create a new attachment.
  */
const createNew = async (data) => {
  const validatedData = await validateAttachment(data)

  const attachmentToAdd = {
    ...validatedData,
    cardId: new ObjectId(String(validatedData.cardId)),
    uploadedBy: new ObjectId(String(validatedData.uploadedBy))
  }

  return await GET_DB()
    .collection(ATTACHMENT_COLLECTION_NAME)
    .insertOne(attachmentToAdd)
}

/**

* Find attachments belonging to a card.
  */
const findByCardId = async (cardId) => {
  return await GET_DB()
    .collection(ATTACHMENT_COLLECTION_NAME)
    .find({
      cardId: new ObjectId(String(cardId)),
      _destroy: false
    })
    .sort({ createdAt: -1 })
    .toArray()
}

/**

* Find one attachment by ID.
  */
const findOneById = async (attachmentId) => {
  return await GET_DB()
    .collection(ATTACHMENT_COLLECTION_NAME)
    .findOne({
      _id: new ObjectId(String(attachmentId)),
      _destroy: false
    })
}

/**

* Delete an attachment by ID.
  */
const deleteOneById = async (attachmentId) => {
  return await GET_DB()
    .collection(ATTACHMENT_COLLECTION_NAME)
    .deleteOne({
      _id: new ObjectId(String(attachmentId))
    })
}

const findByCardIdWithPagination = async (
  cardId,
  { cursor, limit = 10 } = {}
) => {
  try {
    const query = {
      cardId: new ObjectId(String(cardId)),
      _destroy: false
    }

    // Nếu có cursor, lấy các bản ghi có _id nhỏ hơn cursor (cũ hơn)
    if (cursor) {
      query._id = { $lt: new ObjectId(String(cursor)) }
    }

    const limitNum = parseInt(limit, 10) || 10

    // Driver thuần cần dùng .toArray() để lấy dữ liệu từ cursor
    const attachments = await GET_DB()
      .collection(ATTACHMENT_COLLECTION_NAME)
      .find(query)
      .sort({ _id: -1 }) // Mới nhất lên đầu
      .limit(limitNum + 1) // Lấy dư 1 item để check hasMore
      .toArray()

    let hasMore = false
    if (attachments.length > limitNum) {
      hasMore = true
      attachments.pop() // Xóa item thừa dùng để check
    }

    const nextCursor =
      attachments.length > 0 ? attachments[attachments.length - 1]._id : null

    return {
      data: attachments,
      pagination: {
        nextCursor,
        hasMore
      }
    }
  } catch (error) {
    throw error
  }
}

export const attachmentModel = {
  ATTACHMENT_COLLECTION_NAME,
  ATTACHMENT_COLLECTION_SCHEMA,
  createNew,
  findByCardId,
  findOneById,
  deleteOneById,
  findByCardIdWithPagination
}
