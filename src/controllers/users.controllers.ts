import { NextFunction, Request, Response } from 'express'
import User from '~/models/users.model'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserService } from '~/services/users.services'
import { RegisterRequestBody } from '~/models/requests/users.requests'
import { ObjectId } from 'mongoose'

export const loginController = async (req: Request, res: Response) => {
  const { user }: any = req

  const user_id = user._id

  const result = await UserService.login(user_id)

  return res.json({ message: 'Login successful', result })
}

export const registerController = async (
  req: Request<ParamsDictionary, any, RegisterRequestBody>,
  res: Response,
  next: NextFunction
) => {
  const existedEmail = await UserService.findByEmail(req.body.email)
  if (existedEmail) {
    return res.status(400).json({ message: 'Email already in use' })
  }
  const newUser = await UserService.register(req.body)
  return res.status(201).json({ message: 'User registered successfully', newUser })
}

export const logoutController = async (req: Request, res: Response) => {
  // Implement logout logic here
  res.status(200).json({ message: 'Logout successful' })
}

export const searchByEmailController = async (req: Request, res: Response) => {
  const email = req.body.email
  try {
    const user = await UserService.findByEmail(email)
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }
    console.log('Found user:', user)
    return res.json({ user })
  } catch (error) {
    console.error('Search error:', error)
    return res.status(500).json({
      message: 'Error searching user',
      error: error instanceof Error ? error.message : error
    })
  }
}

export const updateUserController = async (req: Request, res: Response) => {
  const userId = req.params.id
  const updateData = req.body
  try {
    const updateUser = await UserService.updateUser(userId, updateData)
    if (!updateUser) {
      return res.status(404).json({ message: 'User not found' })
    }
    return res.json({ message: 'User updated successfully', user: updateUser })
  } catch (error) {
    console.error('Update error:', error)
    return res.status(500).json({
      message: 'Error updating user',
      error: error instanceof Error ? error.message : error
    })
  }
}
