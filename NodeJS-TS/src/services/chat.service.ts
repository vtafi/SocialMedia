import mongoose from 'mongoose'
import Conversation from '~/models/schemas/conversation.schema'
import Message from '~/models/schemas/message.schema'
import UserModel from '~/models/user.model'

const { ObjectId } = mongoose.Types

export const ChatService = {
  // Tạo hoặc lấy conversation giữa 2 users
  async getOrCreateConversation(user1Id: string, user2Id: string) {
    // Tìm conversation có cả 2 users
    let conversation = await Conversation.findOne({
      'participants.userId': { $all: [new ObjectId(user1Id), new ObjectId(user2Id)] },
      isActive: true
    }).populate('participants.userId', 'name avatar username')

    if (!conversation) {
      const [user1, user2] = await Promise.all([
        UserModel.findById(user1Id).select('name avatar username'),
        UserModel.findById(user2Id).select('name avatar username')
      ])

      if (!user1 || !user2) {
        throw new Error('User not found')
      }

      conversation = await Conversation.create({
        participants: [
          { userId: new ObjectId(user1Id), name: user1.name, avatar: user1.avatar ?? '' },
          { userId: new ObjectId(user2Id), name: user2.name, avatar: user2.avatar ?? '' }
        ],
        unreadCount: new Map([
          [user1Id, 0],
          [user2Id, 0]
        ]),
        isActive: true
      })

      // Populate sau khi tạo
      conversation = await conversation.populate('participants.userId', 'name avatar username')
    }

    return conversation
  },

  // Lấy tất cả conversations của user (có populate để frontend lấy thông tin người kia)
  async getUserConversations(userId: string) {
    const conversations = await Conversation.find({
      'participants.userId': new ObjectId(userId),
      isActive: true
    })
      .populate('participants.userId', 'name avatar username')
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
      .populate('senderId', 'name avatar username')
      .lean()

    return messages.reverse()
  },

  // Đánh dấu messages là đã đọc
  async markMessagesAsRead(conversationId: string, userId: string) {
    const result = await Message.updateMany(
      {
        conversationId: new ObjectId(conversationId),
        senderId: { $ne: new ObjectId(userId) },
        isRead: false
      },
      { isRead: true, readAt: new Date() }
    )

    await Conversation.findByIdAndUpdate(conversationId, {
      [`unreadCount.${userId}`]: 0
    })

    return result
  },

  // Tìm kiếm users để chat
  async searchUsersToChat(currentUserId: string, searchTerm: string, _role?: number) {
    const query: Record<string, unknown> = {
      _id: { $ne: new ObjectId(currentUserId) }
    }

    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: 'i' } },
        { username: { $regex: searchTerm, $options: 'i' } },
        { email: { $regex: searchTerm, $options: 'i' } }
      ]
    }

    const users = await UserModel.find(query).select('name email avatar username').limit(20).lean()
    return users
  },

  // Xóa conversation (soft delete)
  async deleteConversation(conversationId: string) {
    return await Conversation.findByIdAndUpdate(conversationId, { isActive: false })
  }
}
