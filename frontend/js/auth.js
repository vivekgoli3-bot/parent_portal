import { apiRequest, setSession, showStatus } from "./api.js";

async function login(email, password, expectedRole, redirectPage) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
    skipAuth: true
  });

  if (data.user.role !== expectedRole) {
    throw new Error(`This account does not have ${expectedRole} access`);
  }

  setSession(data.token, data.user.role);
  window.location.href = redirectPage;
}

function bindAdminLogin() {
  const form = document.getElementById("adminLoginForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showStatus("authMessage", "Signing in...");

    try {
      await login(
        document.getElementById("adminEmail").value.trim(),
        document.getElementById("adminPassword").value,
        "admin",
        "admin.html"
      );
    } catch (error) {
      showStatus("authMessage", error.message, { error: true });
    }
  });
}

function bindStudentLogin() {
  const form = document.getElementById("studentLoginForm");

  if (!form) {
    return;
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    showStatus("authMessage", "Signing in...");

    try {
      await login(
        document.getElementById("studentEmail").value.trim(),
        document.getElementById("studentPassword").value,
        "parent",
        "dashboard.html"
      );
    } catch (error) {
      showStatus("authMessage", error.message, { error: true });
    }
  });
}

bindAdminLogin();
bindStudentLogin();
