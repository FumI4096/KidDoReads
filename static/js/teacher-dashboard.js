import Notification from './modules/Notification.js'
import NavigationManager from './modules/NavigationManager.js';
import NAVIGATION_LEVELS from './modules/NavigationLevels.js';

const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById('log-out-button');
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


activityNavButton.addEventListener('click', async () => {
    await showContents()
    activityNavButton.disabled = true
    activityNavButton.style.pointerEvents = 'none'
    activityNavButton.classList.add('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

assessmentNavButton.addEventListener('click', async () => {
    await showContents()
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

        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData
        });

        const result = await response.json()

        try{
            if (response.ok && result.status){
                sessionStorage.setItem("currentActivityTitle", contentTitle.value.trim())
                sessionStorage.setItem("originalActivityTitle", contentTitle.value.trim())
                sessionStorage.setItem("currentActivityId", result.content_id)
                sessionStorage.setItem("contentType", JSON.stringify(setContentType(selectContent.value)))
                await insertTtsId(sessionStorage.getItem("currentActivityId"))
                editGamePageTo(parseInt(selectContent.value))
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

async function insertTtsId(id){
    const url = "/create-tts"

    const formData = new FormData();

    formData.append('tts_id', id)

    const response = await fetch(url, {
        method: "POST",
        body: formData
    });

    const result = await response.json()

    try{
        if (response.ok && result.status){
            sessionStorage.setItem("currentTtsId", result.ttsId)
            console.log("TTS INSERTED SUCCESSFULLY")
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

//parameters to be whether if it is an assessment or activities(contents)
async function showContents() {
    mainSection.innerHTML = '';

    const url = `/contents/${id}`;
    const response = await fetch(url);
    const result = await response.json();

    try{
        if (response.ok && result.status){
            result.data.forEach(data => {
                addContent(contentStructure(), data.content_id, data.content_title, data.content_json, data.content_type, data.content_type_name, data.isHidden)
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

    function contentStructure(){
        const contentContainer = document.getElementById('content-container')

        if (!contentContainer){
            const div = document.createElement("div");
            div.setAttribute('id', "content-container");
            mainSection.appendChild(div);
            return div
        }

        return contentContainer
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

function addContent(content_container, content_id, content_title, content_details, content_type, content_type_name, content_hidden){
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const activityType = document.createElement("p");
    newContent.classList.add("content");
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
        const url = `content/${id}/${content_id}`

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
        if (Object.keys(content_details).length !== 0){
            sessionStorage.setItem("questions", JSON.stringify(content_details))
        }
        else{
            sessionStorage.setItem("questions", "[]")
        }
        sessionStorage.setItem("currentActivityId", content_id)
        sessionStorage.setItem("currentTtsId", content_id)
        sessionStorage.setItem("currentActivityTitle", content_title)
        sessionStorage.setItem("originalActivityTitle", content_title)
        sessionStorage.setItem("contentType", JSON.stringify(setContentType(content_type)))
        editGamePageTo(content_type)
    })

    previewButton.addEventListener('click', async () => {
        if (Object.keys(content_details).length >= 1){
            sessionStorage.setItem("questions", JSON.stringify(content_details))
            sessionStorage.setItem("contentType", JSON.stringify(setContentType(content_type)))
            sessionStorage.setItem("currentTtsId", content_id)
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

function setContentType(type){
    if (type === 1){
        return {
            category: "Pronunciation", 
            content: "Word Audio Match"
        }
    }
    else if (type === 2){
        return {
            category: "Phonemic Awareness", 
            content: "Listen & Choose"

        }
        
    }
    else if (type === 3){
        return {
            category: "Word Recognition", 
            content: "Sound-Alike Match"

        }

    }
    else if (type === 4){
        return {
            category: "Word Recognition", 
            content: "Meaning Maker"

        }
    }
    else if (type === 5){
        return {
            category: "Reading Comprehension", 
            content: "What Happens Next?"

        }
    }
    else {
        return {
            category: "Reading Comprehension", 
            content: "Picture + Clues"

        }
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
    const dateHeader = document.createElement('th')

    attemptScoreHeaderRow.setAttribute('id', 'attempt-score-header-row')

    countAttemptHeader.textContent = 'Attempt Count'
    scoreAttemptHeader.textContent = 'Score'
    dateHeader.textContent = 'Attempt Submitted Date'

    attemptScoreHeaderRow.appendChild(countAttemptHeader)
    attemptScoreHeaderRow.appendChild(scoreAttemptHeader)
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

function studentProgressHeader(headerContainer, table_header, table_body, teacher_id) {
    const selectCategory = document.createElement('select');
    const selectContent = document.createElement('select');
    selectCategory.setAttribute('id', 'select-category');
    selectCategory.name = 'select-category';
    selectContent.setAttribute('id', 'select-content');
    selectContent.name = 'select-content';
    
    const categoryOptions = [
        {value: 0, text: 'Activities'},
        {value: 1, text: 'Assessments'}
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

    selectContent.addEventListener('change', async () => {
        const url = `/attempts/activities/${teacher_id}/${selectContent.value}`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.status) {
            table_body.innerHTML = '';

            result.attempts.forEach(data => {
                displayAttemptProgress(table_header, table_body, data.content_id, data.content_title, data.completed_students, data.total_students, data.progress, data.is_hidden_from_students, teacher_id, selectContent.value);
            });
        } else {
            console.log(result.message);
        }
    })

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

function attemptProgressHeader(headerContainer, content_name, content_id, table_header, table_body) {
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
        const url = `/attempts/activities/${content_id}/filter/${selectAttemptProgressFilter.value}`;
        const response = await fetch(url);
        const result = await response.json();
        table_body.innerHTML = '';
        
        if (response.ok && result.status) {
            result.scores.forEach(student => {
                displayStudentAttemptScores(table_header, table_body, content_id,content_name, student.student_id, student.student_name, student.student_attempts, student.student_highest_score, student.student_lowest_score, student.total_questions);
            });
        } else {
            console.log(result.message);
        }
    });

    backToMainProgressButton.addEventListener('click', () => {
        restorePreviousState(table_header, table_body);
    })

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

function attemptScoreHeader(headerContainer, student_name, student_id, content_id, table_header, table_body) {
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
        const url = `/attempts/activities/students/${student_id}/${content_id}/filter/${selectAttemptScoreFilter.value}`;
        const response = await fetch(url);
        const result = await response.json();
        table_body.innerHTML = '';
        
        if (response.ok && result.status) {
            result.attemptScores.forEach(attempt => {
                displayAttemptScores(table_body, attempt.attempt_count, attempt.score, formatDate(attempt.date));
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
            table_body
        );
        headerContainer.classList.add('score-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        // Re-fetch data with default filter
        const url = `/attempts/activities/${previousState.data.content_id}/filter/0`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.status) {
            result.scores.forEach(student => {
                displayStudentAttemptScores(table_header, table_body, previousState.data.content_id, previousState.data.content_name, student.student_id, student.student_name, student.student_attempts, student.student_highest_score, student.student_lowest_score, student.total_questions);
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
    // Clear navigation stack when starting fresh
    NavigationManager.clearStack();
    
    mainSection.innerHTML = '';
    const progressTable = document.createElement('table');
    progressTable.setAttribute('id', 'progress-table');

    const progressTableHeader = document.createElement('thead');
    const progressTableBody = document.createElement('tbody');
    
    progressTableHeader.appendChild(getProgressHeaderRow());
    progressTable.appendChild(progressTableHeader);
    progressTable.appendChild(progressTableBody);
    
    mainSection.appendChild(progressTable);
    
    try {
        const url = `/attempts/activities/${teacherId}/${contentType}`;
        const response = await fetch(url);
        const result = await response.json();

        if (response.ok && result.status) {
            const headerContainer = studentProgressHeader(getProgressEventsHeader(), progressTableHeader, progressTableBody, teacherId);
            headerContainer.classList.add('progress-header');
            mainSection.insertBefore(headerContainer, mainSection.firstChild);

            result.attempts.forEach(data => {
                displayAttemptProgress(progressTableHeader, progressTableBody, data.content_id, data.content_title, data.completed_students, data.total_students, data.progress, data.is_hidden_from_students, teacherId, contentType);
            });
        } else {
            console.log(result.message);
        }
    } catch (error) {
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

function displayAttemptProgress(table_header, table_body, content_id, content_title, completed_students, total_students, progress, is_hidden, teacherId, contentType) {
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

        const url = `/attempts/activities/${content_id}/filter/0`;
        const response = await fetch(url);
        const result = await response.json();
        
        // Remove current header
        const currentHeader = mainSection.querySelector('.progress-header');
        if (currentHeader) {
            currentHeader.remove();
        }
        
        table_header.innerHTML = '';
        table_body.innerHTML = '';
        
        table_header.appendChild(getScoreHeaderRow());
        
        const headerContainer = attemptProgressHeader(getProgressEventsHeader(), content_title, content_id, table_header, table_body);
        headerContainer.classList.add('score-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        try {
            if (response.ok && result.status) {
                result.scores.forEach(student => {
                    displayStudentAttemptScores(table_header, table_body, content_id, content_title,student.student_id, student.student_name, student.student_attempts, student.student_highest_score, student.student_lowest_score, student.total_questions
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

function displayStudentAttemptScores(table_header, table_body, content_id, content_name, student_id, student_name, student_attempts, student_highest_score, student_lowest_score, total_questions) {
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
            data: { content_id, content_name },
            headerHTML: mainSection.querySelector('.score-header')?.outerHTML || '',
            tableHeaderHTML: table_header.innerHTML,
            tableBodyHTML: table_body.innerHTML
        });

        const url = `/attempts/activities/students/${student_id}/${content_id}/filter/0`;
        const response = await fetch(url);
        const result = await response.json();

        // Remove current header
        const currentHeader = mainSection.querySelector('.score-header');
        if (currentHeader) {
            currentHeader.remove();
        }

        table_header.innerHTML = '';
        table_body.innerHTML = '';
        table_header.appendChild(getAttemptScoreHeaderRow());

        const headerContainer = attemptScoreHeader(getProgressEventsHeader(), student_name, student_id, content_id, table_header, table_body);
        headerContainer.classList.add('attempt-header');
        mainSection.insertBefore(headerContainer, mainSection.firstChild);

        try {
            if (response.ok && result.status) {
                result.attemptScores.forEach(attempt => {
                    displayAttemptScores(table_body, attempt.attempt_count, attempt.score, formatDate(attempt.date));
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

function displayAttemptScores(table_body, counted_attempts, score, date) {
    const attemptScoreDataRow = document.createElement('tr');
    const countAttemptRow = document.createElement('td');
    const scoreAttemptRow = document.createElement('td');
    const dateRow = document.createElement('td');

    attemptScoreDataRow.classList.add('attempt-score-data-row');

    countAttemptRow.textContent = counted_attempts;
    scoreAttemptRow.textContent = score;
    dateRow.textContent = date;

    attemptScoreDataRow.appendChild(countAttemptRow);
    attemptScoreDataRow.appendChild(scoreAttemptRow);
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

moveStudentInfo();