import Notification from './modules/Notification.js'
import NavigationManager from './modules/NavigationManager.js';
import NAVIGATION_LEVELS from './modules/NavigationLevels.js';
import { encrypt, decrypt } from './modules/SessionHandling.js'

import { loginSuccess } from './modules/RedirectNotification.js'

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById('log-out-button');
const addContentButton = document.getElementById("add-content-button");
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const teacherInfo = document.getElementById('teacher-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
const chatbotButton = document.getElementById('chatbot-button')
const notification = new Notification();
let isInMainSection = false;


const id = await decrypt(sessionStorage.getItem("id"))


logOutButton.addEventListener('click', () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/logout'
})

window.addEventListener('resize', moveStudentInfo);


activityNavButton.addEventListener('click', async () => {
    await displayAssessmentsOrActivities(1)
    activityNavButton.disabled = true
    activityNavButton.style.pointerEvents = 'none'
    activityNavButton.classList.add('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

assessmentNavButton.addEventListener('click', async () => {
    await displayAssessmentsOrActivities(2)
    assessmentNavButton.disabled = true
    assessmentNavButton.style.pointerEvents = 'none'
    assessmentNavButton.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

progressNavButton.addEventListener('click', async () => {
    await getStudentProgressByContentType(id, 1)
    progressNavButton.disabled = true
    progressNavButton.style.pointerEvents = 'none'
    progressNavButton.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
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

        const loadingId = `loading-create-content-${Date.now()}`;
        notification.notify("Creating activity...", "loading", null, null, loadingId);

        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData
        });

        const result = await response.json()

        try{
            notification.dismissLoading(loadingId);
            
            if (response.ok && result.status){
                sessionStorage.setItem("currentActivityTitle", contentTitle.value.trim())
                sessionStorage.setItem("originalActivityTitle", contentTitle.value.trim())
                sessionStorage.setItem("currentActivityId", await encrypt(result.content_id))
                await insertTtsId(await decrypt(sessionStorage.getItem("currentActivityId")))
                editGamePageTo(parseInt(selectContent.value))
            }
            else{
                console.log(result.message)
                notification.notify("Activity can't be created at the moment. Please try again.", "error")
            }

        }
        catch (error){
            notification.dismissLoading(loadingId);
            console.error("Network Error:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    });


}

async function insertTtsId(id){
    const url = "/create-tts"

    const formData = new FormData();

    formData.append('content_id', id)

    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    const result = await response.json()

    try{
        if (response.ok && result.status){
            sessionStorage.setItem("currentTtsId", await encrypt(result.ttsId))
            console.log(result.message)
        }
        else{
            console.log(result.message)
        }
    }
    catch(e){
        console.log("SHIT: " + e)
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    await showUserInfo()
    await showContents()
});

// 1 = contents(activities), 2 = assessment
async function displayAssessmentsOrActivities(category){
    if(category === 1){
        await showContents()
    }
    else if(category === 2){
        await showAssessments()
    }
}

async function showContents() {
    const loadingId = `loading-contents-${Date.now()}`;
    notification.notify("Loading activities...", "loading", null, null, loadingId);
    
    mainSection.innerHTML = ''
    if (window.innerWidth <= 936){
        if (!mainSection.contains(await teacherInfoStructure())) mainSection.appendChild(await teacherInfoStructure());
    }
    mainSection.appendChild(categoryTypeStructure())
    mainSection.appendChild(contentStructure())
    const url = `/contents/${123}`;
    const response = await fetch(url, {
        credentials: 'same-origin'
    });
    const result = await response.json();

    try{
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status){
            if (result.data && result.data.length > 0) {
                result.data.forEach(data => {
                    addContent(contentStructure(), data.content_id, data.content_title, data.content_json, data.tts_json, data.content_type, data.content_type_name, data.isHidden)
                })
            }
            else{
                contentStructure().appendChild(addContainerButtonStructure())
            }
        }
        else{
            console.log(result.message)
            notification.notify("Activities can't be retrieved at the moment. Please try again.", "error");
        }

    }
    catch(error){
        notification.dismissLoading(loadingId);
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }

    function contentStructure(){
        const contentContainer = document.getElementById('content-container')

        if (!contentContainer){
            const div = document.createElement("div");
            div.setAttribute('id', "content-container");

            return div
        }

        return contentContainer
    }

    async function teacherInfoStructure(){
        const teacherInfoContainer = document.getElementById('teacher-info')

        if (!teacherInfoContainer){
            const sectionTeacherInfo = document.createElement("div");
            sectionTeacherInfo.setAttribute('id', "teacher-info");

            const teacherPicture = document.createElement('img')
            teacherPicture.setAttribute('id', 'teacher_picture')
            const teacherName = document.createElement('span')
            teacherName.setAttribute('id', 'teacher_name')
            sectionTeacherInfo.appendChild(teacherPicture)
            sectionTeacherInfo.appendChild(teacherName)

            teacherName.textContent = await decrypt(sessionStorage.getItem("fullName"))
            teacherPicture.src = await decrypt(sessionStorage.getItem("image"))

            return sectionTeacherInfo
        }

        return teacherInfoContainer
    }

    function addContainerButtonStructure(){
        const button = document.createElement("button")
        const span = document.createElement("span")
        const img = document.createElement("img")

        button.setAttribute('id', 'add-content-button')
        span.textContent = 'Add New Activity'
        img.src = '../../static/images/white-add-button.svg'

        button.append(span, img)
        button.addEventListener('click', createContent)

        return button
    }

    function categoryTypeStructure(){
        const categoryType = document.getElementById('category-type')
        
        if(!categoryType){
            const p = document.createElement("p")
            p.setAttribute('id', "category-type")
            p.textContent = "Activities"

            return p;
        }

        return categoryType
    }
}

async function showAssessments() {
    const loadingId = `loading-assessments-${Date.now()}`;
    notification.notify("Loading assessments...", "loading", null, null, loadingId);
    
    mainSection.innerHTML = ''
    if (window.innerWidth <= 936){
        if (!mainSection.contains(await teacherInfoStructure())) mainSection.appendChild(await teacherInfoStructure());
    }
    mainSection.appendChild(categoryTypeStructure())
    mainSection.appendChild(contentStructure())
    const url = '/assessments';
    const response = await fetch(url);
    const result = await response.json();

    try{
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status){
            if (result.data && result.data.length > 0) {
                result.data.forEach(data => {
                    addAssessment(contentStructure(), data.assessment_id, data.assessment_title, data.assessment_json, data.tts_json, data.assessment_type, data.assessment_type_name)
                })
            }
        }
        else{
            console.log(result.message)
            notification.notify("Activities can't be retrieved at the moment. Please try again.", "error");
        }

    }
    catch(error){
        notification.dismissLoading(loadingId);
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }

    function contentStructure(){
        const contentContainer = document.getElementById('content-container')

        if (!contentContainer){
            const div = document.createElement("div");
            div.setAttribute('id', "content-container");

            return div
        }

        return contentContainer
    }

    async function teacherInfoStructure(){
        const teacherInfoContainer = document.getElementById('teacher-info')

        if (!teacherInfoContainer){
            const sectionTeacherInfo = document.createElement("div");
            sectionTeacherInfo.setAttribute('id', "teacher-info");

            const teacherPicture = document.createElement('img')
            teacherPicture.setAttribute('id', 'teacher_picture')
            const teacherName = document.createElement('span')
            teacherName.setAttribute('id', 'teacher_name')
            sectionTeacherInfo.appendChild(teacherPicture)
            sectionTeacherInfo.appendChild(teacherName)

            teacherName.textContent = await decrypt(sessionStorage.getItem("fullName"))
            teacherPicture.src = await decrypt(sessionStorage.getItem("image"))

            return sectionTeacherInfo
        }

        return teacherInfoContainer
    }

    function categoryTypeStructure(){
        const categoryType = document.getElementById('category-type')
        
        if(!categoryType){
            const p = document.createElement("p")
            p.setAttribute('id', "category-type")
            p.textContent = "Assessments"

            return p;
        }

        return categoryType
    }
}


async function showUserInfo(){
    const loadingId = `loading-userinfo-${Date.now()}`;
    notification.notify("Loading user information...", "loading", null, null, loadingId);
    
    const url = `/user/${id}`;
    const response = await fetch(url);
    const result = await response.json();

    try{
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status){
            sessionStorage.setItem("fullName", await encrypt(result.data[0].fullName));

            const teacherName = document.getElementById('teacher_name')
            const teacherPicture = document.getElementById('teacher_picture')

            teacherName.textContent = await decrypt(sessionStorage.getItem("fullName"))
            if (result.data[0].image){
                sessionStorage.setItem("image", await encrypt(result.data[0].image))
                teacherPicture.src = await decrypt(sessionStorage.getItem("image"))
            }
            else{
                sessionStorage.setItem("image", await encrypt(defaultProfilePicture))
                teacherPicture.src = await decrypt(sessionStorage.getItem("image"))
            }

        }
        else{
            console.log(result.message)
            notification.notify("User details can't be retrieved at the moment. Please try again.", "error")
        }
    }
    catch (error){
        notification.dismissLoading(loadingId);
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
}

async function addAssessment(assessment_container, assessment_id, assessment_title, assessment_details, tts_json, assessment_type, assessment_type_name){
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const activityType = document.createElement("p");
    newContent.classList.add("content");
    newContent.style.backgroundImage = `url('/static/images/activities-background-images/${assessment_type}.jpg')`; /* content background image */
    newContent.style.backgroundSize = "cover";
    newContent.style.backgroundPosition = "center";
    activityName.classList.add("activity-name");
    activityType.classList.add("activity-type");
    activityName.innerHTML = assessment_title;
    activityType.innerHTML = assessment_type_name;
    newContent.appendChild(activityName);
    newContent.appendChild(activityType);

    const previewButton = document.createElement("button");
    previewButton.textContent = "Preview Assessment";

    const hideFromStudentLabel = document.createElement("label")
    hideFromStudentLabel.textContent = "Hidden from Students"
    
    const buttonActionContainer = document.createElement("div");
    buttonActionContainer.classList.add("assessment-button-action-container");
    buttonActionContainer.appendChild(previewButton);

    previewButton.addEventListener('click', async () => {
        sessionStorage.setItem("questions", JSON.stringify(assessment_details))
        sessionStorage.setItem("ttsObjects", JSON.stringify(tts_json))
        sessionStorage.setItem("currentActivityTitle", assessment_title)
        previewGamePageTo(assessment_type)
        

    })

    newContent.appendChild(buttonActionContainer);
    assessment_container.appendChild(newContent);
}
async function addContent(content_container, content_id, content_title, content_details, tts_json, content_type, content_type_name, content_hidden){
    const encryptedContentId = await encrypt(content_id)
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const activityType = document.createElement("p");
    newContent.classList.add("content");
    newContent.style.backgroundImage = `url('/static/images/activities-background-images/${content_type}.jpg')`; /* content background image */
    newContent.style.backgroundSize = "cover";
    newContent.style.backgroundPosition = "center";
    activityName.classList.add("activity-name");
    activityType.classList.add("activity-type");
    activityName.innerHTML = content_title;
    activityType.innerHTML = content_type_name;
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

    hideFromStudentCheckbox.addEventListener('click', (event) => {
        if (Object.keys(content_details).length <= 3) {
            event.preventDefault();
            notification.notify("The activity has less than 3 questions. Please add more.", "error");
        }
    });

    hideFromStudentCheckbox.addEventListener('change', async () => {
        const isHidden = hideFromStudentCheckbox.checked ? 1 : 0
        const url = `content/${id}/${content_id}/${isHidden}`

        const loadingId = `loading-hide-content-${Date.now()}`;
        notification.notify("Updating visibility...", "loading", null, null, loadingId);

        try{
            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json' 
    
                },
            });
            const result = await response.json()
            
            notification.dismissLoading(loadingId);
            
            if (response.ok && result.status){
                notification.notify(result.message, "success")
            }
            else{
                notification.notify(result.message, "error")
            }
        }
        catch(error){
            notification.dismissLoading(loadingId);
            console.error("Network Error during deletion:", error);
            notification.notify("Network error. Please check your connection and try again.", "error");
        }
    })

    deleteButton.addEventListener('click', async () => {
        const deleteActivityContainer = document.createElement('div');
        const deleteActivityWrapper = document.createElement('div');
        const yesButton = document.createElement('button');
        const noButton = document.createElement('button');
        const buttonContainer = document.createElement('aside');
        const statement = document.createElement('p');
        
        deleteActivityContainer.setAttribute('id', 'delete-activity-container');
        deleteActivityWrapper.setAttribute('id', 'delete-activity-wrapper');

        statement.textContent = `Are you sure you want to delete the activity "${content_title}"? This action cannot be undone.`;

        yesButton.textContent = 'Yes';
        noButton.textContent = 'No';
        buttonContainer.classList.add('delete-activity-button-container');
        buttonContainer.appendChild(yesButton);
        buttonContainer.appendChild(noButton);

        deleteActivityWrapper.appendChild(statement);
        deleteActivityWrapper.appendChild(buttonContainer);
        deleteActivityContainer.appendChild(deleteActivityWrapper);
        content_container.appendChild(deleteActivityContainer);
        
        yesButton.addEventListener('click', async () => {
            const url = `content/${id}/${content_id}`

            const loadingId = `loading-delete-content-${Date.now()}`;
            notification.notify("Deleting activity...", "loading", null, null, loadingId);

            try{
                const response = await fetch(url, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json' 
        
                    },
                });
        
                const result = await response.json()
        
                notification.dismissLoading(loadingId);
                
                if (response.ok && result.status){
                    notification.notify(result.message, "success")
                    newContent.remove();
                    deleteActivityContainer.remove();
                }
                else{
                    const message = result.message || "Failed to delete content. Please try again.";
                    notification.notify(message, "error");
                    console.error("Server Error:", result);
                }
            }
            catch(error){
                notification.dismissLoading(loadingId);
                console.error("Fetch Error:", error);
                notification.notify("An unexpected error occurred. Please check your connection and try again.", "error");
            }
        })

        noButton.addEventListener('click', () => {
            deleteActivityContainer.remove();
        })

        document.body.appendChild(deleteActivityContainer);
    })

    editButton.addEventListener('click', async () => {
        if (Object.keys(content_details).length !== 0){
            sessionStorage.setItem("questions", JSON.stringify(content_details))
            sessionStorage.setItem("ttsInputs", JSON.stringify(tts_json))
        }
        else{
            sessionStorage.setItem("questions", "[]")
            sessionStorage.setItem("ttsInputs", "[]")
        }
        sessionStorage.setItem("currentActivityId", encryptedContentId)
        sessionStorage.setItem("currentTtsId", encryptedContentId)
        sessionStorage.setItem("currentActivityTitle", content_title)
        sessionStorage.setItem("originalActivityTitle", content_title)
        editGamePageTo(content_type)
    })

    previewButton.addEventListener('click', async () => {
        if (Object.keys(content_details).length >= 1){
            sessionStorage.setItem("questions", JSON.stringify(content_details))
            sessionStorage.setItem("ttsObjects", JSON.stringify(tts_json))
            sessionStorage.setItem("currentActivityTitle", content_title)
            previewGamePageTo(content_type)
        }
        else{
            notification.notify("No questions in this activity. Please questions and try again", "error")
        }

    })

    newContent.appendChild(buttonActionContainer);
    content_container.appendChild(newContent);
    content_container.appendChild(addContentButton);
}

