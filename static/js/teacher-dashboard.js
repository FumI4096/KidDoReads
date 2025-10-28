import Notification from './modules/Notification.js'

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

document.addEventListener("DOMContentLoaded", async function() {
    await showUserInfo()
    await showContents()
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

        if (!(contentContainer)){
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
        sessionStorage.setItem("currentActivityTitle", content_title)
        sessionStorage.setItem("originalActivityTitle", content_title)
        editGamePageTo(content_type)
    })

    previewButton.addEventListener('click', async () => {
        if (Object.keys(content_details).length >= 1){
            sessionStorage.setItem("questions", JSON.stringify(content_details))
            previewGamePageTo(content_type)
        }
        else{
            notification.notify("No questions in this activity. Please questions and try again", "error")
        }

        sessionStorage.setItem("currentActivityTitle", content_title)
    })

    newContent.appendChild(buttonActionContainer);
    content_container.appendChild(newContent);
    content_container.appendChild(addContentButton);
}

function editGamePageTo(url){
    switch(url){
        case 1: //word audio match
            window.location.href = '/word_audio_match_edit';
            break;
        case 2: // listen and choose
            window.location.href = '/listen_and_choose_edit';
            break;
        case 3: //sound alike match
            window.location.href = '/sound_alike_match_edit';
            break;
        case 4: //meaning maker
            window.location.href = '/meaning_maker_edit';
            break;
        case 5: //what happens next
            window.location.href = '/what_happens_next_edit';
            break;
        case 6: //picture + clues
            window.location.href = '/picture_clues_edit';
            break;
    }
}

