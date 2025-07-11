// Get references to the show/hide password icons and the password input field
const showPasswordButton = document.getElementById('showPasswordButton');
const unshowPasswordButton = document.getElementById('unshowPasswordButton');
const passwordInput = document.querySelector('input[type="password"]');

// Event listener to show password (eye icon clicked)
showPasswordButton.addEventListener('click', () => 
    displayEyePassword(showPasswordButton, unshowPasswordButton, true)
);

// Event listener to hide password (eye-off icon clicked)
unshowPasswordButton.addEventListener('click', () => 
    displayEyePassword(unshowPasswordButton, showPasswordButton, false)
);

// Toggle the visibility of the password input field
function displayEyePassword(element1, element2, showPassword){
    element1.style.display = "none";
    element2.style.display = "block";

    passwordInput.type = showPassword ? "text" : "password";

}