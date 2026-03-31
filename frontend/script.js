const API = "https://parent-portal-1.onrender.com";

// LOGIN
const form = document.getElementById("loginForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const res = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        email: email.value,
        password: password.value
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
      alert(data.message);
    }
  });
}

// CREATE STUDENT
async function createStudent(){
  const token = localStorage.getItem("token");

  await fetch(`${API}/api/admin/create-student`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({
      name:name.value,
      email:email.value,
      password:password.value,
      usn:usn.value,
      className:className.value,
      section:section.value
    })
  });

  alert("Student created");
}

// LOAD STUDENTS
async function loadStudents(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/admin/students`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  studentDropdown.innerHTML =
    data.map(s=>`<option value="${s._id}">${s.name}</option>`).join("");
}

// SAVE SUBJECTS
async function saveSubjects(){
  const token = localStorage.getItem("token");

  await fetch(`${API}/api/admin/subjects`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({
      className:classSub.value,
      subjects:subjectsInput.value.split(",")
    })
  });

  alert("Subjects saved");
}

// LOAD SUBJECTS
async function loadSubjects(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/admin/subjects/${classFetch.value}`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  subjectsUI.innerHTML =
    data.subjects.map(s=>`
      <input placeholder="${s}" class="markInput" data-sub="${s}">
    `).join("");
}

// SAVE MARKS
async function saveMarks(){
  const token = localStorage.getItem("token");

  const inputs = document.querySelectorAll(".markInput");

  const subjects = Array.from(inputs).map(i=>({
    name:i.dataset.sub,
    marks:i.value
  }));

  await fetch(`${API}/api/admin/marks`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({
      studentId:studentDropdown.value,
      subjects
    })
  });

  alert("Marks saved");
}

// DASHBOARD MARKS
async function loadMarks(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/marks`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  new Chart(document.getElementById("marksChart"),{
    type:"bar",
    data:{
      labels:data.subjects.map(s=>s.name),
      datasets:[{
        data:data.subjects.map(s=>s.marks)
      }]
    }
  });
}

// ATTENDANCE
async function loadAttendance(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/attendance`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  new Chart(document.getElementById("attendanceChart"),{
    type:"doughnut",
    data:{
      labels:["Present","Absent"],
      datasets:[{
        data:[data.present,data.absent]
      }]
    }
  });
}

// AUTO LOAD
if(window.location.pathname.includes("admin")){
  loadStudents();
}

if(window.location.pathname.includes("dashboard")){
  loadMarks();
  loadAttendance();
}