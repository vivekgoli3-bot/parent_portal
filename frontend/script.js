const API =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://parent-portal-1.onrender.com";

let marksChartInstance;
let attendanceChartInstance;

function getToken() {
  return localStorage.getItem("token");
}

function setMessage(targetId, message, isError = false) {
  const element = document.getElementById(targetId);

  if (!element) {
    if (message) {
      alert(message);
    }
    return;
  }

  element.textContent = message;
  element.style.color = isError ? "#c53c3c" : "#09678c";
}

async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...(options.body ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
    ...(token ? { Authorization: token } : {})
  };

  const response = await fetch(`${API}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || data.error || "Request failed");
  }

  return data;
}

function redirectIfMissingToken() {
  if (!getToken()) {
    window.location.href = "index.html";
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  window.location.href = "index.html";
}

async function login(email, password, expectedRole, redirectPage) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });

  if (data.user.role !== expectedRole) {
    throw new Error(`This account does not have ${expectedRole} access`);
  }

  localStorage.setItem("token", data.token);
  localStorage.setItem("role", data.user.role);
  window.location.href = redirectPage;
}

async function handleAdminLogin(event) {
  event.preventDefault();
  setMessage("authMessage", "Signing in...");

  try {
    await login(
      document.getElementById("adminEmail").value.trim(),
      document.getElementById("adminPassword").value,
      "admin",
      "admin.html"
    );
  } catch (error) {
    setMessage("authMessage", error.message, true);
  }
}

async function handleStudentLogin(event) {
  event.preventDefault();
  setMessage("authMessage", "Signing in...");

  try {
    await login(
      document.getElementById("studentEmail").value.trim(),
      document.getElementById("studentPassword").value,
      "parent",
      "dashboard.html"
    );
  } catch (error) {
    setMessage("authMessage", error.message, true);
  }
}

async function loadStudents() {
  const data = await apiRequest("/api/admin/students");
  const options = data.map((student) => (
    `<option value="${student._id}" data-class="${student.className || ""}">
      ${student.name} ${student.className ? `- ${student.className}` : ""}
    </option>`
  )).join("");

  const studentDropdown = document.getElementById("studentDropdown");
  const studentDropdownAtt = document.getElementById("studentDropdownAtt");

  if (studentDropdown) {
    studentDropdown.innerHTML = options;
  }

  if (studentDropdownAtt) {
    studentDropdownAtt.innerHTML = options;
  }
}

async function createStudent() {
  try {
    const payload = {
      name: document.getElementById("name").value.trim(),
      email: document.getElementById("email").value.trim(),
      password: document.getElementById("password").value,
      usn: document.getElementById("usn").value.trim(),
      className: document.getElementById("className").value.trim(),
      section: document.getElementById("section").value.trim()
    };

    await apiRequest("/api/admin/create-student", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    setMessage("adminMessage", "Student created successfully.");
    await loadStudents();
    await loadStudentsTable();
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function saveSubjects() {
  try {
    const className = document.getElementById("classSub").value.trim();
    const subjects = document.getElementById("subjectsInput").value
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    await apiRequest("/api/admin/subjects", {
      method: "POST",
      body: JSON.stringify({ className, subjects })
    });

    setMessage("adminMessage", "Subjects saved.");
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function loadSubjects() {
  try {
    const className = document.getElementById("classFetch").value.trim();
    const data = await apiRequest(`/api/admin/subjects/${encodeURIComponent(className)}`);
    const subjectsUI = document.getElementById("subjectsUI");

    if (!data.subjects.length) {
      subjectsUI.innerHTML = "<p class='subtle-text'>No subjects found for this class yet.</p>";
      return;
    }

    subjectsUI.innerHTML = data.subjects.map((subject) => `
      <input
        type="number"
        min="0"
        max="100"
        placeholder="${subject} marks"
        class="markInput"
        data-sub="${subject}"
      >
    `).join("");
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function saveMarks() {
  try {
    const inputs = document.querySelectorAll(".markInput");
    const subjects = Array.from(inputs).map((input) => ({
      name: input.dataset.sub,
      marks: Number(input.value) || 0
    }));

    await apiRequest("/api/admin/marks", {
      method: "POST",
      body: JSON.stringify({
        studentId: document.getElementById("studentDropdown").value,
        subjects
      })
    });

    setMessage("adminMessage", "Marks saved.");
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function saveAttendance() {
  try {
    await apiRequest("/api/admin/attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId: document.getElementById("studentDropdownAtt").value,
        present: Number(document.getElementById("present").value) || 0,
        absent: Number(document.getElementById("absent").value) || 0
      })
    });

    setMessage("adminMessage", "Attendance saved.");
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function loadStudentsTable() {
  try {
    const data = await apiRequest("/api/admin/students");
    const tbody = document.querySelector("#studentTable tbody");

    tbody.innerHTML = data.map((student) => `
      <tr>
        <td>${student.name || "-"}</td>
        <td>${student.usn || "-"}</td>
        <td>${student.className || "-"}</td>
        <td>${student.section || "-"}</td>
        <td>
          <button class="danger-button" onclick="deleteStudent('${student._id}')">Delete</button>
        </td>
      </tr>
    `).join("");
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

async function deleteStudent(id) {
  const confirmed = window.confirm("Delete this student and all linked records?");

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/api/admin/student/${id}`, {
      method: "DELETE"
    });

    setMessage("adminMessage", "Student deleted.");
    await loadStudents();
    await loadStudentsTable();
  } catch (error) {
    setMessage("adminMessage", error.message, true);
  }
}

