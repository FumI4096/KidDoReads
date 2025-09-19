//Change variable names 

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById("logOutButton");

const contents = document.getElementById("content-container");
const addContentButton = document.getElementById("add-content-button");
const defaultProfilePicture = "../static/images/default_profile_picture.png";

activityNavButton.addEventListener('click', (e) => {
    // showRecords('/students')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

assessmentNavButton.addEventListener('click', (e) => {
    // showRecords('/teachers')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

progressNavButton.addEventListener('click', (e) => {
    // showRecords('/admins')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
})

document.addEventListener("DOMContentLoaded", async function() {
    const id = localStorage.getItem("id")

    const url = `/user/${id}`;
    const getInfo = await fetch(url);

    const user = await getInfo.json();

    if (user.status){
        localStorage.setItem("fullName", user.data[0].fullName);
        
        const studentName = document.getElementById('student_name')
        const studentPicture = document.getElementById('student_picture')
        
        studentName.textContent = localStorage.getItem("fullName")
        
        if (user.data[0].image){
            localStorage.setItem("image", user.data[0].image)
            studentPicture.src = localStorage.getItem("image")
        }
        else{
            localStorage.setItem("image", defaultProfilePicture)
            studentPicture.src = localStorage.getItem("image")
        }

    }
});



