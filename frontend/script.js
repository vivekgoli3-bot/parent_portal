// 🔐 LOGIN
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
      const res = await fetch("https://parent-portal-1.onrender.com/api/auth/login", {
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
        alert(data.message || "Login failed");
      }

    } catch (err) {
      alert("Server error");
    }
  });
}

// REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const usn = document.getElementById("usn").value;
    const className = document.getElementById("className").value;
    const section = document.getElementById("section").value;

    try {
      const res = await fetch("https://parent-portal-1.onrender.com/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name, email, password, usn, className, section })
      });

      const data = await res.json();

      alert(data.message || "Registered successfully");

      window.location.href = "index.html";

    } catch (err) {
      alert("Error registering");
    }
  });
}


// 📊 DASHBOARD
if (window.location.pathname.includes("dashboard.html")) {

  const token = localStorage.getItem("token");

  if (!token) {
    window.location.href = "index.html";
  }

  fetch("https://parent-portal-1.onrender.com/api/parent/dashboard", {
    headers: {
      "Authorization": token
    }
  })
  .then(res => res.json())
  .then(data => {
    console.log(data);

    document.getElementById("data").innerHTML = `
      <div style="border:1px solid #ccc; padding:15px; margin:10px;">
        <h3>Attendance: ${data.attendance?.percentage || 0}%</h3>
      </div>

      <div style="border:1px solid #ccc; padding:15px;">
        <h3>Marks</h3>
        <ul>
          ${data.marks?.subjects?.map(s => `<li>${s.name}: ${s.marks}</li>`).join("") || "No marks available"}
        </ul>
      </div>
    `;
  });
}


// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}