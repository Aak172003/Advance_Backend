import multer from 'multer'

// This is 2 step Process

// we can store files either in diskStorage or memoryStorage

// temporary store file at local server
const storage = multer.diskStorage({
    // This is for destination
    destination: function (req, file, cb) {
        // cb(null, '../../public/temp_files')

        // console.log("files from multerfile -> ", file)

        cb(null, './public/temp_files')
    },

    // cb -> callback
    // This is for file Name 
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname + '-' + uniqueSuffix)

        // console.log("file : ------ from fileName Fuction ------------------ ",file)
        cb(null, file.originalname + '-' + ".aak")
    }
})

export const upload = multer({ storage })