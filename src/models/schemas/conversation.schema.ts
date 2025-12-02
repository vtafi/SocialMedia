import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IConversation extends Document {
  _id: ObjectId
  participants: {
    userId: ObjectId
    name: string
    avatar?: string
  }[]
  lastMessage?: {
    content: string
    senderId: ObjectId
    createdAt: Date
  }
  unreadCount: Map<string, number> // userId -> unreadCount
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        userId: {
          type: Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },

        name: {
          type: String,
          required: true
        },
        avatar: String
      }
    ],
    lastMessage: {
      content: String,
      senderId: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      createdAt: Date
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)

// Index for efficient queries
conversationSchema.index({ 'participants.userId': 1 })
conversationSchema.index({ updatedAt: -1 })

const Conversation = model<IConversation>('Conversation', conversationSchema)
export default Conversation
