import {
  apiRequest,
  bindLogoutButtons,
  ensureSession,
  escapeHtml,
  formatDate,
  showStatus
} from "./api.js";

export { apiRequest, escapeHtml, formatDate, showStatus };

export function initializeAdminPage() {
  if (!ensureSession("admin")) {
    return false;
  }

  bindLogoutButtons();
  return true;
}

export function setHealthState(message) {
  const element = document.getElementById("erpHealthState");

  if (element) {
    element.textContent = message;
  }
}

export function getClassOptions(students = []) {
  return [...new Set(students.map((student) => student.className).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export function getSectionOptions(students = []) {
  return [...new Set(students.map((student) => student.section).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
}

export function populateFilterSelect(select, options, allLabel, selectedValue = "") {
  if (!select) {
    return;
  }

  select.innerHTML = `
    <option value="">${allLabel}</option>
    ${options.map((option) => `
      <option value="${escapeHtml(option)}">${escapeHtml(option)}</option>
    `).join("")}
  `;

  select.value = selectedValue;
}

export function populateStudentSelect(select, students = [], selectedValue = "", placeholder = "") {
  if (!select) {
    return;
  }

  select.innerHTML = `
    ${placeholder ? `<option value="">${escapeHtml(placeholder)}</option>` : ""}
    ${students.map((student) => `
      <option value="${student._id}">
        ${escapeHtml(student.name)}${student.className ? ` - ${escapeHtml(student.className)}` : ""}
      </option>
    `).join("")}
  `;

  if (selectedValue) {
    select.value = selectedValue;
  }
}

export function filterStudents(students = [], filters = {}) {
  const search = (filters.search || "").trim().toLowerCase();
  const className = filters.className || "";
  const section = filters.section || "";

  return students.filter((student) => {
    const haystack = [
      student.name,
      student.usn,
      student.parentEmail,
      student.className,
      student.section
    ].join(" ").toLowerCase();

    const matchesSearch = !search || haystack.includes(search);
    const matchesClass = !className || student.className === className;
    const matchesSection = !section || student.section === section;

    return matchesSearch && matchesClass && matchesSection;
  });
}
