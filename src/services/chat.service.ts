import { Schema } from 'mongoose'
import Conversation from '~/models/schemas/conversation.schema'
import Message from '~/models/schemas/message.schema'
import UserModel from '~/models/user.model'

const ObjectId = Schema.Types.ObjectId
export const ChatService = {
  // Tạo hoặc lấy conversation giữa 2 users
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    // Tìm conversation có cả 2 users
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [new ObjectId(user1Id), new ObjectId(user2Id)] },
      isActive: true
    })

    if (!conversation) {
      // Lấy thông tin users
      const [user1, user2] = await Promise.all([
        UserModel.findById(user1Id).select('name avatar'),
        UserModel.findById(user2Id).select('name avatar')
      ])

      if (!user1 || !user2) {
        throw new Error('User not found')
      }

      // Tạo conversation mới
      conversation = await Conversation.create({
        participants: [
          {
            userId: new ObjectId(user1Id),
            name: user1.name,
            avatar: user1.avatar
          },
          {
            userId: new ObjectId(user2Id),
            name: user2.name,
            avatar: user2.avatar
          }
        ],
        unreadCount: new Map([
          [user1Id, 0],
          [user2Id, 0]
        ]),
        isActive: true
      })
    }

    return conversation
  },

  // Lấy tất cả conversations của user
  async getUserConversations(userId: string) {
    const conversations = await Conversation.find({
      'participants.userId': new ObjectId(userId),
      isActive: true
    })
      .sort({ updatedAt: -1 })
      .lean()

    return conversations
  },

  // Lấy messages của một conversation
  async getConversationMessages(conversationId: string, limit = 50, skip = 0) {
    const messages = await Message.find({
      conversationId: new ObjectId(conversationId)
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'full_name avatar role')
      .lean()

    return messages.reverse() // Reverse to get oldest first
  },

  // Đánh dấu messages là đã đọc
  async markMessagesAsRead(conversationId: string, userId: string) {
    const result = await Message.updateMany(
      {
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(userId) },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    )

    // Reset unread count
    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0
    })

    return result
  },

  // Tìm kiếm users để chat (Doctors hoặc Patients)
  async searchUsersToChat(currentUserId: string, searchTerm: string, role?: number) {
    const query: any = {
      _id: { $ne: new ObjectId(currentUserId) },
      verify: 1 // Only verified users
    }

    if (role !== undefined) {
      query.role = role
    }

    if (searchTerm) {
      query.$or = [
        { full_name: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    const users = await UserModel.find(query).select('full_name email avatar role').limit(20).lean()

    return users
  },

  // Xóa conversation (soft delete)
  async deleteConversation(conversationId: string) {
    return await Conversation.findByIdAndUpdate(conversationId, {
      isActive: false
    })
  }
}
