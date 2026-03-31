const currentPage = window.location.pathname.split("/").pop();
const pageModules = {
  "admin-login.html": "./js/auth.js",
  "student-login.html": "./js/auth.js",
  "admin.html": "./js/admin.js",
  "dashboard.html": "./js/dashboard.js"
};

if (pageModules[currentPage]) {
  import(pageModules[currentPage]);
}
