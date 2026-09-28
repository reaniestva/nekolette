const express = require('express')
const app = express()

app.use(express.json())

const { authenticate, register } = require('../controllers/auth-controller')

app.post('/auth', authenticate)
app.post('/regis', register)

module.exports = app