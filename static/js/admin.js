import Notification from './modules/Notification.js'
import { encrypt, decrypt } from './modules/SessionHandling.js'

const mainForm = document.getElementById('main-form')
const tableBody = document.querySelector("tbody");
const imageInput = document.getElementById('image-input');
const imageDisplay = document.getElementById('image-display');
const studentDisplayButton = document.getElementById('student-record-button');
const teacherDisplayButton = document.getElementById('teacher-record-button');
const adminDisplayButton = document.getElementById('admin-record-button');
const sectionDisplayButton = document.getElementById('section-record-button');
const showPasswordButton = document.getElementById('showPasswordButton');
const unshowPasswordButton = document.getElementById('unshowPasswordButton');
const logOutButton = document.getElementById('log-out-button');
const inputPassword = document.getElementById('password');
const filterOptions = document.getElementById('filter');
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section > div');
const studentSectionContainer = document.getElementById('section-container');
const studentImportButton = document.getElementById('import-student-button');
const studentSectionFilter = document.getElementById('section-filter');
const adminInfo = document.getElementById('admin-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
const importStudentButton = document.getElementById('import-student-button');
let currentTab = "student";
let isInMainSection = false;
studentDisplayButton.disabled = true;
studentDisplayButton.style.pointerEvents = 'none';

const notifyObj = new Notification();

const sectionRecord = document.getElementById('section-record');
const userRecord = document.getElementById('user-record');
sectionRecord.style.display = "none";

showPasswordButton.addEventListener('click', () => 
    displayEyePassword(showPasswordButton, unshowPasswordButton, true)
);

unshowPasswordButton.addEventListener('click', () => 
    displayEyePassword(unshowPasswordButton, showPasswordButton, false)
);

function displayEyePassword(element1, element2, showPassword){
    element1.style.display = "none";
    element2.style.display = "block";

    inputPassword.type = showPassword ? "text" : "password";

}

logOutButton.addEventListener('click', async () => {
    sessionStorage.clear();
    window.location.href = '/logout'
})

function toggleStudentControls(show) {
    studentSectionContainer.style.display = show ? "block" : "none";
    studentImportButton.style.display = show ? "inline-block" : "none";
    studentSectionFilter.style.display = show ? "inline-block" : "none";
}

studentDisplayButton.addEventListener('click', async () => {
    toggleStudentControls(true);
    currentTab = "student";
    displayRecordSection(currentTab);
    await showRecords('/students');
    filterOptions.value = "default";
    studentDisplayButton.disabled = true;
    studentDisplayButton.style.pointerEvents = 'none';
    studentDisplayButton.classList.add('toggle-user');
    teacherDisplayButton.style.pointerEvents = 'auto';
    teacherDisplayButton.classList.remove('toggle-user');
    adminDisplayButton.style.pointerEvents = 'auto';
    adminDisplayButton.classList.remove('toggle-user');
    sectionDisplayButton.style.pointerEvents = 'auto';
    sectionDisplayButton.classList.remove('toggle-user');
})

teacherDisplayButton.addEventListener('click', async () => {
    toggleStudentControls(false);
    currentTab = "teacher";
    displayRecordSection(currentTab);
    await showRecords('/teachers');
    filterOptions.value = "default";
    teacherDisplayButton.disabled = true;
    teacherDisplayButton.style.pointerEvents = 'none';
    teacherDisplayButton.classList.add('toggle-user');
    studentDisplayButton.style.pointerEvents = 'auto';
    studentDisplayButton.classList.remove('toggle-user');
    adminDisplayButton.style.pointerEvents = 'auto';
    adminDisplayButton.classList.remove('toggle-user');
    sectionDisplayButton.style.pointerEvents = 'auto';
    sectionDisplayButton.classList.remove('toggle-user');
})

adminDisplayButton.addEventListener('click', async () => {
    toggleStudentControls(false);
    currentTab = "admin";
    displayRecordSection(currentTab);
    await showRecords('/admins');
    filterOptions.value = "default";
    adminDisplayButton.disabled = true;
    adminDisplayButton.style.pointerEvents = 'none';
    adminDisplayButton.classList.add('toggle-user');
    studentDisplayButton.style.pointerEvents = 'auto';
    studentDisplayButton.classList.remove('toggle-user');
    teacherDisplayButton.style.pointerEvents = 'auto';
    teacherDisplayButton.classList.remove('toggle-user');
    sectionDisplayButton.style.pointerEvents = 'auto';
    sectionDisplayButton.classList.remove('toggle-user');
})

sectionDisplayButton.addEventListener('click', async () => {
    toggleStudentControls(false);
    currentTab = "section";
    displayRecordSection(currentTab);
    await showSectionRecords('/sections');
    filterOptions.value = "default";
    sectionDisplayButton.disabled = true;
    sectionDisplayButton.style.pointerEvents = 'none';
    sectionDisplayButton.classList.add('toggle-user');
    studentDisplayButton.style.pointerEvents = 'auto';
    studentDisplayButton.classList.remove('toggle-user');
    teacherDisplayButton.style.pointerEvents = 'auto';
    teacherDisplayButton.classList.remove('toggle-user');
    adminDisplayButton.style.pointerEvents = 'auto';
    adminDisplayButton.classList.remove('toggle-user');
})

importStudentButton.addEventListener('click', async () => {
    const importContainer = document.createElement('div')
    importContainer.setAttribute('id', 'import-student-container')

    const importWrapper = document.createElement('div')
    importWrapper.setAttribute('id', 'import-student-wrapper')

    const importNoteContainer = document.createElement('div')
    importNoteContainer.setAttribute('id', 'import-note-container')
    const importNoteHeader = document.createElement('h3')
    importNoteHeader.textContent = 'Import Student Instructions'

    const importNoteDetailsContainer = document.createElement('div')
    importNoteDetailsContainer.setAttribute('id', 'import-note-details-container')

    const importNoteList = document.createElement('ul')
    const note1 = document.createElement('li')
    note1.textContent = 'The file should be in .csv format.'
    const note2 = document.createElement('li')
    note2.textContent = 'The file must have the following columns accordingly: id, first name, last name, email. Its not case-sensitive, but the order should be maintained.'
    const note3 = document.createElement('li')
    note3.textContent = 'Ensure that there are no duplicate Student IDs or emails in the file.'
    const note4 = document.createElement('li')
    note4.textContent = "Importing the file will automatically generate the passwords for the students ('Letrankdr123')."
    const note5 = document.createElement('li')
    note5.textContent = 'Make sure there are no spaces before the data in each cell.'
    const note6 = document.createElement('li')
    note6.textContent = 'Make sure that the student emails follow a valid email format (e.g., example@letran-calamba.edu.ph).'
    importNoteList.append(note1, note2, note3, note4, note5, note6)
    const pictureExampleContainer = document.createElement('aside')
    pictureExampleContainer.setAttribute('id', 'picture-example-container')
    const importPictureExample = document.createElement('img')
    importPictureExample.src = '../static/images/guideline_import.png'
    pictureExampleContainer.appendChild(importPictureExample)

    importNoteDetailsContainer.appendChild(importNoteList)
    importNoteDetailsContainer.appendChild(pictureExampleContainer)

    importNoteContainer.appendChild(importNoteHeader)
    importNoteContainer.appendChild(importNoteDetailsContainer)

    const importButtonContainer = document.createElement('div')
    importButtonContainer.setAttribute('id', 'import-button-container')
    const importButton = document.createElement('input')
    importButton.textContent = 'Import Students'
    importButton.type = 'file'
    importButton.name = 'import_file'
    importButton.id = 'import_file'
    importButton.accept = '.csv'
    importButtonContainer.appendChild(importButton)

    // Add section dropdown
    const sectionContainer = document.createElement('div')
    sectionContainer.setAttribute('id', 'import-section-container')
    const sectionLabel = document.createElement('label')
    sectionLabel.textContent = 'Select Section: '
    sectionLabel.setAttribute('for', 'import-section')
    const sectionSelect = document.createElement('select')
    sectionSelect.setAttribute('id', 'import-section')
    sectionSelect.setAttribute('name', 'section')
    sectionSelect.required = true
    
    const sectionResponse = await fetch('/sections', {
        credentials: 'same-origin',
        cache: 'no-cache'
    });

    const sectionResult = await sectionResponse.json();
    sectionResult.data.forEach(section => {
        const option = document.createElement('option')
        option.value = section.id
        option.textContent = `${section.name} (Grade ${section.grade})`
        sectionSelect.appendChild(option)
    })
    
    sectionContainer.appendChild(sectionLabel)
    sectionContainer.appendChild(sectionSelect)

    const actionButtonContainer = document.createElement('div')
    actionButtonContainer.setAttribute('id', 'import-action-button-container')
    const confirmImportButton = document.createElement('button')
    confirmImportButton.textContent = 'Confirm'
    const cancelImportButton = document.createElement('button')
    cancelImportButton.textContent = 'Cancel'
    actionButtonContainer.appendChild(cancelImportButton)
    actionButtonContainer.appendChild(confirmImportButton)

    // Handle file selection display
    importButton.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importFileText.textContent = e.target.files[0].name
        } else {
            importFileText.textContent = 'No file chosen'
        }
    })

    // Handle cancel button
    cancelImportButton.addEventListener('click', () => {
        document.body.removeChild(importContainer)
    })

    // Handle confirm button - SUBMIT TO API
    confirmImportButton.addEventListener('click', async () => {
        const file = importButton.files[0]
        const section = sectionSelect.value

        // Validation
        if (!file) {
            alert('Please select a CSV file')
            return
        }

        if (!section) {
            alert('Please select a section')
            return
        }

        // Create FormData
        const formData = new FormData()
        formData.append('import_file', file)
        formData.append('section', section)

        // Disable button during upload
        confirmImportButton.disabled = true
        confirmImportButton.textContent = 'Importing...'

        try {
            const response = await fetch('/import-students', {
                method: 'POST',
                body: formData
            })

            const data = await response.json()

            if (data.status) {
                notifyObj.notify(data.message, 'success')
                location.reload() // Or call your function to refresh the student table
            } else {
                // Show errors
                let errorMessage = data.message
                if (data.errors && data.errors.length > 0) {
                    errorMessage += '\n\nErrors:\n' + data.errors.join('\n')
                }
                alert(errorMessage)
            }
        } catch (error) {
            alert('An error occurred while importing students: ' + error.message)
        } finally {
            confirmImportButton.disabled = false
            confirmImportButton.textContent = 'Confirm'
            document.body.removeChild(importContainer)
        }
    })

    // Assemble the modal
    importWrapper.appendChild(importNoteContainer)
    importWrapper.appendChild(importButtonContainer)
    importWrapper.appendChild(sectionContainer)
    importWrapper.appendChild(actionButtonContainer)
    importContainer.appendChild(importWrapper)
    document.body.appendChild(importContainer)
})

