import express from 'express'
import usersRouter from './routes/user.routes'
import { connectDB } from './services/database.service'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import cors from 'cors'
import tweetRouter from './routes/tweet.routes'
import bookmarkRouter from './routes/bookmark.routes'
import likeRouter from './routes/like.routes'
import searchRouter from './routes/search.routes'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import chatRouter from './routes/chat.routes'
import { initializeSocket } from './utils/socket'
import './utils/s3'

config()
const app = express()
const PORT = process.env.PORT || 8386
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173'
  }
})

initFolder()
app.use(cors())
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/search', searchRouter)
app.use('/chat', chatRouter)
connectDB()
app.use(defaultErrorHandler)

initializeSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
