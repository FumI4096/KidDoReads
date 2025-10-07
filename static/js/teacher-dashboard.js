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

addContentButton.addEventListener("click", testContent);

function testContent(){
    const contentContainer = document.createElement("form");
    contentContainer.setAttribute('id', "content-input-container");

    contentContainer.action = "/create_content"
    contentContainer.method = "POST"

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
    contentTitle.name = 'content_title'
    contentTitle.type = "text";
    contentTitle.placeholder = "Enter Content Title";

    const submitContentButton = document.createElement("input");
    submitContentButton.type = "submit";
    submitContentButton.value = "Confirm";
    submitContentButton.setAttribute('id',"submit-content");

    createContent.appendChild(closeContentButton);
    createContent.appendChild(contentHeaderStatement)
    createContent.appendChild(contentTitle);
    contentContainer.appendChild(createContent);

    const contentTypeContainer = document.createElement("div");
    contentTypeContainer.setAttribute('id',"content-type-container");

    const selectContent = document.createElement("select");
    selectContent.setAttribute('id', "content-type");
    selectContent.id = "content_type";
    selectContent.name = "content_type";

    const contentTypes = [
        {value: '', text: 'Activity Type'},
        {value: '1', text: 'Pronunciation: Word Audio Match'}, 
        {value: '2', text: 'Phonemic Awareness: Listen & Choose'}, 
        {value: '3', text: 'Word Recognition: Sound-Alike Match'},
        {value: '4', text: 'Word Recognition: Meaning Maker'},
        {value: '5', text: 'Reading Comprehension: What Happens Next?'},
        {value: '6', text: 'Reading Comprehension: Picture + Clues'}
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

    closeContentButton.addEventListener("click", () => {
        document.body.removeChild(contentContainer);
    });

    contentContainer.addEventListener('submit', async (e) => {
        e.preventDefault();

        const allContentNames = document.querySelectorAll(".activity-name");
        const activityExists = Array.from(allContentNames).some(
            (name) => name.innerHTML === contentTitle.value.trim()
        );
        if (contentTitle .value === "" || selectContent.value === "") {
            notification.notify("Please fill out all fields.", "error");
            return;
        }
        
        if (activityExists) {
            notification.notify("This activity already exists. Please create a different activity.", "error");
            return;
        }

        const formBody = e.target;
        const actionUrl = formBody.action;
        const formData = new FormData(formBody);

        formData.append('teacher_id', localStorage.getItem("id"))

        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData
        });

        const result = await response.json()

        if (result.status){
            formBody.reset()
            document.body.removeChild(contentContainer)
            contents.innerHTML = '';
            showContents()
        }
    });


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

async function showContents() {
    const id = localStorage.getItem("id")

    const url = `/get_contents/${id}`;
    const response = await fetch(url);

    const result = await response.json();

    if (result.status){
        result.data.forEach(data => {
            addContent(data.content_title, data.content_type)
        })
    }
    else{
        console.log(result.message)
    }
}

function addContent(content_title, content_type){
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const activityType = document.createElement("p");
    newContent.classList.add("content");
    activityName.classList.add("activity-name");
    activityType.classList.add("activity-type");
    activityName.innerHTML = content_title;
    activityType.innerHTML = content_type;
    newContent.appendChild(activityName);
    newContent.appendChild(activityType);

    const editButton = document.createElement("button");
    const previewButton = document.createElement("button");
    const hideFromStudentButton = document.createElement("button");
    
    editButton.classList.add("edit-button");
    editButton.innerHTML = "Edit";
    previewButton.classList.add("preview-button");
    previewButton.innerHTML = "Preview";
    hideFromStudentButton.classList.add("hide-from-student-button");
    hideFromStudentButton.innerHTML = "Hide from Students";
    
    const buttonActionContainer = document.createElement("div");
    buttonActionContainer.classList.add("content-button-action-container");
    buttonActionContainer.appendChild(editButton);
    buttonActionContainer.appendChild(previewButton);
    buttonActionContainer.appendChild(hideFromStudentButton);

    newContent.appendChild(buttonActionContainer);

    contents.appendChild(newContent);
    contents.appendChild(addContentButton); // Re-add button
}

showContents()
moveStudentInfo();