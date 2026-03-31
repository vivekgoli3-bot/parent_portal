const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://parent-portal-1.onrender.com";

const LOGIN_PAGE_BY_ROLE = {
  admin: "admin-login.html",
  parent: "student-login.html"
};

const HOME_PAGE_BY_ROLE = {
  admin: "admin.html",
  parent: "dashboard.html"
};

function getCurrentPage() {
  return window.location.pathname.split("/").pop();
}

function getLoginPageForCurrentContext() {
  const currentPage = getCurrentPage();

  if (currentPage.startsWith("admin")) {
    return "admin-login.html";
  }

  if (currentPage === "dashboard.html") {
    return "student-login.html";
  }

  return "index.html";
}

export function getToken() {
  return localStorage.getItem("token");
}

export function getRole() {
  return localStorage.getItem("role");
}

export function setSession(token, role) {
  localStorage.setItem("token", token);
  localStorage.setItem("role", role);
}

export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
}

export function logout() {
  clearSession();
  window.location.href = "index.html";
}

export function bindLogoutButtons() {
  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", logout);
  });
}

export function ensureSession(expectedRole) {
  const token = getToken();
  const role = getRole();

  if (!token) {
    window.location.href = LOGIN_PAGE_BY_ROLE[expectedRole] || "index.html";
    return false;
  }

  if (role && expectedRole && role !== expectedRole) {
    window.location.href = HOME_PAGE_BY_ROLE[role] || "index.html";
    return false;
  }

  return true;
}

export function showStatus(target, message, options = {}) {
  const element = typeof target === "string"
    ? document.getElementById(target)
    : target;

  if (!element) {
    return;
  }

  element.textContent = message || "";
  element.dataset.state = options.error
    ? "error"
    : options.success
      ? "success"
      : "neutral";
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function formatDate(value) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(!options.skipAuth && token ? { Authorization: token } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    if (response.status === 401) {
      clearSession();

      const currentPage = getCurrentPage();

      if (!currentPage.includes("login")) {
        window.location.href = getLoginPageForCurrentContext();
      }
    }

    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}
