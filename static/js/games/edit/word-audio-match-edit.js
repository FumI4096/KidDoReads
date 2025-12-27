import SpeechManager from '../../modules/SpeechManager.js'
import Notification from '../../modules/Notification.js'
import { decrypt } from '../../modules/SessionHandling.js'

const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const questionInput = document.getElementById("question")
const choicesContainer = document.getElementById("choices-container")
const answerContainer = document.getElementById("answer-container")
const importContentButton = document.getElementById("import-content-button")
const saveButton = document.getElementById("save-button")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const editButton = document.getElementById("edit-button")

let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
let ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
let currentQuestion = 0
let originalQuestionText = "" // Track the original question text that was converted

const teacherId = await decrypt(sessionStorage.getItem("id"))
const contentId = await decrypt(sessionStorage.getItem("currentActivityId"))
const ttsId = await decrypt(sessionStorage.getItem("currentTtsId"))
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const ttsConvertButton = document.getElementById('tts-convert-button-1')
const ttsPlayButton = document.getElementById('tts-play-button-1')

const contentType = 1 

categoryDisplay.textContent = "Pronunciation"
contentDisplay.textContent = "Word Audio Match"

const notifObject = new Notification()
const keyWordTtsObj = new SpeechManager()

saveButton.addEventListener("click", saveCurrentQuestion);
editButton.addEventListener("click", setFormToEditMode);
nextButton.addEventListener("click", nextForm);
previousButton.addEventListener("click", previousForm);
toTeacherPageButton.addEventListener("click", saveAndExit);

