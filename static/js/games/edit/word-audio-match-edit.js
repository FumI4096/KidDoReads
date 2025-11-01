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
let originalQuestionText = "" // Track the original question text that was converted

const teacherId = sessionStorage.getItem("id")
const contentId = sessionStorage.getItem("currentActivityId")
const ttsId = sessionStorage.getItem("currentTtsId")
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const storedTypes = JSON.parse(sessionStorage.getItem("contentType"))

const ttsConvertButton = document.getElementById('tts-convert-button-1')
const ttsPlayButton = document.getElementById('tts-play-button-1')

categoryDisplay.textContent = storedTypes.category
contentDisplay.textContent = storedTypes.content

const notifObject = new Notification()
const keyWordTtsObj = new SpeechManager()

saveButton.addEventListener("click", saveCurrentQuestion);
editButton.addEventListener("click", setFormToEditMode);
nextButton.addEventListener("click", nextForm);
previousButton.addEventListener("click", previousForm);

displayActivityTitle.textContent = `Title: ${currentTitle}`;

toTeacherPageButton.addEventListener('click', async () => {
    sessionStorage.removeItem('originalActivityTitle');
    sessionStorage.removeItem('questions');
    sessionStorage.removeItem('currentActivityId');
    sessionStorage.removeItem('currentActivityTitle');
    sessionStorage.removeItem('ttsInputs');
    sessionStorage.removeItem("contentType");
    keyWordTtsObj = null
    window.location.href = '/teacher_dashboard';
});

document.addEventListener("input", () => {
    checkInputState();
});

if (firstQuestionExist(questionObject.length)) {
    loadQuestion(0);
    setFormToViewMode();
    previousButton.disabled = true;
} else {
    clearForm();
    editButton.style.display = "none";
    saveButton.style.display = "inline";
    nextButton.disabled = true;
    previousButton.disabled = true;
    saveButton.disabled = true;
}

/**
 * Check if the current question text differs from what was originally converted
 */
function hasQuestionTextChanged() {
    const currentText = questionInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    // If no audio exists, question hasn't been converted yet
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalQuestionText;
}

function getAudioForQuestion(index) {
    // First check if there's a newly generated audio file (not yet saved)
    const currentAudioFile = keyWordTtsObj.getAudioFile();
    
    // If we're checking the current question and there's a new audio file, return it
    if (index === currentQuestion && currentAudioFile) {
        return currentAudioFile;
    }
    
    // Otherwise check stored TTS object
    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index] && ttsData[index].audioUrl) {
        return ttsData[index].audioUrl;
    }
    
    return null;
}

/**
 * Update TTS button states based on current audio availability
 */
function updateTtsButtonStates(isEditMode = false) {
    const audioUrl = getAudioForQuestion(currentQuestion);
    const hasAudio = audioUrl !== null;
    const hasQuestionText = questionInput.value.trim() !== '';
    const questionChanged = hasQuestionTextChanged();
    
    if (isEditMode) {
        // In edit mode
        if (hasAudio && !questionChanged) {
            // Audio exists and text hasn't changed - show "Reconvert" (optional), enable play
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false;
            changeTtsConverButtonText("Reconvert Text-To-Speech");
        } 
        else if (hasAudio && questionChanged) {
            // Audio exists but text HAS changed - MUST reconvert (required)
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false; // Can still play old audio
            changeTtsConverButtonText("Reconvert Text-To-Speech (Required)");
        } 
        else if (hasQuestionText) {
            // No audio but has text - show "Convert"
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = true;
            changeTtsConverButtonText("Convert Text-To-Speech");
        } 
        else {
            // No audio, no text - disable all
            ttsConvertButton.disabled = true;
            ttsPlayButton.disabled = true;
            changeTtsConverButtonText("Convert Text-To-Speech");
        }
    } 
    else {
        // In view mode - disable convert, enable play if audio exists
        ttsConvertButton.disabled = true;
        ttsPlayButton.disabled = !hasAudio;
        
        if (hasAudio) {
            changeTtsConverButtonText("Converted");
        } 
        else {
            changeTtsConverButtonText("Convert Text-To-Speech");
        }
    }
    
    console.log(`TTS Buttons Updated - Question ${currentQuestion + 1}, Audio: ${hasAudio ? 'Yes' : 'No'}, Changed: ${questionChanged}, Edit Mode: ${isEditMode}`);
}

function checkInputState() {
    const getQuestion = questionInput.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");
    const hasAudio = getAudioForQuestion(currentQuestion) !== null;
    const questionChanged = hasQuestionTextChanged();

    // Can't save if question text changed but hasn't been reconverted
    const needsReconvert = hasAudio && questionChanged;
    const isComplete = getQuestion && getAnswer && hasAudio && !hasEmptyChoice && !needsReconvert;

    saveButton.disabled = !isComplete;
    
    // Show notification if trying to save with changed text
    if (needsReconvert && getQuestion && getAnswer && !hasEmptyChoice) {
        // User has everything filled but needs to reconvert
        console.log("⚠️ Question text changed - reconversion required before saving");
    }
}

function changeTtsConverButtonText(text) {
    const span = ttsConvertButton.querySelector('span');
    span.textContent = text;
}

