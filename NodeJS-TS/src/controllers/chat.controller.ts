import { Request, Response, NextFunction } from 'express'
import { TokenPayload } from '~/models/requests/User.requests'
import { ChatService } from '~/services/chat.service'

export const getOrCreateConversationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { targetUserId } = req.body

    const conversation = await ChatService.getOrCreateConversation(user_id, targetUserId)

    return res.json({
      message: 'Conversation retrieved successfully',
      data: conversation
    })
  } catch (error) {
    next(error)
  }
}

export const getUserConversationsController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const conversations = await ChatService.getUserConversations(user_id)

    return res.json({
      message: 'Conversations retrieved successfully',
      data: conversations
    })
  } catch (error) {
    next(error)
  }
}

export const getConversationMessagesController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params
    const { limit = 50, skip = 0 } = req.query

    const messages = await ChatService.getConversationMessages(conversationId, Number(limit), Number(skip))

    return res.json({
      message: 'Messages retrieved successfully',
      data: messages
    })
  } catch (error) {
    next(error)
  }
}

export const markMessagesAsReadController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { conversationId } = req.params

    await ChatService.markMessagesAsRead(conversationId, user_id)

    return res.json({
      message: 'Messages marked as read'
    })
  } catch (error) {
    next(error)
  }
}

export const searchUsersController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id } = req.decoded_authorization as TokenPayload
    const { search = '', role } = req.query

    const users = await ChatService.searchUsersToChat(
      user_id,
      search as string,
      role ? Number(role) : undefined
    )

    return res.json({
      message: 'Users retrieved successfully',
      data: users
    })
  } catch (error) {
    next(error)
  }
}

export const deleteConversationController = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { conversationId } = req.params

    await ChatService.deleteConversation(conversationId)

    return res.json({
      message: 'Conversation deleted successfully'
    })
  } catch (error) {
    next(error)
  }
}
