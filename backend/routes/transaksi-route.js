const express= require("express")
const app = express()

app.use(express.json())

const transaksiController = require('../controllers/transaksi-controller')
const { authorize } = require('../controllers/auth-controller')

app.get('/transaksi', transaksiController.getTransaksi)
app.get('/transaksi/:tgl_transaksi', transaksiController.getTgl)
app.get('/transaksi/bulan/:tgl_transaksi',[authorize], transaksiController.getBulan)

app.post('/transaksi',[authorize], transaksiController.addTransaksi)
app.put('/transaksi/:id_transaksi',[authorize], transaksiController.updateTransaksi) 
app.put('/transaksi/:id_transaksi',[authorize], transaksiController.updatestatus)

app.delete('/transaksi/:id_transaksi',[authorize], transaksiController.deleteTransaksi)
app.get('/transaksi/user/:id_user',[authorize], transaksiController.getUser)
app.get('/transaksi/namauser/:nama_user',[authorize], transaksiController.getNamaUser) 

app.get('/transaksi/pendapatantgl/:tgl_transaksi',[authorize], transaksiController.getPendapatanTgl)
app.get('/transaksi/pendapatanbln/:tgl_transaksi',[authorize], transaksiController.pendapatanBln)
app.get('/transaksi/detail/:id_transaksi',[authorize], transaksiController.getTransaksiDetail)

module.exports = app