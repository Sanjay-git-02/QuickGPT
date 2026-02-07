import express from 'express'
import 'dotenv/config'
import cors from 'cors'
import connectDB from './configs/db.js'
import userRouter from './routes/userRoutes.js'
import chatRouter from './routes/chatRoutes.js'
import messageRouter from './routes/messageRoutes.js'
import creditRouter from './routes/creditRoutes.js'
import { stripeWebHooks } from './controllers/webhooks.js'

const app = express()

await connectDB()

//Stripe Webhooks
app.post(
  "/api/stripe",
  express.raw({ type: "application/json" }),
  stripeWebHooks
);

//Middleware
app.use(express.json())
app.use(cors())

//Routes

app.get("/",(req,res)=>{
    res.send("Server is live")
})

app.use("/api/user",userRouter)
app.use("/api/chat",chatRouter)
app.use("/api/message",messageRouter)
app.use("/api/credits",creditRouter)

const PORT = process.env.PORT || 3000 

app.listen(PORT,()=>{
    console.log(`Server is listening on port ${PORT}`)
})