displayActivityTitle.textContent = `Title: ${currentTitle}`;

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
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } 
        else if (hasAudio && questionChanged) {
            // Audio exists but text HAS changed - MUST reconvert (required)
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false; // Can still play old audio
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } 
        else if (hasQuestionText) {
            // No audio but has text - show "Convert"
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = true;
            changeTtsConvertButtonText("Convert Text-To-Speech");
        } 
        else {
            // No audio, no text - disable all
            ttsConvertButton.disabled = true;
            ttsPlayButton.disabled = true;
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
    } 
    else {
        // In view mode - disable convert, enable play if audio exists
        ttsConvertButton.disabled = true;
        ttsPlayButton.disabled = !hasAudio;
        
        if (hasAudio) {
            changeTtsConvertButtonText("Converted");
        } 
        else {
            changeTtsConvertButtonText("Convert Text-To-Speech");
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

    const hasStartedEditing = getQuestion || getAnswer || hasAudio || getChoices.some(choice => choice.value.trim() !== "");

    saveButton.disabled = !isComplete;
    importContentButton.disabled = hasStartedEditing;
    toTeacherPageButton.disabled = !isComplete;
}

function changeTtsConvertButtonText(text) {
    const span = ttsConvertButton.querySelector('span');
    span.textContent = text;
}

function hasDuplicateQuestion() {
    const currentKeyword = questionInput.value.trim().toLowerCase();
    
    if (!currentKeyword) return false;
    
    for (let i = 0; i < questionObject.length; i++) {
        // Skip current question
        if (i === currentQuestion) continue;
        
        const otherKeyword = questionObject[i].question?.trim().toLowerCase();
        
        if (otherKeyword === currentKeyword) {
            return true;
        }
    }
    
    return false;
}

ttsConvertButton.addEventListener("click", async () => {
    const audioUrl = getAudioForQuestion(currentQuestion);
    const isReconvert = audioUrl !== null; //check if audio exist to consider as RECONVERTING

    if(hasDuplicateQuestion()){
        notifObject.notify("Duplicated keyword detected in this question. Please provide another text", "error")
        return;
    }
    
    ttsConvertButton.disabled = true;
    changeTtsConvertButtonText(isReconvert ? "Reconverting..." : "Converting...");
    
    try {
        // If reconverting, delete the old speech first
        if (isReconvert) {
            keyWordTtsObj.setAudioFile(audioUrl);
            const deleted = await keyWordTtsObj.deleteSpeech();
            
            if (deleted) {
                ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
                console.log(ttsObject)
                if (ttsObject[currentQuestion]) {
                    ttsObject[currentQuestion].audioUrl = "";
                }
                sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
                console.log(ttsObject)
            } else {
                throw new Error("Failed to delete old speech");
            }
        }
        
        // Generate new speech
        await keyWordTtsObj.generateSpeech(questionInput.value, ttsId.toString(), 1);

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
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !questionChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasText) {
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

function setFormToViewMode() {
    console.log("View Mode - Question", currentQuestion + 1);
    
    importContentButton.disabled = false;
    notifObject.notify("Switched to view mode", "success");
    
    updateTtsButtonStates(false); 
    
    saveButton.style.display = "none";
    editButton.style.display = "inline";
    nextButton.disabled = false;
    
    // Enable save and exit button in view mode
    toTeacherPageButton.disabled = false;
    
    answerRadioButtonsDisable(true);
    questionInput.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });

    previousButton.disabled = currentQuestion === 0;
}

function setFormToEditMode() {
    console.log("Edit Mode - Question", currentQuestion + 1);
    
    notifObject.notify("Switched to edit mode", "success");
    
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

async function saveCurrentQuestion(e) {
    e.preventDefault();

    const getQuestion = questionInput.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getQuestion) {
        notifObject.notify("Please enter a question", "error");
        return;
    }

    const currentChoices = [];
    for (let i = 0; i < getChoices.length; i++) {
        if (getChoices[i].value.trim() === "") {
            notifObject.notify("Please fill all choices", "error");
            return;
        }
        currentChoices.push(getChoices[i].value.trim());
    }

    if (!getAnswer) {
        notifObject.notify("Please select an answer", "error");
        return;
    }

    const audioUrl = getAudioForQuestion(currentQuestion);

    if (!ttsObject[currentQuestion]) {
        ttsObject[currentQuestion] = {};
    }

    if (!audioUrl) {
        notifObject.notify("Please generate speech for this question", "error");
        return;
    }

    let audioChanged = false;
    const currentAudioFile = keyWordTtsObj.getAudioFile();
    const storedAudio = ttsObject[currentQuestion]?.audioUrl;

    if (currentAudioFile && storedAudio !== currentAudioFile) {
        audioChanged = true;
        console.log("Audio changed:", storedAudio, "->", currentAudioFile);
        ttsObject[currentQuestion].audioUrl = currentAudioFile 
        sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
        keyWordTtsObj.clearAudioFile();
        
        originalQuestionText = getQuestion;
    }

    const newQuestion = {
        question: getQuestion,
        choices: currentChoices,
        answer: getAnswer
    };

    // Check if question exists and compare
    const existingQuestion = questionObject[currentQuestion];
    let questionUnchanged = false;

    if (existingQuestion) {
        console.log("Comparing questions:");
        console.log("Existing:", existingQuestion);
        console.log("New:", newQuestion);
        
        // Compare individual properties instead of JSON.stringify
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        // Compare choices array
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = questionTextSame && answerSame && choicesSame;
        console.log("Question unchanged?", questionUnchanged);
    } else {
        console.log("No existing question at index", currentQuestion);
    }


    if (questionUnchanged && !audioChanged) {
        console.log("No changes detected - skipping save");
        setFormToViewMode();
        return;
    }

    const loadingId = `loading-save-${Date.now()}`;
    notifObject.notify("Saving question...", "loading", null, null, loadingId);

    if(audioChanged){
        try{
            const formDataTts = new FormData()
            console.log(ttsObject)
        
            formDataTts.append('ttsId', ttsId)
            formDataTts.append('ttsAudios', JSON.stringify(ttsObject))
            const speechUrl = '/update-speech'
    
            const response = await fetch(speechUrl, {
                method: 'POST',
                body: formDataTts
            })
    
            const result = await response.json()
    
            if (response.ok && result.status){
                console.log("Audios stored succesfully")
                sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
            }
            else{
                console.log(result.message)
                notifObject.dismissLoading(loadingId);
                notifObject.notify(result.message, "error")
                return;
            }
        }
        catch (error){
            console.log(error)
            notifObject.dismissLoading(loadingId);
            notifObject.notify("Cannot save Questions", "error")
            return;
        }

    }

    if(!questionUnchanged){
        const questionExist = Boolean(questionObject[currentQuestion]);
        if (questionExist) {
            console.log("Updating existing question");
            questionObject[currentQuestion] = newQuestion;
        } 
        else {
            console.log("Adding new question");
            questionObject.push(newQuestion);
            currentQuestion = questionObject.length - 1;
        }

        try {
            
            sessionStorage.setItem("questions", JSON.stringify(questionObject));
            const formData = new FormData();
            formData.append('content', sessionStorage.getItem("questions"));
            formData.append('id', teacherId);
            formData.append('content_id', contentId);
            formData.append('total_questions', questionObject.length);

            const response = await fetch('/update_content', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            notifObject.dismissLoading(loadingId);
            
            if(response.ok && result.status) {
                console.log(result.message);
                notifObject.notify('Question saved successfully!', 'success');
            } 
            else {
                console.log("Error saving content:", result.message);
                notifObject.notify('Failed to save question', 'error');
                return;
            }
        } 
        catch (error) {
            notifObject.dismissLoading(loadingId);
            console.error(error);
            notifObject.notify('Error saving question', 'error');
            return;
        }
    } else {
        notifObject.dismissLoading(loadingId);
    }

    setFormToViewMode();
}

// Save and Exit function - same logic as saveCurrentQuestion but redirects after saving
async function saveAndExit(e) {
    e.preventDefault();

    // Check if in edit mode (has unsaved changes)
    const isEditMode = editButton.style.display === "none";
    
    if (!isEditMode) {
        // In view mode, just exit without saving
        sessionStorage.removeItem('originalActivityTitle');
        sessionStorage.removeItem('questions');
        sessionStorage.removeItem('currentActivityId');
        sessionStorage.removeItem('currentActivityTitle');
        sessionStorage.removeItem('ttsInputs');
        sessionStorage.removeItem("contentType");
        window.location.href = '/teacher_dashboard';
        return;
    }

    const getQuestion = questionInput.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getQuestion) {
        notifObject.notify("Please enter a question", "error");
        return;
    }

    const currentChoices = [];
    for (let i = 0; i < getChoices.length; i++) {
        if (getChoices[i].value.trim() === "") {
            notifObject.notify("Please fill all choices", "error");
            return;
        }
        currentChoices.push(getChoices[i].value.trim());
    }

    if (!getAnswer) {
        notifObject.notify("Please select an answer", "error");
        return;
    }

    const audioUrl = getAudioForQuestion(currentQuestion);

    if (!ttsObject[currentQuestion]) {
        ttsObject[currentQuestion] = {};
    }

    if (!audioUrl) {
        notifObject.notify("Please generate speech for this question", "error");
        return;
    }

    let audioChanged = false;
    const currentAudioFile = keyWordTtsObj.getAudioFile();
    const storedAudio = ttsObject[currentQuestion]?.audioUrl;

    if (currentAudioFile && storedAudio !== currentAudioFile) {
        audioChanged = true;
        console.log("Audio changed:", storedAudio, "->", currentAudioFile);
        ttsObject[currentQuestion].audioUrl = currentAudioFile 
        sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
        keyWordTtsObj.clearAudioFile();
        
        originalQuestionText = getQuestion;
    }

    const newQuestion = {
        question: getQuestion,
        choices: currentChoices,
        answer: getAnswer
    };

    // Check if question exists and compare
    const existingQuestion = questionObject[currentQuestion];
    let questionUnchanged = false;

    if (existingQuestion) {
        console.log("Comparing questions:");
        console.log("Existing:", existingQuestion);
        console.log("New:", newQuestion);
        
        // Compare individual properties instead of JSON.stringify
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        // Compare choices array
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = questionTextSame && answerSame && choicesSame;
        console.log("Question unchanged?", questionUnchanged);
    } else {
        console.log("No existing question at index", currentQuestion);
    }

    if (questionUnchanged && !audioChanged) {
        console.log("No changes detected - redirecting to dashboard");
        sessionStorage.removeItem('originalActivityTitle');
        sessionStorage.removeItem('questions');
        sessionStorage.removeItem('currentActivityId');
        sessionStorage.removeItem('currentActivityTitle');
        sessionStorage.removeItem('ttsInputs');
        sessionStorage.removeItem("contentType");
        window.location.href = '/teacher_dashboard';
        return;
    }

    const loadingId = `loading-save-exit-${Date.now()}`;
    notifObject.notify("Saving and exiting...", "loading", null, null, loadingId);

    if(audioChanged){
        try{
            const formDataTts = new FormData()
            console.log(ttsObject)
        
            formDataTts.append('ttsId', ttsId)
            formDataTts.append('ttsAudios', JSON.stringify(ttsObject))
            const speechUrl = '/update-speech'
    
            const response = await fetch(speechUrl, {
                method: 'POST',
                body: formDataTts
            })
    
            const result = await response.json()
    
            if (response.ok && result.status){
                console.log("Audios stored succesfully")
                sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
            }
            else{
                console.log(result.message)
                notifObject.dismissLoading(loadingId);
                notifObject.notify(result.message, "error")
                return;
            }
        }
        catch (error){
            console.log(error)
            notifObject.dismissLoading(loadingId);
            notifObject.notify("Cannot save Questions", "error")
            return;
        }
    }

    if(!questionUnchanged){
        const questionExist = Boolean(questionObject[currentQuestion]);
        if (questionExist) {
            console.log("Updating existing question");
            questionObject[currentQuestion] = newQuestion;
        } 
        else {
            console.log("Adding new question");
            questionObject.push(newQuestion);
            currentQuestion = questionObject.length - 1;
        }

        try {
            sessionStorage.setItem("questions", JSON.stringify(questionObject));
            const formData = new FormData();
            formData.append('content', sessionStorage.getItem("questions"));
            formData.append('id', teacherId);
            formData.append('content_id', contentId);
            formData.append('total_questions', questionObject.length);

            const response = await fetch('/update_content', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            
            notifObject.dismissLoading(loadingId);
            
            if(response.ok && result.status) {
                console.log(result.message);
                notifObject.notify('Question saved successfully! Redirecting...', 'success');
                
                // Redirect after brief delay
                setTimeout(() => {
                    sessionStorage.removeItem('originalActivityTitle');
                    sessionStorage.removeItem('questions');
                    sessionStorage.removeItem('currentActivityId');
                    sessionStorage.removeItem('currentActivityTitle');
                    sessionStorage.removeItem('ttsInputs');
                    sessionStorage.removeItem("contentType");
                    window.location.href = '/teacher_dashboard';
                }, 1000);
            } 
            else {
                console.log("Error saving content:", result.message);
                notifObject.notify('Failed to save question', 'error');
                return;
            }
        } 
        catch (error) {
            notifObject.dismissLoading(loadingId);
            console.error(error);
            notifObject.notify('Error saving question', 'error');
            return;
        }
    } else {
        notifObject.dismissLoading(loadingId);
        sessionStorage.removeItem('originalActivityTitle');
        sessionStorage.removeItem('questions');
        sessionStorage.removeItem('currentActivityId');
        sessionStorage.removeItem('currentActivityTitle');
        sessionStorage.removeItem('ttsInputs');
        sessionStorage.removeItem("contentType");
        window.location.href = '/teacher_dashboard';
    }
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
    originalQuestionText = questionData.question || "";

    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index]) {
        if (ttsData[index].audioUrl) {
            keyWordTtsObj.setAudioFile(ttsData[index].audioUrl);
        } else {
            keyWordTtsObj.clearAudioFile();
        }
    } else {
        // No audio for this question yet
        keyWordTtsObj.clearAudioFile();
    }

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

importContentButton.addEventListener('click', async () => {
    const response = await fetch(`/contents/${contentType}/${teacherId}`);
    const result = await response.json();
    const contentContainer = document.createElement("div");
    contentContainer.setAttribute('id', "import-modal-container");

    const closeContentButton = document.createElement("ion-icon");
    closeContentButton.name = "close-outline";
    closeContentButton.setAttribute('id', "close-import-modal-button");
    closeContentButton.style.color = 'white';

    const contentHeaderStatement = document.createElement("p");
    contentHeaderStatement.setAttribute('id', 'import-modal-statement')
    contentHeaderStatement.textContent = "Import an activity from your previous contents 🗒️";

    const importContent = document.createElement("div");
    importContent.setAttribute('id', "import-content");

    const submitContentButton = document.createElement("button");
    submitContentButton.textContent = "Confirm";
    submitContentButton.setAttribute('id',"submit-content");

    importContent.appendChild(closeContentButton);
    importContent.appendChild(contentHeaderStatement)
    contentContainer.appendChild(importContent);
    const contentTypeContainer = document.createElement("div");
    contentTypeContainer.setAttribute('id',"content-type-container");

    const selectContent = document.createElement("select");
    selectContent.setAttribute('id', "content-type");
    selectContent.id = "content_type";
    selectContent.name = "content_type";

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Select Content';
    selectContent.appendChild(defaultOption);

    // Add fetched contents as options
    if (result.status && result.data) {
        console.log(result.data)
        const contentId = await decrypt(sessionStorage.getItem("currentActivityId"))
        result.data.forEach(content => {
            if(contentId == content.content_id){
                return;
            } // Skip current content
            const optionElement = document.createElement('option');
            optionElement.value = content.content_id;
            optionElement.textContent = content.content_title;
            selectContent.appendChild(optionElement);
        });
    }
    else{
        console.log(result.message)
    }
    
    contentTypeContainer.appendChild(selectContent);
    importContent.appendChild(contentTypeContainer);
    importContent.appendChild(submitContentButton);
    document.body.appendChild(contentContainer);

    closeContentButton.addEventListener("click", () => {
        document.body.removeChild(contentContainer);
    });

    submitContentButton.addEventListener('click', async () => {
        const selectedContentId = selectContent.value;
        try{

            if (selectedContentId) {
                const loadingId = `loading-import-${Date.now()}`;
                submitContentButton.disabled = true;
                notifObject.notify("Importing Content...", "loading", null, null, loadingId);
                // Get the selected content data
                const selectedContent = result.data.find(content => content.content_id == selectedContentId);
                console.log('Selected content:', selectedContent);
                // You can now use selectedContent.content_json and selectedContent.tts_json

                selectedContent.content_json.forEach((questionNo) => {
                    questionObject.push({
                        question: questionNo.question,
                        choices: questionNo.choices,
                        answer: questionNo.answer
                    });
                    console.log('Question', questionNo.question);
                    console.log('Choices', questionNo.choices);
                    console.log('Answer', questionNo.answer);

                    console.log(questionObject);
                });

                selectedContent.tts_json.forEach((audio) => {
                    ttsObject.push({
                        audioUrl: audio.audioUrl
                    });
                    console.log('Audio URL', audio.audioUrl);
                    console.log(ttsObject);
                });

                const formData = new FormData();
                formData.append('content', JSON.stringify(questionObject));
                formData.append('id', teacherId);
                formData.append('content_id', contentId);
                formData.append('total_questions', questionObject.length);

                const questionResponse = await fetch('/update_content', {
                    method: 'POST',
                    body: formData,
                });

                const questionResult = await questionResponse.json();

                const formDataTts = new FormData()
                console.log(ttsObject)
            
                formDataTts.append('ttsId', ttsId)
                formDataTts.append('ttsAudios', JSON.stringify(ttsObject))

                const TtsResponse = await fetch('/update-speech', {
                    method: 'POST',
                    body: formDataTts
                })

                const TtsResult = await TtsResponse.json()

                if((questionResponse.ok && questionResult.status) && (TtsResponse.ok && TtsResult.status)){
                    console.log("Content imported succesfully")
                    sessionStorage.setItem("questions", JSON.stringify(questionObject));
                    sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
                    notifObject.dismissLoading(loadingId);
                    notifObject.notify("Content imported succesfully", "success")
                    submitContentButton.disabled = false;
                    loadQuestion(questionObject.length - 1);
                    setFormToViewMode()
                }
                else{
                    notifObject.dismissLoading(loadingId);
                    if(questionResult.message){
                        console.log(questionResult.message)
                        notifObject.notify("Cannot Import Questions: " + questionResult.message, "error")
                    }
                    if(TtsResult.message){
                        console.log(TtsResult.message)
                        notifObject.notify("Cannot Import Speech: " + TtsResult.message, "error")
                    }
                    submitContentButton.disabled = false;
                }
                document.body.removeChild(contentContainer);
            }
            else{
                notifObject.notify("Please select a content to import", "error")
                return;
            }
        }
        catch (error){
            console.log(error)
            notifObject.notify("Cannot import Content", "error")
            submitContentButton.disabled = false;
            document.body.removeChild(contentContainer);
            return;
        }
    });
});