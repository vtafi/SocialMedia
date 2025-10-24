import { Router } from 'express'
import {
  loginController,
  registerController,
  searchByEmailController,
  updateUserController,
  logoutController,
  verifyEmailController,
  resendVerifyEmailController
} from '~/controllers/users.controllers'
import {
  accessTokenValidator,
  emailVerifyTokenValidator,
  loginValidator,
  refreshTokenValidator,
  registerValidator
} from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const usersRouter = Router()

/*
  Description: Login a user
  Path: /users/login
  Method: POST
  Body: { email: string, password: string }
*/
usersRouter.post('/login', loginValidator, wrapAsync(loginController))

/*
  Description: Register a new user
  Path: /users/register
  Method: POST
  Body: { name: string, email: string, password: string, confirmPassword: string, date_of_birth: string }
*/
usersRouter.post('/register', registerValidator, wrapAsync(registerController))

/*
  Description: Logout a user
  Path: /users/logout
  Method: POST
  Headers: { Authorization: 'Bearer <access_token>' }
  Body: { refreshToken: string }
*/
usersRouter.post('/logout', accessTokenValidator, refreshTokenValidator, wrapAsync(logoutController))

/*
  Description: Verify email
  Path: verify-email
  Method: POST
  Body: { email_verify_token: string }
*/
usersRouter.post('/verify-email', emailVerifyTokenValidator, wrapAsync(verifyEmailController))

/*
  Description: Resend verify email
  Path: resend-verify-email
  Method: POST
  Headers: { Authorization: 'Bearer <access_token>' }
  Body: {  }
*/
usersRouter.post('/resend-verify-email', accessTokenValidator, wrapAsync(resendVerifyEmailController))

usersRouter.post('/find', searchByEmailController)
usersRouter.put('/update/:id', updateUserController)
export default usersRouter
