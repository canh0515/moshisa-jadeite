# Hướng dẫn Triển khai Ứng dụng Moshisa Jadeite lên Server Ubuntu

Tài liệu này ghi lại các bước cần thiết để cài đặt và triển khai ứng dụng từ đầu trên một server Ubuntu mới.

## Phần 1: Cài đặt Môi trường Server

### Bước 1.1: Cài đặt MySQL Server

```bash
# Cập nhật danh sách gói của hệ thống
sudo apt update

# Cài đặt MySQL Server
sudo apt install mysql-server -y
```

### Bước 1.2: Cấu hình bảo mật cho MySQL

Chạy kịch bản bảo mật và làm theo các hướng dẫn.

```bash
sudo mysql_secure_installation
```

Bạn sẽ được hỏi một loạt câu hỏi, hãy chọn các tùy chọn sau:
- **VALIDATE PASSWORD COMPONENT?**: `Y` (Yes) -> Chọn mức độ phức tạp mật khẩu (ví dụ: `1` cho MEDIUM).
- **New password**: Nhập mật khẩu mới cho người dùng `root` của MySQL. **Hãy ghi nhớ mật khẩu này.**
- **Remove anonymous users?**: `Y` (Yes).
- **Disallow root login remotely?**: `Y` (Yes).
- **Remove test database and access to it?**: `Y` (Yes).
- **Reload privilege tables now?**: `Y` (Yes).

### Bước 1.3: Tạo Database và User cho Ứng dụng

Đăng nhập vào MySQL và tạo một database cùng với một người dùng riêng cho ứng dụng để tăng cường bảo mật.

```bash
# Đăng nhập vào MySQL với quyền root của hệ thống
sudo mysql
```

Sau khi vào được dấu nhắc `mysql>`, hãy chạy các lệnh SQL sau. **Nhớ thay `your_strong_password` bằng một mật khẩu mạnh của riêng bạn.**

```sql
-- Tạo database
CREATE DATABASE moshisa_jadeite_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo người dùng mới
CREATE USER 'moshisa_user'@'localhost' IDENTIFIED BY 'your_strong_password';

-- Cấp toàn bộ quyền cho người dùng trên database vừa tạo
GRANT ALL PRIVILEGES ON moshisa_jadeite_db.* TO 'moshisa_user'@'localhost';

-- Áp dụng các thay đổi
FLUSH PRIVILEGES;

-- Thoát
EXIT;
```

### Bước 1.4: Cài đặt Node.js và Git

```bash
# Cài đặt Node.js (phiên bản 18.x được khuyến nghị)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

## Phần 2: Triển khai Ứng dụng

### Bước 2.1: Lấy mã nguồn từ Git

```bash
# Clone repository của bạn vào thư mục home
git clone <URL_REPOSITORY_CUA_BAN> moshisa-jadeite
cd moshisa-jadeite
```

### Bước 2.2: Cài đặt các gói phụ thuộc

```bash
npm install
```

### Bước 2.3: Tạo file môi trường `.env`

Tạo một file `.env` mới và điền thông tin kết nối database bạn đã tạo ở trên.

```bash
nano .env
```

Dán nội dung sau vào, thay thế `your_strong_password` và các giá trị khác nếu cần:

```env
PORT=3000
SESSION_SECRET=mot_chuoi_bi_mat_dai_nao_do
ADMIN_PASSWORD=mat_khau_admin_cua_ban

DB_HOST=localhost
DB_PORT=3306
DB_NAME=moshisa_jadeite_db
DB_USER=moshisa_user
DB_PASSWORD=your_strong_password
```

### Bước 2.4: Tạo cấu trúc và Nhập dữ liệu vào Database

Sử dụng các file `.sql` bạn đã chuẩn bị để thiết lập database.

```bash
# 1. Tạo cấu trúc (schema) từ file schema.sql
mysql -u moshisa_user -p < schema.sql

# 2. Nhập dữ liệu cho các bảng (bạn sẽ cần nhập mật khẩu cho mỗi lệnh)
mysql -u moshisa_user -p moshisa_jadeite_db < categories.sql
mysql -u moshisa_user -p moshisa_jadeite_db < products.sql
mysql -u moshisa_user -p moshisa_jadeite_db < settings.sql
mysql -u moshisa_user -p moshisa_jadeite_db < productcategory.sql
```

## Phần 3: Chạy Ứng dụng

### Bước 3.1: Khởi động ứng dụng

```bash
node server.js
```

Nếu bạn thấy thông báo "Server đang chạy tại http://localhost:3000", có nghĩa là ứng dụng đã triển khai thành công!

### Bước 3.2 (Tùy chọn - Khuyến khích): Chạy ứng dụng với PM2

PM2 là một trình quản lý tiến trình giúp ứng dụng của bạn tự động khởi động lại khi gặp lỗi và chạy ngầm.

```bash
# Cài đặt PM2
sudo npm install pm2 -g

# Khởi động ứng dụng của bạn bằng PM2
pm2 start server.js --name "moshisa-app"

# Lưu lại danh sách ứng dụng để tự khởi động cùng server
pm2 save

# Cấu hình PM2 để tự khởi động khi reboot
pm2 startup
```

Chúc bạn triển khai thành công!