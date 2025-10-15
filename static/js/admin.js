import Notification from './modules/Notification.js'

const mainForm = document.getElementById('main-form')
const tableBody = document.querySelector("tbody");
const imageInput = document.getElementById('image-input');
const imageDisplay = document.getElementById('image-display');
const studentDisplayButton = document.getElementById('student-record-button');
const teacherDisplayButton = document.getElementById('teacher-record-button');
const adminDisplayButton = document.getElementById('admin-record-button');
const showPasswordButton = document.getElementById('showPasswordButton');
const unshowPasswordButton = document.getElementById('unshowPasswordButton');
const logOutButton = document.getElementById('log-out-button');
const inputPassword = document.getElementById('password');
const filterOptions = document.getElementById('filter');
const mainAside = document.querySelector('main > aside');
const mainSection = document.querySelector('main > section > div');
const adminInfo = document.getElementById('admin-info');
const defaultProfilePicture = "../static/images/default_profile_picture.png";
let currentTab = "student";
let isInMainSection = false;

studentDisplayButton.disabled = true;
studentDisplayButton.style.pointerEvents = 'none';

const notifyObj = new Notification();

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

logOutButton.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/logout'
})

studentDisplayButton.addEventListener('click', () => {
    currentTab = "student";
    showRecords('/students');
    filterOptions.value = "default";
    studentDisplayButton.disabled = true;
    studentDisplayButton.style.pointerEvents = 'none';
    studentDisplayButton.classList.add('toggle-user');
    teacherDisplayButton.style.pointerEvents = 'auto';
    teacherDisplayButton.classList.remove('toggle-user');
    adminDisplayButton.style.pointerEvents = 'auto';
    adminDisplayButton.classList.remove('toggle-user');
})

teacherDisplayButton.addEventListener('click', () => {
    currentTab = "teacher";
    showRecords('/teachers');
    filterOptions.value = "default";
    teacherDisplayButton.disabled = true;
    teacherDisplayButton.style.pointerEvents = 'none';
    teacherDisplayButton.classList.add('toggle-user');
    studentDisplayButton.style.pointerEvents = 'auto';
    studentDisplayButton.classList.remove('toggle-user');
    adminDisplayButton.style.pointerEvents = 'auto';
    adminDisplayButton.classList.remove('toggle-user');
})

adminDisplayButton.addEventListener('click', () => {
    currentTab = "admin";
    showRecords('/admins');
    filterOptions.value = "default";
    adminDisplayButton.disabled = true;
    adminDisplayButton.style.pointerEvents = 'none';
    adminDisplayButton.classList.add('toggle-user');
    studentDisplayButton.style.pointerEvents = 'auto';
    studentDisplayButton.classList.remove('toggle-user');
    teacherDisplayButton.style.pointerEvents = 'auto';
    teacherDisplayButton.classList.remove('toggle-user');
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
                showRecords('/students');
            }
            else if (currentTab === "teacher"){
                showRecords('/teachers');
            }
            else if (currentTab === "admin"){
                showRecords('/admins');
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

document.getElementById("filter").addEventListener("change", async (e) => {
    const filterValue = e.target.value;
    const role = currentTab;
    const url = `/filter_record/${role}/${filterValue}`;

    try{
        const response = await fetch(url);
        const result = await response.json();
    
        if (result.status){
            tableBody.innerHTML = "";
            result.data.forEach(data => {
                addRow(data.id, data.fname, data.lname, data.email, data.image, data.role);
            })
        }
        else{
            notifyObj.notify(result.message, "error");
        }

    }
    catch (error){
        console.error("Network Error while filtering records:", error);
        notifyObj.notify("Network error. Please try again later.", "error");
    }
})

async function showRecords(apiRoute){
    try{
        const response = await fetch(apiRoute)
        const result = await response.json();
    
        tableBody.innerHTML = ""
    
        if (result.status){
            result.data.forEach(data => {
                addRow(data.id, data.fname, data.lname, data.email, data.image, data.role);
            })
    
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
                    showRecords('/students');
                }
                else if (currentTab === "teacher"){
                    showRecords('/teachers');
                }
                else if (currentTab === "admin"){
                    showRecords('/admins');
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

document.addEventListener("DOMContentLoaded", async function() {
    const id = localStorage.getItem("id")

    const url = `/user/${id}`;

    try{
        const response = await fetch(url);
        const user = await response.json();
        if (user.status){
            localStorage.setItem("fullName", user.data[0].fullName);
    
            const adminName = document.getElementById('admin_name')
            const adminPicture = document.getElementById('admin_picture')
    
            adminName.textContent = localStorage.getItem("fullName")
            if (user.data[0].image){
                localStorage.setItem("image", user.data[0].image)
                adminPicture.src = localStorage.getItem("image")
            }
            else{
                localStorage.setItem("image", defaultProfilePicture)
                adminPicture.src = localStorage.getItem("image")
            }
    
        }

    }
    catch (error){
        console.error("Network Error during user deletion:", error);
        notifyObj.notify("Network error. Please check your connection and try again.", "error");
    }

});

moveAdminInfo();
showRecords('/students')