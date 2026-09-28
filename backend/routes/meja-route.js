const express = require(`express`)
const app = express()

app.use(express.json())

const { authorize } = require(`../controllers/auth-controller`)
const mejaController = require(`../controllers/meja-controller`)

app.get(`/meja`, mejaController.getMeja)
app.get(`/status/:status`,[authorize], mejaController.statusMeja)
app.post(`/meja`,[authorize], mejaController.addMeja)
app.put(`/meja/:id_meja`, [authorize],mejaController.updateMeja)
app.delete(`/meja/:id_meja`,[authorize], mejaController.deleteMeja)

module.exports = app