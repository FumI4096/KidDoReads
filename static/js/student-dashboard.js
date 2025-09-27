//Change variable names 

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const badgesNavButton = document.getElementById("badges-record-button")
const logOutButton = document.getElementById('log-out-button');
const contents = document.getElementById("content-container");
const addContentButton = document.getElementById("add-content-button");
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const studentInfo = document.getElementById('student-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
// let currentTab = "student";
let isInMainSection = false;


logOutButton.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/logout'
})

activityNavButton.addEventListener('click', () => {
    // showRecords('/students')
    activityNavButton.disabled = true
    activityNavButton.style.pointerEvents = 'none'
    activityNavButton.classList.add('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

assessmentNavButton.addEventListener('click', () => {
    // showRecords('/teachers')
    assessmentNavButton.disabled = true
    assessmentNavButton.style.pointerEvents = 'none'
    assessmentNavButton.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

progressNavButton.addEventListener('click', () => {
    // showRecords('/admins')
    progressNavButton.disabled = true
    progressNavButton.style.pointerEvents = 'none'
    progressNavButton.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
})

// badgesNavButton.addEventListener('click', studentProfile)
window.addEventListener('resize', moveStudentInfo);

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

function studentProfile(){
    const profileBackground = document.createElement('div')
    const profileContainer = document.createElement('div')
    const profileButtonContainer = document.createElement('nav')
    const informationContainer = document.createElement('section')
    const userContainer = document.createElement('article')
    const badgesContainer = document.createElement('aside')

    profileBackground.setAttribute('id', 'profile-background')
    profileContainer.setAttribute('id', 'profile-container')
    profileButtonContainer.setAttribute('id', 'profile-button-container')
    informationContainer.setAttribute('id', 'information-container')
    userContainer.setAttribute('id', 'user-container')
    badgesContainer.setAttribute('id', 'badges-container') // add badges here

    const identificationStatement = document.createElement('p')
    const closeButton = document.createElement('img')
    const studentImage = document.createElement('img')
    const studentName = document.createElement('span')
    const studentId = document.createElement('span') //extra info (can be removed)

    identificationStatement.textContent = "Student Identification Card"
    closeButton.src = '../static/images/close-outline.svg'
    studentImage.src = localStorage.getItem('image')
    studentName.textContent = localStorage.getItem('fullName')
    studentId.textContent = localStorage.getItem('id')

    profileButtonContainer.append(identificationStatement, closeButton)
    userContainer.append(studentImage, studentName)

    informationContainer.append(userContainer, badgesContainer)
    profileContainer.append(profileButtonContainer, informationContainer)
    profileBackground.append(profileContainer)

    document.body.appendChild(profileBackground)


    closeButton.addEventListener('click', () => {
        document.body.removeChild(profileBackground)
    })

}

function moveStudentInfo(){
    if (window.innerWidth <= 936 && !isInMainSection) {
        mainSection.insertBefore(studentInfo, mainSection.firstChild);
        isInMainSection = true;
    } else if (window.innerWidth > 936 && isInMainSection) {
        mainAside.insertBefore(studentInfo, mainAside.firstChild);
        isInMainSection = false;
    }
    
}

moveStudentInfo();