imageInput.addEventListener('change', defaultImageChanger);
window.addEventListener('resize', moveAdminInfo);

function defaultImageChanger(event){
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result; 
        };
        reader.readAsDataURL(file);
    }
    else{
        imageDisplay.src = defaultProfilePicture
    }
}

mainForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const formBody = e.target;
    const actionUrl = formBody.action;
    const formData = new FormData(formBody);

    try{
        const response = await fetch(actionUrl, {
            method: "POST",
            body: formData
        });
    
        const result = await response.json()
    
        if (response.ok && result.status){
            notifyObj.notify(result.message, "success");
            formBody.reset();
            formBody.action = '/register';
            const passwordInput = document.getElementById('password');
            passwordInput.setAttribute('placeholder', "Enter Password");
    
            const submitButton = document.getElementById('submit-user-button');
            const cancelButton = document.getElementById('cancel-user-button');
            cancelButton.hidden = true;
            submitButton.value = "Submit";
            imageDisplay.src = "static/images/default_profile_picture.png"; 
            
            if (currentTab === "student"){
                await showRecords('/students');
            }
            else if (currentTab === "teacher"){
                await showRecords('/teachers');
            }
            else if (currentTab === "admin"){
                await showRecords('/admins');
            }
    
        }
        else{
            if (result.errors){
                result.errors.forEach(error => {
                    notifyObj.notify(error, "error");
                })
                return
            }
            notifyObj.notify(result.message, "error");
        }
    }
    catch (error){
        console.error("Network Error during form submission:", error);
        notifyObj.notify("Network error. Please check your internet connection.", "error");
    }
})

