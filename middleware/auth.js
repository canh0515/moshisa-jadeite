exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    // Nếu đã đăng nhập, cho phép tiếp tục
    return next();
  }
  // Nếu chưa, chuyển hướng về trang đăng nhập
  res.redirect('/admin/login');
};