const userModel = require(`../models/index`).user;
const transaksiModel = require(`../models/index`).transaksi;
const detailModel = require(`../models/index`).detail_transaksi;
const menuModel = require(`../models/index`).menu;
const mejaModel = require(`../models/index`).meja;
const { fn, col, literal } = require('sequelize');
const { Op } = require("sequelize")

//tambah transaksi
exports.addTransaksi = async (request, response) => {
  try {
    let transaksi = {
      id_transaksi: request.body.id_transaksi,
      tgl_transaksi: request.body.tgl_transaksi,
      id_user: request.body.id_user,
      id_meja: request.body.id_meja,
      nama_pelanggan: request.body.nama_pelanggan,
      status: request.body.status,
    };
    console.log('req.body', request.body)
    let checkMeja = await mejaModel.findOne({
      where: { id_meja: transaksi.id_meja },
    });
    console.log("hit")
    if (checkMeja.status == "terisi") {
      return response.json({
        status: true,
        message: " Meja Sedang Terisi",
      });
    } else {
      let insertTransaksi = await transaksiModel.create(transaksi);
      console.log("hit")

      let transaksiID = insertTransaksi.id_transaksi;
      let arrayDetail = request.body.detail_transaksi;
      for (let i = 0; i < arrayDetail.length; i++) {
        arrayDetail[i].id_transaksi = transaksiID;
        let menu = await menuModel.findOne({
          where: { id_menu: arrayDetail[i].id_menu },
        });
        arrayDetail[i].harga = menu?.harga;
      }
      await detailModel.bulkCreate(arrayDetail);

      if (transaksi.status === "belum_bayar") {
        // Ubah status meja menjadi "kosong"
        await mejaModel.update(
          { status: "terisi" },
          { where: { id_meja: transaksi.id_meja } }
        );
      }
      return response.json({
        status: true,
        insertTransaksi,
        message: "Data transaksi berhasil ditambahkan",
      });
    }
  } catch (error) {
    console.log(error)
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.updateTransaksi = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;

    // Ambil data baru dari request body
    const newData = {
      status: request.body.status,
      nama_pelanggan: request.body.nama_pelanggan,
      id_menu: request.body.id_menu, 
      nama_pelanggan: request.body.nama_pelanggan,
      tgl_transaksi: request.body.tgl_transaksi,
      id_meja: request.body.id_meja
    };

    // Temukan transaksi berdasarkan ID
    const transaksi = await transaksiModel.findByPk(id_transaksi);
    if (!transaksi) {
      throw new Error("Transaksi not found.");
    }

    const id_meja = transaksi.id_meja;

    // Update transaksi
    await transaksiModel.update(newData, {
      where: { id_transaksi },
    });

    // Update detail_transaksi jika id_menu diberikan
    if (newData.id_menu) {
      const detailTransaksi = await detailModel.findAll({
        where: { id_transaksi }, // Temukan semua detail berdasarkan id_transaksi
      });

      if (detailTransaksi.length > 0) {
        // Update id_menu di semua detail_transaksi
        const updatedDetailPromises = detailTransaksi.map(detail => {
          return detailModel.update(
            { id_menu: newData.id_menu },
            { where: { id_detail_transaksi: detail.id_detail_transaksi } }
          );
        });

        // Tunggu semua update selesai
        await Promise.all(updatedDetailPromises);
      } else {
        throw new Error("Detail transaksi not found.");
      }
    }

    // Jika status menjadi "lunas", update status meja
    if (request.body.status === "lunas") {
      const [updated] = await Promise.all([
        mejaModel.update({ status: "kosong" }, { where: { id_meja } }),
      ]);

      if (updated[0] === 0) {
        throw new Error("Failed to update meja status.");
      }
    }

    return response.json({
      status: true,
      message: "Data transaksi berhasil diubah",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

// update status transaksi
exports.updatestatus = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;
    const status = request.body.status;
    const id_meja = request.body.id_meja;

    // Update the status of the transaction
    await transaksiModel.update({ status }, { where: { id_transaksi } });

    if (status === "lunas") {
      // Update the status of the meja to "kosong"
      const [updated] = await mejaModel.update(
        { status: "kosong" },
        { where: { id_meja } }
      );
      if (!updated) {
        throw new Error("Failed to update meja status.");
      }
    }

    return response.json({
      status: true,
      message: "Status transaksi berhasil diperbarui",
    });
  } catch (error) {
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.deleteTransaksi = async (request, response) => {
  try {
    const id_transaksi = request.params.id_transaksi;

    // Cek apakah transaksi ada
    const transaksi = await transaksiModel.findOne({
      where: { id_transaksi },
    });

    if (!transaksi) {
      return response.json({
        status: false,
        message: "Transaksi tidak ditemukan",
      });
    }

    // Hapus detail transaksi terkait
    await detailModel.destroy({ where: { id_transaksi } });

    // Hapus transaksi
    await transaksiModel.destroy({ where: { id_transaksi } });

    // Update status meja menjadi "kosong" atau status lain sesuai kebutuhan
    await mejaModel.update(
      { status: "kosong" }, // Ganti dengan status yang sesuai
      { where: { id_meja: transaksi.id_meja } }
    );

    return response.json({
      status: true,
      message: "Data transaksi berhasil dihapus",
    });
  } catch (error) {
    console.error(error); // Log error untuk debugging
    return response.json({
      status: false,
      message: error.message,
    });
  }
};


//get semua data transaksi
exports.getTransaksi = async (request, response) => {
  try {
    // Fetch transactions along with associated models
    let result = await transaksiModel.findAll({
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          attributes: ['id_detail_transaksi', 'id_menu', 'quantity', 'harga'],
          include: ["menu"],
        },
      ],
      order: [["id_transaksi", "DESC"]],
    });

    // Log the result to see the structure
    console.log(JSON.stringify(result, null, 2));

    // Process the result to ensure quantity is displayed and total_harga is calculated
    result = result.map(transaksi => {
      let totalTransaksiHarga = 0;

      if (Array.isArray(transaksi.detail_transaksi)) {
        transaksi.detail_transaksi = transaksi.detail_transaksi.map(detail => {
          // Ensure quantity is not null, default to 1 if it is
          const quantity = detail.quantity
          console.log(quantity);

          const hargaMenu = detail.menu?.harga || 0;

          // Calculate total_harga for this detail (quantity * harga)
          detail.total_harga = quantity * hargaMenu;
          detail.transaksi = quantity;
          totalTransaksiHarga += detail.total_harga;

          return detail;
        });

      } else if (transaksi.detail_transaksi) {
        // Handle single detail_transaksi
        const quantity = transaksi.detail_transaksi.quantity;
        const hargaMenu = transaksi.detail_transaksi.menu?.harga || 0;

        // Calculate total_harga for this single detail
        transaksi.detail_transaksi.total_harga = quantity * hargaMenu;

        // Set quantity in the output
        transaksi.detail_transaksi.quantity = quantity;

        totalTransaksiHarga = transaksi.detail_transaksi.total_harga;
      }

      // Set the total_harga for the entire transaction
      transaksi.setDataValue('total_harga', totalTransaksiHarga);

      return transaksi;
    });

    return response.json({
      status: true,
      data: result,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error); // Log any errors
    return response.json({
      status: false,
      message: error.message,
    });
  }
};

exports.getTransaksiDetail = async (request, response) => {
  try {
    // Extracting id_transaksi from request parameters
    const id_transaksi = request.params.id_transaksi;

    // Querying the database to find transaksi and include its related detail_transaksi and user
    const transaksi = await transaksiModel.findOne({
      include: [
        {
          model: detailModel,
          as: "detail_transaksi",
          attributes: ['id_detail_transaksi', 'id_menu', 'quantity'],
          include: [
            {
              model: menuModel, // Include menuModel to access harga
              as: "menu",
              attributes: ['harga','nama_menu']
            }
          ]
        },
        {
          model: userModel, // Include userModel to get user information
          as: "user",
          attributes: ['nama_user'] // Only include nama_user field
        }
      ],
      where: { id_transaksi } // Match transaksi based on id_transaksi
    });

    // If no transaksi found, return a message
    if (!transaksi) {
      return response.json({
        status: false,
        message: "Detail transaksi tidak ditemukan"
      });
    }

    let totalTransaksiHarga = 0;

    // Ensure detail_transaksi is an array
    if (Array.isArray(transaksi.detail_transaksi)) {
      transaksi.detail_transaksi.forEach(detail => {
        const quantity = detail.quantity || 0; // Fallback to 0 if quantity is undefined
        const hargaMenu = detail.menu?.harga || 0; // Fallback to 0 if menu harga is undefined
        detail.setDataValue('total_harga', quantity * hargaMenu); // Calculate total_harga for this detail
        totalTransaksiHarga += detail.getDataValue('total_harga'); // Accumulate the total price
      });
    }

    // Set total_harga for the transaction
    transaksi.setDataValue('total_harga', totalTransaksiHarga);

    // If transaksi is found, return the data
    return response.json({
      status: true,
      data: transaksi,
    });

  } catch (error) {
    // Log the error for debugging purposes
    console.log('Error fetching transactions', error);
    
    // Return error message to client
    return response.json({
      status: false,
      message: error.message
    });
  }
};

//get tgl
exports.getTgl = async (req, res) => {
  const { tgl_transaksi } = req.params;

  try {
      const startDate = new Date(tgl_transaksi);
      startDate.setHours(0, 0, 0, 0); // Set start time to 00:00:00

      const endDate = new Date(tgl_transaksi);
      endDate.setHours(23, 59, 59, 999); // Set end time to 23:59:59.999

      const result = await transaksiModel.findAll({
          where: {
              tgl_transaksi: {
                  [Op.between]: [startDate, endDate],
              },
          },
          include: [
              "meja",
              "user",
              {
                  model: detailModel,
                  as: "detail_transaksi",
                  attributes: ['id_detail_transaksi', 'id_menu', 'quantity', 'harga'],
                  include: ["menu"],
              },
          ],
      });

      if (result.length === 0) {
          return res.status(404).json({
              status: "error",
              message: "Data tidak ditemukan",
          });
      } else {
          // Process each transaction to calculate total_harga
          const processedResult = result.map(transaksi => {
              let totalTransaksiHarga = 0;

              // Check if detail_transaksi is an array
              if (Array.isArray(transaksi.detail_transaksi)) {
                  transaksi.detail_transaksi = transaksi.detail_transaksi.map(detail => {
                      // Ensure quantity is not null, default to 1 if it is
                      const quantity = detail.quantity !== null && detail.quantity !== undefined ? detail.quantity : 1;

                      // Get the harga (price) of the menu item
                      const hargaMenu = detail.menu?.harga || 0;

                      // Calculate total_harga for this detail (quantity * harga)
                      detail.total_harga = quantity * hargaMenu;

                      // Accumulate total for the transaction
                      totalTransaksiHarga += detail.total_harga;

                      return detail;
                  });
              } else if (transaksi.detail_transaksi) {
                  // Handle single detail_transaksi
                  const quantity = transaksi.detail_transaksi.quantity !== null && transaksi.detail_transaksi.quantity !== undefined ? transaksi.detail_transaksi.quantity : 1;
                  const hargaMenu = transaksi.detail_transaksi.menu?.harga || 0;

                  // Calculate total_harga for this single detail
                  transaksi.detail_transaksi.total_harga = quantity * hargaMenu;

                  totalTransaksiHarga = transaksi.detail_transaksi.total_harga;
              }

              // Set the total_harga for the entire transaction
              transaksi.setDataValue('total_harga', totalTransaksiHarga);

              return transaksi;
          });

          return res.status(200).json({
              status: "success",
              message: "Data ditemukan",
              data: processedResult, // Return processed result with total_harga
          });
      }
  } catch (error) {
      return res.status(500).json({
          status: "error",
          message: error.message,
      });
  }
};

// get data transaksi berdasarkan bulan
exports.getBulan = async (req, res) => {
  const { tgl_transaksi } = req.params;

  // Check if tgl_transaksi is a valid date in format YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(tgl_transaksi)) {
    return res.status(400).json({
      status: "error",
      message: "Invalid date format. Please provide the date in YYYY-MM format.",
    });
  }

  try {
    // Construct the start and end of the month using a safer approach
    const [year, month] = tgl_transaksi.split("-");

    // Start of the month (first day)
    const startMonth = new Date(year, month - 1, 1, 0, 0, 0, 0);

    // End of the month (last day)
    const endMonth = new Date(year, month, 0, 23, 59, 59, 999);

    // Logging the dates for debugging
    console.log("Start of the month:", startMonth);
    console.log("End of the month:", endMonth);

    const result = await transaksiModel.findAll({
      where: {
        tgl_transaksi: {
          [Op.between]: [startMonth, endMonth],
        },
      },
      include: [
        "meja",
        "user",
        {
          model: detailModel,
          as: "detail_transaksi",
          include: ["menu"],
        },
      ],
    });

    if (result.length === 0) {
      return res.status(404).json({
        status: "error",
        message: "Data tidak ditemukan",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Data ditemukan",
      data: result,
    });
  } catch (error) {
    console.error("Error in getBulan:", error);
    return res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// get transaksi by id user
exports.getUser = async (req, res) => {
  // endpoint untuk mengambil data transaksi berdasarkan id user
  try {
    const result = await transaksiModel.findAll({
      where: { id_user: req.params.id_user },
      include: ["user", "meja"],
      order: [["id_transaksi", "DESC"]],
    });

    if (result) {
      res.status(200).json({
        status: "success",
        data: result,
      });
    } else {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// get data transaksi sesuai nama user
exports.getNamaUser = async (req, res) => {
  try {
    const param = { nama_user: req.params.nama_user };
    const userResult = await userModel.findAll({
      where: {
        nama_user: param.nama_user,
      },
    });
    if (userResult.length == null) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    const transaksiResult = await transaksiModel.findAll({
      where: {
        id_user: userResult[0].id_user,
      },
    });
    if (transaksiResult.length === 0) {
      res.status(404).json({
        status: "error",
        message: "data tidak ditemukan",
      });
      return;
    }
    res.status(200).json({
      status: "success",
      message: "data ditemukan",
      data: transaksiResult,
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};

// get data menu yang paling sedikit
exports.getMenu = async (req, res) => {
  try {
    const result = await detailModel.findAll({
      attributes: [
        'id_menu',
        [fn("SUM", col("detail_transaksi.jumlah")), "jumlah"],
      ],
      include: [
        {
          model: menuModel,
          as: 'menu'
        }
      ],
      group: ["id_menu"],
      order: [[literal("jumlah"), "DESC"]],
    }); // mengambil semua data detail_transaksi
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message,
    });
  }
};

// mencari total pendapatan berdasarkan tanggal
exports.getPendapatanTgl = async (req, res) => {
  try {
      const param = { tgl_transaksi: req.params.tgl_transaksi };

      const result = await transaksiModel.findAll({
          attributes: [
              'id_transaksi',
              'tgl_transaksi',
              'id_user',
              'id_meja',
              'nama_pelanggan',
              'status',
              // Menghitung total pendapatan per transaksi
              [fn('SUM', literal('detail_transaksi.harga * detail_transaksi.quantity')), 'pendapatan']
          ],
          include: [
              {
                  model: detailModel,
                  as: 'detail_transaksi',
                  attributes: [] // Tidak ambil atribut dari detail transaksi
              }
          ],
          where: {
              tgl_transaksi: {
                  [Op.between]: [
                      param.tgl_transaksi + " 00:00:00",
                      param.tgl_transaksi + " 23:59:59",
                  ],
              }
          },
          group: ['transaksi.id_transaksi'] // Pastikan pengelompokan berdasarkan id_transaksi
      });

      // Menghitung total keseluruhan pendapatan
      const totalKeseluruhan = result.reduce((total, transaksi) => {
          const pendapatan = parseInt(transaksi.dataValues.pendapatan) || 0; // Menghindari nilai NaN
          return total + pendapatan;
      }, 0);

      console.log('Result:', result); // Tambahkan log untuk melihat data yang diambil
      console.log('Total Keseluruhan:', totalKeseluruhan); // Log total keseluruhan

      res.status(200).json({
          status: "success",
          data: result,
          total_keseluruhan: totalKeseluruhan
      });
  } catch (error) {
      res.status(400).json({
          status: "error",
          message: error.message,
      });
  }
};

//pendapatan bulan
exports.pendapatanBln = async (req, res) => {
  try {
    const param = req.params.tgl_transaksi.split('-'); // Ambil tahun dan bulan
    const tahun = param[0]; // Tahun (YYYY)
    const bulan = param[1]; // Bulan (MM)

    const result = await detailModel.findAll({
      attributes: [
        // Menghitung pendapatan sebagai total harga dikali quantity
        [fn('SUM', literal('detail_transaksi.harga * detail_transaksi.quantity')), 'pendapatan']
      ],
      include: [
        {
          model: transaksiModel,
          as: 'transaksi',
          required: true, // Pastikan untuk menyertakan transaksi yang sesuai
          where: {
            [Op.and]: [
              // Filter bulan
              fn('MONTH', col('transaksi.tgl_transaksi')) === parseInt(bulan),
              // Filter tahun
              fn('YEAR', col('transaksi.tgl_transaksi')) === parseInt(tahun)
            ]
          },
        }
      ],
      group: ['detail_transaksi.id_transaksi']
    });

    // Menghitung total keseluruhan pendapatan
    const totalKeseluruhan = result.reduce((a, b) => a + parseInt(b.dataValues.pendapatan), 0);

    res.status(200).json({
      status: "success",
      data: result,
      total_keseluruhan: totalKeseluruhan
    });
  } catch (error) {
    res.status(400).json({
      status: "error",
      message: error.message,
    });
  }
};