function renderMarksChart(subjects) {
  const chartElement = document.getElementById("marksChart");

  if (!chartElement || typeof Chart === "undefined") {
    return;
  }

  marksChartInstance?.destroy();
  marksChartInstance = new Chart(chartElement, {
    type: "bar",
    data: {
      labels: subjects.map((subject) => subject.name),
      datasets: [{
        label: "Marks",
        data: subjects.map((subject) => subject.marks),
        borderRadius: 12,
        backgroundColor: ["#0d8abc", "#ff8a3d", "#1f6f5f", "#5a7fff", "#cf5a7f"]
      }]
    },
    options: {
      plugins: {
        legend: { display: false }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

function renderAttendanceChart(attendance) {
  const chartElement = document.getElementById("attendanceChart");

  if (!chartElement || typeof Chart === "undefined") {
    return;
  }

  attendanceChartInstance?.destroy();
  attendanceChartInstance = new Chart(chartElement, {
    type: "doughnut",
    data: {
      labels: ["Present", "Absent"],
      datasets: [{
        data: [attendance.present || 0, attendance.absent || 0],
        backgroundColor: ["#0d8abc", "#ff8a3d"]
      }]
    }
  });
}

async function loadDashboard() {
  try {
    const data = await apiRequest("/api/parent/dashboard");
    const subjects = data.marks?.subjects || [];
    const attendance = data.attendance || { present: 0, absent: 0 };
    const totalDays = (attendance.present || 0) + (attendance.absent || 0);
    const averageMarks = subjects.length
      ? Math.round(subjects.reduce((sum, subject) => sum + (Number(subject.marks) || 0), 0) / subjects.length)
      : 0;
    const attendanceRate = totalDays
      ? Math.round(((attendance.present || 0) / totalDays) * 100)
      : 0;

    document.getElementById("studentHeading").textContent =
      data.student?.name ? `${data.student.name}'s Dashboard` : "Student Dashboard";
    document.getElementById("studentMeta").textContent =
      `${data.student?.className || "Class not set"}${data.student?.section ? ` • Section ${data.student.section}` : ""}`;
    document.getElementById("subjectCount").textContent = subjects.length;
    document.getElementById("averageMarks").textContent = averageMarks;
    document.getElementById("attendanceRate").textContent = `${attendanceRate}%`;
    document.getElementById("subjectList").innerHTML = subjects.length
      ? subjects.map((subject) => `
          <div class="subject-pill">
            <strong>${subject.name}</strong>
            <span>${subject.marks}</span>
          </div>
        `).join("")
      : "<p class='subtle-text'>Marks have not been published yet.</p>";

    renderMarksChart(subjects.length ? subjects : [{ name: "No Data", marks: 0 }]);
    renderAttendanceChart(attendance);
  } catch (error) {
    document.getElementById("studentHeading").textContent = "Unable to load dashboard";
    document.getElementById("studentMeta").textContent = error.message;
  }
}

function bindAuthForms() {
  const adminForm = document.getElementById("adminLoginForm");
  const studentForm = document.getElementById("studentLoginForm");

  if (adminForm) {
    adminForm.addEventListener("submit", handleAdminLogin);
  }

  if (studentForm) {
    studentForm.addEventListener("submit", handleStudentLogin);
  }
}

function initializeAdminPage() {
  redirectIfMissingToken();
  loadStudents();
  loadStudentsTable();
}

function initializeDashboardPage() {
  redirectIfMissingToken();
  loadDashboard();
}

bindAuthForms();

if (window.location.pathname.includes("admin.html")) {
  initializeAdminPage();
}

if (window.location.pathname.includes("dashboard.html")) {
  initializeDashboardPage();
}
