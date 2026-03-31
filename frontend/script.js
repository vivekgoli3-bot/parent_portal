const API = "https://parent-portal-1.onrender.com";

// LOGOUT
function logout(){
  localStorage.removeItem("token");
  window.location.href = "index.html";
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

  studentDropdownAtt.innerHTML = studentDropdown.innerHTML;
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
  loadStudents();
}

// SUBJECTS
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

// ATTENDANCE
async function saveAttendance(){
  const token = localStorage.getItem("token");

  await fetch(`${API}/api/admin/attendance`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      Authorization:token
    },
    body:JSON.stringify({
      studentId:studentDropdownAtt.value,
      present:present.value,
      absent:absent.value
    })
  });

  alert("Attendance saved");
}

// STUDENT TABLE
async function loadStudentsTable(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/admin/students`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  document.querySelector("#studentTable tbody").innerHTML =
    data.map(s=>`
      <tr>
        <td>${s.name}</td>
        <td>${s.className}</td>
        <td>
          <button onclick="deleteStudent('${s._id}')">Delete</button>
        </td>
      </tr>
    `).join("");
}

// DELETE
async function deleteStudent(id){
  const token = localStorage.getItem("token");

  await fetch(`${API}/api/admin/student/${id}`,{
    method:"DELETE",
    headers:{Authorization:token}
  });

  loadStudentsTable();
}

// DASHBOARD
async function loadDashboard(){
  const token = localStorage.getItem("token");

  const res1 = await fetch(`${API}/api/parent/dashboard`,{
    headers:{Authorization:token}
  });

  const data = await res1.json();

  new Chart(document.getElementById("marksChart"),{
    type:"bar",
    data:{
      labels:data.marks.subjects.map(s=>s.name),
      datasets:[{data:data.marks.subjects.map(s=>s.marks)}]
    }
  });

  new Chart(document.getElementById("attendanceChart"),{
    type:"doughnut",
    data:{
      labels:["Present","Absent"],
      datasets:[{
        data:[data.attendance.present,data.attendance.absent]
      }]
    }
  });
}

// AUTO LOAD
if(location.pathname.includes("admin")){
  loadStudents();
  loadStudentsTable();
}

if(location.pathname.includes("dashboard")){
  loadDashboard();
}

// REAL-TIME UPDATE
setInterval(()=>{
  if(location.pathname.includes("admin")){
    loadStudentsTable();
  }
},5000);