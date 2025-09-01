// Get references to sidebar buttons and container
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

const defaultProfilePicture = "../static/images/default_profile_picture.png"

studentDisplayButton.addEventListener('click', () => {
    getStudentRecord()
    studentDisplayButton.disabled = true
    teacherDisplayButton.disabled = false
})

teacherDisplayButton.addEventListener('click', () => {
    getTeacherRecord()
    studentDisplayButton.disabled = false
    teacherDisplayButton.disabled = true
})

imageInput.addEventListener('change', (event) => {
    console.log("hehe")
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageDisplay.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    else{
        imageDisplay.src = defaultProfilePicture;
    }
    
});

document.querySelector("form").addEventListener("submit", async (e) => {
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
        prompt(result.message)
        formBody.reset()

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

// Handle sidebar open action
profileButton.addEventListener("click", () => {
    sideBar.style.width = "400px";                      
    profileButton.style.display = "none";               
    closeProfileButton.style.display = "block";         
    closeProfileButton.style.alignSelf = "end";         
    logOutButton.style.alignSelf = "start";             
});

// Handle sidebar close action
closeProfileButton.addEventListener("click", () => {
    sideBar.style.width = "3%";                         
    profileButton.style.display = "block";              
    closeProfileButton.style.display = "none";          
    logOutButton.style.alignSelf = "center";            
});

async function getStudentRecord(){
    const response = await fetch('/students')
    const result = await response.json()

    tableBody.innerHTML = ""

    if (result.status){
        result.data.forEach(student => {
            addRow(student.id, student.fname, student.lname, student.email, student.image, student.role)
        })
    }
    else{
        alert("Error: " + result.message)
    }

}

async function getTeacherRecord(){
    const response = await fetch('/teachers')
    const result = await response.json()

    tableBody.innerHTML = ""

    if (result.status){
        result.data.forEach(teacher => {
            addRow(teacher.id, teacher.fname, teacher.lname, teacher.email, teacher.image, teacher.role)

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
    const mainForm = document.querySelector('form')
    const submitActionContainer = document.getElementById('submit-actions')
    const imageInput = document.getElementById('image-display');
    const idInput = document.getElementById('id');
    const fnameInput = document.getElementById('fname');
    const lnameInput = document.getElementById('lname');
    const emailInput = document.getElementById('email');
    const roleInput = document.getElementById('role');

    const submitButton = document.getElementById('submit-user-button')

    const originalId = document.createElement("input");
    originalId.type = "text"
    originalId.value = id;
    originalId.hidden = true;
    originalId.name = "original_id"

    mainForm.appendChild(originalId)

    mainForm.action = "modify_user";

    imageInput.src = image;
    idInput.value = id;
    fnameInput.value = fname;
    lnameInput.value = lname;
    emailInput.value = email;
    roleInput.value = role;

    submitButton.value = "Save";

    const cancelButton = document.createElement("button")
    cancelButton.textContent = "Cancel"
    cancelButton.setAttribute('id', "cancel-user-button")

    submitActionContainer.appendChild(cancelButton)

    cancelButton.addEventListener('click', () => {
        cancelModify()
    })   

    document.querySelectorAll(".edit-buttons, .delete-buttons").forEach(element => {
        element.disabled = true;
    })

}

function cancelModify(){
    const submitActionContainer = document.getElementById('submit-actions');
    const cancelButton = document.getElementById("cancel-user-button");
    const submitButton = document.getElementById("submit-user-button");

    submitActionContainer.removeChild(cancelButton);
    document.querySelector("form").reset();

    document.querySelectorAll(".edit-buttons, .delete-buttons").forEach(element => {
        element.disabled = false;
    })

    imageDisplay.src = defaultProfilePicture; 
    submitButton.textContent = "Submit";


}

getStudentRecord()