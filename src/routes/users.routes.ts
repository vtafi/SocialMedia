import { Router } from 'express'
import {
  loginController,
  registerController,
  searchByEmailController,
  updateUserController
} from '~/controllers/users.controllers'
import { loginValidator } from '~/middlewares/users.middlewares'

const usersRouter = Router()

usersRouter.post('/login', loginValidator, loginController)
usersRouter.post('/register', registerController)
usersRouter.post('/find', searchByEmailController)
usersRouter.put('/update/:id', updateUserController)
export default usersRouter