function editGamePageTo(url){
    switch(url){
        case 1: 
            window.location.href = '/word_audio_match_edit';
            break;
        case 2: 
            window.location.href = '/listen_and_choose_edit';
            break;
        case 3: 
            window.location.href = '/sound_alike_match_edit';
            break;
        case 4: 
            window.location.href = '/meaning_maker_edit';
            break;
        case 5: 
            window.location.href = '/what_happens_next_edit';
            break;
        case 6: 
            window.location.href = '/picture_clues_edit';
            break;
    }
}

function previewGamePageTo(url){
    switch(url){
        case 1:
            window.location.href = '/word_audio_match_answer';
            break;
        case 2:
            window.location.href = '/listen_and_choose_answer';
            break;
        case 3:
            window.location.href = '/sound_alike_match_answer';
            break;
        case 4:
            window.location.href = '/meaning_maker_answer';
            break;
        case 5:
            window.location.href = '/what_happens_next_answer';
            break;
        case 6:
            window.location.href = '/picture_clues_answer';
            break;
    }
}


// 1. Login as a teacher first
// 2. Make a game first (Word Audio Match would be better if other games aren't yet working)
// 3. Atleast make 3 or more questions, and save them (The save button is already working)
// 4. Uncheck the Hidden button, ensuring that the activity is now UNHIDDEN to students
// 5. Logout, then login as student
// 6. Answer the created activity and click the Finish Button. (It would be better for you to make more attempts)
// 7. Logout, then login as teacher again
// 8. Check the Student Progress Navigation


