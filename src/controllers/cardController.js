import { StatusCodes } from 'http-status-codes'
import { cardService } from '~/services/cardService'

const createNew = async (req, res, next) => {
  try {
    const createdCard = await cardService.createNew(req.body)

    res.status(StatusCodes.CREATED).json(createdCard)
  } catch (error) {
    next(error)
  }
}

const update = async (req, res, next) => {
  try {
    const updatedCard = await cardService.update(
      req.params.id,
      req.body,
      req.file,
      req.jwtDecoded
    )
    res.status(StatusCodes.OK).json(updatedCard)
  } catch (error) {
    next(error)
  }
}

const attachFileToCard = async (req, res, next) => {
  try {
    const attachedFile = await cardService.attachFileToCard(
      req.params.id,
      req.file,
      req.jwtDecoded
    )
    res.status(StatusCodes.OK).json(attachedFile)
  } catch (error) {
    next(error)
  }
}

const getAttachmentsByCardId = async (req, res, next) => {
  try {
    const cardId = req.params.id
    const { cursor, limit } = req.query // Lấy cursor và limit từ query params (nếu có)

    // Truyền thêm req.query xuống service
    const result = await cardService.getAttachmentsByCardId(cardId, {
      cursor,
      limit
    })

    res.status(StatusCodes.OK).json(result)
  } catch (error) {
    next(error)
  }
}

export const cardController = {
  createNew,
  update,
  attachFileToCard,
  getAttachmentsByCardId
}
