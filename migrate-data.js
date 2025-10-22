// /home/rabbit/moshisa-jadeite/export-data.js

const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs').promises;

// --- Kết nối tới Database NGUỒN (SQLite) ---
const sqliteDb = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'database.sqlite'),
  logging: false,
});

/**
 * Hàm giúp escape giá trị để chèn vào câu lệnh SQL.
 * @param {*} val Giá trị cần escape.
 * @returns {string} Giá trị đã được escape.
 */
function escapeSQL(val) {
  if (val === null || val === undefined) {
    return 'NULL';
  }
  if (typeof val === 'boolean') {
    return val ? '1' : '0';
  }
  if (typeof val === 'number') {
    return val.toString();
  }
  // Thêm logic để xử lý định dạng ngày tháng từ SQLite
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(val)) {
    try {
      const date = new Date(val);
      // Định dạng lại thành 'YYYY-MM-DD HH:MM:SS' mà MySQL hiểu
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      return `'${year}-${month}-${day} ${hours}:${minutes}:${seconds}'`;
    } catch (e) { /* Bỏ qua và để hàm xử lý chuỗi bên dưới xử lý */ }
  }

  // Escape single quotes by doubling them up for SQL standard
  val = val.replace(/'/g, "''");
  return `'${val}'`;
}

/**
 * Hàm xuất dữ liệu của một bảng ra file .sql.
 * @param {string} tableName Tên bảng cần xuất.
 */
async function exportTableToSql(tableName) {
  console.log(`\nBắt đầu xuất dữ liệu bảng: ${tableName}...`);

  try {
    const [data] = await sqliteDb.query(`SELECT * FROM \`${tableName}\`;`);

    if (data.length === 0) {
      console.log(`=> Bảng ${tableName} không có dữ liệu để xuất.`);
      return;
    }

    const columns = Object.keys(data[0]);
    const columnList = columns.map(col => `\`${col}\``).join(', ');

    let sqlContent = '';

    // Tạo câu lệnh INSERT cho mỗi dòng
    for (const row of data) {
      const values = columns.map(col => escapeSQL(row[col])).join(', ');
      sqlContent += `INSERT INTO \`${tableName}\` (${columnList}) VALUES (${values});\n`;
    }

    const fileName = `${tableName.toLowerCase()}.sql`;
    await fs.writeFile(fileName, sqlContent);
    console.log(`=> Đã xuất thành công ${data.length} bản ghi ra file: ${fileName}`);
  } catch (error) {
    console.error(`=> Lỗi khi xuất bảng ${tableName}:`, error.message);
  }
}

/**
 * Hàm chính để chạy quá trình xuất dữ liệu.
 */
async function runExport() {
  try {
    console.log('Kiểm tra kết nối tới database SQLite...');
    await sqliteDb.authenticate();
    console.log('Kết nối SQLite thành công.');

    // Danh sách các bảng bạn muốn xuất
    const tablesToExport = ['Categories', 'Products', 'Settings', 'ProductCategory'];

    for (const tableName of tablesToExport) {
      await exportTableToSql(tableName);
    }

    console.log('\n*** QUÁ TRÌNH XUẤT DỮ LIỆU HOÀN TẤT! ***');
    console.log('Các file .sql đã được tạo trong thư mục gốc của dự án.');

  } catch (error) {
    console.error('\n!!! ĐÃ XẢY RA LỖI:', error);
  } finally {
    await sqliteDb.close();
    console.log('\nĐã đóng kết nối database.');
  }
}

runExport();
