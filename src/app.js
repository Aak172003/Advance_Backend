import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import morgan from 'morgan'

// routes
import userRouter from './routes/user.route.js'
const app = express()

console.log("App Js is Running");

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

// As body parser
app.use(express.json())
// Url Encoded 
app.use(express.urlencoded({ extended: true }))

// Static folder name ( where i want to store things to my codebase )
app.use(express.static("public"))
app.use(cookieParser())

app.use(morgan('dev'));

// routes 
app.use("/api/v1/user", userRouter)

app.get('/app', (req, res) => {
    res.json({
        ok: true,
        message: "Api App.js"
    })
})

export default app