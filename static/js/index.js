import Notification from './modules/Notification.js'
import { encrypt } from './modules/SessionHandling.js'

const showPasswordButton = document.getElementById('showPasswordButton');
const unshowPasswordButton = document.getElementById('unshowPasswordButton');
const passwordInput = document.querySelector('input[type="password"]');
const loginForm = document.getElementById('login-form')

const notifyObj = new Notification()

showPasswordButton.addEventListener('click', () => 
    displayEyePassword(showPasswordButton, unshowPasswordButton, true)
);

unshowPasswordButton.addEventListener('click', () => 
    displayEyePassword(unshowPasswordButton, showPasswordButton, false)
);

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

    try{

        if (response.ok && result.status){
            const encryptedId = await encrypt(result.id)
            sessionStorage.setItem("id", encryptedId);
            if(result.role === "student" || result.role === "teacher"){
                const encryptedRole = await encrypt(result.role)
                sessionStorage.setItem("role", encryptedRole)
            }
            window.location.href = result.redirectUrl
        }
        else{
            if (result.errors){
                result.errors.forEach(error => {
                    notifyObj.notify(error, "error")
                })
                return
            }
            notifyObj.notify(result.message, "error")
        }
    }
    catch (error){
        console.log(error.message)
    }
    

})

