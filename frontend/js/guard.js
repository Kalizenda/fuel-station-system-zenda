(function () {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
  }

  const token = localStorage.getItem('token');
  const isLoginPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
  if (!token && !isLoginPage) {
    window.location.href = window.location.pathname.includes('/pages/')
      ? '../index.html'
      : 'index.html';
  }
})();
