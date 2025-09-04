// Get references to the show/hide password icons and the password input field
const showPasswordButton = document.getElementById('showPasswordButton');
const unshowPasswordButton = document.getElementById('unshowPasswordButton');
const passwordInput = document.querySelector('input[type="password"]');
const loginForm = document.getElementById('login-form')

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

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()

    const formData = new FormData(e.target)

    const response = await fetch('/login', {
        method: "POST",
        body: formData
    })

    const result = await response.json()

    if (result.status){
        window.location.href = result.redirectUrl
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

