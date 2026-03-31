import {
  apiRequest,
  escapeHtml,
  initializeAdminPage,
  populateStudentSelect,
  setHealthState,
  showStatus
} from "./admin-core.js";

const state = {
  overview: null,
  students: [],
  subjects: [],
  selectedStudentId: ""
};

const elements = {
  marksStudentSelect: document.getElementById("marksStudentSelect"),
  marksClassInput: document.getElementById("marksClassInput"),
  marksFields: document.getElementById("marksFields"),
  marksTemplateStatus: document.getElementById("marksTemplateStatus"),
  subjectDirectoryCount: document.getElementById("subjectDirectoryCount"),
  subjectDirectoryList: document.getElementById("subjectDirectoryList")
};

function renderMetrics() {
  const metrics = state.overview?.metrics;

  if (!metrics) {
    return;
  }

  document.getElementById("academicsMetricMappings").textContent = metrics.subjectMappings;
  document.getElementById("academicsMetricSubjects").textContent = metrics.configuredSubjects;
  document.getElementById("academicsMetricMarks").textContent = metrics.averageMarks;
  setHealthState(state.overview.alerts?.[0]?.title || "Academics synced");
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

function renderStudentSnapshot(profile) {
  if (!profile) {
    document.getElementById("academicProfileBadge").textContent = "No student selected";
    document.getElementById("academicStudentName").textContent = "Select a student";
    document.getElementById("academicStudentMeta").textContent =
      "Marks and class template will appear here.";
    document.getElementById("studentMarksList").innerHTML =
      "<p class='subtle-text'>No academic data loaded yet.</p>";
    return;
  }

  const { student, marks, analytics } = profile;

  document.getElementById("academicProfileBadge").textContent =
    `${student.className || "Class pending"}${student.section ? ` • ${student.section}` : ""}`;
  document.getElementById("academicStudentName").textContent = student.name;
  document.getElementById("academicStudentMeta").textContent =
    `${student.parentEmail || "No parent email linked"} • ${analytics.averageMarks} average marks`;
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
  populateStudentSelect(
    elements.marksStudentSelect,
    state.students,
    state.selectedStudentId,
    "Select student"
  );
}

async function loadSubjectsDirectory() {
  state.subjects = await apiRequest("/api/admin/subjects");
  renderSubjectDirectory();
}

async function selectStudent(studentId) {
  state.selectedStudentId = studentId;
  populateStudentSelect(
    elements.marksStudentSelect,
    state.students,
    state.selectedStudentId,
    "Select student"
  );

  if (!studentId) {
    elements.marksClassInput.value = "";
    elements.marksTemplateStatus.textContent = "Select a student to begin.";
    renderMarksInputs();
    renderStudentSnapshot(null);
    return;
  }

  const profile = await apiRequest(`/api/admin/student/${studentId}/records`);
  const subjectTemplate = profile.subjectConfig.subjects.length
    ? profile.subjectConfig.subjects
    : profile.marks.subjects.map((subject) => subject.name);

  elements.marksClassInput.value = profile.student.className || "";
  elements.marksTemplateStatus.textContent = subjectTemplate.length
    ? `Loaded ${subjectTemplate.length} subject${subjectTemplate.length === 1 ? "" : "s"} for ${profile.student.className || "selected class"}.`
    : "This class does not have a subject template yet.";
  renderMarksInputs(subjectTemplate, profile.marks.subjects);
  renderStudentSnapshot(profile);
}

async function refreshData(nextSelectedId = state.selectedStudentId) {
  await Promise.all([loadOverview(), loadStudents(), loadSubjectsDirectory()]);

  if (state.students.length) {
    const selectedId = state.students.some((student) => student._id === nextSelectedId)
      ? nextSelectedId
      : state.students[0]._id;

    await selectStudent(selectedId);
  } else {
    await selectStudent("");
  }
}

async function handleSubjectSave(event) {
  event.preventDefault();
  showStatus("academicsMessage", "Saving curriculum mapping...");

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

    await refreshData();
    showStatus("academicsMessage", "Curriculum map saved.", { success: true });
  } catch (error) {
    showStatus("academicsMessage", error.message, { error: true });
  }
}

async function loadMarksTemplate() {
  const className = elements.marksClassInput.value.trim();

  if (!className) {
    showStatus("academicsMessage", "Enter or select a class before loading subjects.", { error: true });
    return;
  }

  try {
    const data = await apiRequest(`/api/admin/subjects/${encodeURIComponent(className)}`);
    elements.marksTemplateStatus.textContent = data.subjects.length
      ? `Loaded ${data.subjects.length} subjects for ${className}.`
      : `No subjects found for ${className}. Add a curriculum map first.`;
    renderMarksInputs(data.subjects);
  } catch (error) {
    showStatus("academicsMessage", error.message, { error: true });
  }
}

async function handleMarksSave(event) {
  event.preventDefault();
  const studentId = elements.marksStudentSelect.value;

  if (!studentId) {
    showStatus("academicsMessage", "Select a student before saving marks.", { error: true });
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

    await refreshData(studentId);
    showStatus("academicsMessage", "Marks saved successfully.", { success: true });
  } catch (error) {
    showStatus("academicsMessage", error.message, { error: true });
  }
}

function bindEvents() {
  document.getElementById("subjectForm").addEventListener("submit", handleSubjectSave);
  document.getElementById("marksForm").addEventListener("submit", handleMarksSave);
  document.getElementById("loadMarksTemplateButton").addEventListener("click", loadMarksTemplate);

  elements.marksStudentSelect.addEventListener("change", async (event) => {
    const student = state.students.find((item) => item._id === event.target.value);
    elements.marksClassInput.value = student?.className || "";
    await selectStudent(event.target.value);
  });
}

async function initialize() {
  if (!initializeAdminPage()) {
    return;
  }

  bindEvents();
  setHealthState("Loading academic controls...");

  try {
    await refreshData();
    showStatus("academicsMessage", "Academic controls ready.", { success: true });
  } catch (error) {
    setHealthState("Academics unavailable");
    showStatus("academicsMessage", error.message, { error: true });
  }
}

initialize();
