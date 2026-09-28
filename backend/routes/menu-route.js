const express = require('express')
const app = express()

const menuController = require('../controllers/menu-controller')
const { authorize } = require('../controllers/auth-controller')

app.get('/menu', menuController.getMenu)
app.post('/menu',[authorize], menuController.addMenu)
app.post('/menu/find',[authorize], menuController.filterMenu)
app.put('/menu/:id_menu',[authorize], menuController.updateMenu)
app.delete('/menu/:id_menu',[authorize],menuController.deleteMenu)
app.use('/menu-image', express.static('/menu-image'))

module.exports = app