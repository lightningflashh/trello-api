import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import { asyncHandler } from '~/asyncHandler'
import passport from '~/config/passport'

const Router = express.Router()

Router.route('/register').post(
  userValidation.createNew,
  asyncHandler(userController.createNew)
)

Router.route('/verify').put(
  userValidation.verifyAccount,
  asyncHandler(userController.verifyAccount)
)

Router.route('/login').post(
  userValidation.login,
  asyncHandler(userController.login)
)

Router.route('/logout').delete(asyncHandler(userController.logout))

Router.route('/refresh_token').get(userController.refreshToken)

Router.route('/update').put(
  authMiddleware.isAuthorized,
  multerUploadMiddleware.upload.single('avatar'), // FE đặt khóa như nào thì ở đây như vậy
  userValidation.update,
  asyncHandler(userController.update)
)

// Redirect user to Google
Router.route('/auth/google').get(
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
)

// Google OAuth callback
Router.route('/auth/google/callback').get(
  passport.authenticate('google', {
    session: false
  }),
  asyncHandler(userController.loginWithGoogle)
)

Router.route('/current').get(
  authMiddleware.isAuthorized,
  asyncHandler(userController.getCurrentUser)
)

export const userRoute = Router
