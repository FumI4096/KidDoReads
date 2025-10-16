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

const id = sessionStorage.getItem("id")

logOutButton.addEventListener('click', () => {
    localStorage.clear();
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

addContentButton.addEventListener("click", createContent);

function createContent(){
    const contentContainer = document.createElement("form");
    contentContainer.setAttribute('id', "content-input-container");

    contentContainer.action = "/contents"
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
        const titleInput = contentTitle.value.trim().toLowerCase();
        const activityExists = Array.from(allContentNames).some(
            (name) => name.innerHTML.trim().toLowerCase() === titleInput
        );
        if (titleInput === "" || selectContent.value === "") {
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

        formData.append('teacher_id', id)

        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData
        });

        const result = await response.json()

        try{
            if (response.ok && result.status){
                contents.innerHTML = '';
                localStorage.setItem("currentActivityTitle", contentTitle.value.trim())
                localStorage.setItem("originalActivityTitle", contentTitle.value.trim())
                switch(selectContent.value){
                    case "1":
                        gamePageSwitch('/word_audio_match_edit')
                        break
                    default:
                        console.log("Error")
                }
            }
            else{
                console.log(result.message)
                notification.notify("Activity can't be created at the moment. Please try again.", "error")
            }

        }
        catch (error){
            console.error("Network Error:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    });


}

document.addEventListener("DOMContentLoaded", async function() {
    showUserInfo()
    showContents()
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
    const url = `/contents/${id}`;
    const response = await fetch(url);
    const result = await response.json();

    try{
        if (response.ok && result.status){
            result.data.forEach(data => {
                addContent(data.content_title, data.content_type, data.isHidden)
            })
        }
        else{
            console.log(result.message)
            notification.notify("Activities can't be retrieved at the moment. Please try again.", "error");
        }

    }
    catch(error){
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
}

async function showUserInfo(){
    const url = `/user/${id}`;
    const response = await fetch(url);
    const result = await response.json();

    try{
        if (response.ok && result.status){
            sessionStorage.setItem("fullName", result.data[0].fullName);

            const teacherName = document.getElementById('teacher_name')
            const teacherPicture = document.getElementById('teacher_picture')

            teacherName.textContent = sessionStorage.getItem("fullName")
            if (result.data[0].image){
                sessionStorage.setItem("image", result.data[0].image)
                teacherPicture.src = sessionStorage.getItem("image")
            }
            else{
                sessionStorage.setItem("image", defaultProfilePicture)
                teacherPicture.src = sessionStorage.getItem("image")
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

function addContent(content_title, content_type, content_hidden){
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
    const deleteButton = document.createElement("button")

    const hideFromStudentContainer = document.createElement("div")
    hideFromStudentContainer.classList.add("hide-from-student-container")
    const hideFromStudentCheckbox = document.createElement("input")
    hideFromStudentCheckbox.type = "checkbox"
    hideFromStudentCheckbox.classList.add("hide-from-student-checkbox")  
    hideFromStudentCheckbox.checked = content_hidden;

    const hideFromStudentLabel = document.createElement("label")
    hideFromStudentLabel.textContent = "Hidden from Students"
    
    editButton.classList.add("edit-button");
    editButton.innerHTML = "Edit Activity";
    previewButton.classList.add("preview-button");
    previewButton.innerHTML = "Preview Activity";
    deleteButton.classList.add("delete-button");
    deleteButton.innerHTML = "Delete Activity";

    hideFromStudentContainer.append(hideFromStudentCheckbox, hideFromStudentLabel)
    
    const buttonActionContainer = document.createElement("div");
    buttonActionContainer.classList.add("content-button-action-container");
    buttonActionContainer.appendChild(editButton);
    buttonActionContainer.appendChild(previewButton);
    buttonActionContainer.appendChild(deleteButton);
    buttonActionContainer.appendChild(hideFromStudentContainer);

    hideFromStudentCheckbox.addEventListener('change', async () => {
        const isHidden = hideFromStudentCheckbox.checked ? 1 : 0
        const url = `content/${id}/${content_title}/${isHidden}`

        try{
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json' 
    
                },
            });
    
            const result = await response.json()
    
            if (response.ok && result.status){
                notification.notify(result.message, "success")
            }
            else{
                notification.notify(result.message, "error")
            }
        }
        catch(error){
            console.error("Network Error during deletion:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    })

    deleteButton.addEventListener('click', async () => {
        const url = `content/${id}/${content_title}`

        try{
            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json' 
    
                },
            });
    
            const result = await response.json()
    
            if (response.ok && result.status){
                notification.notify(result.message, "success")
                newContent.remove();
            }
            else{
                const message = result.message || "Failed to delete content. Please try again.";
                notification.notify(message, "error");
                console.error("Server Error:", result);
            }
        }
        catch(error){
            console.error("Fetch Error:", error);
            notification.notify("An unexpected error occurred. Please check your connection and try again.", "error");
        }
    })

    editButton.addEventListener('click', async () => {
        const url = `/contents/${id}/${content_title}`
        
        try{
            const response = await fetch(url)
            const result = await response.json()
            let gameUrl = editGamePageTo(content_type)
            
            if (response.ok && result.status){
                if (result.data) {
                    sessionStorage.setItem("questions", JSON.stringify(result.data))
                } 
                else {
                    sessionStorage.setItem("questions", "[]")
                }
                gamePageSwitch(gameUrl)
            }
            else{
                const message = "Unable to retrieve content. Please try again later." || result.message
                notification.notify(message, "error");
                console.error("Server Error:", result.message);
            }
        }
        catch (error){
            console.error("Network Error while fetching content:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    })

    previewButton.addEventListener('click', async () => {
        const url = `/contents/${id}/${content_title}`
    
        try{
            const response = await fetch(url)
            const result = await response.json()
            let gameUrl = previewGamePageTo(content_type)
            
            if (response.ok && result.status){
                if (Array.isArray(result.data) && result.data.length > 0) {
                    sessionStorage.setItem("questions", JSON.stringify(result.data))
                } 
                else {
                    sessionStorage.setItem("questions", "[]")
                }
                gamePageSwitch(gameUrl)
            }
            else{
                const message = "Unable to retrieve content. Please try again later." || result.message
                notification.notify(message, "error");
                console.error("Server Error:", response);
                return;
            }
        }
        catch (error){
            console.error("Network Error while fetching content:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    })

    newContent.appendChild(buttonActionContainer);
    contents.appendChild(newContent);
    contents.appendChild(addContentButton); // Re-add button
}

function gamePageSwitch(pageUrl){
    window.location.href = pageUrl
}

function editGamePageTo(url){
    switch(url){
        case 'Pronunciation: Word Audio Match':
            return '/word_audio_match_edit';
        case 'Phonemic Awareness: Listen & Choose':
            // return '/word_audio_match';
        case 'Word Recognition: Sound-Alike Match' :
            // return '/word_audio_match';
        case 'Word Recognition: Meaning Maker':
            // return '/word_audio_match';
        case 'Reading Comprehension: What Happens Next?':
            // return '/word_audio_match';
        case 'Reading Comprehension: Picture + Clues':
            // return '/word_audio_match';
    }
}

function previewGamePageTo(url){
    switch(url){
        case 'Pronunciation: Word Audio Match':
            return '/word_audio_match_preview';
            break;
        case 'Phonemic Awareness: Listen & Choose':
            // return '/word_audio_match';
        case 'Word Recognition: Sound-Alike Match' :
            // return '/word_audio_match';
        case 'Word Recognition: Meaning Maker':
            // return '/word_audio_match';
        case 'Reading Comprehension: What Happens Next?':
            // return '/word_audio_match';
        case 'Reading Comprehension: Picture + Clues':
            // return '/word_audio_match';
    }
}


moveStudentInfo();