import SpeechManager from '../../modules/SpeechManager.js'
import Notification from '../../modules/Notification.js'
import { decrypt } from '../../modules/SessionHandling.js'

const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const passageTitle = document.getElementById("passage-title")
const passage = document.getElementById('passage')
const questionInput = passage // Reference passage as questionInput for TTS functionality
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
let originalPassageTitle = "" // Track the original passage title that was converted

const teacherId = await decrypt(sessionStorage.getItem("id"))
const contentId = await decrypt(sessionStorage.getItem("currentActivityId"))
const ttsId = await decrypt(sessionStorage.getItem("currentTtsId"))
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const ttsConvertButton = document.getElementById('tts-convert-button')
const ttsPlayButton = document.getElementById('tts-play-button')

categoryDisplay.textContent = "Reading Comprehension"
contentDisplay.textContent = "What Happens Next"

const notifObject = new Notification()
const keyWordTtsObj = new SpeechManager()

saveButton.addEventListener("click", saveCurrentQuestion);
editButton.addEventListener("click", setFormToEditMode);
nextButton.addEventListener("click", nextForm);
previousButton.addEventListener("click", previousForm);
toTeacherPageButton.addEventListener('click', saveAndExit);

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
 * Check if the passage text differs from what was originally converted
 */
function hasQuestionTextChanged() {
    const currentText = passage.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    // If no audio exists, question hasn't been converted yet
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalQuestionText;
}

/**
 * Check if the passage title differs from what was originally converted
 */
function hasPassageTitleChanged() {
    const currentText = passageTitle.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    // If no audio exists, passage title hasn't been converted yet
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalPassageTitle;
}

/**
 * Check if any TTS input has changed
 */
