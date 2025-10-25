const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const questionInput = document.getElementById("question")
const choicesContainer = document.getElementById("choices-container")
const answerContainer = document.getElementById("answer-container")
const saveButton = document.getElementById("save-button")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const editButton = document.getElementById("edit-button")
let removeMode = false
let disableSaveButton = false
let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
let currentQuestion = 0
let originalChoiceElements = []
let originalAnswerElements = []

const teacherId = sessionStorage.getItem("id")
const contentId = sessionStorage.getItem("currentActivityId")
const currentTitle = sessionStorage.getItem("currentActivityTitle")

displayActivityTitle.textContent = `Title: ${currentTitle}`
toTeacherPageButton.addEventListener('click', () => {
    sessionStorage.removeItem('originalActivityTitle')
    sessionStorage.removeItem('questions')
    sessionStorage.removeItem('currentActivityId')
    sessionStorage.removeItem('currentActivityTitle')
    window.location.href = '/teacher_dashboard'
});

saveButton.addEventListener("click", saveCurrentQuestion)
editButton.addEventListener("click", setFormToEditMode)
nextButton.addEventListener("click", nextForm)
previousButton.addEventListener("click", previousForm)
document.addEventListener("input", () => {
    checkInputState();
});

if (firstQuestionExist(questionObject.length)) {
    loadQuestion(0);
    questionInput.readOnly = true;
    answerRadioButtonsDisable(true)
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });
    editButton.style.display = "inline"
    previousButton.disabled = true
    saveButton.style.display = "none"
} else {
    clearForm();
    editButton.style.display = "none"
    saveButton.style.display = "inline"
    nextButton.disabled = true
    previousButton.disabled = true
    saveButton.disabled = true
}


//check if some inputs are filled or missing
function checkInputState() {
    const getQuestion = questionInput.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked')
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");

    if (getQuestion && getAnswer && !hasEmptyChoice) {
        saveButton.disabled = false;
    } else {
        saveButton.disabled = true;
    }
}

function setFormToViewMode() {
    saveButton.style.display = "none"
    editButton.style.display = "inline"
    nextButton.disabled = false; 
    answerRadioButtonsDisable(true)
    questionInput.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });

    if(currentQuestion === 0){
        previousButton.disabled = true;
    }
    else{
        previousButton.disabled = false;
    } 

    if(removeMode){
        removeMode = false
    }
}

function setFormToEditMode() {
    saveButton.style.display = "inline"
    editButton.style.display = "none"
    checkInputState()
    questionInput.readOnly = false;
    answerRadioButtonsDisable(false)
    nextButton.disabled = true;

    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = false;
    });

    if (editButton.style.display === "none" && currentQuestion === questionObject.length - 1){
        previousButton.disabled = true;
    }
}

async function saveCurrentQuestion(e){
    e.preventDefault()

    const getQuestion = questionInput.value
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice")
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked')
    const getAnswer = checkedRadioButton.value ? checkedRadioButton.value : null
    var noQuestion = false
    var noChoices = false
    var noAnswer = false

    if (getQuestion === ""){
        noQuestion = true
    }

    const currentChoices = []
    
    for(let i = 0; i < getChoices.length; i++){
        if (getChoices[i].value.trim() === ""){
            noChoices = true
            break
        }
        currentChoices.push(getChoices[i].value.trim())
    }

    if (getAnswer === null){
        noAnswer = true
    }

    if (noQuestion || noChoices || noAnswer){
        console.log("Please put the valid requirements")
    }

    const newQuestion = {
        question: getQuestion,
        choices: currentChoices,
        answer: getAnswer
    };

    questionExist = Boolean(questionObject[currentQuestion])

    if(JSON.stringify(newQuestion) === JSON.stringify(questionObject[currentQuestion])){
        setFormToViewMode()
        return;
    }

    if (questionExist){
        console.log("Question Exist")
        questionObject[currentQuestion] = newQuestion;
    }
    else{
        questionObject.push(newQuestion);
        currentQuestion = questionObject.length - 1;

    }

    sessionStorage.setItem("questions", JSON.stringify(questionObject))

    const formData = new FormData()
    formData.append('content', sessionStorage.getItem("questions"))
    formData.append('id', teacherId)
    formData.append('content_id', contentId)
    formData.append('total_questions', questionObject.length)

    const response = await fetch('/update_content', {
        method: 'POST',
        body: formData,
    });

    const result = await response.json()      
    try{
        if (response.ok && result.status) {
            console.log(result.message);
        } 
        else {
            console.log("Error saving content:", result.message);
        }

    }
    catch (error){
        console.error(error);
    } 

    setFormToViewMode()

    console.log("Currently on Question:", currentQuestion + 1);
}

