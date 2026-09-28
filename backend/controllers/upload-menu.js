const multer = require(`multer`)

const configStorage = multer.diskStorage({
    destination: (request, file, callback) => {
        callback(null, `./menu-image`)
    },
    filename: (request, file, callback) => {
        callback(null, `image-${Date.now()}-${file.originalname}`)
    }
})

const upload = multer({
    storage: configStorage,
    fileFilter: (request, file, callback) => {
        const filetype = [`image/jpg`, `image/png`, `image/jpeg`]
        if (!filetype.includes(file.filename)) {
            callback(null, false)
            return callback(null, `Invalid type of file`)
        }
        const maxSize = (1 * 1024 * 1024)
        const fileSize = request.headers[`content-length`]
        if (fileSize > maxSize) {
            callback(null, false)
            return callback(null, `File size is too large`)
        }
        callback(null, true)
    }
})

module.exports = upload