function hasAnyTtsInputChanged() {
    return hasQuestionTextChanged() || hasPassageTitleChanged();
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
    const hasQuestionText = passage.value.trim() !== '';
    const hasPassageTitleText = passageTitle.value.trim() !== '';
    const ttsInputChanged = hasAnyTtsInputChanged();
    
    if (isEditMode) {
        // In edit mode
        if (hasAudio && !ttsInputChanged) {
            // Audio exists and text hasn't changed - show "Reconvert" (optional), enable play
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false;
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } 
        else if (hasAudio && ttsInputChanged) {
            // Audio exists but text HAS changed - MUST reconvert (required)
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false; // Can still play old audio
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } 
        else if (hasQuestionText && hasPassageTitleText) {
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
    
    console.log(`TTS Buttons Updated - Question ${currentQuestion + 1}, Audio: ${hasAudio ? 'Yes' : 'No'}, Changed: ${ttsInputChanged}, Edit Mode: ${isEditMode}`);
}

function checkInputState() {
    const getPassageTitle = passageTitle.value.trim();
    const getPassage = passage.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");
    const hasAudio = getAudioForQuestion(currentQuestion) !== null;
    const ttsInputChanged = hasAnyTtsInputChanged();

    // Can't save if question text changed but hasn't been reconverted
    const needsReconvert = hasAudio && ttsInputChanged;
    const isComplete = getPassageTitle && getPassage && getAnswer && hasAudio && !hasEmptyChoice && !needsReconvert;

    saveButton.disabled = !isComplete;
    toTeacherPageButton.disabled = !isComplete;
}

function changeTtsConvertButtonText(text) {
    const span = ttsConvertButton.querySelector('span');
    span.textContent = text;
}

function hasDuplicateQuestion() {
    const currentKeyword = passage.value.trim().toLowerCase();
    
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
        notifObject.notify("Duplicated keyword detected in this question. Please provide another text", "error");
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
        await keyWordTtsObj.generateSpeech(`\(${passageTitle.value.trim()}\), \(${passage.value.trim()}\)`, ttsId.toString(), 5);

        originalQuestionText = passage.value.trim();
        originalPassageTitle = passageTitle.value.trim();

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

passageTitle.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasPassageTitleText = passageTitle.value.trim() !== '';
        const hasQuestionText = passage.value.trim() !== '';
        const ttsInputChanged = hasAnyTtsInputChanged();
        
        if (hasAudio && ttsInputChanged && hasPassageTitleText && hasQuestionText) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !ttsInputChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasPassageTitleText && hasQuestionText) {
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

passage.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasText = passage.value.trim() !== '';
        const hasPassageTitleText = passageTitle.value.trim() !== '';
        const ttsInputChanged = hasAnyTtsInputChanged();
        
        if (hasAudio && ttsInputChanged && hasText && hasPassageTitleText) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !ttsInputChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasText && hasPassageTitleText) {
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

function setFormToViewMode() {
    console.log("View Mode - Question", currentQuestion + 1);
    notifObject.notify("Switched to view mode", "success");
    updateTtsButtonStates(false); 
    
    saveButton.style.display = "none";
    editButton.style.display = "inline";
    nextButton.disabled = false;

    toTeacherPageButton.disabled = false;
    
    answerRadioButtonsDisable(true);
    passageTitle.readOnly = true;
    passage.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });

    previousButton.disabled = currentQuestion === 0;
}

function setFormToEditMode() {
    console.log("Edit Mode - Question", currentQuestion + 1);
    notifObject.notify("Switched to edit mode", "success");
    originalQuestionText = passage.value.trim();
    originalPassageTitle = passageTitle.value.trim();
    
    updateTtsButtonStates(true); // true = edit mode
    
    saveButton.style.display = "inline";
    editButton.style.display = "none";
    checkInputState();
    
    passageTitle.readOnly = false;
    passage.readOnly = false;
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

    const getPassageTitle = passageTitle.value.trim();
    const getQuestion = passage.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getPassageTitle) {
        notifObject.notify("Please enter a passage title", "error");
        return;
    }

    if (!getQuestion) {
        notifObject.notify("Please enter a passage", "error");
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
        originalPassageTitle = getPassageTitle;
    }

    const newQuestion = {
        passageTitle: getPassageTitle,
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
        const passageTitleSame = existingQuestion.passageTitle === newQuestion.passageTitle;
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        // Compare choices array
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = passageTitleSame && questionTextSame && answerSame && choicesSame;
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
                notifObject.notify(result.message, "success")
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
    }else {
        notifObject.dismissLoading(loadingId);
    }

    setFormToViewMode();
}

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

    const getPassageTitle = passageTitle.value.trim();
    const getQuestion = passage.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getPassageTitle) {
        notifObject.notify("Please enter a passage title", "error");
        return;
    }

    if (!getQuestion) {
        notifObject.notify("Please enter a passage", "error");
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
        originalPassageTitle = getPassageTitle;
    }

    const newQuestion = {
        passageTitle: getPassageTitle,
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
        const passageTitleSame = existingQuestion.passageTitle === newQuestion.passageTitle;
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        // Compare choices array
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = passageTitleSame && questionTextSame && answerSame && choicesSame;
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
                notifObject.notify(result.message, "success")
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
    }else {
        notifObject.dismissLoading(loadingId);
        sessionStorage.removeItem('originalActivityTitle');
        sessionStorage.removeItem('questions');
        sessionStorage.removeItem('currentActivityId');
        sessionStorage.removeItem('currentActivityTitle');
        sessionStorage.removeItem('ttsInputs');
        sessionStorage.removeItem("contentType");
        window.location.href = '/teacher_dashboard';
    }

    setFormToViewMode();
}

function clearForm() {
    keyWordTtsObj.clearAudioFile();
    originalQuestionText = ""; 
    originalPassageTitle = "";
    updateTtsButtonStates(true); // true = edit mode
    
    passageTitle.value = "";
    passage.value = "";
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
    passageTitle.value = questionData.passageTitle || "";
    passage.value = questionData.question;
    
    // Store the original question text when loading
    originalQuestionText = questionData.question || "";
    originalPassageTitle = questionData.passageTitle || "";

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