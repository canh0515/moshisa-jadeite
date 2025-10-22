const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Testimonial = sequelize.define('Testimonial', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  position: {
    type: DataTypes.STRING,
    allowNull: true // Ví dụ: "Giám đốc công ty ABC"
  },
  avatarUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  reviewText: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

module.exports = Testimonial;