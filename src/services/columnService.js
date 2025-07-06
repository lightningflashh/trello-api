/* eslint-disable no-useless-catch */
import { columnModel } from '~/models/columnModel'
import { cardModel } from '~/models/cardModel'
import { boardModel } from '~/models/boardModel'
import ApiError from '~/utils/ApiError'
import { StatusCodes } from 'http-status-codes'

const createNew = async (reqBody) => {
  try {
    const newColumn = {
      ...reqBody
    }

    const createdColumn = await columnModel.createNew(newColumn)
    const getNewColumn = await columnModel.findOneById(createdColumn.insertedId)

    if (getNewColumn) {
      getNewColumn.cards = []

      await boardModel.pushColumnToBoard(getNewColumn)
    }

    return getNewColumn
  } catch (error) { throw error }
}

const update = async (columnId, reqBody) => {
  try {
    const updatedColumn = {
      ...reqBody,
      updatedAt: Date.now()
    }

    return await columnModel.update(columnId, updatedColumn)
  } catch (error) {
    throw error
  }
}

const deleteItem = async (columnId) => {
  try {
    // Check if the column exists
    const column = await columnModel.findOneById(columnId)
    if (!column) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Column not found')
    }
    // Delete the column
    await columnModel.deleteOneById(columnId)

    // Delete all cards associated with this column
    await cardModel.deleteManyByColumnId(columnId)

    // Remove the column from the board's columnOrderIds array
    await boardModel.pullColumnFromBoard(column)

    return { deleteResult: 'Column deleted successfully' }
  } catch (error) {
    throw error
  }
}
export const columnService = {
  createNew,
  update,
  deleteItem
}