document.getElementById("filter").addEventListener("change", fetchFilteredRecords);
document.getElementById("section-filter").addEventListener("change", fetchFilteredRecords);

async function fetchFilteredRecords() {
    const sortValue = document.getElementById("filter").value;
    const sectionValue = document.getElementById("section-filter").value;
    const role = currentTab;

    console.log(`Filtering records for role: ${role}, sort: ${sortValue}, section: ${sectionValue}`);
    let url = `/filter_record/${role}/${sortValue}`;

    // Apply section filter ONLY for students
    if (role === "student" && sectionValue) {
        url += `?section_id=${sectionValue}`;
    }

    try {
        const response = await fetch(url);
        const result = await response.json();

        if (result.status) {
            tableBody.innerHTML = "";
            result.data.forEach(data => {
                addRow(
                    data.id,
                    data.fname,
                    data.lname,
                    data.email,
                    data.image,
                    data.role
                );
            });
        } else {
            notifyObj.notify(result.message, "error");
        }
    } catch (error) {
        console.error("Network Error while filtering records:", error);
        notifyObj.notify("Network error. Please try again later.", "error");
    }
}

async function showRecords(apiRoute){
    const loadingId = `loading-${Date.now()}`;
    notifyObj.notify("Loading records...", "loading", null, null, loadingId);
    try{
        
        // Dismiss loading notification
        const response = await fetch(apiRoute, {
            credentials: 'same-origin',
            cache: 'no-cache'
        })
        const result = await response.json();
        notifyObj.dismissLoading(loadingId);
        tableBody.innerHTML = ""
        if (response.ok && result.status){  
            result.data.forEach(data => {
                addRow(data.id, data.fname, data.lname, data.email, data.image, data.role);
            })
            notifyObj.notify("Records loaded successfully", "success");
        }
        else{
            notifyObj.notify(result.message, "error");
        }
    }
    catch (error){
        console.error("Network Error while loading records:", error);
        notifyObj.notify("Unable to load data. Please check your network.", "error");
    }

}

async function showSectionRecords(apiRoute){
    const loadingId = `loading-${Date.now()}`;
    notifyObj.notify("Loading section records...", "loading", null, null, loadingId);

    try{
        //fetch sections
        const sectionResponse = await fetch(apiRoute, {
            credentials: 'same-origin',
            cache: 'no-cache'
        });

        const sectionResult = await sectionResponse.json();

        const teacherResponse = await fetch('/teachers', {
            credentials: 'same-origin',
            cache: 'no-cache'
        });

        const teacherResult = await teacherResponse.json();

        if(sectionResponse.ok && sectionResult.status && teacherResponse.ok && teacherResult.status){
            notifyObj.dismissLoading(loadingId);
            notifyObj.notify("Section records loaded successfully", "success");

            displaySectionRecords(sectionResult.data, teacherResult.data);
        }
    }
    catch (error){
        console.error("Network Error while loading records:", error);
        notifyObj.notify("Unable to load data. Please check your network.", "error");
    }
}

