import Notification from './modules/Notification.js';
import { encrypt, decrypt } from './modules/SessionHandling.js'

import { loginSuccess, notifyStudentAchievement } from './modules/RedirectNotification.js'

const profileButton = document.getElementById("student-profile-button");
const logOutButton = document.getElementById('log-out-button');
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const displayContents = document.getElementById('display-contents');
const studentInfo = document.getElementById('student-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
let isInMainSection = false;

const id = await decrypt(sessionStorage.getItem("id"));
const notification = new Notification();

// === LOGOUT BUTTON ===
logOutButton.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/logout';
});

(() => {
    const activityNav = document.getElementById('student-activities-button');
    const assessmentNav = document.getElementById('student-assessments-button');

    if (!activityNav || !assessmentNav) return;

    const activityItem = activityNav.closest('.student-nav-item');
    const assessmentItem = assessmentNav.closest('.student-nav-item');

    const dropdownActivity = activityItem?.querySelector('.dropdown');
    const dropdownAssessment = assessmentItem?.querySelector('.dropdown');

    const arrowActivity = activityItem?.querySelector('.dropdown-arrow');
    const arrowAssessment = assessmentItem?.querySelector('.dropdown-arrow');

    document.addEventListener('click', (e) => {
        const clickedActivity = activityItem?.contains(e.target);
        const clickedAssessment = assessmentItem?.contains(e.target);
        const insideDropdown = e.target.closest('.dropdown');

        // --- ACTIVITY TOGGLE ---
        if (clickedActivity && !insideDropdown) {
            const isActive = dropdownActivity?.classList.contains('active');

            dropdownActivity?.classList.toggle('active', !isActive);
            arrowActivity?.classList.toggle('rotate', !isActive);
            activityItem?.classList.toggle('active-nav', !isActive);

            if (!isActive) {
                dropdownAssessment?.classList.remove('active');
                arrowAssessment?.classList.remove('rotate');
                assessmentItem?.classList.remove('active-nav');
                activityItem?.style.setProperty('z-index', '1000');              // ADD THIS LINE
                assessmentItem?.style.setProperty('pointer-events', 'none');    // ADD THIS LINE
            } else {
                activityItem?.style.removeProperty('z-index');                  // ADD THIS LINE
                assessmentItem?.style.removeProperty('pointer-events');         // ADD THIS LINE
            }
            return;
        }

        // --- ASSESSMENT TOGGLE ---
        if (clickedAssessment && !insideDropdown) {
            const isActive = dropdownAssessment?.classList.contains('active');

            dropdownAssessment?.classList.toggle('active', !isActive);
            arrowAssessment?.classList.toggle('rotate', !isActive);
            assessmentItem?.classList.toggle('active-nav', !isActive);

            if (!isActive) {
                dropdownActivity?.classList.remove('active');
                arrowActivity?.classList.remove('rotate');
                activityItem?.classList.remove('active-nav');
                assessmentItem?.style.setProperty('z-index', '1000');           // ADD THIS LINE
                activityItem?.style.setProperty('pointer-events', 'none');      // ADD THIS LINE
            } else {
                assessmentItem?.style.removeProperty('z-index');                // ADD THIS LINE
                activityItem?.style.removeProperty('pointer-events');           // ADD THIS LINE
            }
            return;
        }

        // --- CLICK OUTSIDE BOTH ---
        if (!clickedActivity && !clickedAssessment && !insideDropdown) {
            dropdownActivity?.classList.remove('active');
            arrowActivity?.classList.remove('rotate');
            activityItem?.classList.remove('active-nav');

            dropdownAssessment?.classList.remove('active');
            arrowAssessment?.classList.remove('rotate');
            assessmentItem?.classList.remove('active-nav');
            
            activityItem?.style.removeProperty('z-index');                      // ADD THIS LINE
            assessmentItem?.style.removeProperty('z-index');                    // ADD THIS LINE
            activityItem?.style.removeProperty('pointer-events');               // ADD THIS LINE
            assessmentItem?.style.removeProperty('pointer-events');             // ADD THIS LINE
        }
    });
})();

