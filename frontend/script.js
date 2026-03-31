const API = "https://parent-portal-1.onrender.com";

// ================= LOGIN =================
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        email: document.getElementById("email").value,
        password: document.getElementById("password").value
      })
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);

      if (data.user.role === "admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } else {
      alert(data.message || "Login failed");
    }
  });
}

// ================= SAVE SUBJECTS =================
async function saveSubjects() {
  const token = localStorage.getItem("token");

  await fetch(`${API}/api/admin/subjects`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({
      className: document.getElementById("classSub").value,
      subjects: document.getElementById("subjectsInput").value.split(",")
    })
  });

  alert("Subjects saved");
}

// ================= LOAD SUBJECTS =================
async function loadSubjects() {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/admin/subjects/${document.getElementById("classFetch").value}`, {
    headers: { Authorization: token }
  });

  const data = await res.json();

  document.getElementById("subjectsUI").innerHTML =
    data.subjects.map(s => `
      <input placeholder="${s}" class="markInput" data-sub="${s}">
    `).join("");
}

// ================= SAVE MARKS =================
async function saveMarks() {
  const token = localStorage.getItem("token");

  const inputs = document.querySelectorAll(".markInput");

  const subjects = Array.from(inputs).map(i => ({
    name: i.dataset.sub,
    marks: i.value
  }));

  await fetch(`${API}/api/admin/marks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token
    },
    body: JSON.stringify({
      studentId: document.getElementById("studentId").value,
      subjects
    })
  });

  alert("Marks saved");
}