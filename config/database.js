const { Sequelize } = require('sequelize');

// Cấu hình kết nối tới MySQL
const sequelize = new Sequelize({
  dialect: 'mysql',
  logging: false,
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  database: process.env.DB_NAME || 'moshisa_jadeite_db',
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  dialectModule: require('mysql2') 
});

module.exports = sequelize;
