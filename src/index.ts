import express from 'express'
import usersRouter from './routes/users.routes'
import { connectDB } from './services/database.services'
import { defaultErrorHandler } from './middlewares/error.middlewares'

const app = express()
const PORT = 3000

app.use(express.json())
app.use('/users', usersRouter)
connectDB()
app.use(defaultErrorHandler)

app.listen(PORT)