function displaySectionRecords(sections, teachers){
    const mainSectionRecordContainer = document.getElementById('main-section-record');

    mainSectionRecordContainer.innerHTML = ''

    const sectionTableContainer = document.createElement('section');
    sectionTableContainer.setAttribute('id', 'section-table-container');
    const teacherRecordSection = document.createElement('section');
    teacherRecordSection.setAttribute('id', 'teacher-record-section');

    console.log(teacherRecordSection)
    const sectionHeader = document.createElement('h2');
    const teacherHeader = document.createElement('h2');
    sectionHeader.textContent = "Sections";
    teacherHeader.textContent = "Teachers";
    const addSectionButton = document.createElement('button');
    const iconSectionButton = document.createElement('ion-icon');
    const statementSectionButton = document.createElement('span');
    iconSectionButton.setAttribute('name', 'add-circle-outline');
    statementSectionButton.textContent = "Add Section";
    addSectionButton.appendChild(iconSectionButton);
    addSectionButton.appendChild(statementSectionButton);
    addSectionButton.classList.add('add-section-button');

    sectionTableContainer.appendChild(sectionHeader);
    teacherRecordSection.appendChild(teacherHeader);

    sections.forEach(section => {
        console.log("Section ID: " + section.id);
        console.log("Section Name: " + section.name);
        console.log("Section Grade: " + section.grade);

        const sectionContainer = document.createElement('div');
        sectionContainer.classList.add('section-container');
        sectionContainer.dataset.sectionId = section.id;
        const sectionWrapper = document.createElement('div');
        sectionWrapper.classList.add('section-wrapper');
        const sectionInfo = document.createElement('div');
        sectionInfo.classList.add('section-info');
        const sectionName = document.createElement('p');
        sectionName.textContent = `${section.name}`;
        const sectionGrade = document.createElement('p');
        sectionGrade.textContent = `Grade ${section.grade}`;

        const sectionActionBar = document.createElement('div');
        sectionActionBar.classList.add('section-action-bar');
        const editSectionButton = document.createElement('button');
        const deleteSectionButton = document.createElement('button');

        editSectionButton.textContent = "Edit";
        deleteSectionButton.textContent = "Delete";
        // tag for easy enable/disable toggling
        editSectionButton.classList.add('section-edit-button');
        deleteSectionButton.classList.add('section-delete-button');
        sectionActionBar.appendChild(editSectionButton);
        sectionActionBar.appendChild(deleteSectionButton);
        sectionInfo.appendChild(sectionName);
        sectionInfo.appendChild(sectionGrade);
        sectionWrapper.appendChild(sectionInfo);
        sectionWrapper.appendChild(sectionActionBar);
        sectionContainer.appendChild(sectionWrapper);

        deleteSectionButton.addEventListener('click', async () => {
            modalSection('delete', section.id);
        });

        editSectionButton.addEventListener('click', async () => {
            modalSection('edit', section.id);
        });
        
        sectionTableContainer.appendChild(sectionContainer);

        
    });

    teachers.forEach(teacher => {
        console.log("Teacher ID: " + teacher.id);
        console.log("Teacher Name: " + teacher.fname + " " + teacher.lname);

        const teacherContainer = document.createElement('div');
        teacherContainer.classList.add('teacher-container');

        const teacherName = document.createElement('h3');
        teacherName.textContent = `${teacher.fname} ${teacher.lname}`;

        const teacherActionBar = document.createElement('div');
        teacherActionBar.classList.add('teacher-action-bar');
        
        const assignSectionButton = document.createElement('button');
        assignSectionButton.textContent = "Assign Section";
        const checkAssignedSectionButton = document.createElement('button');
        checkAssignedSectionButton.textContent = "Check Section";
        const saveSectionsButton = document.createElement('button');
        const cancelSectionsButton = document.createElement('button');

        saveSectionsButton.textContent = "Save";
        cancelSectionsButton.textContent = "Cancel";

        teacherActionBar.appendChild(assignSectionButton);
        teacherActionBar.appendChild(checkAssignedSectionButton);
        teacherContainer.appendChild(teacherName);
        teacherContainer.appendChild(teacherActionBar);
        teacherRecordSection.appendChild(teacherContainer);


        assignSectionButton.addEventListener('click', async () => {
            addSectionButton.disabled = true;
            teacherActionBar.removeChild(assignSectionButton);
            teacherActionBar.removeChild(checkAssignedSectionButton);
            teacherActionBar.appendChild(cancelSectionsButton);
            teacherActionBar.appendChild(saveSectionsButton);
            // Disable section edit/delete while assigning
            document.querySelectorAll('.section-edit-button, .section-delete-button').forEach(btn => btn.disabled = true);
            // Disable all other teacher action buttons
            document.querySelectorAll('.teacher-action-bar button').forEach(btn => {
                if (btn !== cancelSectionsButton && btn !== saveSectionsButton) {
                    btn.disabled = true;
                }
            });
            const assignedSectionsResponse = await fetch(`/section/${teacher.id}`);
            const assignedSectionsResult = await assignedSectionsResponse.json();
            try{
                if (assignedSectionsResponse.ok){
                    const assignedSections = Array.isArray(assignedSectionsResult.data) ? assignedSectionsResult.data : [];
                    const assignedSet = new Set(assignedSections.map(String));
    
                    console.log(assignedSections);
                    const sectionContainers = document.querySelectorAll('.section-container');
    
                    sectionContainers.forEach(container => {
                        const checkBox = document.createElement('input');
                        checkBox.type = 'checkbox';
                        container.prepend(checkBox);
    
                        if (assignedSet.has(String(container.dataset.sectionId))){
                            checkBox.checked = true;
                        }
                    })
                }
                else{
                    console.log("Failed to fetch assigned sections for teacher ID: " + teacher.id);
                }

            }
            catch (error){
                notifyObj.notify("Network Error while fetching assigned sections:", error);
            }

            // Use onclick to avoid stacking duplicate listeners
            saveSectionsButton.onclick = async () => {
                try{
                    const checkedSections = [];
                    document.querySelectorAll('.section-container input[type="checkbox"]:checked').forEach(checkbox => {
                        const sectionId = checkbox.parentElement.dataset.sectionId;
                        checkedSections.push(sectionId);
                    });
    
                    const response = await fetch('/assign_sections', {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({sections: checkedSections, teacherId: teacher.id})
                    });
    
                    const result = await response.json();
    
                    if (response.ok && result.status){
                        notifyObj.notify(result.message, "success");
                    }
                    else{
                        notifyObj.notify(result.message, "error");
                    }
    
                    console.log(checkedSections);
                    const sectionContainers = document.querySelectorAll('.section-container');
                    sectionContainers.forEach(container => {
                        const checkBox = container.querySelector('input[type="checkbox"]');
                        if (checkBox && checkBox.parentElement === container){
                            container.removeChild(checkBox);
                        }
                    });

                }
                catch (error){
                    notifyObj.notify("Network Error during section assignment:", error);
                }

                // Restore action bar buttons
                addSectionButton.disabled = false;
                teacherActionBar.removeChild(cancelSectionsButton);
                teacherActionBar.removeChild(saveSectionsButton);
                teacherActionBar.appendChild(assignSectionButton);
                teacherActionBar.appendChild(checkAssignedSectionButton);
                // Re-enable section edit/delete after saving
                document.querySelectorAll('.section-edit-button, .section-delete-button').forEach(btn => btn.disabled = false);
                // Re-enable all teacher action buttons
                document.querySelectorAll('.teacher-action-bar button').forEach(btn => btn.disabled = false);
                // Clear handlers
                saveSectionsButton.onclick = null;
                cancelSectionsButton.onclick = null;
            };

            cancelSectionsButton.onclick = () => {
                teacherActionBar.removeChild(cancelSectionsButton);
                teacherActionBar.removeChild(saveSectionsButton);
                teacherActionBar.appendChild(assignSectionButton);
                teacherActionBar.appendChild(checkAssignedSectionButton);
                const sectionContainers = document.querySelectorAll('.section-container');
                sectionContainers.forEach(container => {
                    const checkBox = container.querySelector('input[type="checkbox"]');
                    if (checkBox && checkBox.parentElement === container){
                        container.removeChild(checkBox);
                    }
                });
                addSectionButton.disabled = false;
                // Re-enable section edit/delete after cancel
                document.querySelectorAll('.section-edit-button, .section-delete-button').forEach(btn => btn.disabled = false);
                // Re-enable all teacher action buttons
                document.querySelectorAll('.teacher-action-bar button').forEach(btn => btn.disabled = false);
                // Clear handlers
                saveSectionsButton.onclick = null;
                cancelSectionsButton.onclick = null;
            };
        });

        checkAssignedSectionButton.addEventListener('click', async () => {
            addSectionButton.disabled = true;
            const response = await fetch(`/section/${teacher.id}`);

            const result = await response.json();

            try{
                if (response.ok){
                    const assignedSections = Array.isArray(result.data) ? result.data : [];
                    const assignedSet = new Set(assignedSections.map(String));
    
                    console.log(assignedSections);
                    const sectionContainers = document.querySelectorAll('.section-container');
    
                    sectionContainers.forEach(container => {
                        const checkBox = document.createElement('input');
                        checkBox.type = 'checkbox';
                        container.prepend(checkBox);
    
                        // In 'Check Assigned' mode, make all checkboxes read-only
                        checkBox.disabled = true;
                        checkBox.readOnly = true;
                        checkBox.style.cursor = 'not-allowed';
    
                        if (assignedSet.has(String(container.dataset.sectionId))){
                            checkBox.checked = true;
                        }
                    })
                }

            }
            catch (error){
                notifyObj.notify("Network Error while fetching assigned sections:", error);
            }
            
            teacherActionBar.removeChild(assignSectionButton);
            teacherActionBar.removeChild(checkAssignedSectionButton);
            teacherActionBar.appendChild(cancelSectionsButton);
            // Disable section edit/delete while viewing assigned
            document.querySelectorAll('.section-edit-button, .section-delete-button').forEach(btn => btn.disabled = true);
            // Disable all other teacher action buttons
            document.querySelectorAll('.teacher-action-bar button').forEach(btn => {
                if (btn !== cancelSectionsButton) {
                    btn.disabled = true;
                }
            });

            // Use onclick to ensure only one active handler
            cancelSectionsButton.onclick = () => {
                teacherActionBar.removeChild(cancelSectionsButton);
                teacherActionBar.appendChild(assignSectionButton);
                teacherActionBar.appendChild(checkAssignedSectionButton);
                const sectionContainers = document.querySelectorAll('.section-container');
                sectionContainers.forEach(container => {
                    const checkBox = container.querySelector('input[type="checkbox"]');
                    if (checkBox && checkBox.parentElement === container){
                        container.removeChild(checkBox);
                    }
                });
                addSectionButton.disabled = false;
                // Re-enable section edit/delete after cancel
                document.querySelectorAll('.section-edit-button, .section-delete-button').forEach(btn => btn.disabled = false);
                // Re-enable all teacher action buttons
                document.querySelectorAll('.teacher-action-bar button').forEach(btn => btn.disabled = false);
                cancelSectionsButton.onclick = null;
            };
        });
    })

    sectionTableContainer.appendChild(addSectionButton);

    mainSectionRecordContainer.appendChild(sectionTableContainer);
    mainSectionRecordContainer.appendChild(teacherRecordSection);

    addSectionButton.addEventListener('click', async () => {
        modalSection('insert');
    });
}

