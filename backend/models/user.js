'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      this.hasMany(models.transaksi, {
        foreignKey: 'id_transaksi', as: 'transaksi'
      })
    }
  }
  user.init({
    id_user: {
      primaryKey: true,
      autoIncrement: true,
      type: DataTypes.INTEGER
    },
    nama_user: DataTypes.STRING,
    role: DataTypes.ENUM('admin', 'kasir', 'manager'),
    username: DataTypes.STRING,
    password: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'user'
  });
  return user;
};