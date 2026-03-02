import express from 'express'
import usersRouter from './routes/user.routes'
import { connectDB } from './database/mongo.database'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import staticRouter from './routes/static.routes'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import tweetRouter from './routes/tweet.routes'
import bookmarkRouter from './routes/bookmark.routes'
import likeRouter from './routes/like.routes'
import searchRouter from './routes/search.routes'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import chatRouter from './routes/chat.routes'
import { initializeSocket } from './utils/socket'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yaml'
import { readFileSync } from 'fs'
import { join } from 'path'
import './utils/s3'

config()
const app = express()
const PORT = process.env.PORT || 8386
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_REDIRECT_URL,
    credentials: true
  }
})

initFolder()

// Swagger documentation setup
const swaggerDocument = YAML.parse(readFileSync(join(__dirname, '../API_DOCUMENT.yaml'), 'utf8'))

// CORS configuration - explicitly allow frontend origin
app.use(
  cors({
    origin: process.env.CLIENT_REDIRECT_URL, // Tự động đọc link Vercel hoặc Localhost từ file .env
    credentials: true
  })
)
app.use(express.json())
app.use(cookieParser())

// Swagger UI route - Access at http://localhost:8386/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))

app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/static', staticRouter)
app.use('/tweets', tweetRouter)
app.use('/bookmarks', bookmarkRouter)
app.use('/likes', likeRouter)
app.use('/search', searchRouter)
app.use('/chat', chatRouter)
app.get('/health', (req, res) => res.status(200).send('OK'))
connectDB()
app.use(defaultErrorHandler)

initializeSocket(httpServer)

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`)
})