ttsConvertButton.addEventListener("click", async () => {
    const audioUrl = getAudioForQuestion(currentQuestion);
    const isReconvert = audioUrl !== null; //check if audio exist to consider as RECONVERTING
    
    ttsConvertButton.disabled = true;
    changeTtsConverButtonText(isReconvert ? "Reconverting..." : "Converting...");
    
    try {
        // If reconverting, delete the old speech first
        if (isReconvert) {
            keyWordTtsObj.setAudioFile(audioUrl);
            const deleted = await keyWordTtsObj.deleteSpeech();
            
            if (deleted) {
                // Remove from ttsObject
                ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
                delete ttsObject[currentQuestion];
                sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
                keyWordTtsObj.clearAudioFile();
                console.log("Old speech deleted for reconversion");
            } else {
                throw new Error("Failed to delete old speech");
            }
        }
        
        // Generate new speech
        await keyWordTtsObj.generateSpeech(questionInput.value, ttsId.toString());

        originalQuestionText = questionInput.value.trim();

        updateTtsButtonStates(true); // true = edit mode
        checkInputState();
        
        notifObject.notify(
            isReconvert ? 'Speech reconverted successfully!' : 'Text converted successfully!', 
            'success'
        );
        
    } catch (error) {
        console.error('Error generating speech:', error);
        notifObject.notify(
            isReconvert ? 'Failed to reconvert speech' : 'Failed to generate speech', 
            'error'
        );
        
        updateTtsButtonStates(true);
    }
});

ttsPlayButton.addEventListener("click", () => {
    const audioUrl = getAudioForQuestion(currentQuestion);
    
    if (audioUrl) {
        keyWordTtsObj.play(audioUrl, ttsPlayButton);
    } else {
        notifObject.notify("No speech to play", "error");
    }
});

questionInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasText = questionInput.value.trim() !== '';
        const questionChanged = hasQuestionTextChanged();
        
        if (hasAudio && questionChanged && hasText) {
            changeTtsConverButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !questionChanged) {
            changeTtsConverButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasText) {
            changeTtsConverButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

function setFormToViewMode() {
    console.log("View Mode - Question", currentQuestion + 1);
    
    updateTtsButtonStates(false); 
    
    saveButton.style.display = "none";
    editButton.style.display = "inline";
    nextButton.disabled = false;
    
    answerRadioButtonsDisable(true);
    questionInput.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });

    previousButton.disabled = currentQuestion === 0;
}

function setFormToEditMode() {
    console.log("Edit Mode - Question", currentQuestion + 1);
    
    originalQuestionText = questionInput.value.trim();
    
    updateTtsButtonStates(true); // true = edit mode
    
    saveButton.style.display = "inline";
    editButton.style.display = "none";
    checkInputState();
    
    questionInput.readOnly = false;
    answerRadioButtonsDisable(false);
    nextButton.disabled = true;

    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = false;
    });

    if (currentQuestion === questionObject.length - 1) {
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


    const questionExist = Boolean(questionObject[currentQuestion])

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

function clearForm() {
    keyWordTtsObj.clearAudioFile();
    originalQuestionText = ""; 
    updateTtsButtonStates(true); // true = edit mode
    
    questionInput.value = "";
    const choices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedAnswer = document.querySelector('input[name="answer"]:checked');

    choices.forEach(choice => choice.value = "");
    if (checkedAnswer) {
        checkedAnswer.checked = false;
    }
}

function nextForm() {
    questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
    ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    
    previousButton.style.display = "inline";
    previousButton.disabled = false;
    
    if (currentQuestion < questionObject.length - 1) {
        currentQuestion++;
        console.log("Next Question: " + (currentQuestion + 1));
        loadQuestion(currentQuestion);
    } else {
        clearForm();
        currentQuestion = questionObject.length;
        console.log("Ready to create Question:", currentQuestion + 1);
        setFormToEditMode();
    }
}

function previousForm() {
    if (currentQuestion > 0) {
        // Check if we're on a new unsaved question (beyond the array length)
        if (currentQuestion === questionObject.length) {
            // Check if user has generated speech 
            console.log(keyWordTtsObj.getAudioFile())
            const hasGeneratedSpeech = keyWordTtsObj.getAudioFile() !== "";
            
            if (hasGeneratedSpeech) {
                notifObject.notify("Please save the current question before navigating", "error");
                return;
            }
        }
        
        currentQuestion--;
        loadQuestion(currentQuestion);
        setFormToViewMode();
    }
}

function loadQuestion(index) {
    if (index < 0 || index >= questionObject.length) {
        console.log("Invalid index");
        return;
    }

    const questionData = questionObject[index];
    questionInput.value = questionData.question;
    
    // Store the original question text when loading
    originalQuestionText = questionData.question;

    const choiceA = document.getElementById('choice-a');
    const choiceB = document.getElementById('choice-b');
    const choiceC = document.getElementById('choice-c');

    choiceA.value = questionData.choices[0] || "";
    choiceB.value = questionData.choices[1] || "";
    choiceC.value = questionData.choices[2] || "";

    const radioA = document.getElementById('answer-a');
    const radioB = document.getElementById('answer-b');
    const radioC = document.getElementById('answer-c');

    if (radioA) radioA.checked = (questionData.answer === 'a');
    if (radioB) radioB.checked = (questionData.answer === 'b');
    if (radioC) radioC.checked = (questionData.answer === 'c');

    currentQuestion = index;
    
    updateTtsButtonStates(false); // Start in view mode
}

function answerRadioButtonsDisable(state) {
    const radioButtons = answerContainer.querySelectorAll('input');
    radioButtons.forEach(element => {
        element.disabled = state;
    });
}

function firstQuestionExist(length) {
    return length > 0;
}

