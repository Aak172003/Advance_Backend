import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

// import userRouter
import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.route.js'
import likeRouter from './routes/like.route.js'
import commentRouter from './routes/comment.route.js'

const app = express()

console.log("App Js is Running");

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// As body parser 
// app.use(express.json())
app.use(express.json({ limit: "16kb" }))

// Url Encoded -> while getting params from url
app.use(express.urlencoded(
    // nested Objects allow with extended
    { extended: true, limit: "16kb" }
))

// Static folder name ( where i want to store things to my codebase )
app.use(express.static("public"))

// after adding cookieParser middleware , i can access the cookie object from both req , and res object 
app.use(cookieParser())

app.use(morgan('dev'));

// routes
// api versioning 

app.use("/api/v1/user", userRouter)
app.use("/api/v1/videos", videoRouter)
app.use("/api/v1/like", likeRouter)

app.use("/api/v1/comment", commentRouter)

app.get('/app', (req, res) => {
    res.json({
        ok: true,
        message: "Api App.js"
    })
})

export default app