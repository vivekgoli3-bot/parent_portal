import {
  apiRequest,
  escapeHtml,
  filterStudents,
  getClassOptions,
  getSectionOptions,
  initializeAdminPage,
  populateFilterSelect,
  setHealthState,
  showStatus
} from "./admin-core.js";

const state = {
  overview: null,
  students: [],
  selectedStudentId: null
};

const elements = {
  search: document.getElementById("directorySearch"),
  classFilter: document.getElementById("directoryClassFilter"),
  sectionFilter: document.getElementById("directorySectionFilter"),
  resultCount: document.getElementById("directoryResultCount"),
  directoryBody: document.getElementById("studentDirectoryBody"),
  profileEmpty: document.getElementById("profileEmpty"),
  profileContent: document.getElementById("profileContent"),
  profileBadge: document.getElementById("profileBadge")
};

function renderMetrics() {
  const metrics = state.overview?.metrics;

  if (!metrics) {
    return;
  }

  document.getElementById("studentsMetricTotal").textContent = metrics.totalStudents;
  document.getElementById("studentsMetricClasses").textContent = metrics.totalClasses;
  document.getElementById("studentsMetricAttendance").textContent = `${metrics.averageAttendance}%`;
  setHealthState(state.overview.alerts?.[0]?.title || "Records synced");
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
            <button type="button" class="ghost-button" data-attendance-id="${student._id}">Attendance</button>
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

function renderProfile(profile) {
  if (!profile) {
    elements.profileEmpty.textContent =
      "Select a student from the directory to review their linked account, marks, and attendance.";
    elements.profileEmpty.classList.remove("hidden");
    elements.profileContent.classList.add("hidden");
    elements.profileBadge.textContent = "No student selected";
    document.getElementById("studentMarksList").innerHTML = "";
    return;
  }

  const { student, marks, analytics } = profile;

  elements.profileEmpty.classList.add("hidden");
  elements.profileContent.classList.remove("hidden");
  elements.profileBadge.textContent =
    `${student.className || "Class pending"}${student.section ? ` • ${student.section}` : ""}`;
  document.getElementById("profileStudentId").value = student._id;
  document.getElementById("profileDisplayName").textContent = student.name;
  document.getElementById("profileDisplayMeta").textContent =
    `${student.parentEmail || "No parent email linked"}${student.usn ? ` • ${student.usn}` : ""}`;
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
}

async function loadOverview() {
  state.overview = await apiRequest("/api/admin/overview");
  renderMetrics();
}

async function loadStudents() {
  state.students = await apiRequest("/api/admin/students");
  renderFilters();
  renderDirectory();
}

async function selectStudent(studentId) {
  if (!studentId) {
    state.selectedStudentId = null;
    renderDirectory();
    renderProfile(null);
    return;
  }

  state.selectedStudentId = studentId;
  renderDirectory();
  elements.profileEmpty.textContent = "Loading student profile...";
  elements.profileEmpty.classList.remove("hidden");
  elements.profileContent.classList.add("hidden");

  const profile = await apiRequest(`/api/admin/student/${studentId}/records`);
  renderProfile(profile);
}

async function refreshData(nextSelectedId = state.selectedStudentId) {
  await Promise.all([loadOverview(), loadStudents()]);

  if (state.students.length) {
    const selectedId = state.students.some((student) => student._id === nextSelectedId)
      ? nextSelectedId
      : state.students[0]._id;

    await selectStudent(selectedId);
  } else {
    renderProfile(null);
  }
}

async function handleCreateStudent(event) {
  event.preventDefault();
  showStatus("studentsMessage", "Creating student profile...");

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
    await refreshData(response.student?._id);
    showStatus("studentsMessage", "Student account created successfully.", { success: true });
  } catch (error) {
    showStatus("studentsMessage", error.message, { error: true });
  }
}

async function handleProfileUpdate(event) {
  event.preventDefault();
  const studentId = document.getElementById("profileStudentId").value;

  if (!studentId) {
    return;
  }

  showStatus("studentsMessage", "Updating student profile...");

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

    await refreshData(studentId);
    showStatus("studentsMessage", "Student profile updated.", { success: true });
  } catch (error) {
    showStatus("studentsMessage", error.message, { error: true });
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

    await refreshData();
    showStatus("studentsMessage", "Student deleted.", { success: true });
  } catch (error) {
    showStatus("studentsMessage", error.message, { error: true });
  }
}

function bindEvents() {
  document.getElementById("studentCreateForm").addEventListener("submit", handleCreateStudent);
  document.getElementById("studentProfileForm").addEventListener("submit", handleProfileUpdate);
  elements.search.addEventListener("input", renderDirectory);
  elements.classFilter.addEventListener("change", renderDirectory);
  elements.sectionFilter.addEventListener("change", renderDirectory);

  elements.directoryBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest("[data-delete-id]");
    const attendanceButton = event.target.closest("[data-attendance-id]");
    const openButton = event.target.closest("[data-open-id]");
    const row = event.target.closest("[data-student-row]");

    if (deleteButton) {
      await handleDeleteStudent(deleteButton.dataset.deleteId);
      return;
    }

    if (attendanceButton) {
      window.location.href = `admin-attendance.html?student=${attendanceButton.dataset.attendanceId}`;
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

async function initialize() {
  if (!initializeAdminPage()) {
    return;
  }

  bindEvents();
  setHealthState("Loading student records...");

  try {
    await refreshData();
    showStatus("studentsMessage", "Student records ready.", { success: true });
  } catch (error) {
    setHealthState("Data unavailable");
    showStatus("studentsMessage", error.message, { error: true });
  }
}

initialize();
