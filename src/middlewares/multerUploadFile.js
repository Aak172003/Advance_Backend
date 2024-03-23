import multer from 'multer'

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // cb(null, '../../public/temp_files')
        cb(null, './public/temp_files')
    },
    // cb -> callback
    filename: function (req, file, cb) {
        // const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        // cb(null, file.fieldname + '-' + uniqueSuffix)
        cb(null, file.originalname + '-' + ".fileHai")
    }
})

export const upload = multer({ storage })