import { Request, Response } from 'express'
import User from '~/models/users.model'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserService } from '~/services/users.services'
import { RegisterRequestBody } from '~/models/requests/users.requests'

export const loginController = (req: Request, res: Response) => {
  if (req.body.email !== 'user@example.com' || req.body.password !== 'password') {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  return res.json({ message: 'User logged in' })
}

export const registerController = async (req: Request<ParamsDictionary, any, RegisterRequestBody>, res: Response) => {
  try {
    const existedEmail = await UserService.findByEmail(req.body.email)
    if (existedEmail) {
      return res.status(400).json({ message: 'Email already in use' })
    }
    const newUser = await UserService.register(req.body)
    return res.status(201).json({ message: 'User registered successfully', user: newUser })
  } catch (error) {
    console.error('Registration error:', error)
    return res.status(500).json({
      message: 'Error registering user',
      error: error instanceof Error ? error.message : error
    })
  }
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
