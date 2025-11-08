import Notification from './modules/Notification.js';
import { encrypt, decrypt } from './modules/SessionHandling.js'

const profileButton = document.getElementById("profile-button");
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
    const activityNav = document.getElementById('activities-record-button');
    const assessmentNav = document.getElementById('assessments-record-button');

    if (!activityNav || !assessmentNav) return;

    const activityItem = activityNav.closest('.nav-item');
    const assessmentItem = assessmentNav.closest('.nav-item');

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
    profileHeader.id = 'profile-button-container';
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

    // REVISION: Retrieve badge from sessionStorage and validate it exists
    // This checks if badge is not null, not the string 'null', and not empty
    const badgeImage = sessionStorage.getItem('badge');
    const hasBadge = badgeImage && badgeImage !== 'null' && badgeImage !== '';

    // REVISION: Create the "Achievements & Badges" header
    const badgesHeader = document.createElement('h4');
    badgesHeader.textContent = 'Achievements & Badges';
    badgesContainer.appendChild(badgesHeader);

    // REVISION: If badge exists, display it; otherwise show "no badges" message
    if (hasBadge) {
        // REVISION: Create container div with class 'badge-display' for styling
        const badgeImgContainer = document.createElement('div');
        badgeImgContainer.classList.add('badge-display');
        
        // REVISION: Create img element for the badge with class 'badge-image'
        const badgeImg = document.createElement('img');
        badgeImg.src = badgeImage; // Use the badge path from sessionStorage
        badgeImg.alt = 'Achievement Badge';
        badgeImg.classList.add('badge-image'); // This class will be styled in CSS
        
        // REVISION: Add error handler to log if badge image fails to load
        // Useful for debugging incorrect paths or missing files
        badgeImg.onerror = function() {
            console.error('Failed to load badge image from:', this.src);
        };
        
        // REVISION: Append badge image to container, then container to badges section
        badgeImgContainer.appendChild(badgeImg);
        badgesContainer.appendChild(badgeImgContainer);
    } else {
        // REVISION: If no badge exists, display a friendly message
        const noBadgesMsg = document.createElement('p');
        noBadgesMsg.textContent = 'No badges earned yet.';
        badgesContainer.appendChild(noBadgesMsg);
    }

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

function addContent(content_id, teacher_name, content_title, content_details, tts_json, content_type, content_hidden, category_type) {
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const teacherName = document.createElement("p");
    const contentType = document.createElement("p")
    const categoryType = document.createElement("p");
    newContent.classList.add("content");
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
        answerPageTo(content_type);
    });

    displayContents.appendChild(newContent);
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
    document.querySelectorAll('#activities-record-button .dropdown li').forEach(item => {
        item.addEventListener('click', async () => {
            const parentNav = item.closest('.nav-item');
            const navType = parentNav.querySelector('span').textContent.trim(); // e.g. "Activities" or "Assessments"
            const clickedName = item.textContent.trim();

            displayContents.innerHTML = ''
            showContent(parseInt(item.dataset.action))

            // Update the label dynamically
            sectionLabel.textContent = parseInt(item.dataset.action) !== 0 ? `${navType} – ${clickedName}` : 'Select an Activity or Assessment';

            // Optional: highlight selected item
            document.querySelectorAll('.nav-item .dropdown li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
        });
    });

    document.querySelectorAll('#assessments-record-button .dropdown li').forEach(item => {
        item.addEventListener('click', async () => {
            const parentNav = item.closest('.nav-item');
            const navType = parentNav.querySelector('span').textContent.trim(); // e.g. "Activities" or "Assessments"
            const clickedName = item.textContent.trim();

            displayContents.innerHTML = ''
            //add showAssessments() to be created

            // Update the label dynamically
            sectionLabel.textContent = parseInt(item.dataset.action) !== 0 ? `${navType} – ${clickedName}` : "Select an Activity or Assessment";

            // Optional: highlight selected item
            document.querySelectorAll('.nav-item .dropdown li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');
        });
    });
})();