// === PROFILE & RESPONSIVE BEHAVIOR ===
profileButton.addEventListener('click', studentProfile);
window.addEventListener('resize', moveStudentInfo);

document.addEventListener("DOMContentLoaded", async function() {
    await showContent(0);
    await showUserInfo();
});

async function studentProfile() {
    const profileBackground = document.createElement('div');
    const profileContainer = document.createElement('div');
    const profileHeader = document.createElement('nav');
    const informationContainer = document.createElement('section');
    const userContainer = document.createElement('article');
    const badgesContainer = document.createElement('aside');

    profileBackground.id = 'profile-background';
    profileContainer.id = 'profile-container';
    profileHeader.id = 'student-profile-button-container';
    informationContainer.id = 'information-container';
    userContainer.id = 'user-container';
    badgesContainer.id = 'badges-container';

    const identificationStatement = document.createElement('p');
    const closeButton = document.createElement('img');
    identificationStatement.textContent = "Kid-Do-Reads Learner Identification Card";
    closeButton.src = '../static/images/close-outline.svg';
    closeButton.alt = "Close";
    closeButton.style.cursor = 'pointer';
    profileHeader.append(identificationStatement, closeButton);

    const card = document.createElement('div');
    card.classList.add('learner-card');

    const cardBody = document.createElement('div');
    cardBody.classList.add('learner-card-body');

    const studentImage = document.createElement('img');
    studentImage.classList.add('learner-photo');
    studentImage.src = await decrypt(sessionStorage.getItem('image'));
    studentImage.alt = "Learner Photo";

    const learnerDetails = document.createElement('div');
    learnerDetails.classList.add('learner-details');

    const studentName = document.createElement('h3');
    studentName.textContent = await decrypt(sessionStorage.getItem('fullName'));

    const studentId = document.createElement('p');
    studentId.textContent = "Learner ID: " + await decrypt( (sessionStorage.getItem('id')) || "N/A");

    learnerDetails.append(studentName, studentId);
    cardBody.append(studentImage, learnerDetails);
    card.append(cardBody);

    userContainer.append(card);


    const achievements = [
        {id: 1, title: "First Step Hero", description: "Finished your first activity!", image: '../../../static/images/achievement-icons/1-first-step-hero.png', isAchieved: false},
        {id: 2, title: "Brain Starter!", description: "Finished your first assessment!", image: '../../../static/images/achievement-icons/2-brain-starter.png', isAchieved: false},
        {id: 3, title: "Starter Star", description: "Finished 3 assessments and activities!", image: '../../../static/images/achievement-icons/3-starter-star.png', isAchieved: false},
        {id: 4, title: "Learning Explorer", description: "Completed 5 assessments and activities!", image: '../../../static/images/achievement-icons/4-learning-explorer.png', isAchieved: false},
        {id: 5, title: "Super Scholar!", description: "Completed 10 assessments and activities! Keep it up, Super Scholar!", image: '../../../static/images/achievement-icons/5-super-scholar.png', isAchieved: false},
        {id: 6, title: "Learning Legend!", description: "Completed 20 assessments and activities! You're now a true Learning Legend!", image: '../../../static/images/achievement-icons/6-learning-legend.png', isAchieved: false},
        {id: 7, title: "Sound & Spell Star!", description: "Completed the Word Audio Match Assessment!", image: '../../../static/images/achievement-icons/7-sound-and-spell-star.png', isAchieved: false},
        {id: 8, title: "Phonics Pro!", description: "Completed the Listen and Choose Assessment!", image: '../../../static/images/achievement-icons/8-phonics-pro.png', isAchieved: false},
        {id: 9, title: "Wizard Knowledge!", description: "Completed the Meaning Maker Assessment!", image: '../../../static/images/achievement-icons/9-wizard-knowledge.png', isAchieved: false},
        {id: 10, title: "The Detective!", description: "Completed the Sound-Alike Match Assessment!", image: '../../../static/images/achievement-icons/10-the-detective.png', isAchieved: false},
        {id: 11, title: "Story Predictor!", description: "Completed the What Happens Next? Assessment!", image: '../../../static/images/achievement-icons/11-story-predictor.png', isAchieved: false},
        {id: 12, title: "Clue Finder!", description: "Completed the Picture + Clues Assessment!", image: '../../../static/images/achievement-icons/12-clue-finder.png', isAchieved: false},
        {id: 13, title: "Perfect Start!", description: "Achieved your 1st perfect score!", image: '../../../static/images/achievement-icons/13-perfect-start.png', isAchieved: false},
        {id: 14, title: "Perfect Streak!", description: "Achieved your 5th perfect score! — You're becoming a real master of learning — keep that streak going!", image: '../../../static/images/achievement-icons/14-perfect-streak.png', isAchieved: false},
        {id: 15, title: "Perfect Pro!", description: "Achieved your 10th perfect score! You're a true learning champion", image: '../../../static/images/achievement-icons/15-perfect-pro.png', isAchieved: false}
    ]

    const achievementUrl = `/achievements/${await decrypt(sessionStorage.getItem('id'))}`


    const response = await fetch(achievementUrl)
    const result = await response.json()
    if (response.ok && result.status){
        result.achievements.forEach(studentAchievement => {
            const achievement = achievements.find(a => a.id === studentAchievement.achievement_id);
            if (achievement) {
                achievement.isAchieved = true;
            }

            console.log(achievements)
        }); 
    }
    else{
        console.log(result.message)
    }


    achievements.forEach(achievement => {
        const achievementCard = document.createElement('div');
        achievementCard.classList.add('achievement-card');
        
        // Add locked/unlocked state class for styling
        if (achievement.isAchieved) {
            achievementCard.classList.add('unlocked');
        } else {
            achievementCard.classList.add('locked');
        }

        // REVISION: Create achievement image container
        const achievementImgContainer = document.createElement('div');
        achievementImgContainer.classList.add('achievement-icon');
        
        const achievementImg = document.createElement('img');
        achievementImg.src = achievement.image;
        achievementImg.alt = achievement.title;
        
        achievementImgContainer.appendChild(achievementImg);

        // REVISION: Create achievement info container
        const achievementInfo = document.createElement('div');
        achievementInfo.classList.add('achievement-info');

        const achievementTitle = document.createElement('h5');
        achievementTitle.textContent = achievement.title;

        const achievementDesc = document.createElement('p');
        achievementDesc.textContent = achievement.description;

        achievementInfo.append(achievementTitle, achievementDesc);

        // REVISION: Create lock icon for locked achievements
        if (!achievement.isAchieved) {
            const lockIcon = document.createElement('div');
            lockIcon.classList.add('lock-icon');
            lockIcon.innerHTML = '🔒';
            achievementCard.appendChild(lockIcon);
        }

        achievementCard.append(achievementImgContainer, achievementInfo);
        badgesContainer.appendChild(achievementCard);
    });

    informationContainer.append(userContainer, badgesContainer);
    profileContainer.append(profileHeader, informationContainer);
    profileBackground.append(profileContainer);
    document.body.appendChild(profileBackground);

    closeButton.addEventListener('click', () => {
        document.body.removeChild(profileBackground);
    });
}

