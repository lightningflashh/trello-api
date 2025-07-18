import Joi from 'joi'
import { OBJECT_ID_RULE, OBJECT_ID_RULE_MESSAGE, EMAIL_RULE, EMAIL_RULE_MESSAGE } from '~/utils/validators'
import { GET_DB } from '~/config/mongodb'
import { ObjectId } from 'bson'
import { CARD_MEMBER_ACTIONS } from '~/utils/constants'

// Define Collection (name & schema)
const CARD_COLLECTION_NAME = 'cards'
const CARD_COLLECTION_SCHEMA = Joi.object({
  boardId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
  columnId: Joi.string().required().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),

  title: Joi.string().required().min(3).max(50).trim().strict(),
  description: Joi.string().optional(),

  cover: Joi.string().default(null),
  memberIds: Joi.array().items(
    Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE)
  ).default([]),
  /* Dữ liệu comments của Card chúng ta sẽ học cách nhúng – embedded vào bản ghi Card luôn như dưới đây */
  comments: Joi.array().items({
    userId: Joi.string().pattern(OBJECT_ID_RULE).message(OBJECT_ID_RULE_MESSAGE),
    userEmail: Joi.string().pattern(EMAIL_RULE).message(EMAIL_RULE_MESSAGE),
    userAvatar: Joi.string(),
    userDisplayName: Joi.string(),
    content: Joi.string(),
    /* Chỗ này lưu ý vì dùng hàm $push để thêm comment nên không set default Date.now luôn giống hàm insertOne khi create được. */
    commentedAt: Joi.date().timestamp()
  }).default([]),

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

/**
 * Đẩy một phần tử comment vào đầu mảng comments!
 * - Trong JS, ngược lại với push (thêm phần tử vào cuối mảng) sẽ là unshift (thêm phần tử vào đầu mảng)
 * - Nhưng trong mongodb hiện tại chỉ có $push - mặc định đẩy phần tử vào cuối mảng.
 * - Vẫn dùng $push, nhưng bọc data vào Array để trong $each và chỉ định $position: 0
 */
const unshiftNewComment = async (cardId, commentData) => {
  try {
    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(cardId)) },
      { $push: { comments: { $each: [commentData], $position: 0 } } },
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}

/*
  Hàm này sẽ có nhiệm vụ xử lý cập nhật thêm hoặc xóa member khỏi card dựa theo Action
  Sẽ sử dụng $push để thêm hoặc $pull để loại bỏ ($pull trong mongodb để lấy một phần tử ra khỏi mảng rồi xóa nó đi)
*/
const updateMembers = async (cardId, incomingMemberInfo) => {
  try {
    // Tạo ra một biến updateCondition ban đầu là rỗng
    let updateCondition = {}
    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.ADD) {
      // console.log('Trường hợp Add, dùng $push: ', incomingMemberInfo)
      updateCondition = { $push: { memberIds: new ObjectId(String(incomingMemberInfo.userId)) } }
    }
    if (incomingMemberInfo.action === CARD_MEMBER_ACTIONS.REMOVE) {
      // console.log('Trường hợp Remove, dùng $pull: ', incomingMemberInfo)
      updateCondition = { $pull: { memberIds: new ObjectId(String(incomingMemberInfo.userId)) } }
    }

    const result = await GET_DB().collection(CARD_COLLECTION_NAME).findOneAndUpdate(
      { _id: new ObjectId(String(cardId)) },
      updateCondition, // truyền cái updateCondition ở đây
      { returnDocument: 'after' }
    )
    return result
  } catch (error) { throw new Error(error) }
}


export const cardModel = {
  CARD_COLLECTION_NAME,
  CARD_COLLECTION_SCHEMA,
  createNew,
  findOneById,
  update,
  deleteManyByColumnId,
  unshiftNewComment,
  updateMembers
}