function previewGamePageTo(url){
    switch(url){
        case 1: // word audio match
            window.location.href = '/word_audio_match_answer';
            break;
        case 2: // listen and choose
            window.location.href = '/listen_and_choose_answer';
            break;
        case 3: //sound alike match
            window.location.href = '/sound_alike_match_answer';
            break;
        case 4: //meaning maker
            window.location.href = '/meaning_maker_answer';
            break;
        case 5: //what happens next
            window.location.href = '/what_happens_next_answer';
            break;
            case 6: //picture + clues
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
        headerContainer.setAttribute('id', 'event-details-header')
        
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

function studentProgressHeader(headerContainer){
    const selectCategory = document.createElement('select')
    const selectContent = document.createElement('select')
    selectCategory.setAttribute('id', 'select-category')
    selectCategory.name = 'select-category'
    selectContent.setAttribute('id', 'select-content')
    selectContent.name = 'select-content'
    const categoryOptions = [
        {value: 0, text: 'Activities'},
        {value: 1, text: 'Assessments'}
    ]
    const contentOptions = [
        {value: 1, text: 'Pronunciation: Word Audio Match'}, 
        {value: 2, text: 'Phonemic Awareness: Listen & Choose'},
        {value: 3, text: 'Word Recognition: Sound-Alike Match'},
        {value: 4, text: 'Word Recognition: Meaning Maker'},
        {value: 5, text: 'Reading Comprehension: What Happens Next?'},
        {value: 6, text: 'Reading Comprehension: Picture + Clues'}
    ]

    categoryOptions.forEach(option => {
        const optionElement = document.createElement('option')
        optionElement.value = option.value
        optionElement.textContent = option.text

        selectCategory.appendChild(optionElement)
    })

    contentOptions.forEach(option => {
        const optionElement = document.createElement('option')
        optionElement.value = option.value
        optionElement.textContent = option.text

        selectContent.appendChild(optionElement)
    })

    headerContainer.appendChild(selectCategory)
    headerContainer.appendChild(selectContent)

    return headerContainer
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

function attemptProgressHeader(headerContainer, content_name, content_id, table_header, table_body){
    const contentName = document.createElement('h3')
    contentName.textContent = content_name
    headerContainer.appendChild(contentName)

    const selectAttemptProgressFilter = document.createElement('select')
    selectAttemptProgressFilter.setAttribute('id', 'select-attempt-progress-filter')
    selectAttemptProgressFilter.name = 'select-attempt-progress-filter'
    const filterOptions = [
        {value: 0, text: 'Student ID DESC'},
        {value: 1, text: 'Student ID ASC'},
        {value: 2, text: 'High Score'},
        {value: 3, text: 'Low Score'},
        {value: 4, text: 'Most Attempts'},
        {value: 5, text: 'Least Attempts'}
    ]

    filterOptions.forEach(option => {
        const optionElement = document.createElement('option')
        optionElement.value = option.value
        optionElement.textContent = option.text
        selectAttemptProgressFilter.appendChild(optionElement)
    })

    headerContainer.appendChild(selectAttemptProgressFilter)

    selectAttemptProgressFilter.addEventListener('change', async () => {
        const url = `/attempts/activities/${content_id}/filter/${selectAttemptProgressFilter.value}`;
        const response = await fetch(url)
        const result = await response.json()
        table_body.innerHTML = ''
        if (response.ok && result.status){
            result.scores.forEach(student => {
                displayStudentAttemptScores(table_header, table_body, content_id, student.student_id, student.student_name, student.student_attempts, student.student_highest_score, student.student_lowest_score, student.total_questions)
            })
        }
        else{
            console.log(result.message)
        }
    })

    return headerContainer
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

function attemptScoreHeader(headerContainer, student_name, student_id, content_id, table_body){
    const studentName = document.createElement('h3')
    studentName.textContent = student_name
    headerContainer.appendChild(studentName)

    const selectAttemptScoreFilter = document.createElement('select')
    selectAttemptScoreFilter.setAttribute('id', 'select-attempt-score-category')
    selectAttemptScoreFilter.name = 'select-attempt-score-category'
    const filterOptions = [
        {value: 0, text: 'High Score'},
        {value: 1, text: 'Low Score'},
        {value: 2, text: 'Attempt Date DESC'},
        {value: 3, text: 'Attempt Date ASC'}
    ]

    filterOptions.forEach(option => {
        const optionElement = document.createElement('option')
        optionElement.value = option.value
        optionElement.textContent = option.text

        selectAttemptScoreFilter.appendChild(optionElement)
    })

    headerContainer.appendChild(selectAttemptScoreFilter)

    selectAttemptScoreFilter.addEventListener('change', async () => {
        const url = `/attempts/activities/students/${student_id}/${content_id}/filter/${selectAttemptScoreFilter.value}`;
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

    const progressTableHeader = document.createElement('thead')
    const progressTableBody = document.createElement('tbody')
    
    progressTableHeader.appendChild(getProgressHeaderRow())
    progressTable.appendChild(progressTableHeader)
    progressTable.appendChild(progressTableBody)
    
    mainSection.appendChild(progressTable)
    try{
        const url = `/attempts/activities/${teacherId}/${contentType}`;
        const response = await fetch(url)
        const result = await response.json()

        if (response.ok && result.status){
            mainSection.insertBefore(studentProgressHeader(getProgressEventsHeader()), mainSection.firstChild)

            result.attempts.forEach(data => {
                displayAttemptProgress(progressTableHeader, progressTableBody, data.content_id, data.content_title, data.completed_students, data.total_students, data.progress)
            })
        }
        else{
            console.log(result.message)
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

function displayAttemptProgress(table_header, table_body, content_id, content_title, completed_students, total_students, progress){
    const dataRow = document.createElement('tr')
    const contentTitleData = document.createElement('td')
    const completedStudentsData = document.createElement('td')
    const totalStudentsData = document.createElement('td')
    const progressData = document.createElement('td')
    
    contentTitleData.textContent = content_title
    contentTitleData.classList.add('link')
    completedStudentsData.textContent = completed_students
    totalStudentsData.textContent = total_students
    progressData.textContent = progress
    
    dataRow.appendChild(contentTitleData)
    dataRow.appendChild(completedStudentsData)
    dataRow.appendChild(totalStudentsData)
    dataRow.appendChild(progressData)
    
    table_body.appendChild(dataRow)

    contentTitleData.addEventListener('click', async () => {
        const url = `/attempts/activities/${content_id}/filter/${0}`;
        const response = await fetch(url)
        const result = await response.json()
        
        table_header.innerHTML = ''
        table_body.innerHTML = ''
        
        table_header.appendChild(getScoreHeaderRow())
        
        mainSection.insertBefore(attemptProgressHeader(getProgressEventsHeader(), content_title, content_id, table_header, table_body), mainSection.firstChild)

        try{
            if (response.ok && result.status){
                result.scores.forEach(student => {
                    displayStudentAttemptScores(table_header, table_body, content_id, student.student_id, student.student_name, student.student_attempts, student.student_highest_score, student.student_lowest_score, student.total_questions)
                })
            }
        }
        catch(error){
            console.log(error)
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

function displayStudentAttemptScores(table_header, table_body, content_id, student_id, student_name, student_attempts, student_highest_score, student_lowest_score, total_questions){
    const scoreDataRow = document.createElement('tr')
    const studentIdData = document.createElement('td')
    const studentNameData = document.createElement('td')
    const attemptsData = document.createElement('td')
    const highestScoreData = document.createElement('td')
    const lowestScoreData = document.createElement('td')
    const totalQuestionsData = document.createElement('td')

    studentIdData.textContent = student_id
    studentNameData.textContent = student_name
    attemptsData.textContent = student_attempts || 0
    attemptsData.classList.add('link')
    highestScoreData.textContent = student_highest_score || 0
    lowestScoreData.textContent = student_lowest_score || 0
    totalQuestionsData.textContent = total_questions

    scoreDataRow.appendChild(studentIdData)
    scoreDataRow.appendChild(studentNameData)
    scoreDataRow.appendChild(attemptsData)
    scoreDataRow.appendChild(highestScoreData)
    scoreDataRow.appendChild(lowestScoreData)
    scoreDataRow.appendChild(totalQuestionsData)

    table_body.appendChild(scoreDataRow)

    attemptsData.addEventListener('click', async () => {
        const url = `/attempts/activities/students/${student_id}/${content_id}/filter/${0}`
        
        const response = await fetch(url)
        const result = await response.json()

        table_header.innerHTML = ''
        table_body.innerHTML = ''
        table_header.appendChild(getAttemptScoreHeaderRow())

        mainSection.insertBefore(attemptScoreHeader(getProgressEventsHeader(), student_name, student_id, content_id, table_body), mainSection.firstChild)

        try{
            if (response.ok && result.status){

                result.attemptScores.forEach(attempt => {
                    displayAttemptScores(table_body, attempt.attempt_count, attempt.score, formatDate(attempt.date))
                })
            }
        }
        catch(error){
            console.log(error)
        }

    })
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

    countAttemptRow.textContent = counted_attempts
    scoreAttemptRow.textContent = score
    dateRow.textContent = date

    attemptScoreDataRow.appendChild(countAttemptRow)
    attemptScoreDataRow.appendChild(scoreAttemptRow)
    attemptScoreDataRow.appendChild(dateRow)

    table_body.appendChild(attemptScoreDataRow)
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

moveStudentInfo();