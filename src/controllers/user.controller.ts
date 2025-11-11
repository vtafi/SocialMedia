import { NextFunction, Request, Response } from 'express'
import User from '~/models/user.model'
import { ParamsDictionary } from 'express-serve-static-core'
import { UserService } from '~/services/user.service'
import {
  FollowUserRequestBody,
  ForgotPasswordRequestBody,
  LoginRequestBody,
  LogoutRequestBody,
  RegisterRequestBody,
  ResetPasswordRequestBody,
  TokenPayload,
  UnfollowRequestParams,
  UpdateMeRequestBody,
  VerifyEmailRequestBody,
  VerifyForgotPasswordRequestBody
} from '~/models/requests/user.requests'
import mongoose, { ObjectId } from 'mongoose'
import UserModel from '~/models/user.model'
import httpStatus from '~/constants/httpStatus'
import { userMessages } from '~/constants/messages'
import { UserVerifyStatus } from '~/constants/enum'
import { config } from 'dotenv'
import { pick } from 'lodash'
config()

export const loginController = async (req: Request<ParamsDictionary, any, LoginRequestBody>, res: Response) => {
  const { user }: any = req

  const user_id = user._id.toString()

  const result = await UserService.login({ user_id, verify: user.verify })

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
  if (user.verify === UserVerifyStatus.Verified) {
    return res.json({ message: userMessages.EMAIL_ALREADY_VERIFIED })
  }
  const result = await UserService.resendVerifyEmail(user_id)
  return res.json(result)
}

export const forgotPasswordController = async (
  req: Request<ParamsDictionary, any, ForgotPasswordRequestBody>,
  res: Response
) => {
  const { _id, verify } = req.user!
  if (!_id) {
    return res.status(401).json({ message: userMessages.USER_NOT_FOUND })
  }
  const user_id = _id.toString()
  const result = await UserService.forgotPassword({ user_id, verify })
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

export const refreshTokenController = async (req: Request, res: Response) => {
  try {
    const { refresh_token } = req.body

    // Call service
    const result = await UserService.refreshToken(refresh_token)

    // ✅ Success response
    return res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: result
    })
  } catch (error: any) {
    // ❌ Error responses (401, 404, 403)
    const status = error.status || 500
    const message = error.message || 'Internal server error'

    return res.status(status).json({
      success: false,
      message
    })
  }
}

export const getMeController = async (req: Request, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const user = await UserService.getMeProfile(user_id)
  return res.json({ message: userMessages.GET_ME_SUCCESSFULLY, result: user })
}

export const updateMeController = async (req: Request<ParamsDictionary, any, UpdateMeRequestBody>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const body = req.body
  const result = await UserService.updateMe(user_id, body)
  return res.json({ message: userMessages.UPDATE_ME_SUCCESSFULLY, result })
}

export const followUserController = async (
  req: Request<ParamsDictionary, any, FollowUserRequestBody>,
  res: Response
) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.body
  const result = await UserService.followUser(user_id, followed_user_id)
  return res.json(result)
}

export const unfollowUserController = async (req: Request<UnfollowRequestParams>, res: Response) => {
  const { user_id } = req.decoded_authorization as TokenPayload
  const { followed_user_id } = req.params
  const result = await UserService.unfollowUser(user_id, followed_user_id)
  return res.json(result)
}