function modalSection(type, sectionId=null){
    const modalContainer = document.createElement('div');
    modalContainer.setAttribute('id', 'modal-section-container');

    const modalWrapper = document.createElement('div');
    modalWrapper.setAttribute('id', 'modal-section-wrapper');

    const insertSectionInput = document.createElement('input');
    insertSectionInput.type = 'text';
    insertSectionInput.name = 'section_name';

    const insertSectionNote = document.createElement('p');
    insertSectionNote.textContent = 'Inserting section will automatically be assigned to Grade 3';

    const deleteSectionSentence = document.createElement('p');
    deleteSectionSentence.textContent = 'Are you sure you want to delete this section? This action cannot be undone.';

    const actionButtonContainer = document.createElement('aside');
    actionButtonContainer.setAttribute('id', 'modal-action-button-container');
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm';
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    actionButtonContainer.appendChild(cancelButton);
    actionButtonContainer.appendChild(confirmButton);

    if(type == 'insert'){
        insertSectionInput.placeholder = 'Enter Section Name';
        modalWrapper.appendChild(insertSectionNote);
        modalWrapper.appendChild(insertSectionInput);
    }
    else if(type == 'edit'){
        insertSectionInput.placeholder = 'Edit Section Name';
        modalWrapper.appendChild(insertSectionInput);
    }
    else if(type == 'delete'){
        modalContainer.setAttribute('id', 'delete-section-container');
        modalWrapper.setAttribute('id', 'delete-section-wrapper');
        modalWrapper.appendChild(deleteSectionSentence);
    }

    modalWrapper.appendChild(actionButtonContainer);
    modalContainer.appendChild(modalWrapper);

    if(type == 'insert'){
        confirmButton.addEventListener('click', async () => {
            const sectionName = insertSectionInput.value.trim();
            if (sectionName.length === 0){
                notifyObj.notify("Section name cannot be empty.", "error");
                return;
            }

            // Check for duplicate section names
            const existingSections = document.querySelectorAll('.section-container .section-info p:first-child');
            for (const p of existingSections) {
                if (p.textContent.trim() === sectionName) {
                    notifyObj.notify("Section name already exists.", "error");
                    return;
                }
            }

            const response = await fetch('/insert_section', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sectionName: sectionName })
            });

            const result = await response.json();

            if (response.ok && result.status){
                notifyObj.notify(result.message, "success");
                document.body.removeChild(modalContainer);
                await showSectionRecords('/sections');
            }
            else{
                notifyObj.notify(result.message, "error");
            }
        });
    }
    else if(type == 'edit'){
        confirmButton.addEventListener('click', async () => {
            const sectionName = insertSectionInput.value.trim();
            if (sectionName.length === 0){
                notifyObj.notify("Section name cannot be empty.", "error");
                return;
            }

            // Check for duplicate section names
            const existingSections = document.querySelectorAll('.section-container .section-info p:first-child');
            for (const p of existingSections) {
                if (p.textContent.trim() === sectionName) {
                    notifyObj.notify("Section name already exists.", "error");
                    return;
                }
            }

            const response = await fetch('/update_section', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sectionName: sectionName, sectionId: sectionId })
            });

            const result = await response.json();

            if (response.ok && result.status){
                notifyObj.notify(result.message, "success");
                document.body.removeChild(modalContainer);
                await showSectionRecords('/sections');
            }
            else{
                notifyObj.notify(result.message, "error");
            }
        });
    }
    else if(type == 'delete'){
        confirmButton.addEventListener('click', async () => {
            try{

                const response = await fetch('/delete_section', {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ sectionId: sectionId })
                });
    
                const result = await response.json();
    
                if (response.ok && result.status){
                    notifyObj.notify(result.message, "success");
                    document.body.removeChild(modalContainer);
                    await showSectionRecords('/sections');
                }
                else{
                    notifyObj.notify(result.message, "error");
                }
            }
            catch (error){
                console.error("Network Error during section deletion:", error);
                notifyObj.notify("Network error. Please check your connection and try again.", "error");
            }
        });
    }
    cancelButton.addEventListener('click', () => {
        document.body.removeChild(modalContainer);
    })
    document.body.appendChild(modalContainer);
}

