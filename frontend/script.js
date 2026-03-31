const currentPage = window.location.pathname.split("/").pop() || "index.html";
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
  import(pageModules[currentPage]).catch((error) => {
    console.error(`Failed to load page module for ${currentPage}`, error);

    const statusElement = document.getElementById("studentsMessage")
      || document.getElementById("overviewMessage")
      || document.getElementById("attendanceMessage")
      || document.getElementById("academicsMessage")
      || document.getElementById("authMessage");

    if (statusElement) {
      statusElement.textContent =
        "This page did not finish loading its controls. Refresh once and open the portal through http://localhost:5000 or a local web server.";
      statusElement.dataset.state = "error";
    }
  });
}
