import { Router } from 'express'
import {
  deleteConversationController,
  getConversationMessagesController,
  getOrCreateConversationController,
  getUserConversationsController,
  markMessagesAsReadController,
  searchUsersController
} from '~/controllers/chat.controller'
import { accessTokenValidator } from '~/middlewares/user.middlewares'
import { wrapAsync } from '~/utils/handler'

const chatRouter = Router()

// Tất cả routes chat yêu cầu authentication
chatRouter.use(accessTokenValidator)

// Tìm kiếm users để chat
chatRouter.get('/users/search', wrapAsync(searchUsersController))

// Lấy tất cả conversations của user hiện tại
chatRouter.get('/conversations', wrapAsync(getUserConversationsController))

// Tạo hoặc lấy conversation với user khác
chatRouter.post('/conversations', wrapAsync(getOrCreateConversationController))

// Lấy messages của một conversation
chatRouter.get('/conversations/:conversationId/messages', wrapAsync(getConversationMessagesController))

// Đánh dấu messages là đã đọc
chatRouter.patch('/conversations/:conversationId/read', wrapAsync(markMessagesAsReadController))

// Xóa conversation
chatRouter.delete('/conversations/:conversationId', wrapAsync(deleteConversationController))

export default chatRouter
