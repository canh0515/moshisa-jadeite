const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  // Các thuộc tính của model được định nghĩa ở đây
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
  price: {
    // Thay đổi thành STRING để lưu được cả số và chữ "Liên hệ"
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  images: {
    // Lưu một mảng các URL hình ảnh dưới dạng chuỗi JSON
    type: DataTypes.TEXT,
    allowNull: true // Cho phép null vì media có thể không có
  },
  video_urls: {
    // Lưu một mảng các URL video dưới dạng chuỗi JSON
    type: DataTypes.TEXT,
    allowNull: true
  }
  // Sequelize tự động thêm các trường `createdAt` và `updatedAt`
});

module.exports = Product;