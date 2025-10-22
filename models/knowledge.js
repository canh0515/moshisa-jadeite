const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Knowledge = sequelize.define('Knowledge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Danh mục này sẽ dùng để liên kết với sản phẩm. Ví dụ: "Ngọc Trai", "Phỉ Thúy"
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // Mỗi loại ngọc chỉ có một bài kiến thức chính
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

module.exports = Knowledge;