// Get references to sidebar buttons and container
const profileButton = document.getElementById("profileButton");
const sideBar = document.getElementById("sideBar");
const closeProfileButton = document.getElementById("closeProfileButton");
const logOutButton = document.getElementById("logOutButton");
const tableBody = document.querySelector("tbody");
const addRowButton = document.getElementById("addRowButton");

addRowButton.addEventListener("click", addRow); // Add event listener to add row button

// Handle sidebar open action
profileButton.addEventListener("click", () => {
    sideBar.style.width = "400px";                      // Expand sidebar
    profileButton.style.display = "none";               // Hide profile button
    closeProfileButton.style.display = "block";         // Show close button
    closeProfileButton.style.alignSelf = "end";         // Align close button to end
    logOutButton.style.alignSelf = "start";             // Align logout button to start
});

// Handle sidebar close action
closeProfileButton.addEventListener("click", () => {
    sideBar.style.width = "3%";                         // Collapse sidebar
    profileButton.style.display = "block";              // Show profile button
    closeProfileButton.style.display = "none";          // Hide close button
    logOutButton.style.alignSelf = "center";            // Center logout button
});

function addRow(){
    const newRow = document.createElement("tr");

    // Image upload cell
    const imgTd = document.createElement("td");
    imgTd.className = "uploadImageData";
    const label = document.createElement("label");
    label.htmlFor = "picUpload";
    label.textContent = "Your Image File";
    const inputFile = document.createElement("input");
    inputFile.type = "file";
    inputFile.id = "picUpload";
    inputFile.name = "myImage";
    inputFile.accept = "image/png, image/jpeg";
    inputFile.hidden = true;
    label.appendChild(inputFile);
    imgTd.appendChild(label);

    // ID cell
    const idTd = document.createElement("td");
    const idInput = document.createElement("input");
    idInput.type = "text";
    idInput.placeholder = "Enter ID";
    idTd.appendChild(idInput);

    // Name cell
    const nameTd = document.createElement("td");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "Enter Name";
    nameTd.appendChild(nameInput);

    // Email cell
    const emailTd = document.createElement("td");
    const emailInput = document.createElement("input");
    emailInput.type = "text";
    emailInput.placeholder = "Enter Email";
    emailTd.appendChild(emailInput);

    // Action buttons cell
    const actionTd = document.createElement("td");
    actionTd.className = "actionButtons";
    const actionDiv = document.createElement("div");
    const editBtn = document.createElement("button");
    editBtn.textContent = "Edit";
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    actionDiv.appendChild(editBtn);
    actionDiv.appendChild(deleteBtn);
    actionTd.appendChild(actionDiv);

    // Append all cells to the row
    newRow.appendChild(imgTd);
    newRow.appendChild(idTd);
    newRow.appendChild(nameTd);
    newRow.appendChild(emailTd);
    newRow.appendChild(actionTd);

    tableBody.appendChild(newRow);

    tableBody.appendChild(newRow);
}