// === KID-DO-READS MAIN SCRIPT ===
import Notification from './modules/Notification.js';

const profileButton = document.getElementById("profile-button");
const logOutButton = document.getElementById('log-out-button');
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section');
const displayContents = document.getElementById('display-contents');
const studentInfo = document.getElementById('student-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
let isInMainSection = false;

const id = sessionStorage.getItem("id");
const notification = new Notification();

// === LOGOUT BUTTON ===
logOutButton.addEventListener('click', () => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/logout';
});

// === FIXED DROPDOWN FUNCTIONALITY (ACTIVITIES + ASSESSMENTS) ===
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
    await showContent(1);
    await showUserInfo();
});

// === STUDENT PROFILE MODAL ===
function studentProfile() {
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
    studentImage.src = localStorage.getItem('image') || defaultProfilePicture;
    studentImage.alt = "Learner Photo";

    const learnerDetails = document.createElement('div');
    learnerDetails.classList.add('learner-details');

    const studentName = document.createElement('h3');
    studentName.textContent = localStorage.getItem('fullName');

    const studentId = document.createElement('p');
    studentId.textContent = "Learner ID: " + (localStorage.getItem('id') || "N/A");

    const studentSection = document.createElement('p');
    studentSection.textContent = "Section: N/A";

    learnerDetails.append(studentName, studentId, studentSection);
    cardBody.append(studentImage, learnerDetails);
    card.append(cardBody);

    userContainer.append(card);
    badgesContainer.innerHTML = `<h4>Achievements & Badges</h4><p>No badges earned yet.</p>`;

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
                    data.content_type,
                    data.isHidden
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

function addContent(content_id, teacher_name, content_title, content_details, content_type, content_hidden) {
    const newContent = document.createElement("div");
    const activityName = document.createElement("p");
    const teacherName = document.createElement("p");
    newContent.classList.add("content");
    activityName.classList.add("activity-name");
    teacherName.classList.add("teacher-name");
    activityName.innerHTML = content_title;
    teacherName.innerHTML = teacher_name;
    newContent.append(activityName, teacherName);

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

    playActivityButton.addEventListener('click', () => {
        sessionStorage.setItem("currentActivityTitle", content_title);
        sessionStorage.setItem("currentContentId", content_id);
        sessionStorage.setItem("questions", JSON.stringify(content_details));
        answerPageTo(content_type);
    });

    displayContents.appendChild(newContent);
}

// === USER INFO ===
async function showUserInfo() {
    const url = `/user/${id}`;
    const response = await fetch(url);
    const result = await response.json();
    try {
        if (response.ok && result.status) {
            sessionStorage.setItem("fullName", result.data[0].fullName);
            const studentName = document.getElementById('student_name');
            const studentPicture = document.getElementById('student_picture');
            studentName.textContent = sessionStorage.getItem("fullName");
            if (result.data[0].image) {
                sessionStorage.setItem("image", result.data[0].image);
                studentPicture.src = sessionStorage.getItem("image");
            } else {
                sessionStorage.setItem("image", defaultProfilePicture);
                studentPicture.src = sessionStorage.getItem("image");
            }
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
        case 'Phonemic Awareness: Listen & Choose':
        case 'Word Recognition: Sound-Alike Match':
        case 'Word Recognition: Meaning Maker':
        case 'Reading Comprehension: What Happens Next?':
        case 'Reading Comprehension: Picture + Clues':
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

        // --- Style ---
        sectionLabel.style.fontFamily = "'Light-Poppins', Light-Poppins";
        sectionLabel.style.fontSize = '1.5rem';
        sectionLabel.style.fontWeight = '500';
        sectionLabel.style.color = '#222';
        sectionLabel.style.margin = '0 0 1rem 0';
        sectionLabel.style.paddingLeft = '0.5rem';
        sectionLabel.style.backgroundColor = 'transparent';
        sectionLabel.style.lineHeight = '1.2';

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
            sectionLabel.textContent = `${navType} – ${clickedName}`;

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
            sectionLabel.textContent = `${navType} – ${clickedName}`;

            // Optional: highlight selected item
            document.querySelectorAll('.nav-item .dropdown li').forEach(li => li.classList.remove('active'));
            item.classList.add('active');

            
        });
    });
})();