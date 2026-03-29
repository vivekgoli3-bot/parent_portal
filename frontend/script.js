document.addEventListener("DOMContentLoaded", () => {
  console.log("JS Loaded");

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


// SEND OTP
async function sendOtp() {
  const emailEl = document.getElementById("email");
  const email = emailEl?.value;
  if (!email) return alert("Enter email first");

  try {
    const res = await fetch("https://parent-portal-1.onrender.com/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message || "OTP sent");
  } catch (e) {
    alert("Failed to send OTP");
  }
}


// VERIFY + REGISTER
const registerForm = document.getElementById("registerForm");

if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("name")?.value;
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const usn = document.getElementById("usn")?.value;
    const className = document.getElementById("className")?.value;
    const section = document.getElementById("section")?.value;
    const otp = document.getElementById("otp")?.value;

    if (!name || !email || !password || !usn || !className || !section || !otp) {
      return alert("Fill all fields including OTP");
    }

    try {
      const res = await fetch("https://parent-portal-1.onrender.com/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, usn, className, section, otp })
      });

      const result = await res.json();
      alert(result.message || "Registered");

      if (res.ok) {
        window.location.href = "index.html";
      }
    } catch (err) {
      alert("Error registering");
    }
  });
}


// FORGOT
async function forgot() {
  const email = document.getElementById("email")?.value;
  if (!email) return alert("Enter email");

  try {
    const res = await fetch("https://parent-portal-1.onrender.com/api/auth/forgot-password", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    alert(data.message);
  } catch (e) {
    alert("Error sending reset link");
  }
}


// RESET
async function reset() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");
  const newPassword = document.getElementById("password")?.value;

  if (!token || !newPassword) return alert("Invalid request");

  try {
    const res = await fetch("https://parent-portal-1.onrender.com/api/auth/reset-password", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ token, newPassword })
    });

    const data = await res.json();
    alert(data.message);
  } catch (e) {
    alert("Error resetting password");
  }
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

    // 🔹 PROFILE (fallback values)
    document.getElementById("studentName").innerText = "Student";
    document.getElementById("studentClass").innerText = "BCA";
    document.getElementById("studentSection").innerText = "A";

    // 🔹 ATTENDANCE
    const attendance = data.attendance?.percentage || 0;

    const badge = document.getElementById("attendanceBadge");
    badge.innerText = attendance + "%";

    // 🎨 COLOR BADGE
    if (attendance > 75) {
      badge.className = "badge bg-success";
    } else if (attendance > 50) {
      badge.className = "badge bg-warning";
    } else {
      badge.className = "badge bg-danger";
    }

    // 📊 Attendance Chart
    new Chart(document.getElementById("attendanceChart"), {
      type: "doughnut",
      data: {
        labels: ["Present", "Absent"],
        datasets: [{
          data: [attendance, 100 - attendance]
        }]
      }
    });

    // 📊 Marks Chart
    const subjects = data.marks?.subjects || [];

    new Chart(document.getElementById("marksChart"), {
      type: "bar",
      data: {
        labels: subjects.map(s => s.name),
        datasets: [{
          label: "Marks",
          data: subjects.map(s => s.marks)
        }]
      }
    });

  });
}

// 🚪 LOGOUT
function logout() {
  localStorage.removeItem("token");
  window.location.href = "index.html";
}
});