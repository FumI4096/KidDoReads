import Notification from './modules/Notification.js'

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById('log-out-button');
const contents = document.getElementById("content-container");
const addContentButton = document.getElementById("add-content-button");
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const teacherInfo = document.getElementById('teacher-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
const notification = new Notification();
let isInMainSection = false;

logOutButton.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/logout'
})

window.addEventListener('resize', moveStudentInfo);


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

addContentButton.addEventListener("click", testContent);

function testContent(){
    const contentContainer = document.createElement("div");
    contentContainer.setAttribute('id', "content-input-container");

    const closeContentButton = document.createElement("ion-icon");
    closeContentButton.name = "close-outline";
    closeContentButton.setAttribute('id', "close-content-button");
    closeContentButton.style.color = 'white';

    const contentHeaderStatement = document.createElement("p");
    contentHeaderStatement.setAttribute('id', 'content-header-statement')
    contentHeaderStatement.textContent = "Create an Activity";

    const createContent = document.createElement("div");
    createContent.setAttribute('id', "create-content");

    const contentTitle = document.createElement("input");
    contentTitle.setAttribute('id',"content-title");
    contentTitle.type = "text";
    contentTitle.placeholder = "Enter Content Title";

    const submitContentButton = document.createElement("button");
    submitContentButton.innerHTML = "Confirm";
    submitContentButton.setAttribute('id',"submit-content");

    createContent.appendChild(closeContentButton);
    createContent.appendChild(contentHeaderStatement)
    createContent.appendChild(contentTitle);
    contentContainer.appendChild(createContent);

    const contentTypeContainer = document.createElement("div");
    contentTypeContainer.setAttribute('id',"content-type-container");

    const selectContent = document.createElement("select");
    selectContent.setAttribute('id', "content-type");
    selectContent.id = "content-type";
    selectContent.name = "content-type";

    const contentTypes = [
        {value: '', text: 'Activity Type'},
        {value: 'activity1', text: 'Activity 1'}, 
        {value: 'activity2', text: 'Activity 2'}, 
        {value: 'activity3', text: 'Activity 3'}
    ];
    contentTypes.forEach(type => {
        const optionElement = document.createElement('option');
        optionElement.value = type.value;
        optionElement.textContent = type.text;

        selectContent.appendChild(optionElement)
    });
    
    contentTypeContainer.appendChild(selectContent);
    createContent.appendChild(contentTypeContainer);
    createContent.appendChild(submitContentButton);
    document.body.appendChild(contentContainer);

    submitContentButton.addEventListener('click', addContent)

    closeContentButton.addEventListener("click", () => {
        document.body.removeChild(contentContainer);
    });

    function addContent(){
        const newContent = document.createElement("div");
        const testElement = document.createElement("p");
        testElement.innerHTML = "test";
        newContent.classList.add("content");
        newContent.appendChild(testElement);
        contents.appendChild(newContent);
        contents.appendChild(addContentButton); // Re-add button
        document.body.removeChild(contentContainer);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    const id = localStorage.getItem("id")

    const url = `/user/${id}`;
    const getInfo = await fetch(url);

    const user = await getInfo.json();

    if (user.status){
        localStorage.setItem("fullName", user.data[0].fullName);

        const teacherName = document.getElementById('teacher_name')
        const teacherPicture = document.getElementById('teacher_picture')

        teacherName.textContent = localStorage.getItem("fullName")
        if (user.data[0].image){
            localStorage.setItem("image", user.data[0].image)
            teacherPicture.src = localStorage.getItem("image")
        }
        else{
            localStorage.setItem("image", defaultProfilePicture)
            teacherPicture.src = localStorage.getItem("image")
        }

    }
});

function moveStudentInfo(){
    if (window.innerWidth <= 936 && !isInMainSection) {
        mainSection.insertBefore(teacherInfo, mainSection.firstChild);
        isInMainSection = true;
    } else if (window.innerWidth > 936 && isInMainSection) {
        mainAside.insertBefore(teacherInfo, mainAside.firstChild);
        isInMainSection = false;
    }
    
}

moveStudentInfo();