function clearForm(){
    questionInput.value = ""
    const choices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedAnswer = document.querySelector('input[name="answer"]:checked');

    choices.forEach(choice => choice.value = "");

    if (checkedAnswer) {
        checkedAnswer.checked = false;
    }

}

function nextForm(){
    questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
    previousButton.style.display = "inline"
    previousButton.disabled = false
    if (currentQuestion < questionObject.length - 1) {
        currentQuestion++
        console.log("Next Question: " + currentQuestion)
        loadQuestion(currentQuestion)
        
    } else {
        clearForm();
        currentQuestion = questionObject.length; 
        console.log("Ready to create Question:", currentQuestion + 1);
        setFormToEditMode()
    }
    
}

function previousForm() {
    if (currentQuestion > 0) {
        currentQuestion--
        if (currentQuestion + 1 == 1){
            checkInputState()
        }
        loadQuestion(currentQuestion);
        setFormToViewMode()
    }
}

function loadQuestion(index) {
    if (index < 0 || index >= questionObject.length) {
        console.log("Invalid index");
        return;
    }

    const answerHeader = document.createElement("h3")
    answerHeader.textContent = "Choose an Answer:"
    const answerOptions = document.createElement("div")
    answerOptions.className = "answer-options"
    
    const questionData = questionObject[index];
    questionInput.value = questionData.question;

    const choicesContainer = document.querySelector(".choices-container");
    choicesContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    answerContainer.appendChild(answerHeader)

    const choiceLetters = ['A', 'B', 'C', 'D'];
    questionData.choices.forEach((choiceText, i) => {
        const choiceBox = document.createElement('div');
        choiceBox.className = 'choice-box';

        const choiceLetter = document.createElement('p');
        choiceLetter.className = 'choice-letter';
        choiceLetter.textContent = choiceLetters[i] + ".";

        const choiceInput = document.createElement('input');
        choiceInput.className = 'choice';
        choiceInput.type = 'text';
        choiceInput.placeholder = 'Enter a choice';
        choiceInput.value = choiceText; 
        choiceBox.appendChild(choiceLetter);
        choiceBox.appendChild(choiceInput);
        choicesContainer.appendChild(choiceBox);

        const answerRadioButton = document.createElement("input")
        const answerLabel = document.createElement("label")

        answerRadioButton.type = "radio"
        answerRadioButton.setAttribute("id", choiceLetters[i].toLowerCase())
        answerRadioButton.name = "answer"
        answerRadioButton.value = choiceLetters[i].toLowerCase()

        answerLabel.textContent = choiceLetters[i]
        answerLabel.setAttribute('for', choiceLetters[i].toLowerCase())

        if (questionData.answer === choiceLetters[i].toLowerCase()){
            answerRadioButton.checked = true;
        } 

        answerOptions.append(answerRadioButton, answerLabel)
    });

    answerContainer.appendChild(answerOptions)

    currentQuestion = index; 
}

function answerRadioButtonsDisable(state){
    const radioButtons = answerContainer.querySelectorAll('input')
    radioButtons.forEach(element => {
        element.disabled = state
    })
}

function firstQuestionExist(length){
    if (length > 0){
        return true
    }
    else{
        return false
    }
}