// === RESPONSIVE LAYOUT ===
function moveStudentInfo() {
    if (window.innerWidth <= 936 && !isInMainSection) {
        mainSection.insertBefore(studentInfo, mainSection.firstChild);
        isInMainSection = true;
    } else if (window.innerWidth > 936 && isInMainSection) {
        mainAside.insertBefore(studentInfo, mainAside.firstChild);
        isInMainSection = false;
    }
}

// === CONTENT DISPLAY ===
async function showContent(contentTypeNum) {
    const url = `/students/contents/${contentTypeNum}`;

    try {
        const response = await fetch(url);
        const result = await response.json();
        if (response.ok && result.status) {
            result.data.forEach(data => {
                addContent(
                    data.content_id,
                    data.teacher_name,
                    data.content_title,
                    data.content_json,
                    data.tts_json,
                    data.content_type,
                    data.isHidden,
                    "Activity"
                );
            });
        } else {
            notification.notify("Contents can't be retrieved at the moment. Please try again.", "error");
        }
    } catch (error) {
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
}

async function showAssessment(contentTypeNum) {
    const url = `/students/assessments/${contentTypeNum}`;
    try {
        const response = await fetch(url);
        const result = await response.json();
        if (response.ok && result.status) {
            result.data.forEach(data => {
                addAssessment(
                    data.assessment_id,
                    data.assessment_title,
                    data.assessment_json,
                    data.tts_json,
                    data.assessment_type,
                    "Assessment",
                );
            });
        } else {
            notification.notify("Contents can't be retrieved at the moment. Please try again.", "error");
        }
    } catch (error) {
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
}

function addContent(content_id, teacher_name, content_title, content_details, tts_json, content_type, content_hidden, category_type) {
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const teacherName = document.createElement("p");
    const contentType = document.createElement("p")
    const categoryType = document.createElement("p");
    newContent.classList.add("content");
    newContent.style.backgroundImage = `url('/static/images/activities-background-images/${content_type}.jpg')`; /* content background image */
    newContent.style.backgroundSize = "cover";
    newContent.style.backgroundPosition = "center";
    activityName.classList.add("activity-name");
    teacherName.classList.add("teacher-name");
    contentType.classList.add("category-type")
    categoryType.classList.add("category-type");
    activityName.innerHTML = content_title;
    teacherName.innerHTML = teacher_name;
    contentType.innerHTML = getContentName(content_type)
    categoryType.innerHTML = category_type;
    newContent.append(activityName, teacherName, categoryType, contentType);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("button-container");
    const playActivityButton = document.createElement('button');
    const checkProgressButton = document.createElement('button');

    playActivityButton.classList.add('play-activity-button');
    playActivityButton.innerHTML = "Play Activity";
    checkProgressButton.classList.add('check-progress-button');
    checkProgressButton.innerHTML = "Check Progress";

    buttonContainer.append(playActivityButton, checkProgressButton);
    newContent.append(buttonContainer);

    newContent.style.display = content_hidden ? 'none' : 'flex';

    playActivityButton.addEventListener('click', async () => {
        sessionStorage.setItem("currentActivityTitle", content_title);
        sessionStorage.setItem("currentContentId", await encrypt(content_id));
        sessionStorage.setItem("questions", JSON.stringify(content_details));
        sessionStorage.setItem("ttsObjects", JSON.stringify(tts_json))

        const formData = new FormData()
        
        formData.append("student_id", id)
        formData.append("content_id", await decrypt(sessionStorage.getItem("currentContentId")))
        
        const response = await fetch('/attempt/activity', {
            method: "POST",
            body: formData
        })
        
        const result = await response.json()

        try{
            if (response.ok && result.status){
                if(result.hasUnfinished){   
                    hasUnfinishedAttemptContainer(result.studentAnswer, result.attemptId, content_type, 1)

                }
                else{
                    sessionStorage.setItem("categoryTypeNum", 1)
                    sessionStorage.setItem("userAnswers", JSON.stringify({}))
                    sessionStorage.setItem("currentAttemptId", await encrypt(result.attemptId))
                    answerPageTo(content_type);
                }
            }
            else{
                console.log(result.message)
            }
        }
        catch (error){
            console.log(error)
        }
    });

    checkProgressButton.addEventListener('click', async () => {
        const url = `/attempts/activities/students/${id}/${content_id}/filter/0`;
        const response = await fetch(url);
        const result = await response.json();

        const attemptScoreContainer = document.createElement('div') //background
        const attemptScoreWrapper = document.createElement('div')
        attemptScoreWrapper.setAttribute('id', 'attempt-score-wrapper')
        const attemptScoreTable = document.createElement('table') //container itself
        const closeButton = document.createElement('img')
        closeButton.src = '../../static/images/close-outline.svg'
        closeButton.alt = "close-button"

        closeButton.addEventListener('click', () => {
            attemptScoreContainer.remove()
        })

        attemptScoreWrapper.appendChild(closeButton)
        const attemptScoreTableHeader = document.createElement('thead')
        const attemptScoreTableBody = document.createElement('tbody')

        const attemptScoreTableHeaderRow = document.createElement('tr')

        const attemptScoreTableHeaderAttemptNo = document.createElement('th')
        const attemptScoreTableHeaderScore = document.createElement('th')
        const attemptScoreTableHeaderStatus = document.createElement('th')
        const attemptScoreTableHeaderDate = document.createElement('th')
        attemptScoreTableHeaderAttemptNo.textContent = "Attempt No."
        attemptScoreTableHeaderScore.textContent = "Score"
        attemptScoreTableHeaderStatus.textContent = "Status"
        attemptScoreTableHeaderDate.textContent = "Finished At"
        
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderAttemptNo)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderScore)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderStatus)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderDate)

        attemptScoreTableHeader.appendChild(attemptScoreTableHeaderRow)

        attemptScoreContainer.setAttribute('id', 'attempt-score-container')
        attemptScoreTable.setAttribute('id', 'attempt-score-table')

        attemptScoreTable.appendChild(attemptScoreTableHeader)

        
        if (response.ok && result.status){
            result.attemptScores.forEach(attempt => {
                attemptScoreTableBody.appendChild(displayAttemptScores(attempt.attempt_count, attempt.score, attempt.status, formatDate(attempt.date)));
            });
            attemptScoreTable.appendChild(attemptScoreTableBody)
            attemptScoreWrapper.appendChild(attemptScoreTable)
            attemptScoreContainer.appendChild(attemptScoreWrapper)

            document.body.appendChild(attemptScoreContainer)
        }


    })
    displayContents.appendChild(newContent);

    function hasUnfinishedAttemptContainer(answer, attempt_id, type){
        const unfinishedAttemptContainer = document.createElement('div')
        const unfinishedAttemptWrapper = document.createElement('div')
        const statement = document.createElement('p')
        const buttonContainer = document.createElement('div')
        const resumeButton = document.createElement('button')
        const closeButton = document.createElement('button')

        unfinishedAttemptContainer.setAttribute('id', 'unfinished-attempt-container')
        unfinishedAttemptWrapper.setAttribute('id', 'unfinished-attempt-wrapper')

        statement.textContent = "Uh Oh! An unfinished and saved activity detected! Please finish it!"

        resumeButton.textContent = "Resume Activity"
        closeButton.textContent = "Resume Later"

        buttonContainer.append(resumeButton, closeButton)

        unfinishedAttemptWrapper.appendChild(statement)
        unfinishedAttemptWrapper.appendChild(buttonContainer)

        unfinishedAttemptContainer.appendChild(unfinishedAttemptWrapper)

        resumeButton.addEventListener('click', async () => {
            const formData = new FormData();
            formData.append("attempt_id", attempt_id);
            
            const response = await fetch('/resume_attempt/activity', {
                method: "PATCH",
                body: formData
            });

            const result = await response.json()

            if (response.ok && result.status){
                sessionStorage.setItem("userAnswers", JSON.stringify(answer))
                sessionStorage.setItem("currentAttemptId", await encrypt(attempt_id))
                answerPageTo(type)
            }
            else{
                console.log(result.message)
            }
        })

        closeButton.addEventListener('click', () => {
            unfinishedAttemptContainer.remove()
        })

        document.body.appendChild(unfinishedAttemptContainer)
    }

}
function addAssessment(assessment_id, assessment_title, assessment_details, tts_json, assessment_type, category_type) {
    const newContent = document.createElement("div");
    const assessmentName = document.createElement("p");
    const assessmentType = document.createElement("p")
    newContent.classList.add("content");
    assessmentName.classList.add("activity-name");
    assessmentType.classList.add("category-type")
    assessmentName.innerHTML = assessment_title;
    assessmentType.innerHTML = getContentName(assessment_type)
    newContent.append(assessmentName, assessmentType);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add("button-container");
    const playActivityButton = document.createElement('button');
    const checkProgressButton = document.createElement('button');

    playActivityButton.classList.add('play-activity-button');
    playActivityButton.innerHTML = "Play Activity";
    checkProgressButton.classList.add('check-progress-button');
    checkProgressButton.innerHTML = "Check Progress";

    buttonContainer.append(playActivityButton, checkProgressButton);
    newContent.append(buttonContainer);

    playActivityButton.addEventListener('click', async () => {
        sessionStorage.setItem("currentActivityTitle", assessment_title);
        sessionStorage.setItem("currentContentId", await encrypt(assessment_id));
        sessionStorage.setItem("questions", JSON.stringify(assessment_details));
        sessionStorage.setItem("ttsObjects", JSON.stringify(tts_json))

        const formData = new FormData()
        
        formData.append("student_id", id)
        formData.append("content_id", await decrypt(sessionStorage.getItem("currentContentId")))
        
        const response = await fetch('/attempt/assessment', {
            method: "POST",
            body: formData
        })
        
        const result = await response.json()

        try{
            if (response.ok && result.status){
                if(result.hasUnfinished){   
                    hasUnfinishedAttemptContainer(result.studentAnswer, result.attemptId, assessment_type, 2)

                }
                else{
                    sessionStorage.setItem("userAnswers", JSON.stringify({}))
                    sessionStorage.setItem("currentAttemptId", await encrypt(result.attemptId))
                    sessionStorage.setItem("categoryTypeNum", 2)
                    answerPageTo(assessment_type);
                }
            }
            else{
                console.log(result.message)
            }
        }
        catch (error){
            console.log(error)
        }
    });

    checkProgressButton.addEventListener('click', async () => {
        const url = `/attempts/assessments/students/${id}/${assessment_id}/filter/0`;
        const response = await fetch(url);
        const result = await response.json();

        const attemptScoreContainer = document.createElement('div') //background
        const attemptScoreWrapper = document.createElement('div')
        attemptScoreWrapper.setAttribute('id', 'attempt-score-wrapper')
        const attemptScoreTable = document.createElement('table') //container itself
        const closeButton = document.createElement('img')
        closeButton.src = '../../static/images/close-outline.svg'
        closeButton.alt = "close-button"

        closeButton.addEventListener('click', () => {
            attemptScoreContainer.remove()
        })

        attemptScoreWrapper.appendChild(closeButton)
        const attemptScoreTableHeader = document.createElement('thead')
        const attemptScoreTableBody = document.createElement('tbody')

        const attemptScoreTableHeaderRow = document.createElement('tr')

        const attemptScoreTableHeaderAttemptNo = document.createElement('th')
        const attemptScoreTableHeaderScore = document.createElement('th')
        const attemptScoreTableHeaderStatus = document.createElement('th')
        const attemptScoreTableHeaderDate = document.createElement('th')
        attemptScoreTableHeaderAttemptNo.textContent = "Attempt No."
        attemptScoreTableHeaderScore.textContent = "Score"
        attemptScoreTableHeaderStatus.textContent = "Status"
        attemptScoreTableHeaderDate.textContent = "Finished At"
        
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderAttemptNo)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderScore)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderStatus)
        attemptScoreTableHeaderRow.appendChild(attemptScoreTableHeaderDate)

        attemptScoreTableHeader.appendChild(attemptScoreTableHeaderRow)

        attemptScoreContainer.setAttribute('id', 'attempt-score-container')
        attemptScoreTable.setAttribute('id', 'attempt-score-table')

        attemptScoreTable.appendChild(attemptScoreTableHeader)

        
        if (response.ok && result.status){
            result.attemptScores.forEach(attempt => {
                attemptScoreTableBody.appendChild(displayAttemptScores(attempt.attempt_count, attempt.score, attempt.status, formatDate(attempt.date)));
            });
            attemptScoreTable.appendChild(attemptScoreTableBody)
            attemptScoreWrapper.appendChild(attemptScoreTable)
            attemptScoreContainer.appendChild(attemptScoreWrapper)

            document.body.appendChild(attemptScoreContainer)
        }


    })
    displayContents.appendChild(newContent);

    function hasUnfinishedAttemptContainer(answer, attempt_id, type, categoryTypeNum){
        const unfinishedAttemptContainer = document.createElement('div')
        const unfinishedAttemptWrapper = document.createElement('div')
        const statement = document.createElement('p')
        const buttonContainer = document.createElement('div')
        const resumeButton = document.createElement('button')
        const closeButton = document.createElement('button')

        unfinishedAttemptContainer.setAttribute('id', 'unfinished-attempt-container')
        unfinishedAttemptWrapper.setAttribute('id', 'unfinished-attempt-wrapper')

        statement.textContent = "Uh Oh! An unfinished and saved activity detected! Please finish it!"

        resumeButton.textContent = "Resume Activity"
        closeButton.textContent = "Resume Later"

        buttonContainer.append(resumeButton, closeButton)

        unfinishedAttemptWrapper.appendChild(statement)
        unfinishedAttemptWrapper.appendChild(buttonContainer)

        unfinishedAttemptContainer.appendChild(unfinishedAttemptWrapper)

        resumeButton.addEventListener('click', async () => {
            const formData = new FormData();
            formData.append("attempt_id", attempt_id);
            
            const response = await fetch('/resume_attempt/assessment', {
                method: "PATCH",
                body: formData
            });

            const result = await response.json()

            if (response.ok && result.status){
                sessionStorage.setItem("categoryTypeNum", categoryTypeNum)
                sessionStorage.setItem("userAnswers", JSON.stringify(answer))
                sessionStorage.setItem("currentAttemptId", await encrypt(attempt_id))
                answerPageTo(type)
            }
            else{
                console.log(result.message)
            }
        })

        closeButton.addEventListener('click', () => {
            unfinishedAttemptContainer.remove()
        })

        document.body.appendChild(unfinishedAttemptContainer)
    }

}

