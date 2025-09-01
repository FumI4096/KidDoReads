const addChoiceButton = document.getElementById("add-choice-button")
const removeChoiceButton = document.getElementById("remove-choice-button")
const choicesContainer = document.querySelector(".choices-container")
const saveButton = document.getElementById("save-button")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const editButton = document.getElementById("edit-button")
let removeMode = false
let disableSaveButton = false
let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
let currentQuestion = 0

addChoiceButton.addEventListener("click", addChoice)
removeChoiceButton.addEventListener("click", removeChoice)
choicesContainer.addEventListener("click", (e) => {
    if (removeMode && e.target.closest(".choice-box") && choicesContainer.querySelectorAll(".choice-box").length != 2) {
        e.target.closest(".choice-box").remove();
        relabelChoices();
    }
    checkInputState()
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
    document.querySelector(".question").readOnly = true;
    document.querySelector(".answer").readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });
    addChoiceButton.disabled = true
    removeChoiceButton.disabled = true
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

function checkInputState() {
    const getQuestion = document.querySelector(".question").value.trim();
    const getAnswer = document.querySelector(".answer").value.trim();
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
    addChoiceButton.disabled = true;
    removeChoiceButton.disabled = true;
    document.querySelector(".question").readOnly = true;
    document.querySelector(".answer").readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });
    const choicesElements = choicesContainer.querySelectorAll(".choice-box")
    choicesElements.forEach(element => {
        if (removeChoiceButton.disabled == true){
            element.classList.remove("choice-box-hover")
            
        }
    });

    if(currentQuestion === 0){
        previousButton.disabled = true;
    }
    else{
        previousButton.disabled = false;
    } 
}

function setFormToEditMode() {
    saveButton.style.display = "inline"
    editButton.style.display = "none"
    checkInputState()
    document.querySelector(".question").readOnly = false;
    document.querySelector(".answer").readOnly = false;
    addChoiceButton.disabled = false;
    removeChoiceButton.disabled = false;
    nextButton.disabled = true;

    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = false;
    });

    if (editButton.style.display === "none" && currentQuestion === questionObject.length - 1){
        previousButton.disabled = true;
    }
}

function addChoice(){
    choiceCount = choicesContainer.querySelectorAll(".choice-box").length
    choiceCharacter = ''

    switch (choiceCount + 1){
        case 1:
            choiceCharacter = 'A'
            break
        case 2:
            choiceCharacter = 'B'
            break        
        case 3:
            choiceCharacter = 'C'
            break
        case 4:
            choiceCharacter = 'D'
            break
    }

    if(choiceCount != 4){
        const choiceInput = document.createElement("input")
        const choiceDiv = document.createElement("div")
        const choiceLetter = document.createElement("p")
        
        choiceLetter.classList.add("choice-letter")
        choiceLetter.textContent = choiceCharacter
        
        choiceInput.type = "text"
        choiceInput.name = choiceCharacter
        choiceInput.placeholder = "Enter a choice"
        choiceInput.classList.add("choice")
        
        choiceDiv.classList.add("choice-box")
        choiceDiv.append(choiceLetter)
        choiceDiv.append(choiceInput)
        choicesContainer.appendChild(choiceDiv)
    }
    checkInputState()

}

function removeChoice() {
    removeMode = !removeMode
    const choicesElements = choicesContainer.querySelectorAll(".choice-box")
    choicesElements.forEach(element => {
        if (removeMode){
            element.classList.add("choice-box-hover")
            addChoiceButton.disabled = true
        }
        else{
            element.classList.remove("choice-box-hover")
            addChoiceButton.disabled = false
        }
    });
    checkInputState()
}

function relabelChoices() {
    const choiceElements = choicesContainer.querySelectorAll(".choice-box");
    choiceElements.forEach((element, index) => {
        const letter = String.fromCharCode(65 + index);
        element.querySelector(".choice-letter").textContent = letter;
    });
}

function saveCurrentQuestion(){
    const getQuestion = document.querySelector(".question").value
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice")
    const getAnswer = document.querySelector(".answer").value
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

    if (getAnswer === ""){
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
    setFormToViewMode()

    console.log("Currently on Question:", currentQuestion + 1);
}

function clearForm(){
    document.querySelector(".question").value = ""
    document.querySelector(".answer").value = ""
    const choices = choicesContainer.querySelectorAll(".choice-box .choice");
    if (choices.length > 2) {
        for (let i = 2; i < choices.length; i++) {
            choices[i].parentElement.remove();
        }
    }

    // Clear the values of the first two choices
    const updatedChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    updatedChoices.forEach(choice => choice.value = "");
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
    questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");

    if (index < 0 || index >= questionObject.length) {
        console.log("Invalid index");
        return;
    }

    const questionData = questionObject[index];
    document.querySelector(".question").value = questionData.question;
    document.querySelector(".answer").value = questionData.answer;

    const choicesContainer = document.querySelector(".choices-container");
    choicesContainer.innerHTML = '';

    const choiceLetters = ['A', 'B', 'C', 'D'];
    questionData.choices.forEach((choiceText, i) => {
        const choiceBox = document.createElement('div');
        choiceBox.className = 'choice-box';

        const choiceLetter = document.createElement('p');
        choiceLetter.className = 'choice-letter';
        choiceLetter.textContent = choiceLetters[i];

        const choiceInput = document.createElement('input');
        choiceInput.className = 'choice';
        choiceInput.type = 'text';
        choiceInput.placeholder = 'Enter a choice';
        choiceInput.value = choiceText; 
        choiceBox.appendChild(choiceLetter);
        choiceBox.appendChild(choiceInput);
        choicesContainer.appendChild(choiceBox);
    });

    currentQuestion = index; 
}

function firstQuestionExist(length){
    if (length > 0){
        return true
    }
    else{
        return false
    }
}


