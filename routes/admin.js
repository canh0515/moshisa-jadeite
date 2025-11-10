const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

const { isLoggedIn } = require('../middleware/auth');
const upload = require('../config/multer');

// --- Public Admin Routes ---
router.get('/login', adminController.getLoginPage);
router.post('/login', adminController.postLogin);
router.get('/logout', adminController.getLogout);

// --- Protected Admin Routes (middleware `isLoggedIn` sẽ được áp dụng cho tất cả các route bên dưới) ---
router.use(isLoggedIn);

// Middleware để đặt layout cho tất cả các route admin được bảo vệ
router.use((req, res, next) => {
  res.locals.layout = 'admin/layout';
  next();
});

// GET /admin
router.get('/', adminController.getAdminPage);

// GET /admin/add-product
router.get('/add-product', adminController.getAddProductPage);

// POST /admin/add-product - sử dụng middleware upload.array('images', 10)
router.post('/add-product', upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 } // Cho phép upload tối đa 5 video
]), adminController.postAddProduct);

// GET /admin/edit-product/:id - Hiển thị form sửa sản phẩm
router.get('/edit-product/:id', adminController.getEditProductPage);

// POST /admin/edit-product/:id - Cập nhật sản phẩm
router.post('/edit-product/:id', upload.fields([
  { name: 'new_images', maxCount: 10 },
  { name: 'new_videos', maxCount: 5 } // Cho phép upload tối đa 5 video mới
]), adminController.postEditProduct);

// POST /admin/delete-product/:id - Xóa sản phẩm
router.post('/delete-product/:id', adminController.postDeleteProduct);

// GET /admin/settings
router.get('/settings', adminController.getSettingsPage);

// POST /admin/settings - sử dụng middleware upload.fields để xử lý nhiều loại file
router.post('/settings', upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'payment_partners', maxCount: 5 },
  { name: 'shipping_partners', maxCount: 5 },
  { name: 'banner_image', maxCount: 1 }
]), adminController.postUpdateSettings);

// Route để xóa logo đối tác/carousel
router.post('/settings/delete-logo', adminController.postDeleteLogo);

// --- Carousel Routes ---
router.post('/carousel/add', upload.single('slide_image'), adminController.postAddCarouselSlide);
router.post('/carousel/delete', adminController.postDeleteCarouselSlide);


// --- Testimonials Routes ---

// GET /admin/testimonials
router.get('/testimonials', adminController.getTestimonialsPage);

// GET /admin/testimonials/add
router.get('/testimonials/add', adminController.getAddTestimonialPage);

// POST /admin/testimonials/add
router.post('/testimonials/add', upload.single('avatar'), adminController.postAddTestimonial);

// GET /admin/testimonials/edit/:id
router.get('/testimonials/edit/:id', adminController.getEditTestimonialPage);

// POST /admin/testimonials/edit/:id
router.post('/testimonials/edit/:id', upload.single('avatar'), adminController.postEditTestimonial);

// POST /admin/testimonials/delete/:id
router.post('/testimonials/delete/:id', adminController.postDeleteTestimonial);

// --- Knowledge Routes ---

// GET /admin/knowledge
router.get('/knowledge', adminController.getKnowledgePage);

// GET /admin/knowledge/add
router.get('/knowledge/add', adminController.getAddKnowledgePage);

// POST /admin/knowledge/add
router.post('/knowledge/add', adminController.postAddKnowledge);

// GET /admin/knowledge/edit/:id
router.get('/knowledge/edit/:id', adminController.getEditKnowledgePage);

// POST /admin/knowledge/edit/:id
router.post('/knowledge/edit/:id', adminController.postEditKnowledge);

// POST /admin/knowledge/delete/:id
router.post('/knowledge/delete/:id', adminController.postDeleteKnowledge);

// --- Article Routes ---

// GET /admin/articles
router.get('/articles', adminController.getArticlesPage);

// GET /admin/articles/add
router.get('/articles/add', adminController.getAddArticlePage);

// POST /admin/articles/add
router.post('/articles/add', upload.single('image'), adminController.postAddArticle);

// GET /admin/articles/edit/:id
router.get('/articles/edit/:id', adminController.getEditArticlePage);

// POST /admin/articles/edit/:id
router.post('/articles/edit/:id', upload.single('image'), adminController.postEditArticle);

// POST /admin/articles/delete/:id
router.post('/articles/delete/:id', adminController.postDeleteArticle);

// --- Category Routes ---

// GET /admin/categories
router.get('/categories', adminController.getCategoryPage);

// GET /admin/categories/add
router.get('/categories/add', adminController.getAddCategoryPage);

// POST /admin/categories/add
router.post('/categories/add', adminController.postAddCategory);

// GET /admin/categories/edit/:id
router.get('/categories/edit/:id', adminController.getEditCategoryPage);

// POST /admin/categories/edit/:id
router.post('/categories/edit/:id', adminController.postEditCategory);

// --- Video Library Routes ---
// GET /admin/videos
router.get('/videos', adminController.getVideosPage);

// POST /admin/videos/upload
router.post('/videos/upload', upload.single('video'), adminController.postUploadVideo);

// POST /admin/videos/delete
router.post('/videos/delete', adminController.postDeleteVideo);

// --- Page Content Routes ---

// GET /admin/page/:pageKey
router.get('/page/:pageKey', adminController.getPageEditor);

// POST /admin/page/:pageKey
router.post('/page/:pageKey', adminController.postPageEditor);

module.exports = router;