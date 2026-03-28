// 🔐 LOGIN
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
      } else {
        alert("Login failed");
      }

    } catch (err) {
      alert("Server error");
    }
  });
}

// 📊 DASHBOARD
if (window.location.pathname.includes("dashboard.html")) {

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "login.html";
  }

  fetch("http://localhost:5000/api/parent/dashboard", {
    headers: {
      "Authorization": token
    }
  })
  .then(res => res.json())
  .then(data => {
    document.getElementById("data").innerHTML = `
      <div style="border:1px solid #ccc; padding:15px; margin:10px;">
        <h3>Attendance: ${data.attendance?.percentage || 0}%</h3>
      </div>

      <div style="border:1px solid #ccc; padding:15px;">
        <h3>Marks</h3>
        <ul>
          ${data.marks?.subjects.map(s => `<li>${s.name}: ${s.marks}</li>`).join("")}
        </ul>
      </div>
    `;
  });
}

// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "login.html";
}