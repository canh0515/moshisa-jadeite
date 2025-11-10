const Product = require('../models/product');
const Testimonial = require('../models/testimonial');
const Knowledge = require('../models/knowledge');
const Setting = require('../models/setting');
const Category = require('../models/category');
const CarouselSlide = require('../models/carouselSlide');
const Article = require('../models/article');

// Hiển thị trang chủ với các sản phẩm nổi bật
exports.getHomePage = async (req, res) => {
  try {
    // Lấy dữ liệu không phụ thuộc trước
    const [testimonials, slides] = await Promise.all([
      Testimonial.findAll({
        order: [['createdAt', 'DESC']], // Tải kèm sản phẩm liên quan
        limit: 4
      }),
      CarouselSlide.findAll({ order: [['order', 'ASC']] })
    ]);

    // 1. Lấy các danh mục được đánh dấu là "nổi bật"
    const featuredCategories = await Category.findAll({
      where: { isFeatured: true },
      order: [['name', 'ASC']],
    });

    // 2. Với mỗi danh mục nổi bật, lấy 4 sản phẩm mới nhất.
    // Cách tiếp cận này (N+1 query) rõ ràng và hiệu quả về bộ nhớ cho trang chủ,
    // vì nó chỉ tải đúng 4 sản phẩm cho mỗi danh mục thay vì tải tất cả rồi lọc.
    for (const category of featuredCategories) {
      const products = await category.getProducts({
        limit: 4,
        order: [['createdAt', 'DESC']],
      });
      // Gán trực tiếp mảng sản phẩm vào đối tượng danh mục
      category.Products = products;
    }

    res.render('index', {
      pageTitle: 'Trang sức Ngọc Việt Nam - Trang chủ',
      testimonials: testimonials,
      slides: slides,
      featuredCategories: featuredCategories
    });
  } catch (err) {
    console.error("Lỗi khi lấy trang chủ:", err);
    res.status(500).send('Lỗi từ server');
  }
};

// --- Article (Blog) Pages ---

exports.getArticleListPage = async (req, res) => {
  try {
    const articles = await Article.findAll({ order: [['createdAt', 'DESC']] });
    res.render('articles', {
      pageTitle: 'Bài viết',
      articles: articles
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

exports.getArticleDetailPage = async (req, res) => {
  try {
    const article = await Article.findOne({ where: { slug: req.params.slug } });
    if (!article) {
      return res.status(404).send('Không tìm thấy bài viết');
    }
    res.render('article-detail', {
      pageTitle: article.title,
      article: article
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};



// Hiển thị trang danh sách sản phẩm (có lọc theo danh mục)
exports.getProductsPage = async (req, res) => {
  try {
    const selectedCategoryId = req.query.category;
    let productQueryOptions = {
      order: [['createdAt', 'DESC']],
      include: [Category] // Luôn tải kèm danh mục
    };

    if (selectedCategoryId) {
      // Thêm điều kiện lọc sản phẩm theo categoryId trực tiếp vào include
      productQueryOptions.include = [{
        model: Category,
        where: { id: selectedCategoryId },
        // Bắt buộc phải có include này để lọc, nhưng không cần trả về dữ liệu
        attributes: [] 
      }];
    }

    // Lấy danh sách tất cả các danh mục để hiển thị menu
    const categories = await Category.findAll({ order: [['name', 'ASC']] });
    
    // Bây giờ mới thực hiện truy vấn sản phẩm với các tùy chọn đã được xây dựng hoàn chỉnh
    const products = await Product.findAll(productQueryOptions);

    res.render('products', {
      pageTitle: 'Sản phẩm',
      products: products,
      categories: categories,
      selectedCategory: selectedCategoryId || 'Tất cả'
    });
  } catch (err) {
    console.error("Lỗi khi lấy trang sản phẩm:", err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị trang "Về chúng tôi"
exports.getAboutUsPage = async (req, res) => {
  try {
    const aboutUsContent = await Setting.findByPk('about_us_page_content');
    res.render('page', {
      pageTitle: 'Về chúng tôi',
      title: 'Về chúng tôi',
      content: aboutUsContent ? aboutUsContent.value : 'Nội dung đang được cập nhật.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị trang "Liên hệ"
exports.getContactPage = async (req, res) => {
  try {
    const contactContent = await Setting.findByPk('contact_page_content');
    res.render('page', {
      pageTitle: 'Liên hệ',
      title: 'Thông tin Liên hệ',
      content: contactContent ? contactContent.value : 'Nội dung đang được cập nhật.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị trang danh sách các bài viết kiến thức
exports.getKnowledgeListPage = async (req, res) => {
  try {
    const articles = await Knowledge.findAll({ order: [['title', 'ASC']] });
    res.render('knowledge', {
      pageTitle: 'Kiến thức về Trang sức',
      articles: articles
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị chi tiết một bài viết kiến thức
exports.getKnowledgeDetailPage = async (req, res) => {
  try {
    const article = await Knowledge.findOne({ where: { slug: req.params.slug } });
    if (!article) {
      return res.status(404).send('Không tìm thấy bài viết');
    }
    res.render('knowledge-detail', {
      pageTitle: article.title,
      article: article
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// --- Các trang chính sách ---

const staticPageConfigs = {
  'chinh-sach-bao-mat': { title: 'Chính sách bảo mật', contentKey: 'privacy_policy_content' },
  'chinh-sach-doi-tra': { title: 'Chính sách đổi trả', contentKey: 'return_policy_content' },
  'chinh-sach-giao-hang': { title: 'Chính sách giao hàng', contentKey: 'shipping_policy_content' },
  'huong-dan-mua-hang': { title: 'Hướng dẫn mua hàng', contentKey: 'shopping_guide_content' }
};

exports.getStaticPage = async (req, res) => {
  const pageKey = req.params.slug;
  const config = staticPageConfigs[pageKey];

  if (!config) {
    return res.status(404).send('Trang không tồn tại');
  }

  try {
    const setting = await Setting.findByPk(config.contentKey);
    res.render('page', {
      pageTitle: config.title,
      title: config.title,
      content: setting ? setting.value : 'Nội dung đang được cập nhật.'
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};

// Hiển thị trang chi tiết sản phẩm
exports.getProductDetailPage = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findByPk(productId, {
      include: Category // Eager load các danh mục của sản phẩm
    });

    if (!product) {
      return res.status(404).send('Không tìm thấy sản phẩm');
    }

    // Tìm bài viết kiến thức liên quan dựa trên danh mục sản phẩm
    // Lấy danh sách tên các danh mục của sản phẩm
    const productCategoryNames = product.Categories.map(c => c.name);
    // Tìm TẤT CẢ các bài viết kiến thức có danh mục nằm trong danh sách trên
    const knowledgeArticles = await Knowledge.findAll({ where: { category: productCategoryNames } });

    let images = [];
    let videos = [];
    try {
      if (product.images) {
        images = JSON.parse(product.images);
      }
      if (product.video_urls) {
        videos = JSON.parse(product.video_urls);
      }
    } catch (e) {
      console.error("Lỗi parse JSON media sản phẩm:", e);
    }

    res.render('product-detail', {
      pageTitle: product.name,
      product: product,
      images: images,
      videos: videos,
      knowledgeArticles: knowledgeArticles
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi từ server');
  }
};