// DESIGN: progress-header-row, progress-header-row > th (Level 1)
function getProgressHeaderRow(){
    const progressHeaderRow = document.createElement('tr')
    const contentTitleHeader = document.createElement('th')
    const completedStudentsHeader = document.createElement('th')
    const totalStudentsHeader = document.createElement('th')
    const progressHeader = document.createElement('th')

    progressHeaderRow.setAttribute('id', 'progress-header-row')
    
    contentTitleHeader.textContent = 'Content Title'
    completedStudentsHeader.textContent = 'Completed Students'
    totalStudentsHeader.textContent = 'Total Students'
    progressHeader.textContent = 'Progress'

    progressHeaderRow.appendChild(contentTitleHeader)
    progressHeaderRow.appendChild(completedStudentsHeader)
    progressHeaderRow.appendChild(totalStudentsHeader)
    progressHeaderRow.appendChild(progressHeader)

    return progressHeaderRow
}


//DESIGN: score-header-row, score-header-row > th (Level 2)
function getScoreHeaderRow(){
    const scoreHeaderRow = document.createElement('tr')
    const studentIdHeader = document.createElement('th')
    const studentNameHeader = document.createElement('th')
    const attemptsHeader = document.createElement('th')
    const highestScoreHeader = document.createElement('th')
    const lowestScoreHeader = document.createElement('th')
    const totalQuestionsHeader = document.createElement('th')

    scoreHeaderRow.setAttribute('id', 'score-header-row')

    studentIdHeader.textContent = 'Student ID'
    studentNameHeader.textContent = 'Student Name'
    attemptsHeader.textContent = 'Attempts'
    highestScoreHeader.textContent = 'Highest Score'
    lowestScoreHeader.textContent = 'Lowest Score'
    totalQuestionsHeader.textContent = 'Total Questions'

    scoreHeaderRow.appendChild(studentIdHeader)
    scoreHeaderRow.appendChild(studentNameHeader)
    scoreHeaderRow.appendChild(attemptsHeader)
    scoreHeaderRow.appendChild(highestScoreHeader)
    scoreHeaderRow.appendChild(lowestScoreHeader)
    scoreHeaderRow.appendChild(totalQuestionsHeader)

    return scoreHeaderRow
}