function addRow(user_id, user_fname, user_lname, user_email, user_image, role){
    const newRow = document.createElement("tr");

    // Image cell
    const imgTd = document.createElement("td");
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("user-image-cell");
    const image = document.createElement("img");
    image.classList.add("user-image-display");
    if (user_image){
        image.src = user_image;
    }
    else{
        image.src = defaultProfilePicture;
    }
    
    imageContainer.appendChild(image);
    imgTd.appendChild(imageContainer);

    // ID cell
    const idTd = document.createElement("td");
    const idInput = document.createElement("p");
    idInput.textContent = user_id;
    idTd.appendChild(idInput);

    // First Name cell
    const firstNameTd = document.createElement("td");
    const firstNameInput = document.createElement("p");
    firstNameInput.textContent = user_fname;
    firstNameTd.appendChild(firstNameInput);

    // Last Name cell
    const lastNameTd = document.createElement("td");
    const lastNameInput = document.createElement("p");
    lastNameInput.textContent = user_lname;
    lastNameTd.appendChild(lastNameInput);

    // Email cell
    const emailTd = document.createElement("td");
    const emailInput = document.createElement("p");
    emailInput.textContent = user_email;
    emailTd.append(emailInput);
    
    // Action buttons cell
    const actionTd = document.createElement("td");
    actionTd.classList.add("action-buttons");
    const actionDiv = document.createElement("div");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    editBtn.classList.add("edit-buttons")
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.classList.add("delete-buttons")
    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(deleteBtn);
    actionTd.appendChild(actionDiv);

    editBtn.addEventListener('click', () => {
        populateForm(user_image, user_id, user_fname, user_lname, user_email, role.toLowerCase());
    })

    deleteBtn.addEventListener('click', () => {
        deleteUser(user_id, user_fname, user_lname, role.toLowerCase());
    })

    // Append all cells to the row
    newRow.appendChild(imgTd);
    newRow.appendChild(idTd);
    newRow.appendChild(firstNameTd);
    newRow.appendChild(lastNameTd);
    newRow.appendChild(emailTd);
    newRow.appendChild(actionTd);
    tableBody.appendChild(newRow);
}

