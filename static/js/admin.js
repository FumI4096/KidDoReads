const profileButton = document.getElementById("profileButton");
const sideBar = document.getElementById("sideBar");
const closeProfileButton = document.getElementById("closeProfileButton");
const logOutButton = document.getElementById("logOutButton");
const tableBody = document.querySelector("tbody");
const formBody = document.querySelector("form")
const imageInput = document.getElementById('image-input')
const imageDisplay = document.getElementById('image-display')
const studentDisplayButton = document.getElementById('student-record-button')
const teacherDisplayButton = document.getElementById('teacher-record-button')
const filterOptions = document.getElementById('filter')
let currentTab = "student"
const defaultProfilePicture = "../static/images/default_profile_picture.png"

studentDisplayButton.disabled = true;

studentDisplayButton.addEventListener('click', () => {
    currentTab = "student"
    showRecords('/students')
    filterOptions.value = "default"
    studentDisplayButton.disabled = true
    teacherDisplayButton.disabled = false
})

teacherDisplayButton.addEventListener('click', () => {
    currentTab = "teacher"
    showRecords('/teachers')
    filterOptions.value = "default"
    studentDisplayButton.disabled = false
    teacherDisplayButton.disabled = true
})

imageInput.addEventListener('change', defaultImageChanger);

function defaultImageChanger(event){
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    }

document.getElementById("main-form").addEventListener("submit", async (e) => {
    e.preventDefault()

    const formBody = e.target;
    const actionUrl = formBody.action;
    const formData = new FormData(formBody);

    const response = await fetch(actionUrl, {
        method: "POST",
        body: formData
    });

    const result = await response.json()

    if (result.status){
        //notification here
        alert(result.message)
        formBody.reset()
        formBody.action = '/register'

        const submitButton = document.getElementById('submit-user-button');
        const cancelButton = document.getElementById('cancel-user-button');
        cancelButton.hidden = true;
        submitButton.value = "Submit"
        
        if (currentTab == "student"){
            showRecords('/students')
        }
        else if (currentTab == "teacher"){
            showRecords('/teachers')
        }

    }
    else{
        if (result.errors){
            result.errors.forEach(error => {
                alert("Error: " + error)
            })
            return
        }
        alert("Error: " + result.message)
    }
})

document.getElementById("filter").addEventListener("change", async (e) => {
    const filterValue = e.target.value;
    const role = currentTab

    const url = `/filter_record/${role}/${filterValue}`

    const response = await fetch(url)

    const result = await response.json()

    if (result.status){
        tableBody.innerHTML = ""
        result.data.forEach(data => {
            addRow(data.id, data.fname, data.lname, data.email, data.image, data.role)
        })
    }
    else{
        alert("Error: " + result.message)
    }
})

async function showRecords(apiRoute){
    const response = await fetch(apiRoute)
    const result = await response.json()

    tableBody.innerHTML = ""

    if (result.status){
        result.data.forEach(data => {
            addRow(data.id, data.fname, data.lname, data.email, data.image, data.role)
        })

    }
    else{
        alert("Error: " + result.message)
    }

}

function addRow(user_id, user_fname, user_lname, user_email, user_image, role){
    const newRow = document.createElement("tr");

    // Image cell
    const imgTd = document.createElement("td");
    const image = document.createElement("img");
    imgTd.classList.add("user-image-cell");
    image.classList.add("user-image-display");
    if (user_image){
        image.src = user_image;
    }
    else{
        image.src = defaultProfilePicture;
    }

    imgTd.appendChild(image);

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
        populateForm(user_image, user_id, user_fname, user_lname, user_email, role.toLowerCase())
    })

    deleteBtn.addEventListener('click', () => {
        deleteUser(user_id, role.toLowerCase())
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
    const imageInput = document.getElementById('image-display');
    const idInput = document.getElementById('id');
    const fnameInput = document.getElementById('fname');
    const lnameInput = document.getElementById('lname');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');

    const submitButton = document.getElementById('submit-user-button')
    const cancelButton = document.getElementById('cancel-user-button')

    cancelButton.hidden = false
    submitButton.disabled = true;

    const originalId = document.createElement("input");
    originalId.type = "text"
    originalId.value = id;
    originalId.hidden = true;
    originalId.name = "original_id"

    mainForm.appendChild(originalId)
    mainForm.action = "modify_user";

    if (image){
        imageInput.src = image;
    }
    else{
        imageInput.src = defaultProfilePicture;
    }
    idInput.value = id;
    fnameInput.value = fname;
    lnameInput.value = lname;
    emailInput.value = email;
    roleInput.value = role;

    function updateSubmitButtonState() {
        const isImageSame = checkImageSame(imageInput.value, image)

        const isIdSame = idInput.value == id;
        const isFnameSame = fnameInput.value == fname;
        const isLnameSame = lnameInput.value == lname;
        const isEmailSame = emailInput.value == email;
        const allFieldsAreTheSame = isImageSame && isIdSame && isFnameSame && isLnameSame && isEmailSame;
        
        submitButton.disabled = allFieldsAreTheSame;
    }

    imageInput.addEventListener('change', updateSubmitButtonState)
    idInput.addEventListener('input', updateSubmitButtonState);
    fnameInput.addEventListener('input', updateSubmitButtonState);
    lnameInput.addEventListener('input', updateSubmitButtonState);
    emailInput.addEventListener('input', updateSubmitButtonState);

    submitButton.value = "Save";
    submitActionContainer.appendChild(cancelButton)

    cancelButton.addEventListener('click', () => {
        mainForm.removeChild(originalId)
        document.querySelectorAll(".edit-buttons").forEach(element => {
            element.removeEventListener('click', populateForm)
        })
        cancelModify()
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
}

function deleteUser(id, role){
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
    statement.textContent = `Are you sure you want to delete user ${id}`;


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

        const response = await fetch('/delete_user', {
            method: "POST",
            body: formData
        });

        const result = await response.json()

        if (result.status){
            formBody.remove();
            alert(result.message)
            if (currentTab == "student"){
                showRecords('/students')
            }
            else if (currentTab == "teacher"){
                showRecords('/teachers')
            }
        }
        else{
            alert("Error: " + result.message)
        }
    })
}

function checkImageSame(inputtedImage, originalImage){
    const cleanInputtedImage = inputtedImage.split("\\").pop();
    const cleanOriginalImage = originalImage.split("/").pop();

    return cleanInputtedImage == cleanOriginalImage
}

showRecords('/students')