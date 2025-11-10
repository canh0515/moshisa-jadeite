const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// Route cho trang chủ
router.get('/', productController.getHomePage);

// Route cho trang chi tiết sản phẩm
router.get('/san-pham/:id', productController.getProductDetailPage);

// Route cho trang danh sách sản phẩm
router.get('/san-pham', productController.getProductsPage);

// Route cho trang danh sách kiến thức
router.get('/kien-thuc', productController.getKnowledgeListPage);

// Route cho trang chi tiết một bài viết kiến thức
router.get('/kien-thuc/:slug', productController.getKnowledgeDetailPage);

// Route cho các trang tĩnh
router.get('/ve-chung-toi', productController.getAboutUsPage);
router.get('/lien-he', productController.getContactPage);

// --- Article (Blog) Routes ---
router.get('/bai-viet', productController.getArticleListPage);
router.get('/bai-viet/:slug', productController.getArticleDetailPage);

// Route động cho các trang tĩnh (phải đặt ở cuối)
// Sẽ bắt các slug như /chinh-sach-bao-mat, /chinh-sach-doi-tra, v.v.
router.get('/:slug', productController.getStaticPage);

module.exports = router;