const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu trữ file và tên file
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Lưu file vào thư mục public/uploads
        cb(null, path.join(__dirname, '..', 'public', 'uploads'));
    },
    filename: (req, file, cb) => {
        // Tạo tên file duy nhất để tránh trùng lặp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// Khởi tạo middleware upload
const upload = multer({ storage: storage });

module.exports = upload;