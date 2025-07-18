import { StatusCodes } from 'http-status-codes'
import { invitationService } from '~/services/invitationService'

const createNewBoardInvitation = async (req, res, next) => {
  try {
    // User thực hiện request này chính là Inviter – người đi mời
    const inviterId = req.jwtDecoded._id
    const resInvitation = await invitationService.createNewBoardInvitation(req.body, inviterId)

    res.status(StatusCodes.CREATED).json(resInvitation)
  } catch (error) { next(error) }
}

const getInvitations = async (req, res, next) => {
  try {
    // Chưa có logic gì ở đây, chỉ cần trả về danh sách các invitation của người dùng
    // Thực hiện lấy từ DB và trả về thôi.
    const invitations = await invitationService.getInvitations(req.jwtDecoded._id)
    res.status(StatusCodes.OK).json(invitations)
  } catch (error) { next(error) }
}

const updateBoardInvitation = async (req, res, next) => {
  try {
    const { invitationId } = req.params
    const userId = req.jwtDecoded._id
    const { status } = req.body
    const updatedInvitation = await invitationService.updateBoardInvitation(userId, invitationId, status)

    res.status(StatusCodes.OK).json(updatedInvitation)
  } catch (error) { next(error) }
}

export const invitationController = {
  createNewBoardInvitation,
  getInvitations,
  updateBoardInvitation
}
