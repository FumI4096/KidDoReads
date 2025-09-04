// Set the default current tab to Grade 2
let currentTab = 2;

// Get references to grade navigation elements
const twoNav = document.getElementById("twoNav");
const threeNav = document.getElementById("threeNav");
const fourNav = document.getElementById("fourNav");

// Get references to sidebar buttons and container
const profileButton = document.getElementById("profileButton");
const sideBar = document.getElementById("sideBar");
const closeProfileButton = document.getElementById("closeProfileButton");
const logOutButton = document.getElementById("logOutButton");

// Get references to main content area and add content button
const mainHome = document.getElementById("mainHome");
const contents = document.getElementById("contents");
const addContentButton = document.getElementById("addContentButton");

// Set up tab switching event listeners
twoNav.addEventListener("click", () => changeTab(2));
threeNav.addEventListener("click", () => changeTab(3));
fourNav.addEventListener("click", () => changeTab(4));

// Handle click to add content
addContentButton.addEventListener("click", () => testContent());

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

// Function to change the current tab
function changeTab(tab){
    // Future logic for displaying different sections can be added here
    switch(tab){
        case 2:
        case 3:
        case 4:
            currentTab = tab;
            console.log(currentTab); // Debug: Log current tab
            break;
    }
}

// Function to dynamically create a content creation form
function testContent(){
    // Create background overlay
    const contentBackground = document.createElement("div");
    contentBackground.classList.add("contentBackground");

    // Create close button for content form
    const closeContentButton = document.createElement("ion-icon");
    closeContentButton.name = "close-outline";
    closeContentButton.classList.add("closeContentButton");

    // Create content form container
    const createContent = document.createElement("div");
    createContent.classList.add("createContent");

    // Create input for content title
    const contentTitle = document.createElement("input");
    contentTitle.classList.add("contentTitle");
    contentTitle.type = "text";
    contentTitle.placeholder = "Enter Content Title";

    // Create submit button
    const submitContent = document.createElement("button");
    submitContent.innerHTML = "Create Content";
    submitContent.classList.add("submitContent");

    // Add close button and title input to content form
    createContent.appendChild(closeContentButton);
    createContent.appendChild(contentTitle);
    contentBackground.appendChild(createContent);

    // Add radio button selection for content types
    const contentStatement = document.createElement("p");
    contentStatement.innerHTML = "Select the type of content you want to create:";

    const contentTypeContainer = document.createElement("div");
    contentTypeContainer.classList.add("contentTypeContainer");
    contentTypeContainer.appendChild(contentStatement);

    // List of content types
    const contentTypes = ["Quiz", "Spelling Game", "Storytelling"];
    contentTypes.forEach(type => {
        const labelRadio = document.createElement("label");
        labelRadio.style.display = "flex";
        labelRadio.style.alignItems = "center";
        labelRadio.style.gap = "0.5rem";

        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "contentType";
        radio.value = type.toLowerCase();

        const customSpan = document.createElement("span");

        // Append radio button and label
        labelRadio.appendChild(radio);
        labelRadio.appendChild(customSpan);
        labelRadio.appendChild(document.createTextNode(type));
        contentTypeContainer.appendChild(labelRadio);
    });

    // Finalize form structure
    createContent.appendChild(contentTypeContainer);
    createContent.appendChild(submitContent);
    document.body.appendChild(contentBackground);

    // Close content form when close icon is clicked
    closeContentButton.addEventListener("click", () => {
        contentBackground.style.display = "none";
    });
}

// Optional function for adding simple "test" content to the page
function addContent(){
    contents.removeChild(addContentButton); // Temporarily remove button to insert new content
    const newContent = document.createElement("div");
    const testElement = document.createElement("p");
    testElement.innerHTML = "test";
    newContent.classList.add("content");
    newContent.appendChild(testElement);
    contents.appendChild(newContent);
    contents.appendChild(addContentButton); // Re-add button
}
