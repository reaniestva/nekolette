const userModel = require('../models/index').user
const joi = require('joi')
const { Op } = require("sequelize")
const md5 = require('md5')

const validateUser = (input) => {
    let rules = joi.object().keys({
        nama_user: joi
            .string()
            .required(),
        role: joi
            .string()
            .valid('kasir','admin','manager')
            .required(),
        username: joi
            .string()
            .required(),
        password: joi
            .string()
            .min(8)
    })
    let { error } = rules.validate(input)
    if (error) {
        let message = error
            .details
            .map(item => item.message)
            .join(',')
        return {
            status: false,
            message: error.message
        }
    }
    return {
        status: true,
    }
}

exports.getUser = async (request, response) => {
    try {
        let result = await userModel.findAll({
            order: [['createdAt', 'desc']]
        })
        return response.json({
            status: true,
            data: result
        })
    } catch (error) {
        return response.json({
            status:false,
            message: error.message
        })
    }
}

exports.findUser = async (request, response) => {
    try {
        let keyword = request.body.keyword
        let result = await userModel.findAll({
            where: {
                [Op.or]: {
                    nama_user: { [Op.substring]: keyword},
                    role: { [Op.substring]: keyword },
                    username: { [Op.substring]: keyword}
                }
            }
        })
        return response.json({
            status:true,
            data:result
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.addUser = async (request, response) => {
    try {
        
        let resultValidation = validateUser(request.body)
        if (resultValidation.status === false) {
            return response.json({
                status: false,
                message: resultValidation.message
            })
        }

        const existingUser = await userModel.findOne({
            where: { username: request.body.username },
        });

        if (existingUser) {
            return response.status(409).json({
                success: false,
                message: 'Username already exists',
            });
        }

        request.body.password = md5(request.body.password)
        await userModel.create(request.body)
        return response.json({
            status: true,
            message: 'Data user berhasil ditambahkan'
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.updateUser = async (request, response) => {
    try {
        let id_user = request.params.id_user
        let resultValidation = validateUser(request.body)
        if (resultValidation.status === false) {
            return response.json({
                status: false,
                message: resultValidation.message
            })
        }
        if (request.body.password){
            request.body.password = md5(request.body.password)
        }
        await userModel.update(request.body, {where: { id_user: id_user } })
        return response.json({
            status: true,
            message: 'Data USer berhasil diubah'
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

exports.deleteUser = async (request, response) => {
    try {
        let id_user = request.params.id_user
        await userModel.destroy({where: {id_user: id_user}})
        return response.json({
            status: true,
            message: 'Data user berhasil dihapus'
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}

//role
exports.roleUser = async (request, response) => {
    try {
        const param = { role: request.params.role };
        const user = await userModel.findAll({ where: param });
        if (user.length > 0) { // jika data ditemukan
          return response.json({ // mengembalikan response dengan status code 200 dan data meja
            status: "success",
            data: user,
          });
        } else { // jika data tidak ditemukan
          return response.status(404).json({ // mengembalikan response dengan status code 404 dan pesan data tidak ditemukan
            status: "error",
            message: "data tidak ditemukan",
          });
        }
      } catch (error) { // jika gagal
        return response.status(400).json({ // mengembalikan response dengan status code 400 dan pesan error
          status: "error",
          message: error.message,
        });
      }
    };