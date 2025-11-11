import express from 'express'
import usersRouter from './routes/user.routes'
import { connectDB } from './services/database.service'
import { defaultErrorHandler } from './middlewares/error.middlewares'
import mediasRouter from './routes/media.routes'

const app = express()
const PORT = 8386
app.use(express.json())
app.use('/users', usersRouter)
app.use('/medias', mediasRouter)
connectDB()
app.use(defaultErrorHandler)

app.listen(PORT)