function populateForm(image, id, fname, lname, email, role){
    const mainForm = document.getElementById('main-form')
    const submitActionContainer = document.getElementById('submit-actions')
    const imageInput = document.getElementById('image-input');
    const imageDisplay = document.getElementById('image-display');
    const idInput = document.getElementById('id');
    const fnameInput = document.getElementById('fname');
    const lnameInput = document.getElementById('lname');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    const roleInput = document.getElementById('role');
    let originalImage = "";
    
    passwordInput.setAttribute('placeholder', "Enter Password (Optional)");

    const submitButton = document.getElementById('submit-user-button');
    const cancelButton = document.getElementById('cancel-user-button');

    cancelButton.hidden = false;
    submitButton.disabled = true;

    imageInput.accept = 'image/png, image/jpeg';

    const originalId = document.createElement("input");
    originalId.type = "text";
    originalId.value = id;
    originalId.hidden = true;
    originalId.name = "original_id";

    const originalEmail = document.createElement("input");
    originalEmail.type = "text";
    originalEmail.value = email;
    originalEmail.hidden = true;
    originalEmail.name = "original_email";

    mainForm.appendChild(originalId);
    mainForm.appendChild(originalEmail)
    mainForm.action = "modify_user";

    if (image){
        imageDisplay.src = image;
        originalImage = image;

    }
    else{
        imageDisplay.src = defaultProfilePicture;
        originalImage = defaultProfilePicture;
    }
    idInput.value = id;
    fnameInput.value = fname;
    lnameInput.value = lname;
    emailInput.value = email;
    roleInput.value = role;

    function updateSubmitButtonState() {
        const isImageSame = checkImageSame(imageInput.value, originalImage);

        const isIdSame = idInput.value == id;
        const isFnameSame = fnameInput.value == fname;
        const isLnameSame = lnameInput.value == lname;
        const isEmailSame = emailInput.value == email;
        const isRoleSame = roleInput.value == role;
        const isPasswordEmpty = passwordInput.value.length == 0;
        const allFieldsAreTheSame = isImageSame && isIdSame && isFnameSame && isLnameSame && isEmailSame && isPasswordEmpty && isRoleSame;
        
        submitButton.disabled = allFieldsAreTheSame;
    }
    
    imageInput.addEventListener('change', updateSubmitButtonState);
    roleInput.addEventListener('change', updateSubmitButtonState);
    idInput.addEventListener('input', updateSubmitButtonState);
    fnameInput.addEventListener('input', updateSubmitButtonState);
    lnameInput.addEventListener('input', updateSubmitButtonState);
    emailInput.addEventListener('input', updateSubmitButtonState);
    passwordInput.addEventListener('input', updateSubmitButtonState)

    submitButton.value = "Save";
    submitActionContainer.appendChild(cancelButton);

    cancelButton.addEventListener('click', () => {
        mainForm.removeChild(originalId);
        mainForm.removeChild(originalEmail)
        passwordInput.setAttribute('placeholder', "Enter Password");
        document.querySelectorAll(".edit-buttons").forEach(element => {
            element.removeEventListener('click', populateForm);
        })
        cancelModify();
    })   

    document.querySelectorAll(".edit-buttons, .delete-buttons").forEach(element => {
        element.disabled = true;
    })

}

function cancelModify(){
    const cancelButton = document.getElementById("cancel-user-button");
    const submitButton = document.getElementById("submit-user-button");
    submitButton.value = "Submit";
    submitButton.disabled = false;
    cancelButton.hidden = true;
    document.querySelector("form").reset();
    document.querySelectorAll(".edit-buttons, .delete-buttons").forEach(element => {
        element.disabled = false;
    })
    imageDisplay.src = defaultProfilePicture; 
    submitButton.textContent = "Submit";
    mainForm.action = '/register'
}

