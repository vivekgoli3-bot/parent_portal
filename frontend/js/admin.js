import {
  apiRequest,
  bindLogoutButtons,
  ensureSession,
  escapeHtml,
  formatDate,
  showStatus
} from "./api.js";

const state = {
  overview: null,
  students: [],
  subjects: [],
  selectedStudentId: null
};

let enrollmentChartInstance;
let performanceChartInstance;

const elements = {
  alerts: document.getElementById("adminAlerts"),
  directoryBody: document.getElementById("studentDirectoryBody"),
  directorySearch: document.getElementById("directorySearch"),
  directoryClassFilter: document.getElementById("directoryClassFilter"),
  directorySectionFilter: document.getElementById("directorySectionFilter"),
  directoryResultCount: document.getElementById("directoryResultCount"),
  recentAdmissionsList: document.getElementById("recentAdmissionsList"),
  subjectDirectoryCount: document.getElementById("subjectDirectoryCount"),
  subjectDirectoryList: document.getElementById("subjectDirectoryList"),
  profileEmpty: document.getElementById("profileEmpty"),
  profileContent: document.getElementById("profileContent"),
  profileBadge: document.getElementById("profileBadge"),
  marksStudentSelect: document.getElementById("marksStudentSelect"),
  attendanceStudentSelect: document.getElementById("attendanceStudentSelect"),
  marksClassInput: document.getElementById("marksClassInput"),
  marksFields: document.getElementById("marksFields"),
  marksTemplateStatus: document.getElementById("marksTemplateStatus"),
  adminHealth: document.getElementById("erpHealthState")
};

function updateHealthState(message) {
  if (elements.adminHealth) {
    elements.adminHealth.textContent = message;
  }
}

function renderMetric(id, value) {
  const element = document.getElementById(id);

  if (element) {
    element.textContent = value;
  }
}

function renderAlerts(alerts = []) {
  elements.alerts.innerHTML = alerts.map((alert) => `
    <article class="alert-card" data-tone="${escapeHtml(alert.tone)}">
      <h4>${escapeHtml(alert.title)}</h4>
      <p>${escapeHtml(alert.description)}</p>
    </article>
  `).join("");
}

