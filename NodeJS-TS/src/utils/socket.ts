import { Server as HTTPServer } from 'http'
import { Server, Socket } from 'socket.io'
import { verifyToken } from './jwt'
import { TokenType } from '~/constants/enum'
import Message from '~/models/schemas/message.schema'
import Conversation from '~/models/schemas/conversation.schema'
import mongoose from 'mongoose'

const { ObjectId } = mongoose.Types

interface AuthSocket extends Socket {
  userId?: string
  userName?: string
}

// Store online users: userId -> socketId
const onlineUsers = new Map<string, string>()

const allowedOrigins = [
  process.env.CLIENT_REDIRECT_URL,
  'http://localhost:5173',
  'https://social-media-pi-mauve.vercel.app'
].filter(Boolean) as string[]

export const initializeSocket = (httpServer: HTTPServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
        if (!origin) return callback(null, true)
        if (allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true)
        } else {
          callback(new Error('Not allowed by CORS'))
        }
      },
      credentials: true
    }
  })

  // Authentication middleware
  io.use(async (socket: AuthSocket, next) => {
    try {
      // Ưu tiên auth.token, fallback sang cookie access_token
      let token = socket.handshake.auth.token

      if (!token) {
        const rawCookie = socket.handshake.headers.cookie || ''
        const match = rawCookie.match(/(?:^|;\s*)access_token=([^;]+)/)
        if (match) token = decodeURIComponent(match[1])
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'))
      }

      // Verify JWT token
      const decoded = await verifyToken({
        token,
        publicKey: process.env.JWT_SECRET_ACCESS_TOKEN as string
      })

      if (decoded.token_type !== TokenType.AccessToken) {
        return next(new Error('Authentication error: Invalid token type'))
      }

      // Attach user info to socket
      socket.userId = decoded.user_id

      // Get user details from handshake

      socket.userName = socket.handshake.auth.name

      next()
    } catch (error: any) {
      console.error('Socket auth error:', error.message)
      return next(new Error('Authentication error: Invalid token'))
    }
  })

  io.on('connection', (socket: AuthSocket) => {
    const userId = socket.userId as string
    console.log(`✅ User connected: ${userId} (${socket.userName})`)

    // Add to online users
    onlineUsers.set(userId, socket.id)

    // Broadcast online status to all users
    io.emit('user-online', { userId, socketId: socket.id })

    // Join user's personal room
    socket.join(`user:${userId}`)

    // Handle joining a conversation
    socket.on('join-conversation', async (conversationId: string) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`📥 User ${userId} joined conversation ${conversationId}`)
    })

    // Handle leaving a conversation
    socket.on('leave-conversation', (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`)
      console.log(`📤 User ${userId} left conversation ${conversationId}`)
    })

    // Handle sending a message
    socket.on(
      'send-message',
      async (data: { conversationId: string; content: string; messageType?: 'text' | 'image' | 'file' }) => {
        try {
          const { conversationId, content, messageType = 'text' } = data

          // Create message in database
          const message = await Message.create({
            conversationId: new ObjectId(conversationId),
            senderId: new ObjectId(userId),
            content,
            messageType,
            isRead: false
          })

          // Populate sender info
          const populatedMessage = await Message.findById(message._id).populate('senderId', 'name avatar').lean()

          // Get conversation to update unread counts
          const conversation = await Conversation.findById(conversationId)
          if (conversation) {
            // Increment unread count for all participants except sender
            const updateFields: any = {
              lastMessage: {
                content,
                senderId: new ObjectId(userId),
                createdAt: new Date()
              },
              updatedAt: new Date()
            }

            // Increment unread count for each participant (except sender)
            conversation.participants.forEach((participant) => {
              const participantId = participant.userId.toString()
              if (participantId !== userId) {
                const currentCount = conversation.unreadCount.get(participantId) || 0
                updateFields[`unreadCount.${participantId}`] = currentCount + 1
              }
            })

            await Conversation.findByIdAndUpdate(conversationId, updateFields)
          }

          // Emit to all users in the conversation
          io.to(`conversation:${conversationId}`).emit('new-message', {
            ...populatedMessage,
            senderName: socket.userName,
            conversationId
          })

          // Emit updated conversation list to all participants for real-time badge updates
          if (conversation) {
            conversation.participants.forEach((participant) => {
              const participantId = participant.userId.toString()
              io.to(`user:${participantId}`).emit('conversation-updated', {
                conversationId,
                lastMessage: {
                  content,
                  senderId: new ObjectId(userId),
                  createdAt: new Date()
                },
                updatedAt: new Date()
              })

              // Send notification to offline users
              if (participantId !== userId && !onlineUsers.has(participantId)) {
                console.log(`📧 Send notification to offline user: ${participantId}`)
              }
            })
          }

          console.log(`💬 Message sent in conversation ${conversationId}`)
        } catch (error) {
          console.error('❌ Error sending message:', error)
          socket.emit('error', { message: 'Failed to send message' })
        }
      }
    )

    // Handle typing indicator
    socket.on('typing-start', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        userId,
        userName: socket.userName,
        conversationId
      })
    })

    socket.on('typing-stop', (conversationId: string) => {
      socket.to(`conversation:${conversationId}`).emit('user-stop-typing', {
        userId,
        conversationId
      })
    })

    // Handle marking messages as read
    socket.on('mark-as-read', async (data: { conversationId: string; messageIds: string[] }) => {
      try {
        const { conversationId, messageIds } = data

        await Message.updateMany(
          {
            _id: { $in: messageIds.map((id) => new ObjectId(id)) },
            senderId: { $ne: new ObjectId(userId) }
          },
          {
            isRead: true,
            readAt: new Date()
          }
        )

        // Notify other users in conversation
        socket.to(`conversation:${conversationId}`).emit('messages-read', {
          conversationId,
          messageIds,
          readBy: userId
        })

        console.log(`✅ Messages marked as read in conversation ${conversationId}`)
      } catch (error) {
        console.error('❌ Error marking messages as read:', error)
      }
    })

    // Handle disconnect
    socket.on('disconnect', () => {
      onlineUsers.delete(userId)
      io.emit('user-offline', { userId })
      console.log(`❌ User disconnected: ${userId}`)
    })
  })

  return io
}

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys())
}
