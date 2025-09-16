//Change variable names 

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById("logOutButton");

const contents = document.getElementById("content-container");
const addContentButton = document.getElementById("add-content-button");

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



