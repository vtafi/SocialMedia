import { Router } from 'express'
import {
  loginController,
  registerController,
  searchByEmailController,
  updateUserController
} from '~/controllers/users.controllers'
import { loginValidator, registerValidator } from '~/middlewares/users.middlewares'
import { wrapAsync } from '~/utils/handlers'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, wrapAsync(loginController))
usersRouter.post('/register', registerValidator, wrapAsync(registerController))
usersRouter.post('/find', searchByEmailController)
usersRouter.put('/update/:id', updateUserController)
export default usersRouter
