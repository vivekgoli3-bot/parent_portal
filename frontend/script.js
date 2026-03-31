const API = "https://parent-portal-1.onrender.com";

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

// LOAD SUBJECTS DYNAMIC
async function loadSubjects(){
  const token = localStorage.getItem("token");

  const res = await fetch(`${API}/api/admin/subjects/${classFetch.value}`,{
    headers:{Authorization:token}
  });

  const data = await res.json();

  document.getElementById("subjectsUI").innerHTML =
    data.subjects.map(s=>`
      <input placeholder="${s}" class="markInput" data-sub="${s}">
    `).join("");
}

// SAVE MARKS (EDIT ALSO)
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
      studentId:studentId.value,
      subjects
    })
  });

  alert("Marks saved");
}