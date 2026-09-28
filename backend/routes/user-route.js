const express = require(`express`)
const app = express()

app.use(express.json())

const userController = require(`../controllers/user-controller`)
const { authorize } = require(`../controllers/auth-controller`)


app.get(`/user`, userController.getUser)
app.get(`/user/:role`,[authorize], userController.roleUser)
app.post(`/user/find`,[authorize], userController.findUser)
app.post(`/user`,[authorize], userController.addUser)
app.put(`/user/:id_user`,[authorize], userController.updateUser)
app.delete(`/user/:id_user`,[authorize],userController.deleteUser)

module.exports = app