function deleteUser(id, firstName, lastName, role){
    const formContainer = document.createElement('form');
    const inputContainer = document.createElement('div');
    const submitButton = document.createElement('input');
    const cancelButton = document.createElement('input');
    const buttonContainer = document.createElement('aside');
    const statement = document.createElement('p');
    const idInput = document.createElement('input');
    const roleInput = document.createElement('input');

    idInput.type = 'text';
    idInput.value = id;
    idInput.hidden = true;
    idInput.name = 'id';
    roleInput.type = 'text';
    roleInput.value = role;
    roleInput.hidden = true;
    roleInput.name = 'role';

    formContainer.action = '/delete_user';
    formContainer.method = 'POST';
    formContainer.setAttribute('id', 'delete-form');

    inputContainer.setAttribute('id', 'delete-input-container');

    submitButton.type = 'submit';
    submitButton.value = 'Yes';
    cancelButton.type = 'button';
    cancelButton.value = "No";
    statement.textContent = `Are you sure you want to permanently remove user "${firstName} ${lastName}"?`;

    cancelButton.addEventListener('click', () => {
        if (formContainer.parentNode) {
            formContainer.parentNode.removeChild(formContainer);
        }
    })

    buttonContainer.style.display = "flex";
    buttonContainer.append(submitButton, cancelButton);
    inputContainer.append(statement, buttonContainer);
    formContainer.append(inputContainer, idInput, roleInput);
    document.body.appendChild(formContainer)

    formContainer.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formBody = e.target;
        const formData = new FormData(formBody);

        try{
            const response = await fetch('/delete_user', {
                method: "POST",
                body: formData
            });
    
            const result = await response.json();
    
            if (response.ok && result.status){
                formBody.remove();
                notifyObj.notify(result.message, "success");
                if (currentTab === "student"){
                    await showRecords('/students');
                }
                else if (currentTab === "teacher"){
                    await showRecords('/teachers');
                }
                else if (currentTab === "admin"){
                    await showRecords('/admins');
                }
            }
            else{
                const message = result.message || "Failed to delete user. Please try again.";
                notifyObj.notify(message, "error");
                console.error("Server Error:", response);
            }
        }
        catch (error){
            console.error("Network Error during user deletion:", error);
            notifyObj.notify("Network error. Please check your connection and try again.", "error");
        }
    })
}

function checkImageSame(inputtedImage, originalImage){
    if (inputtedImage.trim().length === 0 || originalImage == null){
        return true
    }
    else{
        const cleanInputtedImage = inputtedImage.split("\\").pop();
        const cleanOriginalImage = originalImage.split("/").pop();
    
        return cleanInputtedImage == cleanOriginalImage;
    }
}

function moveAdminInfo(){
    if (window.innerWidth <= 936 && !isInMainSection) {
        mainSection.insertBefore(adminInfo, mainSection.firstChild);
        isInMainSection = true;
    } else if (window.innerWidth > 936 && isInMainSection) {
        mainAside.insertBefore(adminInfo, mainAside.firstChild);
        isInMainSection = false;
    }
    
}

window.addEventListener("load", async function() {
    const id = await decrypt(sessionStorage.getItem("id"))

    const url = `/user/${id}`;

    try{
        const response = await fetch(url, {
            credentials: 'same-origin',
            cache: 'no-cache'
        });
        const result = await response.json();
        if (response.ok && result.status){
            sessionStorage.setItem("fullName", await encrypt(result.data[0].fullName));
    
            const adminName = document.getElementById('admin_name')
            const adminPicture = document.getElementById('admin_picture')
    
            adminName.textContent = await decrypt(sessionStorage.getItem("fullName"))
            if (result.data[0].image){
                sessionStorage.setItem("image", await encrypt(result.data[0].image))
                adminPicture.src = await decrypt(sessionStorage.getItem("image"))
            }
            else{
                sessionStorage.setItem("image", await encrypt(defaultProfilePicture))
                adminPicture.src = await decrypt(sessionStorage.getItem("image"))
            }
    
        }
        else{
            console.log(result.message)
            notifyObj.notify("User details can't be retrieved at the moment. Please try again.", "error")
        
        }

    }
    catch (error){
        console.error("Network Error during user deletion:", error);
        notifyObj.notify("Network error. Please check your connection and try again.", "error");
    }

    await showRecords('/students')
});

function displayRecordSection(tab){
    if (tab == "section"){
        userRecord.style.display = "none";
        sectionRecord.style.display = "flex";
    }
    else{
        userRecord.style.display = "flex";
        sectionRecord.style.display = "none";
    }

}

async function loadSectionOptions(){
    const response = await fetch('/sections');
    const result = await response.json();

    try{

        if (response.ok && result.status){
            console.log(result.data);
            const selectSection = document.getElementById('section');
            const sectionFilter = document.getElementById('section-filter');
            result.data.forEach(section => {
                const option = document.createElement('option');
                option.value = section.id;
                option.textContent = `${section.name} - Grade ${section.grade}`;
                selectSection.appendChild(option);
                sectionFilter.appendChild(option.cloneNode(true));
            });
    
    
        }
    }
    catch (error){
        notifyObj.notify("Network Error while fetching sections:", error);
    }
};

moveAdminInfo();
await loadSectionOptions()