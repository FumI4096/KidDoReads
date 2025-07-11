// Get references to sidebar buttons and container
const profileButton = document.getElementById("profileButton");
const sideBar = document.getElementById("sideBar");
const closeProfileButton = document.getElementById("closeProfileButton");
const logOutButton = document.getElementById("logOutButton");

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