//DESIGN: attempt-score-header-row, attempt-score-header-row > th (Level 3)
function getAttemptScoreHeaderRow(){
    const attemptScoreHeaderRow = document.createElement('tr')
    const countAttemptHeader = document.createElement('th')
    const scoreAttemptHeader = document.createElement('th')
    const statusAttemptHeader = document.createElement('th')
    const dateHeader = document.createElement('th')

    attemptScoreHeaderRow.setAttribute('id', 'attempt-score-header-row')

    countAttemptHeader.textContent = 'Attempt Count'
    scoreAttemptHeader.textContent = 'Score'
    statusAttemptHeader.textContent = 'Status'
    dateHeader.textContent = 'Attempt Submitted Date'

    attemptScoreHeaderRow.appendChild(countAttemptHeader)
    attemptScoreHeaderRow.appendChild(scoreAttemptHeader)
    attemptScoreHeaderRow.appendChild(statusAttemptHeader)
    attemptScoreHeaderRow.appendChild(dateHeader)

    return attemptScoreHeaderRow

}

//NO NEED TO DESIGN
function getProgressEventsHeader(){
    const headerContainer = document.getElementById('event-details-header')
    if (!(headerContainer)){
        const headerContainer = document.createElement('div')
        
        return headerContainer
    }
    else{
        headerContainer.innerHTML = ''
        return headerContainer
    }
    
}

/**
 * studentProgressHeader
 * Creates the main header with category and content filters (Level 1)
 * 
 * DESIGN ELEMENTS:
 * - Two dropdown selects (category and content type)
 * - Categories: Activities, Assessments
 * - Content types: Different game types
 * 
 * EXISTING IDs:
 * - #select-category
 * - #select-content
 * 
 * 
 */

/**
 * studentProgressHeader - Updated to handle both categories
 */
function studentProgressHeader(headerContainer, table_header, table_body, teacher_id) {
    const selectCategory = document.createElement('select');
    const selectContent = document.createElement('select');
    selectCategory.setAttribute('id', 'select-category');
    selectCategory.name = 'select-category';
    selectContent.setAttribute('id', 'select-content');
    selectContent.name = 'select-content';
    
    const categoryOptions = [
        {value: 'activities', text: 'Activities'},
        {value: 'assessments', text: 'Assessments'}
    ];
    
    const contentOptions = [
        {value: 1, text: 'Pronunciation: Word Audio Match'}, 
        {value: 2, text: 'Phonemic Awareness: Listen & Choose'},
        {value: 3, text: 'Word Recognition: Sound-Alike Match'},
        {value: 4, text: 'Word Recognition: Meaning Maker'},
        {value: 5, text: 'Reading Comprehension: What Happens Next?'},
        {value: 6, text: 'Reading Comprehension: Picture + Clues'}
    ];

    categoryOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectCategory.appendChild(optionElement);
    });

    contentOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectContent.appendChild(optionElement);
    });

    selectCategory.addEventListener('change', async () => {
        const categoryValue = selectCategory.value;
        let url;
        
        if (categoryValue === 'activities') {
            url = `/attempts/activities/${teacher_id}/${selectContent.value}`;
            selectContent.style.display = 'block';
        } else {
            url = `/attempts/assessments`;
            selectContent.style.display = 'none';
        }
        
        const loadingId = `loading-category-${Date.now()}`;
        notification.notify("Loading data...", "loading", null, null, loadingId);
        
        const response = await fetch(url);
        const result = await response.json();
        
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status) {
            table_body.innerHTML = '';
            
            result.attempts.forEach(data => {
                const normalizedData = categoryValue === 'assessments' 
                    ? {
                        content_id: data.assessment_id,
                        content_title: data.assessment_title,
                        completed_students: data.completed_students,
                        total_students: data.total_students,
                        progress: data.progress,
                        is_hidden_from_students: false
                      }
                    : data;
                
                displayAttemptProgress(
                    table_header, 
                    table_body, 
                    normalizedData.content_id, 
                    normalizedData.content_title, 
                    normalizedData.completed_students, 
                    normalizedData.total_students, 
                    normalizedData.progress, 
                    normalizedData.is_hidden_from_students, 
                    teacher_id, 
                    categoryValue === 'activities' ? selectContent.value : categoryValue,
                    categoryValue // Pass the category type
                );
            });
        } else {
            console.log(result.message);
        }
    });

    selectContent.addEventListener('change', async () => {
        if (selectCategory.value === 'activities') {
            const url = `/attempts/activities/${teacher_id}/${selectContent.value}`;
            
            const loadingId = `loading-content-type-${Date.now()}`;
            notification.notify("Loading activities...", "loading", null, null, loadingId);
            
            const response = await fetch(url);
            const result = await response.json();
            
            notification.dismissLoading(loadingId);
            
            if (response.ok && result.status) {
                table_body.innerHTML = '';
                result.attempts.forEach(data => {
                    displayAttemptProgress(
                        table_header, 
                        table_body, 
                        data.content_id, 
                        data.content_title, 
                        data.completed_students, 
                        data.total_students, 
                        data.progress, 
                        data.is_hidden_from_students, 
                        teacher_id, 
                        selectContent.value,
                        'activities' // Pass the category type
                    );
                });
            } else {
                console.log(result.message);
            }
        }
    });

    headerContainer.appendChild(selectCategory);
    headerContainer.appendChild(selectContent);

    return headerContainer;
}

/**
 * attemptProgressHeader
 * Creates header for student scores view with back button and filters (Level 2)
 * 
 * DESIGN ELEMENTS:
 * - Back button to return to progress list
 * - Content title (h3)
 * - Filter dropdown for sorting student scores
 * 
 * EXISTING ID: 
 * #back-to-main-progress-button
 * #content-name
 * #attempt-progress-detail-container
 * #select-attempt-progress-filter
 * 
 */

