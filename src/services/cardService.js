import { attachmentModel } from '~/models/attachmentModel'
import { cardModel } from '~/models/cardModel'
import { columnModel } from '~/models/columnModel'
import { CloudinaryProvider } from '~/providers/CloudinaryProvider'

const createNew = async (reqBody) => {
  try {
    const newCard = {
      ...reqBody
    }

    const createdCard = await cardModel.createNew(newCard)
    const getNewCard = await cardModel.findOneById(createdCard.insertedId)

    if (getNewCard) {
      await columnModel.pushCardToColumn(getNewCard)
    }

    return getNewCard
  } catch (error) {
    throw error
  }
}

const update = async (cardId, reqBody, cardCoverFile, infoJwtDecoded) => {
  try {
    const updateData = { ...reqBody, updatedAt: Date.now() }
    let updatedCard = {}
    if (cardCoverFile) {
      const uploadResult = await CloudinaryProvider.streamUpload(
        cardCoverFile.buffer,
        'card-covers'
      )
      updatedCard = await cardModel.update(cardId, {
        cover: uploadResult.secure_url
      })
    } else if (updateData.commentToAdd) {
      // Tạo dữ liệu comment để thêm vào db
      const commentData = {
        ...updateData.commentToAdd,
        commentedAt: Date.now(),
        userId: infoJwtDecoded._id,
        userEmail: infoJwtDecoded.email
      }
      updatedCard = await cardModel.unshiftNewComment(cardId, commentData)
    } else if (updateData.incomingMemberInfo) {
      // TH ADD hoặc REMOVE thành viên vào Card
      updatedCard = await cardModel.updateMembers(
        cardId,
        updateData.incomingMemberInfo
      )
    } else {
      updatedCard = await cardModel.update(cardId, updateData)
    }
    return updatedCard
  } catch (error) {
    throw error
  }
}

const attachFileToCard = async (cardId, file, infoJwtDecoded) => {
  try {
    const uploadResult = await CloudinaryProvider.streamUpload(
      file.buffer,
      'card-attachments'
    )

    const attachmentData = {
      cardId,
      fileName: file.originalname,
      storageKey: uploadResult.public_id,
      fileUrl: uploadResult.secure_url,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: infoJwtDecoded._id
    }

    const createdAttachment = await attachmentModel.createNew(attachmentData)

    return createdAttachment
  } catch (error) {
    throw error
  }
}

const getAttachmentsByCardId = async (cardId, queryParams = {}) => {
  try {
    const { cursor, limit } = queryParams

    const result = await attachmentModel.findByCardIdWithPagination(cardId, {
      cursor,
      limit
    })

    return result
  } catch (error) {
    throw error
  }
}

export const cardService = {
  createNew,
  update,
  attachFileToCard,
  getAttachmentsByCardId
}
