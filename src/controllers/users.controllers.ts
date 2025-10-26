import { NextFunction, Request, Response } from 'express'
import User from '~/models/users.model'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserService } from '~/services/users.services'
import {
  ForgotPasswordRequestBody,
  LoginRequestBody,
  LogoutRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  VerifyEmailRequestBody,
  VerifyForgotPasswordRequestBody
} from '~/models/requests/users.requests'
import mongoose, { ObjectId } from 'mongoose'
import UserModel from '~/models/users.model'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { UserVeryfyStatus } from '~/constants/enum'
import { config } from 'dotenv'
config()

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
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

export const logoutController = async (req: Request<ParamsDictionary, any, LogoutRequestBody>, res: Response) => {
  const { refresh_token } = req.body
  const result = await UserService.logout(refresh_token)

  res.status(200).json(result)
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

export const verifyEmailController = async (
  req: Request<ParamsDictionary, any, VerifyEmailRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_email_verify_token as TokenPayload
  const user = await UserModel.findOne({
    _id: new mongoose.Types.ObjectId(user_id)
  })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  if (user.email_verify_token === '') {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED })
  }
  const result = await UserService.verifyEmail(user_id)
  return res.json({
    message: userMessages.EMAIL_VERIFIED_SUCCESSFULLY,
    result
  })
}

export const resendVerifyEmailController = async (req: Request, res: Response, next: NextFunction) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await UserModel.findOne({ _id: new mongoose.Types.ObjectId(user_id) })
  if (!user) {
    return res.status(httpStatus.NOT_FOUND).json({ message: userMessages.USER_NOT_FOUND })
  }
  if (user.verify === UserVeryfyStatus.Verified) {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED })
  }
  const result = await UserService.resendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id } = req.user!
  if (!_id) {
    return res.status(401).json({ message: userMessages.USER_NOT_FOUND })
  }
  const user_id = _id.toString()
  const result = await UserService.forgotPassword(user_id)
  return res.json(result)
}

export const verifyForgotPasswordController = async (
  req: Request<ParamsDictionary, any, VerifyForgotPasswordRequestBody>,
  res: Response
) => {
  return res.json({ message: userMessages.FORGOT_PASSWORD_TOKEN_VERIFIED_SUCCESSFULLY })
}

export const resetPasswordController = async (
  req: Request<ParamsDictionary, any, ResetPasswordRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_forgot_password_token as TokenPayload
  const { password } = req.body
  const result = await UserService.resetPassword(user_id, password)
  return res.json(result)
}

export const oauthGoogleController = async (req: Request, res: Response) => {
  console.log(req.url)
  const { code } = req.query
  const { accessToken, refreshToken, newUser } = await UserService.oauthGoogle(code as string)
  const urlRedirect = `${process.env.CLIENT_URL}?access_token=${accessToken}&refresh_token=${refreshToken}&newUser=${newUser}`
  return res.redirect(urlRedirect)
}
