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

// Định nghĩa lại từng route cho các trang tĩnh để đảm bảo tính ổn định
router.get('/chinh-sach-bao-mat', (req, res) => { req.params.slug = 'chinh-sach-bao-mat'; productController.getStaticPage(req, res); });
router.get('/chinh-sach-doi-tra', (req, res) => { req.params.slug = 'chinh-sach-doi-tra'; productController.getStaticPage(req, res); });
router.get('/chinh-sach-giao-hang', (req, res) => { req.params.slug = 'chinh-sach-giao-hang'; productController.getStaticPage(req, res); });
router.get('/huong-dan-mua-hang', (req, res) => { req.params.slug = 'huong-dan-mua-hang'; productController.getStaticPage(req, res); });

// --- Article (Blog) Routes ---
router.get('/bai-viet', productController.getArticleListPage);
router.get('/bai-viet/:slug', productController.getArticleDetailPage);


module.exports = router;