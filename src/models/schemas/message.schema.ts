import { Schema, model, Document } from 'mongoose'
import { ObjectId } from 'mongodb'

export interface IMessage extends Document {
  _id: ObjectId
  conversationId: ObjectId
  senderId: ObjectId
  content: string
  messageType: 'text' | 'image' | 'file' | 'system'
  isRead: boolean
  readAt?: Date
  attachments?: {
    fileName: string
    fileUrl: string
    fileType: string
    fileSize: number
  }[]
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new Schema<IMessage>(
  {
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: 'Users', // Match the model name in users.model.ts
      required: true,
      index: true
    },

    content: {
      type: String,
      required: true
    },
    messageType: {
      type: String,
      enum: ['text', 'image', 'file', 'system'],
      default: 'text'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    },
    attachments: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number
      }
    ]
  },
  {
    timestamps: true
  }
)

// Index for efficient queries
messageSchema.index({ conversationId: 1, createdAt: -1 })
messageSchema.index({ senderId: 1, createdAt: -1 })

const Message = model<IMessage>('Message', messageSchema)
export default Message