function renderRecentAdmissions(students = []) {
  elements.recentAdmissionsList.innerHTML = students.length
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

function renderOverview() {
  const metrics = state.overview?.metrics;

  if (!metrics) {
    return;
  }

  renderMetric("metricStudents", metrics.totalStudents);
  renderMetric("metricClasses", metrics.totalClasses);
  renderMetric("metricMarks", metrics.averageMarks);
  renderMetric("metricAttendance", `${metrics.averageAttendance}%`);
  renderAlerts(state.overview.alerts);
  renderRecentAdmissions(state.overview.recentStudents);
  renderEnrollmentChart(state.overview.classDistribution);
  renderPerformanceChart(state.overview.classPerformance);
  updateHealthState(
    state.overview.alerts?.[0]?.title || "Records synced"
  );
}

function getClassOptions(students) {
  return [...new Set(students.map((student) => student.className).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function getSectionOptions(students) {
  return [...new Set(students.map((student) => student.section).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

function renderFilterOptions() {
  const selectedClass = elements.directoryClassFilter.value;
  const selectedSection = elements.directorySectionFilter.value;

  elements.directoryClassFilter.innerHTML = `
    <option value="">All classes</option>
    ${getClassOptions(state.students).map((className) => `
      <option value="${escapeHtml(className)}">${escapeHtml(className)}</option>
    `).join("")}
  `;

  elements.directorySectionFilter.innerHTML = `
    <option value="">All sections</option>
    ${getSectionOptions(state.students).map((section) => `
      <option value="${escapeHtml(section)}">${escapeHtml(section)}</option>
    `).join("")}
  `;

  elements.directoryClassFilter.value = selectedClass;
  elements.directorySectionFilter.value = selectedSection;
}

function getFilteredStudents() {
  const search = elements.directorySearch.value.trim().toLowerCase();
  const classFilter = elements.directoryClassFilter.value;
  const sectionFilter = elements.directorySectionFilter.value;

  return state.students.filter((student) => {
    const haystack = [
      student.name,
      student.usn,
      student.parentEmail,
      student.className,
      student.section
    ].join(" ").toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesClass = !classFilter || student.className === classFilter;
    const matchesSection = !sectionFilter || student.section === sectionFilter;

    return matchesSearch && matchesClass && matchesSection;
  });
}

function renderStudentDirectory() {
  const filteredStudents = getFilteredStudents();

  elements.directoryResultCount.textContent =
    `${filteredStudents.length} record${filteredStudents.length === 1 ? "" : "s"}`;

  elements.directoryBody.innerHTML = filteredStudents.length
    ? filteredStudents.map((student) => `
        <tr data-student-row="${student._id}" class="${student._id === state.selectedStudentId ? "row-selected" : ""}">
          <td>
            <strong>${escapeHtml(student.name || "-")}</strong>
            <span class="table-subtext">${escapeHtml(student.usn || "No USN")}</span>
          </td>
          <td>${escapeHtml(student.parentEmail || "Not linked")}</td>
          <td>${escapeHtml(student.className || "-")}${student.section ? ` • ${escapeHtml(student.section)}` : ""}</td>
          <td>${student.attendanceRate || 0}%</td>
          <td>${student.averageMarks || 0}</td>
          <td class="action-cell">
            <button type="button" class="ghost-button" data-open-id="${student._id}">Open</button>
            <button type="button" class="danger-text-button" data-delete-id="${student._id}">Delete</button>
          </td>
        </tr>
      `).join("")
    : `
        <tr>
          <td colspan="6">
            <div class="empty-state compact-empty">No students match the current filters.</div>
          </td>
        </tr>
      `;
}

function renderStudentSelects() {
  const options = state.students.map((student) => `
    <option value="${student._id}">
      ${escapeHtml(student.name)}${student.className ? ` - ${escapeHtml(student.className)}` : ""}
    </option>
  `).join("");

  elements.marksStudentSelect.innerHTML = options;
  elements.attendanceStudentSelect.innerHTML = options;

  if (state.selectedStudentId) {
    elements.marksStudentSelect.value = state.selectedStudentId;
    elements.attendanceStudentSelect.value = state.selectedStudentId;
  }
}

function renderSubjectDirectory() {
  elements.subjectDirectoryCount.textContent =
    `${state.subjects.length} class${state.subjects.length === 1 ? "" : "es"} mapped`;

  elements.subjectDirectoryList.innerHTML = state.subjects.length
    ? state.subjects.map((subjectGroup) => `
        <article class="subject-directory-card">
          <div class="card-header compact-header">
            <div>
              <h3>${escapeHtml(subjectGroup.className)}</h3>
              <p class="card-subtitle">${subjectGroup.subjects.length} subjects configured</p>
            </div>
          </div>
          <div class="chip-list">
            ${subjectGroup.subjects.map((subject) => `
              <span class="chip">${escapeHtml(subject)}</span>
            `).join("")}
          </div>
        </article>
      `).join("")
    : "<p class='subtle-text'>No subject mappings configured yet.</p>";
}

function renderMarksInputs(subjects = [], marks = []) {
  const marksMap = new Map(
    marks.map((subject) => [subject.name, subject.marks])
  );

  elements.marksFields.innerHTML = subjects.length
    ? subjects.map((subject) => `
        <label>
          <span>${escapeHtml(subject)}</span>
          <input
            class="mark-input"
            data-subject="${escapeHtml(subject)}"
            type="number"
            min="0"
            max="100"
            value="${marksMap.get(subject) || ""}"
            placeholder="Enter marks"
          >
        </label>
      `).join("")
    : "<div class='empty-state compact-empty'>Load a subject template to start marks entry.</div>";
}

function renderProfile(profile) {
  if (!profile) {
    elements.profileEmpty.textContent =
      "Select a student from the directory to review their linked account, marks, and attendance.";
    elements.profileEmpty.classList.remove("hidden");
    elements.profileContent.classList.add("hidden");
    elements.profileBadge.textContent = "No student selected";
    document.getElementById("studentMarksList").innerHTML = "";
    elements.marksFields.innerHTML =
      "<div class='empty-state compact-empty'>Select a student to begin marks entry.</div>";
    elements.marksTemplateStatus.textContent = "Select a student to begin.";
    return;
  }

  const { student, marks, attendance, subjectConfig, analytics } = profile;
  const subjectTemplate = subjectConfig.subjects.length
    ? subjectConfig.subjects
    : marks.subjects.map((subject) => subject.name);

  elements.profileEmpty.classList.add("hidden");
  elements.profileContent.classList.remove("hidden");
  elements.profileBadge.textContent = `${student.className || "Class pending"}${student.section ? ` • ${student.section}` : ""}`;
  document.getElementById("profileStudentId").value = student._id;
  document.getElementById("profileDisplayName").textContent = student.name;
  document.getElementById("profileDisplayMeta").textContent = `${student.parentEmail || "No parent email linked"}${student.usn ? ` • ${student.usn}` : ""}`;
  document.getElementById("profileAttendanceRate").textContent = `${analytics.attendanceRate}%`;
  document.getElementById("profileAverageMarks").textContent = analytics.averageMarks;
  document.getElementById("profileTrackedSubjects").textContent = analytics.trackedSubjects;
  document.getElementById("profileStudentName").value = student.name || "";
  document.getElementById("profileParentEmail").value = student.parentEmail || "";
  document.getElementById("profileUsn").value = student.usn || "";
  document.getElementById("profileClassName").value = student.className || "";
  document.getElementById("profileSection").value = student.section || "";
  document.getElementById("studentMarksList").innerHTML = marks.subjects.length
    ? marks.subjects.map((subject) => `
        <div class="subject-pill">
          <strong>${escapeHtml(subject.name)}</strong>
          <span>${Number(subject.marks) || 0}</span>
        </div>
      `).join("")
    : "<p class='subtle-text'>No marks published for this student yet.</p>";

  elements.marksClassInput.value = student.className || "";
  elements.attendanceStudentSelect.value = student._id;
  elements.marksStudentSelect.value = student._id;
  document.getElementById("attendancePresent").value = attendance.present || 0;
  document.getElementById("attendanceAbsent").value = attendance.absent || 0;
  elements.marksTemplateStatus.textContent = subjectTemplate.length
    ? `Loaded ${subjectTemplate.length} subject${subjectTemplate.length === 1 ? "" : "s"} for ${student.className || "selected class"}.`
    : "This class does not have a subject template yet.";
  renderMarksInputs(subjectTemplate, marks.subjects);
}

async function loadOverview() {
  state.overview = await apiRequest("/api/admin/overview");
  renderOverview();
}

async function loadStudents() {
  state.students = await apiRequest("/api/admin/students");
  renderFilterOptions();
  renderStudentSelects();
  renderStudentDirectory();
}

async function loadSubjectsDirectory() {
  state.subjects = await apiRequest("/api/admin/subjects");
  renderSubjectDirectory();
}

async function selectStudent(studentId) {
  if (!studentId) {
    renderProfile(null);
    return;
  }

  state.selectedStudentId = studentId;
  renderStudentDirectory();
  elements.profileEmpty.textContent = "Loading student profile...";
  elements.profileEmpty.classList.remove("hidden");
  elements.profileContent.classList.add("hidden");

  const profile = await apiRequest(`/api/admin/student/${studentId}/records`);
  renderProfile(profile);
}

async function refreshAdminData(nextSelectedId = state.selectedStudentId) {
  await Promise.all([loadOverview(), loadStudents(), loadSubjectsDirectory()]);

  if (state.students.length) {
    const chosenId = state.students.some((student) => student._id === nextSelectedId)
      ? nextSelectedId
      : state.students[0]._id;

    await selectStudent(chosenId);
  } else {
    state.selectedStudentId = null;
    renderProfile(null);
  }
}

async function handleCreateStudent(event) {
  event.preventDefault();
  showStatus("adminMessage", "Creating student profile...");

  try {
    const payload = {
      name: document.getElementById("createStudentName").value.trim(),
      email: document.getElementById("createParentEmail").value.trim(),
      password: document.getElementById("createParentPassword").value,
      usn: document.getElementById("createStudentUsn").value.trim(),
      className: document.getElementById("createStudentClass").value.trim(),
      section: document.getElementById("createStudentSection").value.trim()
    };

    const response = await apiRequest("/api/admin/create-student", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    event.target.reset();
    await refreshAdminData(response.student?._id);
    showStatus("adminMessage", "Student account created successfully.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function handleSubjectSave(event) {
  event.preventDefault();
  showStatus("adminMessage", "Saving curriculum mapping...");

  try {
    const className = document.getElementById("subjectClassName").value.trim();
    const subjects = document.getElementById("subjectListInput").value
      .split(",")
      .map((subject) => subject.trim())
      .filter(Boolean);

    await apiRequest("/api/admin/subjects", {
      method: "POST",
      body: JSON.stringify({ className, subjects })
    });

    await Promise.all([loadOverview(), loadSubjectsDirectory()]);

    if (state.selectedStudentId) {
      await selectStudent(state.selectedStudentId);
    }

    showStatus("adminMessage", "Curriculum map saved.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const studentId = document.getElementById("profileStudentId").value;

  if (!studentId) {
    return;
  }

  showStatus("adminMessage", "Updating student profile...");

  try {
    await apiRequest(`/api/admin/student/${studentId}`, {
      method: "PUT",
      body: JSON.stringify({
        name: document.getElementById("profileStudentName").value.trim(),
        email: document.getElementById("profileParentEmail").value.trim(),
        usn: document.getElementById("profileUsn").value.trim(),
        className: document.getElementById("profileClassName").value.trim(),
        section: document.getElementById("profileSection").value.trim()
      })
    });

    await refreshAdminData(studentId);
    showStatus("adminMessage", "Student profile updated.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function loadMarksTemplate() {
  const className = elements.marksClassInput.value.trim();

  if (!className) {
    showStatus("adminMessage", "Enter or select a class before loading subjects.", { error: true });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/subjects/${encodeURIComponent(className)}`);
    elements.marksTemplateStatus.textContent = data.subjects.length
      ? `Loaded ${data.subjects.length} subjects for ${className}.`
      : `No subjects found for ${className}. Add a curriculum map first.`;
    renderMarksInputs(data.subjects);
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function handleMarksSave(event) {
  event.preventDefault();
  const studentId = elements.marksStudentSelect.value;

  if (!studentId) {
    showStatus("adminMessage", "Select a student before saving marks.", { error: true });
    return;
  }

  const subjects = [...document.querySelectorAll(".mark-input")].map((input) => ({
    name: input.dataset.subject,
    marks: Number(input.value) || 0
  }));

  try {
    await apiRequest("/api/admin/marks", {
      method: "POST",
      body: JSON.stringify({ studentId, subjects })
    });

    await refreshAdminData(studentId);
    showStatus("adminMessage", "Marks saved successfully.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function handleAttendanceSave(event) {
  event.preventDefault();
  const studentId = elements.attendanceStudentSelect.value;

  if (!studentId) {
    showStatus("adminMessage", "Select a student before saving attendance.", { error: true });
    return;
  }

  try {
    await apiRequest("/api/admin/attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        present: Number(document.getElementById("attendancePresent").value) || 0,
        absent: Number(document.getElementById("attendanceAbsent").value) || 0
      })
    });

    await refreshAdminData(studentId);
    showStatus("adminMessage", "Attendance saved successfully.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

async function handleDeleteStudent(studentId) {
  const confirmed = window.confirm("Delete this student and all linked records?");

  if (!confirmed) {
    return;
  }

  try {
    await apiRequest(`/api/admin/student/${studentId}`, {
      method: "DELETE"
    });

    await refreshAdminData();
    showStatus("adminMessage", "Student deleted.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
  }
}

function bindEvents() {
  document.getElementById("studentCreateForm").addEventListener("submit", handleCreateStudent);
  document.getElementById("subjectForm").addEventListener("submit", handleSubjectSave);
  document.getElementById("studentProfileForm").addEventListener("submit", handleProfileUpdate);
  document.getElementById("marksForm").addEventListener("submit", handleMarksSave);
  document.getElementById("attendanceForm").addEventListener("submit", handleAttendanceSave);
  document.getElementById("loadMarksTemplateButton").addEventListener("click", loadMarksTemplate);

  elements.directorySearch.addEventListener("input", renderStudentDirectory);
  elements.directoryClassFilter.addEventListener("change", renderStudentDirectory);
  elements.directorySectionFilter.addEventListener("change", renderStudentDirectory);

  elements.marksStudentSelect.addEventListener("change", async (event) => {
    const student = state.students.find((item) => item._id === event.target.value);
    elements.marksClassInput.value = student?.className || "";
    await selectStudent(event.target.value);
  });

  elements.attendanceStudentSelect.addEventListener("change", async (event) => {
    await selectStudent(event.target.value);
  });

  elements.directoryBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");
    const openButton = event.target.closest("[data-open-id]");
    const row = event.target.closest("[data-student-row]");

    if (deleteButton) {
      await handleDeleteStudent(deleteButton.dataset.deleteId);
      return;
    }

    if (openButton) {
      await selectStudent(openButton.dataset.openId);
      return;
    }

    if (row) {
      await selectStudent(row.dataset.studentRow);
    }
  });
}

async function initializeAdmin() {
  if (!ensureSession("admin")) {
    return;
  }

  bindLogoutButtons();
  bindEvents();
  updateHealthState("Loading operational data...");

  try {
    await refreshAdminData();
    showStatus("adminMessage", "ERP workspace ready.", { success: true });
  } catch (error) {
    showStatus("adminMessage", error.message, { error: true });
    updateHealthState("Data unavailable");
  }
}

initializeAdmin();
