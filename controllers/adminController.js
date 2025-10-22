const Product = require('../models/product');
const sequelize = require('../config/database'); // Import sequelize instance
const fs = require('fs').promises;
const path = require('path');
const Setting = require('../models/setting');
const Testimonial = require('../models/testimonial');
const Knowledge = require('../models/knowledge');
const Category = require('../models/category');
const slugify = require('slugify');
const CarouselSlide = require('../models/carouselSlide');
const Article = require('../models/article');

// --- Authentication ---

// Hiển thị trang đăng nhập
exports.getLoginPage = (req, res) => {
  res.render('admin/login', {
    pageTitle: 'Đăng nhập Admin',
    layout: false // Không sử dụng layout admin cho trang này
  });
};

// Xử lý đăng nhập
exports.postLogin = (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true; // Lưu trạng thái đăng nhập vào session
    res.redirect('/admin');
  } else {
    res.redirect('/admin/login?error=1');
  }
};

// Xử lý đăng xuất
exports.getLogout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
};

// Hiển thị trang admin chính với danh sách sản phẩm
exports.getAdminPage = async (req, res) => {
  try {
    const products = await Product.findAll({ 
      include: Category,
      order: [['createdAt', 'DESC']] 
    });
    res.render('admin/index', {
      pageTitle: 'Trang Quản Trị',
      products: products,
      successMessage: req.flash('success'), // Lấy thông báo thành công
      errorMessage: req.flash('error'),     // Lấy thông báo lỗi
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị form thêm sản phẩm
exports.getAddProductPage = async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
  const files = await fs.readdir(uploadDir);
  
  // Lọc ra các file video
  const videos = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp4', '.webm', '.ogg'].includes(ext);
  }).map(file => `/uploads/${file}`);

  res.render('admin/add-product', {
    pageTitle: 'Thêm Sản Phẩm Mới',
    categories: categories,
    videos: videos
  });
};

// Xử lý việc thêm sản phẩm mới
exports.postAddProduct = async (req, res) => {
  const { name, price, description, categories, video_urls } = req.body;
  const uploadedImages = req.files.images || [];
  const uploadedVideos = req.files.videos || [];

  // req.files là một object chứa các mảng file được upload bởi multer
  if (uploadedImages.length === 0) {
    req.flash('error', 'Vui lòng upload ít nhất một hình ảnh.');
    return res.redirect('back');
  }

  // Lấy đường dẫn của các file ảnh đã upload
  const imagePaths = uploadedImages.map(file => '/uploads/' + file.filename);

  // Lấy đường dẫn của các file video đã upload
  const videoPaths = uploadedVideos.map(file => '/uploads/' + file.filename);

  // Gộp các video đã chọn từ thư viện và video mới upload
  const existingVideoUrls = video_urls ? JSON.parse(video_urls) : [];
  const allVideoUrls = JSON.stringify([...existingVideoUrls, ...videoPaths]);

  try {
    const product = await Product.create({
      name, price, description,
      images: JSON.stringify(imagePaths), // Chuyển mảng thành chuỗi JSON để lưu
      video_urls: allVideoUrls // Lưu mảng tất cả video urls
    });
    // Đảm bảo `categories` luôn là một mảng
    const categoriesToSet = categories ? (Array.isArray(categories) ? categories : [categories]) : [];

    // Gán các danh mục đã chọn cho sản phẩm
    await product.setCategories(categoriesToSet);
    
    req.flash('success', 'Đã thêm sản phẩm thành công!');
    // Sau khi thêm thành công, chuyển hướng về trang admin
    res.redirect('/admin');
  } catch (err) {
    console.error('Lỗi khi thêm sản phẩm:', err);
    req.flash('error', 'Không thể thêm sản phẩm.');
    res.status(500).send('Không thể thêm sản phẩm');
  }
};

// Hiển thị form sửa sản phẩm
exports.getEditProductPage = async (req, res) => {
  try {
    const productId = req.params.id;
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');

    const [product, categories, files] = await Promise.all([
      Product.findByPk(productId, {
        // Eager load các danh mục của sản phẩm
        include: Category 
      }),
      Category.findAll({ order: [['name', 'ASC']] }),
      fs.readdir(uploadDir)
    ]);

    if (!product) {
      return res.status(404).send('Không tìm thấy sản phẩm');
    }

    // Lọc ra các file video
    const videos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.ogg'].includes(ext);
    }).map(file => `/uploads/${file}`);

    res.render('admin/edit-product', {
      pageTitle: 'Sửa sản phẩm',
      product: product,
      categories: categories,
      videos: videos,
    });
  } catch (err) {
    console.error('Lỗi khi lấy sản phẩm để sửa:', err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý cập nhật sản phẩm
exports.postEditProduct = async (req, res) => {
  const productId = req.params.id;
  const { name, price, description, categories, existing_media, video_urls } = req.body;

  // Bắt đầu một transaction
  try {
    await sequelize.transaction(async (t) => {
      const product = await Product.findByPk(productId, { transaction: t });
      if (!product) {
        throw new Error('Không tìm thấy sản phẩm');
      }

      // Xử lý ảnh
      let imagePaths = [];
      try {
        if (typeof existing_media === 'string' && existing_media.length > 0) {
          imagePaths = JSON.parse(existing_media);
        }
      } catch (e) {
        console.error('Lỗi khi parse existing_media JSON:', e);
      }

      // Thêm ảnh mới nếu có
      if (req.files && req.files.new_images) {
        const newImagePaths = req.files.new_images.map(file => '/uploads/' + file.filename);
        imagePaths.push(...newImagePaths);
      }

      // Xử lý video
      let videoPaths = [];
      try {
        if (typeof video_urls === 'string' && video_urls.length > 0) {
          videoPaths = JSON.parse(video_urls);
        }
      } catch (e) {
        console.error('Lỗi khi parse video_urls JSON:', e);
      }
      if (req.files && req.files.new_videos) {
        const newVideoPaths = req.files.new_videos.map(file => '/uploads/' + file.filename);
        videoPaths.push(...newVideoPaths);
      }

      // Cập nhật thông tin sản phẩm
      await product.update({
        name, price, description,
        images: JSON.stringify(imagePaths),
        video_urls: JSON.stringify(videoPaths)
      }, { transaction: t });

      // Đảm bảo `categories` luôn là một mảng, ngay cả khi chỉ có một giá trị được chọn
      const categoriesToSet = categories ? (Array.isArray(categories) ? categories : [categories]) : [];
      
      // Gán lại các danh mục cho sản phẩm
      await product.setCategories(categoriesToSet, { transaction: t });
    });
    req.flash('success', 'Đã cập nhật sản phẩm thành công!');
    res.redirect('/admin'); // Chuyển hướng sau khi transaction thành công
  } catch (err) {
    console.error('Lỗi khi cập nhật sản phẩm:', err);
    req.flash('error', 'Không thể cập nhật sản phẩm.');
    res.redirect('/admin');
  }
};

// Xử lý xóa sản phẩm
exports.postDeleteProduct = async (req, res) => {
  const productId = req.params.id;
  await Product.destroy({ where: { id: productId } });
  req.flash('success', 'Đã xóa sản phẩm thành công!');
  res.redirect('/admin');
};

// Hiển thị trang cài đặt chung
exports.getSettingsPage = async (req, res) => {
  const [articles, slides] = await Promise.all([
    Article.findAll({ order: [['title', 'ASC']] }),
    CarouselSlide.findAll({ order: [['order', 'ASC']] })
  ]);
  res.render('admin/settings', {
    pageTitle: 'Cài đặt chung',
    articles: articles,
      slides: slides
  });
};

// Xử lý cập nhật cài đặt
exports.postUpdateSettings = async (req, res) => {
  const { 
    site_name, footer_info, phone_number,
    banner_title, banner_subtitle, banner_button_text, banner_button_link,
    featured_products_title, testimonials_title, footer_about_us_text, about_us_business_info, color_primary, color_accent,
    about_us_phone, about_us_address, about_us_email, banner_article_link, chat_link,
    existing_payment_partners, existing_shipping_partners
  } = req.body;

  try {
    const settingsToUpdate = [
      { key: 'site_name', value: site_name },
      { key: 'footer_info', value: footer_info },
      { key: 'phone_number', value: phone_number },
      { key: 'banner_title', value: banner_title },
      { key: 'banner_subtitle', value: banner_subtitle },
      { key: 'banner_button_text', value: banner_button_text },
      { key: 'banner_button_link', value: banner_button_link },
      { key: 'banner_article_link', value: banner_article_link },
      { key: 'featured_products_title', value: featured_products_title },
      { key: 'testimonials_title', value: testimonials_title },
      { key: 'footer_about_us_text', value: footer_about_us_text },
      { key: 'about_us_business_info', value: about_us_business_info },
      { key: 'about_us_phone', value: about_us_phone },
      { key: 'about_us_address', value: about_us_address },
      { key: 'about_us_email', value: about_us_email },
      { key: 'color_primary', value: color_primary },
      { key: 'color_accent', value: color_accent },
    ];

    // Nếu có file logo mới được upload
    if (req.files && req.files.logo) {
      // Lưu đường dẫn tương đối vào DB, ví dụ: /uploads/logo-1678886400000.png
      const logoUrl = '/uploads/' + req.files.logo[0].filename;
      settingsToUpdate.push({ key: 'logo_url', value: logoUrl });
    }

    // Nếu có file ảnh banner mới được upload
    if (req.files && req.files.banner_image) {
      const bannerImageUrl = '/uploads/' + req.files.banner_image[0].filename;
      settingsToUpdate.push({ key: 'banner_image_url', value: bannerImageUrl });
    }

    // Xử lý logo đối tác thanh toán
    let paymentPartners = existing_payment_partners ? JSON.parse(existing_payment_partners) : [];
    if (req.files && req.files.payment_partners) {
      const newPaymentLogos = req.files.payment_partners.map(file => '/uploads/' + file.filename);
      paymentPartners.push(...newPaymentLogos);
    }
    settingsToUpdate.push({ key: 'payment_partners', value: JSON.stringify(paymentPartners) });

    // Xử lý logo đối tác vận chuyển
    let shippingPartners = existing_shipping_partners ? JSON.parse(existing_shipping_partners) : [];
    if (req.files && req.files.shipping_partners) {
      const newShippingLogos = req.files.shipping_partners.map(file => '/uploads/' + file.filename);
      shippingPartners.push(...newShippingLogos);
    }
    settingsToUpdate.push({ key: 'shipping_partners', value: JSON.stringify(shippingPartners) });

    // Dùng bulkCreate với option `updateOnDuplicate` để vừa tạo mới vừa cập nhật
    await Setting.bulkCreate(settingsToUpdate, {
      updateOnDuplicate: ['value']
    });

    res.redirect('/admin/settings');
  } catch (err) {
    console.error('Lỗi khi cập nhật cài đặt:', err);
    res.status(500).send('Không thể cập nhật cài đặt');
  }
};

// Xử lý xóa logo/slide
exports.postDeleteLogo = async (req, res) => {
  const { partnerType, logoUrl } = req.body;

  if (!partnerType || !logoUrl) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin.' });
  }

  // Ánh xạ partnerType từ client tới key trong database
  const settingKeys = {
    'payment_partners': 'payment_partners', // Key phải là chuỗi ký tự
    'shipping_partners': 'shipping_partners' // Key phải là chuỗi ký tự
  };

  const settingKey = settingKeys[partnerType];
  if (!settingKey) {
    return res.status(400).json({ success: false, message: 'Loại đối tác không hợp lệ.' });
  }

  try {
    const setting = await Setting.findByPk(settingKey);
    const logos = setting && setting.value ? JSON.parse(setting.value) : [];
    const updatedLogos = logos.filter(url => url !== logoUrl);
    await Setting.upsert({ key: settingKey, value: JSON.stringify(updatedLogos) });
    res.json({ success: true, message: 'Xóa thành công.' });
  } catch (err) {
    console.error("Lỗi khi xóa logo:", err);
    res.status(500).json({ success: false, message: 'Lỗi từ server.' });
  }
};

// --- Quản lý Carousel ---

exports.postAddCarouselSlide = async (req, res) => {
  const { title, description, link } = req.body;
  if (!req.file) {
    return res.status(400).send('Vui lòng upload ảnh cho slide.');
  }
  const imageUrl = '/uploads/' + req.file.filename;

  try {
    await CarouselSlide.create({
      imageUrl,
      title,
      description,
      link
    });
    res.redirect('/admin/settings');
  } catch (err) {
    console.error('Lỗi khi thêm slide:', err);
    res.status(500).send('Không thể thêm slide');
  }
};

exports.postDeleteCarouselSlide = async (req, res) => {
  const { slideId } = req.body;
  try {
    await CarouselSlide.destroy({ where: { id: slideId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
};

// --- Quản lý Đánh giá (Testimonials) ---

// Hiển thị trang quản lý đánh giá
exports.getTestimonialsPage = async (req, res) => {
  try {
    const testimonials = await Testimonial.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/testimonials', {
      pageTitle: 'Quản lý Đánh giá',
      testimonials: testimonials,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị form thêm đánh giá
exports.getAddTestimonialPage = (req, res) => {
  res.render('admin/add-testimonial', {
    pageTitle: 'Thêm Đánh giá mới'
  });
};

// Xử lý thêm đánh giá mới
exports.postAddTestimonial = async (req, res) => {
  const { name, position, reviewText } = req.body;
  if (!req.file) {
    return res.status(400).send('Vui lòng upload ảnh đại diện (avatar).');
  }
  const avatarUrl = '/uploads/' + req.file.filename;

  try {
    await Testimonial.create({ name, position, reviewText, avatarUrl });
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error('Lỗi khi thêm đánh giá:', err);
    res.status(500).send('Không thể thêm đánh giá');
  }
};

// Hiển thị form sửa đánh giá
exports.getEditTestimonialPage = async (req, res) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).send('Không tìm thấy đánh giá');
    }
    res.render('admin/edit-testimonial', {
      pageTitle: 'Sửa Đánh giá',
      testimonial: testimonial
    });
  } catch (err) {
    console.error('Lỗi khi lấy đánh giá để sửa:', err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý cập nhật đánh giá
exports.postEditTestimonial = async (req, res) => {
  const { name, position, reviewText } = req.body;
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).send('Không tìm thấy đánh giá');
    }

    let avatarUrl = testimonial.avatarUrl;
    if (req.file) {
      avatarUrl = '/uploads/' + req.file.filename;
    }

    await testimonial.update({ name, position, reviewText, avatarUrl });
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error('Lỗi khi cập nhật đánh giá:', err);
    res.status(500).send('Không thể cập nhật đánh giá');
  }
};

// Xử lý xóa đánh giá
exports.postDeleteTestimonial = async (req, res) => {
  try {
    const { id } = req.body;
    await Testimonial.destroy({ where: { id: id } });
    res.redirect('/admin/testimonials');
  } catch (err) {
    console.error('Lỗi khi xóa đánh giá:', err);
    res.status(500).send('Không thể xóa đánh giá');
  }
};

// --- Quản lý Kiến thức (Knowledge) ---

// Hiển thị trang quản lý bài viết kiến thức
exports.getKnowledgePage = async (req, res) => {
  try {
    const articles = await Knowledge.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/knowledge', {
      pageTitle: 'Quản lý Kiến thức',
      articles: articles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị form thêm bài viết
exports.getAddKnowledgePage = async (req, res) => {
  const categories = await Category.findAll({ order: [['name', 'ASC']] });
  res.render('admin/add-knowledge', {
    pageTitle: 'Thêm bài viết mới',
    categories: categories,
  });
};

// Xử lý thêm bài viết mới
exports.postAddKnowledge = async (req, res) => {
  const { title, category, content } = req.body;
  try {
    const slug = slugify(title, { lower: true, strict: true });
    await Knowledge.create({ title, category, content, slug });
    res.redirect('/admin/knowledge');
  } catch (err) {
    console.error('Lỗi khi thêm bài viết:', err);
    res.status(500).send('Không thể thêm bài viết');
  }
};

// Hiển thị form sửa bài viết kiến thức
exports.getEditKnowledgePage = async (req, res) => {
  try {
    const [article, categories] = await Promise.all([
      Knowledge.findByPk(req.params.id),
      Category.findAll({ order: [['name', 'ASC']] })
    ]);
    if (!article) {
      return res.status(404).send('Không tìm thấy bài viết');
    }
    res.render('admin/edit-knowledge', {
      pageTitle: 'Sửa bài viết kiến thức',
      article: article,
      categories: categories
    });
  } catch (err) {
    console.error('Lỗi khi lấy bài viết kiến thức để sửa:', err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý cập nhật bài viết kiến thức
exports.postEditKnowledge = async (req, res) => {
  const { title, category, content } = req.body;
  try {
    const article = await Knowledge.findByPk(req.params.id);
    if (article) {
      const slug = slugify(title, { lower: true, strict: true });
      await article.update({ title, category, content, slug });
    }
    res.redirect('/admin/knowledge');
  } catch (err) {
    console.error('Lỗi khi cập nhật bài viết kiến thức:', err);
    res.status(500).send('Không thể cập nhật bài viết');
  }
};

// Xử lý xóa bài viết kiến thức
exports.postDeleteKnowledge = async (req, res) => {
  try {
    await Knowledge.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/knowledge');
  } catch (err) {
    console.error('Lỗi khi xóa bài viết kiến thức:', err);
    res.status(500).send('Không thể xóa bài viết');
  }
};


// --- Quản lý Bài viết (Articles) ---

exports.getArticlesPage = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [['createdAt', 'DESC']] });
    res.render('admin/articles', {
      pageTitle: 'Quản lý Bài viết',
      articles: articles,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

exports.getAddArticlePage = (req, res) => {
  res.render('admin/add-article', {
    pageTitle: 'Thêm Bài viết mới'
  });
};

exports.postAddArticle = async (req, res) => {
  const { title, content } = req.body;
  let imageUrl = null;

  if (req.file) {
    imageUrl = '/uploads/' + req.file.filename;
  }

  try {
    const slug = slugify(title, { lower: true, strict: true });
    await Article.create({ title, content, imageUrl, slug });
    res.redirect('/admin/articles');
  } catch (err) {
    console.error('Lỗi khi thêm bài viết:', err);
    res.status(500).send('Không thể thêm bài viết');
  }
};

// Hiển thị form sửa bài viết
exports.getEditArticlePage = async (req, res) => {
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).send('Không tìm thấy bài viết');
    }
    res.render('admin/edit-article', {
      pageTitle: 'Sửa Bài viết',
      article: article,
    });
  } catch (err) {
    console.error('Lỗi khi lấy bài viết để sửa:', err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý cập nhật bài viết
exports.postEditArticle = async (req, res) => {
  const { title, content } = req.body;
  try {
    const article = await Article.findByPk(req.params.id);
    if (!article) {
      return res.status(404).send('Không tìm thấy bài viết');
    }

    let imageUrl = article.imageUrl;
    if (req.file) {
      imageUrl = '/uploads/' + req.file.filename;
    }

    const slug = slugify(title, { lower: true, strict: true });
    await article.update({ title, content, imageUrl, slug });
    res.redirect('/admin/articles');
  } catch (err) {
    console.error('Lỗi khi cập nhật bài viết:', err);
    res.status(500).send('Không thể cập nhật bài viết');
  }
};

// Xử lý xóa bài viết
exports.postDeleteArticle = async (req, res) => {
  try {
    await Article.destroy({ where: { id: req.params.id } });
    res.redirect('/admin/articles');
  } catch (err) {
    console.error('Lỗi khi xóa bài viết:', err);
    res.status(500).send('Không thể xóa bài viết');
  }
};


// --- Quản lý Danh mục (Categories) ---

// Hiển thị trang quản lý danh mục
exports.getCategoryPage = async (req, res) => {
  try {
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    res.render('admin/categories', {
      pageTitle: 'Quản lý Danh mục',
      categories: categories,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị form thêm danh mục
exports.getAddCategoryPage = (req, res) => {
  res.render('admin/add-category', {
    pageTitle: 'Thêm Danh mục mới'
  });
};

// Xử lý thêm danh mục mới
exports.postAddCategory = async (req, res) => {
  const { name, isFeatured } = req.body;
  try {
    await Category.create({ name, isFeatured: !!isFeatured });
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Lỗi khi thêm danh mục:', err);
    res.status(500).send('Không thể thêm danh mục');
  }
};

// Hiển thị form sửa danh mục
exports.getEditCategoryPage = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) {
      return res.status(404).send('Không tìm thấy danh mục');
    }
    res.render('admin/edit-category', {
      pageTitle: 'Sửa Danh mục',
      category: category,
    });
  } catch (err) {
    console.error('Lỗi khi lấy danh mục để sửa:', err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý cập nhật danh mục
exports.postEditCategory = async (req, res) => {
  const { name, isFeatured } = req.body;
  try {
    const category = await Category.findByPk(req.params.id);
    if (category) {
      await category.update({ name, isFeatured: !!isFeatured });
    }
    res.redirect('/admin/categories');
  } catch (err) {
    console.error('Lỗi khi cập nhật danh mục:', err);
    res.status(500).send('Không thể cập nhật danh mục');
  }
};

// --- Quản lý Video ---

// Hiển thị trang quản lý video
exports.getVideosPage = async (req, res) => {
  try {
    const uploadDir = path.join(__dirname, '..', 'public', 'uploads');
    const files = await fs.readdir(uploadDir);
    
    // Lọc ra các file video
    const videos = files.filter(file => {
      const ext = path.extname(file).toLowerCase();
      return ['.mp4', '.webm', '.ogg'].includes(ext);
    }).map(file => `/uploads/${file}`); // Tạo đường dẫn tương đối

    res.render('admin/videos', {
      pageTitle: 'Thư viện Video',
      videos: videos,
      successMessage: req.flash('success'),
      errorMessage: req.flash('error')
    });
  } catch (err) {
    console.error("Lỗi khi đọc thư mục video:", err);
    res.status(500).send('Lỗi từ server');
  }
};

// Xử lý upload video mới
exports.postUploadVideo = (req, res) => {
  if (!req.file) {
    req.flash('error', 'Vui lòng chọn một file video để upload.');
  } else {
    req.flash('success', 'Upload video thành công!');
  }
  res.redirect('/admin/videos');
};

// Xử lý xóa video
exports.postDeleteVideo = async (req, res) => {
  const { videoUrl } = req.body; // ví dụ: /uploads/my-video.mp4

  if (!videoUrl) {
    req.flash('error', 'Không có video nào được chọn để xóa.');
    return res.redirect('/admin/videos');
  }

  try {
    // Xây dựng đường dẫn tuyệt đối đến file
    // videoUrl có dạng '/uploads/video.mp4', ta cần lấy tên file
    const filename = path.basename(videoUrl);
    const filePath = path.join(__dirname, '..', 'public', 'uploads', filename);

    // Kiểm tra file có tồn tại không trước khi xóa
    await fs.access(filePath);
    await fs.unlink(filePath);

    req.flash('success', `Đã xóa video "${filename}" thành công!`);
  } catch (error) {
    console.error('Lỗi khi xóa video:', error);
    if (error.code === 'ENOENT') {
      req.flash('error', 'Không tìm thấy file video để xóa.');
    } else {
      req.flash('error', 'Đã xảy ra lỗi khi xóa video.');
    }
  }

  res.redirect('/admin/videos');
};

// --- Quản lý Nội dung Trang (Pages) ---

const pageConfigs = {
  'about-us': {
    title: 'Chỉnh sửa trang "Về chúng tôi"',
    contentKey: 'about_us_page_content'
  },
  'contact': {
    title: 'Chỉnh sửa trang "Liên hệ"',
    contentKey: 'contact_page_content'
  },
  'privacy-policy': {
    title: 'Chỉnh sửa Chính sách bảo mật',
    contentKey: 'privacy_policy_content'
  },
  'return-policy': {
    title: 'Chỉnh sửa Chính sách đổi trả',
    contentKey: 'return_policy_content'
  },
  'shipping-policy': {
    title: 'Chỉnh sửa Chính sách giao hàng',
    contentKey: 'shipping_policy_content'
  },
  'shopping-guide': {
    title: 'Chỉnh sửa Hướng dẫn mua hàng',
    contentKey: 'shopping_guide_content'
  }
};

// Hiển thị trang chỉnh sửa nội dung
exports.getPageEditor = async (req, res) => {
  const pageKey = req.params.pageKey;
  const config = pageConfigs[pageKey];

  if (!config) return res.status(404).send('Trang không tồn tại');

  const setting = await Setting.findByPk(config.contentKey);

  res.render('admin/page-editor', {
    pageTitle: config.title,
    pageKey: pageKey,
    content: setting ? setting.value : '',
  });
};

// Xử lý cập nhật nội dung trang
exports.postPageEditor = async (req, res) => {
  const pageKey = req.params.pageKey;
  const config = pageConfigs[pageKey];
  const { content } = req.body;

  if (!config) return res.status(404).send('Trang không tồn tại');

  await Setting.upsert({ key: config.contentKey, value: content });

  res.redirect(`/admin/page/${pageKey}`);
};
