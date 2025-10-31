import SpeechManager from '../../modules/SpeechManager.js'
import Notification from '../../modules/Notification.js'

const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const questionInput = document.getElementById("question")
const choicesContainer = document.getElementById("choices-container")
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
const ttsId = sessionStorage.getItem("currentTtsId")
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const storedTypes = JSON.parse(sessionStorage.getItem("contentType"))

const ttsConvertButton = document.getElementById('tts-convert-button')
const ttsPlayButton = document.getElementById('tts-play-button')
const ttsDeleteButton = document.getElementById('tts-delete-button')

ttsConvertButton.disabled = true
ttsPlayButton.disabled = true
ttsDeleteButton.disabled = true

const ttsButtons = [ttsConvertButton, ttsPlayButton, ttsDeleteButton]

categoryDisplay.textContent = storedTypes.category
contentDisplay.textContent = storedTypes.content

const notifObject = new Notification()

ttsConvertButton.addEventListener("click", async () => {
    // Get the span element
    const buttonSpan = ttsConvertButton.querySelector('span');
    const originalText = buttonSpan.textContent;
    
    ttsConvertButton.disabled = true;
    buttonSpan.textContent = "Converting..."
    
    try {
        await SpeechManager.generateSpeech(questionInput.value, ttsId.toString());

        const newSpeech = {
            audioUrl: SpeechManager.getAudioFile(),
            text: questionInput.value,
            ttsId: ttsId
        };

        // Store by currentQuestion as key
        ttsObject[currentQuestion] = newSpeech;

        console.log("Current Audio is:", JSON.stringify(ttsObject));

        // Keep button disabled, enable play and delete
        ttsPlayButton.disabled = false;
        ttsDeleteButton.disabled = false;
        
        buttonSpan.textContent = "Converted"
        notifObject.notify('Text converted successfully!', 'success')
        
    } catch (error) {
        console.error('Error generating speech:', error);
        notifObject.notify('Failed to generate speech', 'error');
        
        // Reset button on error
        ttsConvertButton.disabled = false;
        buttonSpan.textContent = originalText;
    }
});

ttsPlayButton.addEventListener("click", () => {
    //if current question exist
    if (ttsObject[currentQuestion]) {
        SpeechManager.play(ttsObject[currentQuestion].audioUrl, ttsPlayButton);
    } 
    else {
        notifObject.notify("No speech to play", "error");
    }
})

ttsDeleteButton.addEventListener("click", async () => {
    const ttsConverButtonSpan = ttsConvertButton.querySelector("span")
    //delete current speech
    if (!ttsObject[currentQuestion]) {
        Notification.notify("No speech to delete", "error");
        return;
    }

    SpeechManager.setAudioFile(ttsObject[currentQuestion].audioUrl);
    
    const deleted = await SpeechManager.deleteSpeech();
    
    if (deleted) {
        delete ttsObject[currentQuestion];
        sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
        
        console.log("TTS after deletion:", ttsObject);
        
        ttsPlayButton.disabled = true;
        ttsDeleteButton.disabled = true;
        ttsConvertButton.disabled = false;

        ttsConverButtonSpan.textContent = 'Convert Text-To-Speech'
        
        notifObject.notify("Speech deleted successfully", "success");
    } else {
        notifObject.notify("Failed to delete speech", "error");
    }
})

displayActivityTitle.textContent = `Title: ${currentTitle}`
toTeacherPageButton.addEventListener('click', async () => {
    await saveCurrentQuestion(event);
    sessionStorage.removeItem('originalActivityTitle');
    sessionStorage.removeItem('questions');
    sessionStorage.removeItem('currentActivityId');
    sessionStorage.removeItem('currentActivityTitle');
    sessionStorage.removeItem('ttsInputs');
    sessionStorage.removeItem("contentType");
    window.location.href = '/teacher_dashboard';
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
        return;
    }

    const newQuestion = {
        question: getQuestion,
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
    questionInput.value = ""
    const choices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedAnswer = document.querySelector('input[name="answer"]:checked');

    ttsConvertButton.querySelector('span').textContent = "Convert Text-To-Speech"

    choices.forEach(choice => choice.value = "");

    if (checkedAnswer) {
        checkedAnswer.checked = false;
    }

    console.log(ttsObject)
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

// Handling tts buttons
(
    questionInput.addEventListener("input", () => {
        if (questionInput.value === ''){
            ttsConvertButton.disabled = true
            
        }
        else{
            ttsConvertButton.disabled = false

        }
    })
)

