import express from 'express'
import usersRouter from './routes/user.routes'
import { connectDB } from './services/database.service'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'
import { initFolder } from './utils/files'
import { config } from 'dotenv'
import path from 'path'
import { UPLOAD_DIR } from './constants/dir'

config()
const app = express()
const PORT = process.env.PORT || 8386

initFolder()
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)))
connectDB()
app.use(defaultErrorHandler)

app.listen(PORT)
