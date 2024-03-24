import dbConnection from './db/dbconnect.js';
import dotenv from 'dotenv';
import morgan from 'morgan';

// Appjs file ko index file me refrence dege 
import App from './app.js'

// As early as possible in your application , import and configure dotenv
// So in first running file we need to execute dotenv.config();
// Which means the env variable is avaible throughout the code

dotenv.config();

// dotenv.config({
//     path: './env'
// });


// This is App Js File
const app = App;

/*
// In index file , make database connection code , 
// this is not good approach , shift that dbconnection code into db file , for proper structure .

// This is async IFI(Imeditaely Invoked Function)
(async () => {
    try {
        const conn = await mongoose.connect(`${process.env.DATABASE_URI}/${DB_NAME}`);
        console.log(`Connected To MongoDB at ${conn.connection.host}`);
        
        // If not able to connect , throw error 
        // Listners
        app.on("error", (error) => {
            console.log(`Error in MongoDB is  ${error}`);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`App is Running on port ${process.env.PORT}`);
        });
    } catch (error) {
        console.log(`Error in MongoDB is  ${error}`);
        throw error;
    }
})();

 */

const port = process.env.PORT || 3000

dbConnection()
    .then(
        // IFI -> This is async IFI(Imeditaely Invoked Function)
        () => {
            app.listen(port, () => {
                console.log(`Server is Running at : ${port}`);
            })
        }).catch((error) => {
            console.log(`Error in MongoDB is  ${error}`);
            throw error;
        })

app.use(morgan('dev'))

app.get('/', (req, res) => {
    res.json({
        ok: true,
        message: "This is demo get Request "
    })
})

app.get('/index', (req, res) => {
    res.json({
        ok: true,
        message: "This is Index File "
    })
})