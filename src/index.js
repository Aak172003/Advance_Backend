import dbConnection from './db/dbconnect.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Appjs file ko index file me refrence dege 
import app from './app.js'

dotenv.config();
// routes
import userRouter from './routes/user.route.js'

// This is App Js File
// const app = App;


/*
(async () => {
    try {
        const conn = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);
        console.log(`Connected To MongoDB at ${conn.connection.host}`);
        app.on("error", (error) => {
            console.log(`Error in MongoDB is  ${error}`);
            throw error;
        });
    } catch (error) {
        console.log(`Error in MongoDB is  ${error}`);
        throw error;
    }
})();

app.listen(process.env.PORT, () => {
    console.log(`App is Running on port ${process.env.PORT}`);
});

*/

const port = process.env.PORT || 3000

dbConnection().then(() => {
    app.listen(port, () => {
        console.log(`Server is Running at : ${port}`);
    })
    app.on("error", (error) => {
        console.log(`Error in MongoDB is  ${error}`);
        throw error;
    });
}).catch((error) => {
    console.log(`Error in MongoDB is  ${error}`);
    throw error;
})

app.use(morgan('dev'))

app.use("/api/v1/user", userRouter)

app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: "This is demo get Request "
    })
})

app.get('/index', (req, res) => {
    res.json({
        ok: true,
        message: "TThis is Index File "
    })
})