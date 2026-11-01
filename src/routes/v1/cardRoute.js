import express from 'express'
import { cardValidation } from '~/validations/cardValidation'
import { cardController } from '~/controllers/cardController'

import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'

const Router = express.Router()

Router.route('/:id/attachments').post(
  authMiddleware.isAuthorized,
  multerUploadMiddleware.upload.single('attachment'),
  cardController.attachFileToCard
)

Router.route('/').post(
  authMiddleware.isAuthorized,
  cardValidation.createNew,
  cardController.createNew
)

Router.route('/:id').put(
  authMiddleware.isAuthorized,
  multerUploadMiddleware.upload.single('cardCover'),
  cardValidation.update,
  cardController.update
)

Router.route('/:id/attachments').get(
  authMiddleware.isAuthorized,
  cardController.getAttachmentsByCardId
)

export const cardRoute = Router
