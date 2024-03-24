import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

// import userRouter
import userRouter from './routes/user.route.js'

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
app.use(cookieParser())

app.use(morgan('dev'));

// routes 
// api versioning 
app.use("/api/v1/user", userRouter)

app.get('/app', (req, res) => {
    res.json({
        ok: true,
        message: "Api App.js"
    })
})

export default app