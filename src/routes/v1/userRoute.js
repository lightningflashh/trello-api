import express from 'express'
import { userValidation } from '~/validations/userValidation'
import { userController } from '~/controllers/userController'
import { authMiddleware } from '~/middlewares/authMiddleware'
import { multerUploadMiddleware } from '~/middlewares/multerUploadMiddleware'
import passport from '~/config/passport'

const Router = express.Router()

Router.route('/register').post(
  userValidation.createNew,
  userController.createNew
)

Router.route('/verify').put(
  userValidation.verifyAccount,
  userController.verifyAccount
)

Router.route('/login').post(userValidation.login, userController.login)

Router.route('/logout').delete(userController.logout)

Router.route('/refresh_token').get(userController.refreshToken)

Router.route('/update').put(
  authMiddleware.isAuthorized,
  multerUploadMiddleware.upload.single('avatar'), // FE đặt khóa như nào thì ở đây như vậy
  userValidation.update,
  userController.update
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
  userController.loginWithGoogle
)

Router.route('/current').get(
  authMiddleware.isAuthorized,
  userController.getCurrentUser
)

export const userRoute = Router