function displayAttemptScores(attempt_no, score, status, date) {
    // Create table row
    const tableRow = document.createElement('tr')
    tableRow.className = 'attempt-score-row'

    // Create table cells
    const attemptNumberCell = document.createElement('td')
    attemptNumberCell.className = 'attempt-number'
    attemptNumberCell.textContent = `#${attempt_no}`

    const scoreCell = document.createElement('td')
    scoreCell.className = 'score'
    scoreCell.textContent = score

    const statusCell = document.createElement('td')
    statusCell.className = `status-${status.toLowerCase()}`
    statusCell.textContent = status

    const dateCell = document.createElement('td')
    dateCell.className = 'date'
    dateCell.textContent = date

    // Append all cells to the row
    tableRow.appendChild(attemptNumberCell)
    tableRow.appendChild(scoreCell)
    tableRow.appendChild(statusCell)
    tableRow.appendChild(dateCell)

    // Append row to the table (which is outside)
    return tableRow
}

function getContentName(type){
    switch(type){
        case 1:
            return 'Pronunciation: Word Audio Match'
        case 2:
            return 'Phonemic Awareness: Listen & Choose'
        case 3:
            return 'Word Recognition: Sound-Alike Match'
        case 4:
            return 'Word Recognition: Meaning Maker?'
        case 5:
            return 'Reading Comprehension: What Happens Next?'
        case 6: 
            return 'Reading Comprehension: Picture + Clues'
    }
}

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

