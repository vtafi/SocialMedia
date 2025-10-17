import express from 'express'
import usersRouter from './routes/users.routes'
import { connectDB } from './services/database.services'

const app = express()
const PORT = 3000

app.use(express.json())
app.use('/users', usersRouter)
connectDB()

app.listen(PORT)
