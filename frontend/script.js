const currentPage = window.location.pathname.split("/").pop();
const pageModules = {
  "admin-login.html": "./js/auth.js",
  "student-login.html": "./js/auth.js",
  "admin.html": "./js/admin-overview.js",
  "admin-students.html": "./js/admin-students.js",
  "admin-academics.html": "./js/admin-academics.js",
  "admin-attendance.html": "./js/admin-attendance.js",
  "dashboard.html": "./js/dashboard.js"
};

if (pageModules[currentPage]) {
  import(pageModules[currentPage]);
}
