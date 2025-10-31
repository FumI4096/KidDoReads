const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const keyWordInput = document.getElementById("key-word")
const sentenceInput = document.getElementById("sentence")
const choicesContainer = document.getElementById("choice-box-container")
const answerContainer = document.getElementById("answer-container")
const saveButton = document.getElementById("save-button")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const editButton = document.getElementById("edit-button")
let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
let ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
let currentQuestion = 0

const teacherId = sessionStorage.getItem("id")
const contentId = sessionStorage.getItem("currentActivityId")
const ttsId = contentId
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const storedTypes = JSON.parse(sessionStorage.getItem("contentType"))

const ttsConvertButton1 = document.getElementById('tts-convert-button-1')
const ttsPlayButton1 = document.getElementById('tts-play-button-1')
const ttsDeleteButton1 = document.getElementById('tts-delete-button-1')

const ttsConvertButton2 = document.getElementById('tts-convert-button-2')
const ttsPlayButton2 = document.getElementById('tts-play-button-2')
const ttsDeleteButton2 = document.getElementById('tts-delete-button-2')

categoryDisplay.textContent = storedTypes.category
contentDisplay.textContent = storedTypes.content


ttsConvertButton1.addEventListener("click", async () => {
    const speechesExist = Boolean(ttsObject[currentQuestion])

    if (speechesExist){
        const ttsData = ttsObject[currentQuestion]
        console.log(ttsData)
    }
    
    const ttsInputStatementContainer = document.createElement("div");
    ttsInputStatementContainer.setAttribute('id', "tts-input-statement-container") 
    
})

ttsConvertButton2.addEventListener("click", async () => {
    const speechesExist = Boolean(ttsObject[currentQuestion])

    if (speechesExist){
        const ttsData = ttsObject[currentQuestion]
        console.log(ttsData)
    }
    
    const ttsInputStatementContainer = document.createElement("div");
    ttsInputStatementContainer.setAttribute('id', "tts-input-statement-container") 
    
})

displayActivityTitle.textContent = `Title: ${currentTitle}`
toTeacherPageButton.addEventListener('click', () => {
    sessionStorage.removeItem('originalActivityTitle')
    sessionStorage.removeItem('questions')
    sessionStorage.removeItem('currentActivityId')
    sessionStorage.removeItem('currentActivityTitle')
    sessionStorage.removeItem('ttsInputs')
    sessionStorage.removeItem("contentType")
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
    keyWordInput.readOnly = true;
    sentenceInput.readOnly = true;
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
    const getKeyWord = keyWordInput.value.trim();
    const getSentence = sentenceInput.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked')
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");

    if (getKeyWord && getSentence && getAnswer && !hasEmptyChoice) {
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
    keyWordInput.readOnly = true;
    sentenceInput.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
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
    keyWordInput.readOnly = false;
    sentenceInput.readOnly = false;
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

    const getKeyWord = keyWordInput.value.trim()
    const getSentence = sentenceInput.value.trim()
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice")
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked')
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : null
    var noKeyWord = false
    var noSentence = false
    var noChoices = false
    var noAnswer = false

    if (getKeyWord === ""){
        noKeyWord = true
    }

    if (getSentence === ""){
        noSentence = true
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

    if (noKeyWord || noSentence || noChoices || noAnswer){
        console.log("Please put the valid requirements")
        return;
    }

    const newQuestion = {
        keyWord: getKeyWord,
        sentence: getSentence,
        choices: currentChoices,
        answer: getAnswer
    };

    let questionExist = Boolean(questionObject[currentQuestion])

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
    keyWordInput.value = ""
    sentenceInput.value = ""
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
    
    const questionData = questionObject[index];
    keyWordInput.value = questionData.keyWord || "";
    sentenceInput.value = questionData.sentence || "";

    const choiceA = document.getElementById('choice-a')
    const choiceB = document.getElementById('choice-b')
    const choiceC = document.getElementById('choice-c')

    choiceA.value = questionData.choices[0] || ""
    choiceB.value = questionData.choices[1] || ""
    choiceC.value = questionData.choices[2] || ""

    const radioA = document.getElementById('answer-a');
    const radioB = document.getElementById('answer-b');
    const radioC = document.getElementById('answer-c');

    if (radioA) radioA.checked = (questionData.answer === 'a');
    if (radioB) radioB.checked = (questionData.answer === 'b');
    if (radioC) radioC.checked = (questionData.answer === 'c');

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