// === USER INFO ===
async function showUserInfo() {
    const url = `/user/${id}`;
    const response = await fetch(url);
    const result = await response.json();
    try {
        if (response.ok && result.status) {
            sessionStorage.setItem("fullName", await encrypt(result.data[0].fullName));
            const studentName = document.getElementById('student_name');
            const studentPicture = document.getElementById('student_picture');
            studentName.textContent = await decrypt(sessionStorage.getItem("fullName"));
            if (result.data[0].image) {
                sessionStorage.setItem("image", await encrypt(result.data[0].image));
                studentPicture.src = await decrypt(sessionStorage.getItem("image"));
            } else {
                sessionStorage.setItem("image", await encrypt(defaultProfilePicture));
                studentPicture.src = await decrypt(sessionStorage.getItem("image"));
            }
            
            // REVISION: Store badge from backend or set test badge
            // TEMPORARY: Using test badge for now
            sessionStorage.setItem("badge", "../static/images/badge.PNG");
            
            // FUTURE: Replace above line with this when backend is ready:
            // if (result.data[0].badge) {
            //     sessionStorage.setItem("badge", result.data[0].badge);
            // } else {
            //     sessionStorage.setItem("badge", null);
            // }
            
        } else {
            notification.notify("User details can't be retrieved at the moment. Please try again.", "error");
        }
    } catch (error) {
        console.error("Network Error:", error);
        notification.notify("Network error. Please check your connection and try again.", "error");
    }
}

