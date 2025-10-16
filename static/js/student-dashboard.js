//Change variable names 
import Notification from './modules/Notification.js'

const profileButton = document.getElementById("profile-button")
const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const logOutButton = document.getElementById('log-out-button');
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const studentInfo = document.getElementById('student-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
// let currentTab = "student";
let isInMainSection = false;

const id = sessionStorage.getItem("id")
const notification = new Notification();

logOutButton.addEventListener('click', () => {
    localStorage.clear();
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

profileButton.addEventListener('click', studentProfile)
window.addEventListener('resize', moveStudentInfo);

document.addEventListener("DOMContentLoaded", async function() {
    showContent(1)
    showUserInfo()

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

async function showContent(contentTypeNum){
    const url = `/students/contents/${contentTypeNum}`

    try{
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.status){
            result.data.forEach(element => {
                console.log(element)
            });
        }
        else{
            console.log(result.message)
            notification.notify("Contents can't be retrieved at the moment. Please try again.", "error")

        }
    }
    catch (error){
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
    
}

async function showUserInfo(){
    const url = `/user/${id}`;
    const response = await fetch(url);
    const result = await getInfo.json();

    try{
        if (response.ok && result.status){
            sessionStorage.setItem("fullName", result.data[0].fullName);
            
            const studentName = document.getElementById('student_name')
            const studentPicture = document.getElementById('student_picture')
            
            studentName.textContent = sessionStorage.getItem("fullName")
            
            if (result.data[0].image){
                sessionStorage.setItem("image", result.data[0].image)
                studentPicture.src = sessionStorage.getItem("image")
            }
            else{
                sessionStorage.setItem("image", defaultProfilePicture)
                studentPicture.src = sessionStorage.getItem("image")
            }

        }
        else{
            console.log(result.message)
            notification.notify("User details can't be retrieved at the moment. Please try again.", "error")
        }
    }
    catch (error){
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }

}

moveStudentInfo();