function attemptProgressHeader(headerContainer, content_name, content_id, table_header, table_body, category) {
    const backToMainProgressButton = document.createElement('button');
    backToMainProgressButton.textContent = 'Back';
    backToMainProgressButton.setAttribute('id', 'back-to-main-progress-button');

    const contentName = document.createElement('h3');
    contentName.textContent = content_name;
    contentName.setAttribute('id', 'content-name');
    headerContainer.appendChild(contentName);

    const detailsContainer = document.createElement('div');
    detailsContainer.setAttribute('id', 'attempt-progress-detail-container');

    const selectAttemptProgressFilter = document.createElement('select');
    selectAttemptProgressFilter.setAttribute('id', 'select-attempt-progress-filter');
    selectAttemptProgressFilter.name = 'select-attempt-progress-filter';
    
    const filterOptions = [
        {value: 0, text: 'Student ID DESC'},
        {value: 1, text: 'Student ID ASC'},
        {value: 2, text: 'High Score'},
        {value: 3, text: 'Low Score'},
        {value: 4, text: 'Most Attempts'},
        {value: 5, text: 'Least Attempts'}
    ];

    filterOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectAttemptProgressFilter.appendChild(optionElement);
    });

    detailsContainer.appendChild(backToMainProgressButton);
    detailsContainer.appendChild(selectAttemptProgressFilter);
    headerContainer.appendChild(detailsContainer);

    selectAttemptProgressFilter.addEventListener('change', async () => {
        // Use different endpoint based on category
        const url = category === 'assessments'
            ? `/attempts/assessments/${content_id}/filter/${selectAttemptProgressFilter.value}`
            : `/attempts/activities/${content_id}/filter/${selectAttemptProgressFilter.value}`;
        
        const loadingId = `loading-filter-${Date.now()}`;
        notification.notify("Filtering data...", "loading", null, null, loadingId);
            
        const response = await fetch(url);
        const result = await response.json();
        table_body.innerHTML = '';
        
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status) {
            result.scores.forEach(student => {
                displayStudentAttemptScores(
                    table_header, 
                    table_body, 
                    content_id,
                    content_name, 
                    student.student_id, 
                    student.student_name, 
                    student.student_attempts, 
                    student.student_highest_score, 
                    student.student_lowest_score, 
                    student.total_questions,
                    category // Pass category to next level
                );
            });
        } else {
            console.log(result.message);
        }
    });

    backToMainProgressButton.addEventListener('click', () => {
        restorePreviousState(table_header, table_body);
    });

    return headerContainer;
}

/**
 * attemptScoreHeader
 * Creates header for individual student's attempt details (Level 3)
 * 
 * DESIGN ELEMENTS:
 * - Back button to return to student scores
 * - Student name (h3)
 * - Filter dropdown for sorting attempts
 * 
 * EXISTING ID: 
 * #back-to-attempt-progress-button
 * #student-name
 * #attempt-score-detail-container
 * #select-attempt-score-filter
 */

function attemptScoreHeader(headerContainer, student_name, student_id, content_id, table_header, table_body, category) {
    const backToAttemptProgressButton = document.createElement('button');
    backToAttemptProgressButton.textContent = 'Back';
    backToAttemptProgressButton.setAttribute('id', 'back-to-attempt-progress-button');

    const studentName = document.createElement('h3');
    studentName.textContent = student_name;
    studentName.setAttribute('id', 'student-name');
    headerContainer.appendChild(studentName);

    const detailContainer = document.createElement('div');
    detailContainer.setAttribute('id', 'attempt-score-detail-container');

    const selectAttemptScoreFilter = document.createElement('select');
    selectAttemptScoreFilter.setAttribute('id', 'select-attempt-score-filter');
    selectAttemptScoreFilter.name = 'select-attempt-score-filter';
    
    const filterOptions = [
        {value: 0, text: 'High Score'},
        {value: 1, text: 'Low Score'},
        {value: 2, text: 'Attempt Date DESC'},
        {value: 3, text: 'Attempt Date ASC'}
    ];

    filterOptions.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value;
        optionElement.textContent = option.text;
        selectAttemptScoreFilter.appendChild(optionElement);
    });

    detailContainer.appendChild(backToAttemptProgressButton);
    detailContainer.appendChild(selectAttemptScoreFilter);
    headerContainer.appendChild(detailContainer);

    selectAttemptScoreFilter.addEventListener('change', async () => {
        // Use different endpoint based on category
        const url = category === 'assessments'
            ? `/attempts/assessments/students/${student_id}/${content_id}/filter/${selectAttemptScoreFilter.value}`
            : `/attempts/activities/students/${student_id}/${content_id}/filter/${selectAttemptScoreFilter.value}`;
        
        const loadingId = `loading-attempt-filter-${Date.now()}`;
        notification.notify("Filtering attempts...", "loading", null, null, loadingId);
            
        const response = await fetch(url);
        const result = await response.json();
        table_body.innerHTML = '';
        
        notification.dismissLoading(loadingId);
        
        if (response.ok && result.status) {
            result.attemptScores.forEach(attempt => {
                displayAttemptScores(table_body, attempt.attempt_count, attempt.score, attempt.status, formatDate(attempt.date));
            });
        } else {
            console.log(result.message);
        }
    });

    backToAttemptProgressButton.addEventListener('click', () => {
        restorePreviousState(table_header, table_body);
    });

    return headerContainer;
}

/**
 * restorePreviousState
 * Handles back navigation between levels using NavigationManager
 * 
 * NAVIGATION FLOW:
 * - From Level 3 (Attempt Details) → Level 2 (Student Scores)
 * - From Level 2 (Student Scores) → Level 1 (Progress List)
 * 
 * REQUIRED CLASSES NEEDED TO BE DESIGNED (used for element removal):
 * - .progress-header
 * - .score-header
 * - .attempt-header
 * 
 */

