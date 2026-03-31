import {
  apiRequest,
  escapeHtml,
  formatDate,
  initializeAdminPage,
  setHealthState,
  showStatus
} from "./admin-core.js";

let enrollmentChartInstance;
let performanceChartInstance;

function renderMetric(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function renderAlerts(alerts = []) {
  const container = document.getElementById("adminAlerts");

  container.innerHTML = alerts.map((alert) => `
    <article class="alert-card" data-tone="${escapeHtml(alert.tone)}">
      <h4>${escapeHtml(alert.title)}</h4>
      <p>${escapeHtml(alert.description)}</p>
    </article>
  `).join("");
}

function renderRecentAdmissions(students = []) {
  const container = document.getElementById("recentAdmissionsList");

  container.innerHTML = students.length
    ? students.map((student) => `
        <div class="recent-item">
          <div>
            <strong>${escapeHtml(student.name)}</strong>
            <span>${escapeHtml(student.className || "Class pending")}${student.section ? ` • Section ${escapeHtml(student.section)}` : ""}</span>
          </div>
          <div class="recent-meta">
            <span>${escapeHtml(student.parentEmail || "No email linked")}</span>
            <strong>${formatDate(student.createdAt)}</strong>
          </div>
        </div>
      `).join("")
    : "<p class='subtle-text'>No recent admissions found.</p>";
}

function renderEnrollmentChart(classDistribution = []) {
  const chartElement = document.getElementById("enrollmentChart");

  if (!chartElement || typeof Chart === "undefined") {
    return;
  }

  enrollmentChartInstance?.destroy();
  enrollmentChartInstance = new Chart(chartElement, {
    type: "doughnut",
    data: {
      labels: classDistribution.map((item) => item.className),
      datasets: [{
        data: classDistribution.map((item) => item.count),
        backgroundColor: ["#2bb6f0", "#ff9360", "#55c59b", "#7f8cff", "#ff6a88", "#ffcc66"],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "68%",
      plugins: {
        legend: {
          position: "bottom"
        }
      }
    }
  });
}

function renderPerformanceChart(classPerformance = []) {
  const chartElement = document.getElementById("performanceChart");

  if (!chartElement || typeof Chart === "undefined") {
    return;
  }

  performanceChartInstance?.destroy();
  performanceChartInstance = new Chart(chartElement, {
    type: "bar",
    data: {
      labels: classPerformance.map((item) => item.className),
      datasets: [
        {
          label: "Average Marks",
          data: classPerformance.map((item) => item.averageMarks),
          backgroundColor: "#2bb6f0",
          borderRadius: 12
        },
        {
          label: "Attendance Rate",
          data: classPerformance.map((item) => item.attendanceRate),
          backgroundColor: "#ff9360",
          borderRadius: 12
        }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

async function loadOverview() {
  showStatus("overviewMessage", "Loading overview...");

  try {
    const data = await apiRequest("/api/admin/overview");

    renderMetric("metricStudents", data.metrics.totalStudents);
    renderMetric("metricClasses", data.metrics.totalClasses);
    renderMetric("metricMarks", data.metrics.averageMarks);
    renderMetric("metricAttendance", `${data.metrics.averageAttendance}%`);
    renderAlerts(data.alerts);
    renderRecentAdmissions(data.recentStudents);
    renderEnrollmentChart(data.classDistribution);
    renderPerformanceChart(data.classPerformance);
    setHealthState(data.alerts?.[0]?.title || "Records synced");
    showStatus("overviewMessage", "Overview synced successfully.", { success: true });
  } catch (error) {
    setHealthState("Overview unavailable");
    showStatus("overviewMessage", error.message, { error: true });
  }
}

if (initializeAdminPage()) {
  loadOverview();
}
