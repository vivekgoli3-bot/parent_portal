import {
  apiRequest,
  bindLogoutButtons,
  ensureSession,
  escapeHtml
} from "./api.js";

let marksChartInstance;
let attendanceChartInstance;

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
        borderRadius: 14,
        backgroundColor: ["#2bb6f0", "#ff9360", "#55c59b", "#7f8cff", "#ff6a88"]
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
        backgroundColor: ["#2bb6f0", "#ff9360"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "68%"
    }
  });
}

function renderInsights(averageMarks, attendanceRate, subjectCount) {
  const target = document.getElementById("studentInsightBoard");
  const statusPill = document.getElementById("studentStatusPill");
  const academicTone = averageMarks >= 75 ? "positive" : averageMarks >= 50 ? "warning" : "error";
  const attendanceTone = attendanceRate >= 85 ? "positive" : attendanceRate >= 70 ? "warning" : "error";
  const overallLabel = averageMarks >= 75 && attendanceRate >= 85
    ? "On Track"
    : averageMarks >= 50 && attendanceRate >= 70
      ? "Watchlist"
      : "Needs Attention";

  statusPill.textContent = overallLabel;
  statusPill.dataset.tone = overallLabel === "On Track"
    ? "positive"
    : overallLabel === "Watchlist"
      ? "warning"
      : "error";

  target.innerHTML = `
    <article class="alert-card" data-tone="${academicTone}">
      <h4>Academic average</h4>
      <p>${averageMarks} overall marks across ${subjectCount} subject${subjectCount === 1 ? "" : "s"}.</p>
    </article>
    <article class="alert-card" data-tone="${attendanceTone}">
      <h4>Attendance performance</h4>
      <p>${attendanceRate}% attendance based on the current school-day totals.</p>
    </article>
    <article class="alert-card" data-tone="neutral">
      <h4>What to review</h4>
      <p>Use the subject breakdown to identify strong subjects and the next area needing support.</p>
    </article>
  `;
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
    document.getElementById("subjectBreakdownCount").textContent =
      `${subjects.length} subject${subjects.length === 1 ? "" : "s"}`;
    document.getElementById("subjectList").innerHTML = subjects.length
      ? subjects.map((subject) => `
          <div class="subject-pill">
            <strong>${escapeHtml(subject.name)}</strong>
            <span>${Number(subject.marks) || 0}</span>
          </div>
        `).join("")
      : "<p class='subtle-text'>Marks have not been published yet.</p>";

    renderMarksChart(subjects.length ? subjects : [{ name: "No Data", marks: 0 }]);
    renderAttendanceChart(attendance);
    renderInsights(averageMarks, attendanceRate, subjects.length);
  } catch (error) {
    document.getElementById("studentHeading").textContent = "Unable to load dashboard";
    document.getElementById("studentMeta").textContent = error.message;
  }
}

if (ensureSession("parent")) {
  bindLogoutButtons();
  loadDashboard();
}