async function restorePreviousState(table_header, table_body) {
    if (!NavigationManager.hasPreviousState()) {
        console.log('No previous state to restore');
        return;
    }

    const previousState = NavigationManager.popState();
    
    // Remove current header
    const currentHeader = mainSection.querySelector('.progress-header, .score-header, .attempt-header');
    if (currentHeader) {
        currentHeader.remove();
    }

    // Clear tables
    table_header.innerHTML = '';
    table_body.innerHTML = '';

    // Restore based on level
    if (previousState.level === NAVIGATION_LEVELS.STUDENT_SCORES) {
        // Going back to student scores view
        table_header.appendChild(getScoreHeaderRow());
        
        const headerContainer = attemptProgressHeader(
            getProgressEventsHeader(), 
            previousState.data.content_name, 
            previousState.data.content_id, 
            table_header, 
            table_body,
            previousState.data.category // Pass the category
        );
        headerContainer.classList.add('score-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        // Re-fetch data with default filter using appropriate endpoint
        const url = previousState.data.category === 'assessments'
            ? `/attempts/assessments/${previousState.data.content_id}/filter/0`
            : `/attempts/activities/${previousState.data.content_id}/filter/0`;
        
        const loadingId = `loading-restore-${Date.now()}`;
        notification.notify("Loading data...", "loading", null, null, loadingId);
            
        const response = await fetch(url);
        const result = await response.json();

        notification.dismissLoading(loadingId);

        if (response.ok && result.status) {
            result.scores.forEach(student => {
                displayStudentAttemptScores(
                    table_header, 
                    table_body, 
                    previousState.data.content_id, 
                    previousState.data.content_name, 
                    student.student_id, 
                    student.student_name, 
                    student.student_attempts, 
                    student.student_highest_score, 
                    student.student_lowest_score, 
                    student.total_questions,
                    previousState.data.category // Pass the category
                );
            });
        }
    } else if (previousState.level === NAVIGATION_LEVELS.PROGRESS_LIST) {
        // Going back to main progress list
        getStudentProgressByContentType(previousState.data.teacherId, previousState.data.contentType);
    }
}

/**
 * getStudentProgressByContentType
 * Initializes the main student progress view (Level 1)
 * Entry point for the student progress tracking system
 * 
 * DESIGN ELEMENTS:
 * - Main table container
 * 
 * EXISTING ID: #progress-table
 */

async function getStudentProgressByContentType(teacherId, contentType) {
    const loadingId = `loading-progress-${Date.now()}`;
    notification.notify("Loading student progress...", "loading", null, null, loadingId);
    
    NavigationManager.clearStack();
    mainSection.innerHTML = '';

    // Create table wrapper for horizontal scrolling
    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('table-wrapper');

    const progressTable = document.createElement('table');
    progressTable.setAttribute('id', 'progress-table');
    const progressTableHeader = document.createElement('thead');
    const progressTableBody = document.createElement('tbody');

    progressTableHeader.appendChild(getProgressHeaderRow());
    progressTable.appendChild(progressTableHeader);
    progressTable.appendChild(progressTableBody);
    
    // Append table to wrapper, then wrapper to mainSection
    tableWrapper.appendChild(progressTable);
    mainSection.appendChild(tableWrapper);

    try {
        // Determine category and URL
        const category = contentType === 'assessments' ? 'assessments' : 'activities';
        const url = contentType === 'assessments' 
            ? `/attempts/assessments`
            : `/attempts/activities/${teacherId}/${contentType}`;
            
        const response = await fetch(url);
        const result = await response.json();

        notification.dismissLoading(loadingId);

        if (response.ok && result.status) {
            const headerContainer = studentProgressHeader(
                getProgressEventsHeader(), 
                progressTableHeader, 
                progressTableBody, 
                teacherId
            );
            headerContainer.classList.add('progress-header');
            mainSection.insertBefore(headerContainer, mainSection.firstChild);

            result.attempts.forEach(data => {
                // Normalize data structure based on contentType
                const normalizedData = contentType === 'assessments'
                    ? {
                        content_id: data.assessment_id,
                        content_title: data.assessment_title,
                        completed_students: data.completed_students,
                        total_students: data.total_students,
                        progress: data.progress,
                        is_hidden_from_students: false
                      }
                    : data;
                
                displayAttemptProgress(
                    progressTableHeader, 
                    progressTableBody, 
                    normalizedData.content_id, 
                    normalizedData.content_title, 
                    normalizedData.completed_students, 
                    normalizedData.total_students, 
                    normalizedData.progress, 
                    normalizedData.is_hidden_from_students, 
                    teacherId, 
                    contentType,
                    category
                );
            });
        } else {
            console.log(result.message);
        }
    } catch (error) {
        notification.dismissLoading(loadingId);
        console.log(error);
    }
}

/**
 * displayAttemptProgress
 * Displays a row in the progress table (Level 1)
 * Shows overview of student completion for each activity
 * 
 * DESIGN ELEMENTS:
 * - Table row with clickable content title
 * 
 * EXISTING CLASS ELEMENTS:
 * .data-row
 * .link
 * 
 * NOTE: The .link class indicates a clickable element that navigates to Level 2
 * 
 */

function displayAttemptProgress(table_header, table_body, content_id, content_title, completed_students, total_students, progress, is_hidden, teacherId, contentType, category) {
    const dataRow = document.createElement('tr');
    const contentTitleData = document.createElement('td');
    const completedStudentsData = document.createElement('td');
    const totalStudentsData = document.createElement('td');
    const progressData = document.createElement('td');

    if(is_hidden){
        dataRow.style.display = 'none';
    }

    dataRow.classList.add('data-row');
    
    contentTitleData.textContent = content_title;
    contentTitleData.classList.add('link');
    completedStudentsData.textContent = completed_students;
    totalStudentsData.textContent = total_students;
    progressData.textContent = progress;
    
    dataRow.appendChild(contentTitleData);
    dataRow.appendChild(completedStudentsData);
    dataRow.appendChild(totalStudentsData);
    dataRow.appendChild(progressData);
    
    table_body.appendChild(dataRow);

    contentTitleData.addEventListener('click', async () => {
        // Save current state before navigating
        NavigationManager.pushState({
            level: NAVIGATION_LEVELS.PROGRESS_LIST,
            data: { teacherId, contentType },
            headerHTML: mainSection.querySelector('.progress-header')?.outerHTML || '',
            tableHeaderHTML: table_header.innerHTML,
            tableBodyHTML: table_body.innerHTML
        });

        // Use appropriate endpoint based on category
        const url = category === 'assessments'
            ? `/attempts/assessments/${content_id}/filter/0`
            : `/attempts/activities/${content_id}/filter/0`;
        
        const loadingId = `loading-content-details-${Date.now()}`;
        notification.notify("Loading student scores...", "loading", null, null, loadingId);
            
        const response = await fetch(url);
        const result = await response.json();
        
        notification.dismissLoading(loadingId);
        
        // Remove current header
        const currentHeader = mainSection.querySelector('.progress-header');
        if (currentHeader) {
            currentHeader.remove();
        }
        
        table_header.innerHTML = '';
        table_body.innerHTML = '';
        
        table_header.appendChild(getScoreHeaderRow());
        
        const headerContainer = attemptProgressHeader(
            getProgressEventsHeader(), 
            content_title, 
            content_id, 
            table_header, 
            table_body,
            category // Pass category to level 2
        );
        headerContainer.classList.add('score-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        try {
            if (response.ok && result.status) {
                result.scores.forEach(student => {
                    displayStudentAttemptScores(
                        table_header, 
                        table_body, 
                        content_id, 
                        content_title,
                        student.student_id, 
                        student.student_name, 
                        student.student_attempts, 
                        student.student_highest_score, 
                        student.student_lowest_score, 
                        student.total_questions,
                        category // Pass category to level 2
                    );
                });
            }
        } catch (error) {
            console.log(error);
        }
    });
}


/**
 * displayStudentAttemptScores
 * Displays a row in the student scores table (Level 2)
 * Shows individual student performance for a specific activity
 * 
 * DESIGN ELEMENTS:
 * - Table row with student information
 * - Clickable attempts cell that navigates to Level 3
 * 
 * EXISTING CLASS ELEMENTS:
 * .score-data-row
 * .link
 * 
 * NOTE: The .link class on attemptsData indicates it's clickable
 * 
 * 
 */

function displayStudentAttemptScores(table_header, table_body, content_id, content_name, student_id, student_name, student_attempts, student_highest_score, student_lowest_score, total_questions, category) {
    const scoreDataRow = document.createElement('tr');
    const studentIdData = document.createElement('td');
    const studentNameData = document.createElement('td');
    const attemptsData = document.createElement('td');
    const highestScoreData = document.createElement('td');
    const lowestScoreData = document.createElement('td');
    const totalQuestionsData = document.createElement('td');

    scoreDataRow.classList.add('score-data-row');

    studentIdData.textContent = student_id;
    studentNameData.textContent = student_name;
    attemptsData.textContent = student_attempts || 0;
    attemptsData.classList.add('link');
    highestScoreData.textContent = student_highest_score || 0;
    lowestScoreData.textContent = student_lowest_score || 0;
    totalQuestionsData.textContent = total_questions;

    scoreDataRow.appendChild(studentIdData);
    scoreDataRow.appendChild(studentNameData);
    scoreDataRow.appendChild(attemptsData);
    scoreDataRow.appendChild(highestScoreData);
    scoreDataRow.appendChild(lowestScoreData);
    scoreDataRow.appendChild(totalQuestionsData);

    table_body.appendChild(scoreDataRow);

    attemptsData.addEventListener('click', async () => {
        // Save current state before navigating
        NavigationManager.pushState({
            level: NAVIGATION_LEVELS.STUDENT_SCORES,
            data: { content_id, content_name, category }, // Save category in state
            headerHTML: mainSection.querySelector('.score-header')?.outerHTML || '',
            tableHeaderHTML: table_header.innerHTML,
            tableBodyHTML: table_body.innerHTML
        });

        // Use appropriate endpoint based on category
        const url = category === 'assessments'
            ? `/attempts/assessments/students/${student_id}/${content_id}/filter/0`
            : `/attempts/activities/students/${student_id}/${content_id}/filter/0`;
        
        const loadingId = `loading-student-attempts-${Date.now()}`;
        notification.notify("Loading attempt details...", "loading", null, null, loadingId);
            
        const response = await fetch(url);
        const result = await response.json();

        notification.dismissLoading(loadingId);

        // Remove current header
        const currentHeader = mainSection.querySelector('.score-header');
        if (currentHeader) {
            currentHeader.remove();
        }

        table_header.innerHTML = '';
        table_body.innerHTML = '';
        table_header.appendChild(getAttemptScoreHeaderRow());

        const headerContainer = attemptScoreHeader(
            getProgressEventsHeader(), 
            student_name, 
            student_id, 
            content_id, 
            table_header, 
            table_body,
            category // Pass category to level 3
        );
        headerContainer.classList.add('attempt-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        try {
            if (response.ok && result.status) {
                result.attemptScores.forEach(attempt => {
                    displayAttemptScores(table_body, attempt.attempt_count, attempt.score, attempt.status, formatDate(attempt.date));
                });
            }
        } catch (error) {
            console.log(error);
        }
    });
}

/**
 * displayAttemptScores
 * Displays all scores for each rows by a student (Level 3)
 * 
 * 
 * EXISTING CLASS ELEMENTS:
 * .attempt-score-data-row
 * 
 * NOTE: The .link class on attemptsData indicates it's clickable
 * 
 * 
 */

function displayAttemptScores(table_body, counted_attempts, score, status, date) {
    const attemptScoreDataRow = document.createElement('tr');
    const countAttemptRow = document.createElement('td');
    const scoreAttemptRow = document.createElement('td');
    const statusAttemptRow = document.createElement('td')
    const dateRow = document.createElement('td');

    attemptScoreDataRow.classList.add('attempt-score-data-row');

    countAttemptRow.textContent = counted_attempts;
    scoreAttemptRow.textContent = score;
    statusAttemptRow.textContent = status
    dateRow.textContent = date;

    attemptScoreDataRow.appendChild(countAttemptRow);
    attemptScoreDataRow.appendChild(scoreAttemptRow);
    attemptScoreDataRow.appendChild(statusAttemptRow);
    attemptScoreDataRow.appendChild(dateRow);

    table_body.appendChild(attemptScoreDataRow);
}

// helper/utility function to format date
function formatDate(dateString) {
    const date = new Date(dateString + '+08:00');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}

function moveStudentInfo(){
    if (window.innerWidth <= 936 && !isInMainSection) {
        mainSection.insertBefore(teacherInfo, mainSection.firstChild);
        isInMainSection = true;
    } else if (window.innerWidth > 936 && isInMainSection) {
        mainAside.insertBefore(teacherInfo, mainAside.firstChild);
        isInMainSection = false;
    }
    
}

chatbotButton.addEventListener('click', conversationStructure)


async function conversationStructure(){
    let chatConversation = [];
    const conversationContainer = document.createElement('div')
    const headerConversationContainer = document.createElement('div')
    const conversationMessagesContainer = document.createElement('div')
    const sendMessageContainer = document.createElement('div')

    conversationContainer.setAttribute('id', 'conversation-container')
    headerConversationContainer.setAttribute('id', 'header-conversation-container')
    conversationMessagesContainer.setAttribute('id', 'conversation-messages-container')
    sendMessageContainer.setAttribute('id', 'send-message-container')

    //headerConversationContainer elements
    const chatbotName = document.createElement('h3')
    const closeConversationButton = document.createElement('img')
    chatbotName.textContent = "Chatbot"
    closeConversationButton.src = '../../static/images/close-outline.svg'
    closeConversationButton.alt = 'close-button'
    closeConversationButton.addEventListener('click', () => {
        conversationContainer.classList.add('closing');
        setTimeout(() => {
            conversationContainer.remove();
        }, 300);
    })

    headerConversationContainer.append(chatbotName, closeConversationButton)
    conversationContainer.appendChild(headerConversationContainer)

    //conversationMessagesContainer elements
    const userMessageContainer = document.createElement('div')
    userMessageContainer.classList.add('user-message-container')
    const botMessageContainer = document.createElement('div')
    botMessageContainer.classList.add('bot-message-container')

    //sendMessageContainer elements
    const inputMessage = document.createElement('input')
    const sendButton = document.createElement('button')
    inputMessage.placeholder = "Input your message"
    inputMessage.setAttribute('id', 'input-message')
    sendButton.textContent = "Send"
    sendButton.setAttribute('id', 'send-button')
    sendButton.disabled = true
    inputMessage.addEventListener('input', () => {
        sendButton.disabled = inputMessage.value === "" ? true : false;
    })
    sendButton.addEventListener('click', async () => {await sendMessage(inputMessage.value.trim())})

    sendMessageContainer.append(inputMessage, sendButton)
    
    // Helper function to scroll to bottom
    function scrollToBottom() {
        conversationMessagesContainer.scrollTop = conversationMessagesContainer.scrollHeight;
    }
    
    const loadingId = `loading-chat-history-${Date.now()}`;
    notification.notify("Loading chat history...", "loading", null, null, loadingId);
    
    try{
        const getHistory = `/chat-history/${id}`
        const response = await fetch(getHistory)
        const result = await response.json()

        notification.dismissLoading(loadingId);

        if(response.ok){
            if(result.status){
                result.history.forEach(history => {
                    chatConversation.push(history)
                    displayChatHistory(history.botMessage, history.userMessage)
                })

            }
            else{
                console.log("test")
                const botImage = document.createElement('img')
                const botMessageStatement = document.createElement('p')
                botImage.src = "static/images/monmon.png"
                botImage.alt = "monmon"
                botMessageStatement.textContent = 'Hello! How may I assist you today?'

                botMessageContainer.append(botImage, botMessageStatement)

                chatConversation.push({
                    botMessage: botMessageStatement.textContent
                })
                conversationMessagesContainer.appendChild(botMessageContainer)

            }

            conversationContainer.append(conversationMessagesContainer, sendMessageContainer)
            
            // Scroll to bottom after loading history
            setTimeout(scrollToBottom, 100);

        }
        else{
            console.log(result.message)
            return;
        }

        document.body.appendChild(conversationContainer)
    }
    catch (error){
        notification.dismissLoading(loadingId);
        console.log("Error on displaying conversation: " + error)
        return;
    }
    
    async function displayChatHistory(botMessage, userMessage){
        const userContainer = document.createElement('div')
        const botContainer = document.createElement('div')
        userContainer.classList.add('user-message-container')
        botContainer.classList.add('bot-message-container')
        const userImage = document.createElement('img')
        userImage.src = await decrypt(sessionStorage.getItem("image"))
        userImage.alt = "user_image"
        const userMessageStatement = document.createElement('p')
        userMessageStatement.textContent = userMessage
        
        const botImage = document.createElement('img')
        botImage.src = "static/images/monmon.png"
        botImage.alt = "bot_image"
        const botMessageStatement = document.createElement('p')
        botMessageStatement.textContent = botMessage

        userContainer.append(userMessageStatement, userImage)
        botContainer.append(botImage, botMessageStatement)

        conversationMessagesContainer.append(userContainer, botContainer)
    }

    async function sendMessage(userMessage){
        const message = userMessage
        let botMessage = ""
        const sendMessageUrl = '/api/chatbot/response'

        inputMessage.disabled = true;
        sendButton.disabled = true;

        const loadingId = `loading-bot-response-${Date.now()}`;
        notification.notify("Waiting for response...", "loading", null, null, loadingId);

        try{
            const response = await fetch(sendMessageUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userMessage: message,
                })
            })

            const reply = await response.json()

            notification.dismissLoading(loadingId);

            if (response.ok && reply.status){
                botMessage = reply.botResponse

                const botMessageContainer = document.createElement('div')
                const userMessageContainer = document.createElement('div')

                botMessageContainer.classList.add('bot-message-container')
                userMessageContainer.classList.add('user-message-container')

                const botImage = document.createElement('img')
                const botMessageStatement = document.createElement('p')
                botImage.src = "static/images/monmon.png"
                botImage.alt = "monmon"
                botMessageStatement.textContent = botMessage

                const userImage = document.createElement('img')
                const userMessageStatement = document.createElement('p')
                userImage.src = await decrypt(sessionStorage.getItem("image"))
                userImage.alt = "image_user"
                userMessageStatement.textContent = message

                botMessageContainer.append(botImage, botMessageStatement)
                userMessageContainer.append(userMessageStatement, userImage)

                conversationMessagesContainer.append(userMessageContainer, botMessageContainer)
                
                // Scroll to bottom after sending message
                scrollToBottom();

                const newConversation = {
                    userMessage: message,
                    botMessage: botMessage
                }
                chatConversation.push(newConversation)

                updateConversation(chatConversation)
            }
            else{
                console.log(reply.status)
                notification.notify("Failed to get response. Please try again.", "error");
            }
        }
        catch (error){
            notification.dismissLoading(loadingId);
            console.log("Error on chatbot: " + error)
            notification.notify("Network error. Please try again.", "error");
        }
        finally{
            inputMessage.value = "";
            inputMessage.disabled = false;
        }
        console.log(chatConversation)
    }

    async function updateConversation(convoObj){
        try{
            const convoUrl = '/update-conversation'
    
            const convoBody = new FormData()
    
            convoBody.append('teacher_id', id)
            convoBody.append('conversation', JSON.stringify(convoObj))
            const response = await fetch(convoUrl, {
                method: 'PATCH',
                body: convoBody
            })
    
            const result = await response.json()
    
            if(!response.ok && !result){
                console.log("Error saving conversation")
                console.log(result.message)
            }
            else{
                console.log(result.message)
            }

        }
        catch (error){
            console.log("Error saving conversation: " + error )
        }
    }
}

loginSuccess()

moveStudentInfo();