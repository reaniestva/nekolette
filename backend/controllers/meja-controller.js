const mejaModel = require('../models/index').meja
const joi = require('joi')

const validateMeja = async (input) => {
    let rules = joi.object().keys({
        nomor_meja: joi
            .string()
            .required(),
        status: joi
            .boolean()
            .required()
    })
    let { error } = rules.validate(input)
    if (error) {
        let message = error
            .details
            .map(item => item.message)
            .join(',')
        
        return {
            status: false,
            message: message
        }
    }
    return {
        status: true
    }
}

exports.getMeja = async (request, response) => {
    try {
        let meja = await mejaModel.findAll()
        return response.json({
            status: true,
            data: meja
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}
exports.statusMeja = async (request, response) => {
    try {
        const param = { status: request.params.status};
        const meja = await mejaModel.findAll({ where: param });
        if (meja.length > 0) {
            return response.json({
                status: "success",
                data: meja,
            });
        } else {
            return response.status(404).json({
                status: "error",
                message: "data tidak ditemukan",
            });
        }
    } catch (error) {
        return response.status(400).json({
            status: "error",
            message: error.message,
        });
    }
};

exports.addMeja = async (request, response) => {
    try {
        console.log(request.body);  // Debug untuk melihat apa yang diterima

        let resultValidation = validateMeja(request.body);
        if (resultValidation.status === false) {
            return response.json({
                status: false,
                message: resultValidation.message
            });
        }

        await mejaModel.create(request.body);
        return response.json({
            status: true,
            message: 'Data meja berhasil ditambahkan'
        });
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        });
    }
};
exports.updateMeja = async (request, response) => {
    try {
        let id_meja = request.params.id_meja
        let resultValidation = validateMeja(request.body)
        if (resultValidation.status == false) {
            return response.json({
                status: false,
                message: resultValidation.message
            })
        }
        await mejaModel.update(request.body, {where: {id_meja: id_meja}})
        return response.json({
            status: true,
            message: 'Data meja berhasil diubah'
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
}
exports.deleteMeja = async (request, response) => {
    try {
        let id_meja = request.params.id_meja
        await mejaModel.destroy({ where: { id_meja: id_meja } })
        return response.json({
            status: true,
            message: `Data meja berhasil dihapus`
        })
    } catch (error) {
        return response.json({
            status: false,
            message: error.message
        })
    }
};