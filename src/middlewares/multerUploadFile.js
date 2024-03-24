import multer from 'multer'

// This is 2 step Process

// we can store files either in diskStorage or memoryStorage

// temporary store file at local server
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, '../../public/temp_files')

        // console.log("files from multerfile -> ", file)

        cb(null, './public/temp_files')
    },

    // cb -> callback
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname + '-' + uniqueSuffix)
        cb(null, file.originalname + '-' + ".aak")
    }
})

export const upload = multer({ storage })