function answerPageTo(url) {
    switch (url) {
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

moveStudentInfo();

// === DYNAMIC LABEL UPDATE FOR DROPDOWN CLICKS ===
(() => {
    // label element 
    let sectionLabel = document.getElementById('section-label');
    if (!sectionLabel) {
        sectionLabel = document.createElement('p');
        sectionLabel.id = 'section-label';
        sectionLabel.textContent = 'Select an Activity or Assessment';

        // Insert label before the main display area
        const displayArea = document.getElementById('display-contents');
        displayArea.parentNode.insertBefore(sectionLabel, displayArea);
    }
    
    // Add click listeners to all dropdown items
    document.querySelectorAll('#student-activities-button .dropdown li').forEach(item => {
        item.addEventListener('click', async () => {
            const parentNav = item.closest('.student-nav-item');
            const navType = parentNav.querySelector('span').textContent.trim(); // e.g. "Activities" or "Assessments"
            const clickedName = item.textContent.trim();

            displayContents.innerHTML = ''
            showContent(parseInt(item.dataset.action))

            // Update the label dynamically
            sectionLabel.textContent = parseInt(item.dataset.action) !== 0 ? `${navType} – ${clickedName}` : 'Select an Activity or Assessment';

            // Optional: highlight selected item
            document.querySelectorAll('.student-nav-item .dropdown li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            dropdown.classList.toggle('active', false)
            
        });
    });

    document.querySelectorAll('#student-assessments-button .dropdown li').forEach(item => {
        item.addEventListener('click', async () => {
            const parentNav = item.closest('.student-nav-item');
            const navType = parentNav.querySelector('span').textContent.trim(); // e.g. "Activities" or "Assessments"
            const clickedName = item.textContent.trim();

            displayContents.innerHTML = ''
            showAssessment(parseInt(item.dataset.action))

            // Update the label dynamically
            sectionLabel.textContent = parseInt(item.dataset.action) !== 0 ? `${navType} – ${clickedName}` : "Select an Activity or Assessment";

            // Optional: highlight selected item
            document.querySelectorAll('.student-nav-item .dropdown li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            const dropdown = parentNav.querySelector('.dropdown');
            dropdown.classList.toggle('active', false)
        });
    });
})();

loginSuccess()

const achievementIds = JSON.parse(sessionStorage.getItem("achievementIds")) || []
for (const achievementId of achievementIds) {
    notifyStudentAchievement(achievementId)
}
sessionStorage.removeItem("achievementIds")

