import {
  apiRequest,
  escapeHtml,
  filterStudents,
  getClassOptions,
  getQueryParam,
  getSectionOptions,
  initializeAdminPage,
  populateFilterSelect,
  populateStudentSelect,
  setHealthState,
  showStatus
} from "./admin-core.js";

const state = {
  overview: null,
  students: [],
  selectedStudentId: ""
};

const elements = {
  search: document.getElementById("attendanceSearch"),
  classFilter: document.getElementById("attendanceClassFilter"),
  sectionFilter: document.getElementById("attendanceSectionFilter"),
  resultCount: document.getElementById("attendanceResultCount"),
  directoryBody: document.getElementById("attendanceDirectoryBody"),
  studentSelect: document.getElementById("attendanceStudentSelect"),
  empty: document.getElementById("attendanceEmpty"),
  content: document.getElementById("attendanceProfileContent")
};

function renderMetrics() {
  const metrics = state.overview?.metrics;

  if (!metrics) {
    return;
  }

  const lowAttendanceCount = state.students.filter((student) => Number(student.attendanceRate) < 75).length;

  document.getElementById("attendanceMetricStudents").textContent = metrics.totalStudents;
  document.getElementById("attendanceMetricAverage").textContent = `${metrics.averageAttendance}%`;
  document.getElementById("attendanceMetricConcern").textContent = lowAttendanceCount;
  setHealthState(state.overview.alerts?.[0]?.title || "Attendance synced");
}

function renderFilters() {
  populateFilterSelect(
    elements.classFilter,
    getClassOptions(state.students),
    "All classes",
    elements.classFilter.value
  );

  populateFilterSelect(
    elements.sectionFilter,
    getSectionOptions(state.students),
    "All sections",
    elements.sectionFilter.value
  );
}

function getFilteredStudents() {
  return filterStudents(state.students, {
    search: elements.search.value,
    className: elements.classFilter.value,
    section: elements.sectionFilter.value
  });
}

function renderDirectory() {
  const filteredStudents = getFilteredStudents();

  elements.resultCount.textContent =
    `${filteredStudents.length} student${filteredStudents.length === 1 ? "" : "s"}`;

  elements.directoryBody.innerHTML = filteredStudents.length
    ? filteredStudents.map((student) => `
        <tr data-student-row="${student._id}" class="${student._id === state.selectedStudentId ? "row-selected" : ""}">
          <td>
            <strong>${escapeHtml(student.name || "-")}</strong>
            <span class="table-subtext">${escapeHtml(student.usn || "No USN")}</span>
          </td>
          <td>${escapeHtml(student.className || "-")}${student.section ? ` • ${escapeHtml(student.section)}` : ""}</td>
          <td>${student.attendanceRate || 0}%</td>
          <td class="action-cell">
            <button type="button" class="ghost-button" data-open-id="${student._id}">Update</button>
          </td>
        </tr>
      `).join("")
    : `
        <tr>
          <td colspan="4">
            <div class="empty-state compact-empty">No students match the current attendance filters.</div>
          </td>
        </tr>
      `;
}

function renderProfile(profile) {
  if (!profile) {
    elements.empty.textContent = "Select a student from the attendance directory to load the current record.";
    elements.empty.classList.remove("hidden");
    elements.content.classList.add("hidden");
    document.getElementById("attendanceProfileBadge").textContent = "No student selected";
    return;
  }

  const { student, attendance, analytics } = profile;

  elements.empty.classList.add("hidden");
  elements.content.classList.remove("hidden");
  document.getElementById("attendanceStudentId").value = student._id;
  document.getElementById("attendanceProfileBadge").textContent =
    `${student.className || "Class pending"}${student.section ? ` • ${student.section}` : ""}`;
  document.getElementById("attendanceSelectedName").textContent = student.name;
  document.getElementById("attendanceSelectedMeta").textContent =
    `${student.parentEmail || "No parent email linked"}${student.usn ? ` • ${student.usn}` : ""}`;
  document.getElementById("attendanceCurrentRate").textContent = `${analytics.attendanceRate}%`;
  document.getElementById("attendanceCurrentPresent").textContent = attendance.present || 0;
  document.getElementById("attendanceCurrentAbsent").textContent = attendance.absent || 0;
  document.getElementById("attendancePresent").value = attendance.present || 0;
  document.getElementById("attendanceAbsent").value = attendance.absent || 0;

  populateStudentSelect(elements.studentSelect, state.students, student._id, "Select student");
}

async function loadOverview() {
  state.overview = await apiRequest("/api/admin/overview");
}

async function loadStudents() {
  state.students = await apiRequest("/api/admin/students");
  renderFilters();
  renderDirectory();
  populateStudentSelect(elements.studentSelect, state.students, state.selectedStudentId, "Select student");
}

async function selectStudent(studentId) {
  state.selectedStudentId = studentId;
  renderDirectory();

  if (!studentId) {
    renderProfile(null);
    populateStudentSelect(elements.studentSelect, state.students, "", "Select student");
    return;
  }

  const profile = await apiRequest(`/api/admin/student/${studentId}/records`);
  renderProfile(profile);
}

async function refreshData(nextSelectedId = state.selectedStudentId) {
  await Promise.all([loadOverview(), loadStudents()]);
  renderMetrics();

  if (state.students.length) {
    const selectedId = state.students.some((student) => student._id === nextSelectedId)
      ? nextSelectedId
      : state.students[0]._id;

    await selectStudent(selectedId);
  } else {
    renderProfile(null);
  }
}

async function handleAttendanceSave(event) {
  event.preventDefault();
  const studentId = document.getElementById("attendanceStudentId").value || elements.studentSelect.value;
  const present = Number(document.getElementById("attendancePresent").value) || 0;
  const absent = Number(document.getElementById("attendanceAbsent").value) || 0;

  if (!studentId) {
    showStatus("attendanceMessage", "Select a student before saving attendance.", { error: true });
    return;
  }

  if (present < 0 || absent < 0) {
    showStatus("attendanceMessage", "Attendance values cannot be negative.", { error: true });
    return;
  }

  try {
    await apiRequest("/api/admin/attendance", {
      method: "POST",
      body: JSON.stringify({
        studentId,
        present,
        absent
      })
    });

    await refreshData(studentId);
    showStatus("attendanceMessage", "Attendance updated successfully.", { success: true });
  } catch (error) {
    showStatus("attendanceMessage", error.message, { error: true });
  }
}

function bindEvents() {
  document.getElementById("attendanceUpdateForm").addEventListener("submit", handleAttendanceSave);
  elements.search.addEventListener("input", renderDirectory);
  elements.classFilter.addEventListener("change", renderDirectory);
  elements.sectionFilter.addEventListener("change", renderDirectory);

  elements.directoryBody.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-open-id]");
    const row = event.target.closest("[data-student-row]");

    if (openButton) {
      await selectStudent(openButton.dataset.openId);
      return;
    }

    if (row) {
      await selectStudent(row.dataset.studentRow);
    }
  });

  elements.studentSelect.addEventListener("change", async (event) => {
    await selectStudent(event.target.value);
  });
}

async function initialize() {
  if (!initializeAdminPage()) {
    return;
  }

  bindEvents();
  setHealthState("Loading attendance controls...");

  try {
    await refreshData(getQueryParam("student"));
    showStatus("attendanceMessage", "Attendance controls ready.", { success: true });
  } catch (error) {
    setHealthState("Attendance unavailable");
    showStatus("attendanceMessage", error.message, { error: true });
  }
}

initialize();
