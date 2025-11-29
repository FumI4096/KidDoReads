import SpeechManager from '../../modules/SpeechManager.js'
import Notification from '../../modules/Notification.js'
import { decrypt } from '../../modules/SessionHandling.js'

const displayActivityTitle = document.getElementById('display-activity-title')
const toTeacherPageButton = document.getElementById('to-teacher-page-button')
const prefixSuffixInput = document.getElementById("prefix-suffix")
const prefixSuffixMeaningInput = document.getElementById("prefix-suffix-meaning")
const questionInput = document.getElementById("question")
const choicesContainer = document.getElementById("choice-box-container")
const answerContainer = document.getElementById("answer-container")
const saveButton = document.getElementById("save-button")
const nextButton = document.getElementById("next-button")
const previousButton = document.getElementById("previous-button")
const editButton = document.getElementById("edit-button")

let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");
let ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
let currentQuestion = 0
let originalQuestionText = "" // Track the original question text that was converted
let originalPrefixSuffix = "" // Track the original prefix/suffix text that was converted
let originalPrefixSuffixMeaning = "" // Track the original prefix/suffix meaning that was converted

const teacherId = await decrypt(sessionStorage.getItem("id"))
const contentId = await decrypt(sessionStorage.getItem("currentActivityId"))
const ttsId = await decrypt(sessionStorage.getItem("currentTtsId"))
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const ttsConvertButton = document.getElementById('tts-convert-button')
const ttsPlayButton = document.getElementById('tts-play-button')

categoryDisplay.textContent = "Word Recognition"
contentDisplay.textContent = "Meaning Maker"

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

function hasQuestionTextChanged() {
    const currentText = questionInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalQuestionText;
}

function hasPrefixSuffixChanged() {
    const currentText = prefixSuffixInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalPrefixSuffix;
}

function hasPrefixSuffixMeaningChanged() {
    const currentText = prefixSuffixMeaningInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion) !== null;
    
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalPrefixSuffixMeaning;
}

function hasAnyTtsInputChanged() {
    return hasQuestionTextChanged() || hasPrefixSuffixChanged() || hasPrefixSuffixMeaningChanged();
}

function getAudioForQuestion(index) {
    const currentAudioFile = keyWordTtsObj.getAudioFile();
    
    if (index === currentQuestion && currentAudioFile) {
        return currentAudioFile;
    }
    
    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index] && ttsData[index].audioUrl) {
        return ttsData[index].audioUrl;
    }
    
    return null;
}

function updateTtsButtonStates(isEditMode = false) {
    const audioUrl = getAudioForQuestion(currentQuestion);
    const hasAudio = audioUrl !== null;
    const hasQuestionText = questionInput.value.trim() !== '';
    const hasPrefixSuffixText = prefixSuffixInput.value.trim() !== '';
    const hasPrefixSuffixMeaningText = prefixSuffixMeaningInput.value.trim() !== '';
    const ttsInputChanged = hasAnyTtsInputChanged();
    
    if (isEditMode) {
        if (hasAudio && !ttsInputChanged) {
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false;
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } 
        else if (hasAudio && ttsInputChanged) {
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = false;
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } 
        else if (hasQuestionText && hasPrefixSuffixText && hasPrefixSuffixMeaningText) {
            ttsConvertButton.disabled = false;
            ttsPlayButton.disabled = true;
            changeTtsConvertButtonText("Convert Text-To-Speech");
        } 
        else {
            ttsConvertButton.disabled = true;
            ttsPlayButton.disabled = true;
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
    } 
    else {
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
    const getPrefixSuffix = prefixSuffixInput.value.trim();
    const getPrefixSuffixMeaning = prefixSuffixMeaningInput.value.trim();
    const getQuestion = questionInput.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");
    const hasAudio = getAudioForQuestion(currentQuestion) !== null;
    const ttsInputChanged = hasAnyTtsInputChanged();

    const needsReconvert = hasAudio && ttsInputChanged;
    const isComplete = getPrefixSuffix && getPrefixSuffixMeaning && getQuestion && getAnswer && hasAudio && !hasEmptyChoice && !needsReconvert;

    saveButton.disabled = !isComplete;
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
    const isReconvert = audioUrl !== null;

    if(hasDuplicateQuestion()){
        notifObject.notify("Duplicated keyword detected in this question. Please provide another text", "error")
        return;
    }
    
    ttsConvertButton.disabled = true;
    ttsPlayButton.disabled = true;
    changeTtsConvertButtonText(isReconvert ? "Reconverting..." : "Converting...");
    
    try {
        if (isReconvert) {
            keyWordTtsObj.setAudioFile(audioUrl);
            const deleted = await keyWordTtsObj.deleteSpeech();
            
            if (deleted) {
                ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
                if (ttsObject[currentQuestion]) {
                    ttsObject[currentQuestion].audioUrl = "";
                }
                sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
                keyWordTtsObj.clearAudioFile();
            } else {
                throw new Error("Failed to delete old speech");
            }
        }
        
        await keyWordTtsObj.generateSpeech(`\(${prefixSuffixInput.value.trim()}\), \(${questionInput.value}\), \(${prefixSuffixMeaningInput.value.trim()}\)`, ttsId.toString(), 4);

        originalQuestionText = questionInput.value.trim();
        originalPrefixSuffix = prefixSuffixInput.value.trim();
        originalPrefixSuffixMeaning = prefixSuffixMeaningInput.value.trim();

        updateTtsButtonStates(true);
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

prefixSuffixInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasPrefixSuffixText = prefixSuffixInput.value.trim() !== '';
        const hasQuestionText = questionInput.value.trim() !== '';
        const hasPrefixSuffixMeaningText = prefixSuffixMeaningInput.value.trim() !== '';
        const ttsInputChanged = hasAnyTtsInputChanged();
        
        if (hasAudio && ttsInputChanged && hasPrefixSuffixText && hasQuestionText && hasPrefixSuffixMeaningText) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !ttsInputChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasPrefixSuffixText && hasQuestionText && hasPrefixSuffixMeaningText) {
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

prefixSuffixMeaningInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasPrefixSuffixMeaningText = prefixSuffixMeaningInput.value.trim() !== '';
        const hasQuestionText = questionInput.value.trim() !== '';
        const hasPrefixSuffixText = prefixSuffixInput.value.trim() !== '';
        const ttsInputChanged = hasAnyTtsInputChanged();
        
        if (hasAudio && ttsInputChanged && hasPrefixSuffixMeaningText && hasQuestionText && hasPrefixSuffixText) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !ttsInputChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasPrefixSuffixMeaningText && hasQuestionText && hasPrefixSuffixText) {
            changeTtsConvertButtonText("Convert Text-To-Speech");
        }
        
        updateTtsButtonStates(true);
    }
    checkInputState();
});

questionInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion) !== null;
        const hasText = questionInput.value.trim() !== '';
        const hasPrefixSuffixText = prefixSuffixInput.value.trim() !== '';
        const hasPrefixSuffixMeaningText = prefixSuffixMeaningInput.value.trim() !== '';
        const ttsInputChanged = hasAnyTtsInputChanged();
        
        if (hasAudio && ttsInputChanged && hasText && hasPrefixSuffixText && hasPrefixSuffixMeaningText) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech (Required)");
        } else if (hasAudio && !ttsInputChanged) {
            changeTtsConvertButtonText("Reconvert Text-To-Speech");
        } else if (!hasAudio && hasText && hasPrefixSuffixText && hasPrefixSuffixMeaningText) {
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
    
    // Enable save and exit button in view mode
    toTeacherPageButton.disabled = false;
    
    answerRadioButtonsDisable(true);
    prefixSuffixInput.readOnly = true;
    prefixSuffixMeaningInput.readOnly = true;
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
    originalPrefixSuffix = prefixSuffixInput.value.trim();
    originalPrefixSuffixMeaning = prefixSuffixMeaningInput.value.trim();
    
    updateTtsButtonStates(true);
    
    saveButton.style.display = "inline";
    editButton.style.display = "none";
    checkInputState();
    
    prefixSuffixInput.readOnly = false;
    prefixSuffixMeaningInput.readOnly = false;
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

    const getPrefixSuffix = prefixSuffixInput.value.trim();
    const getPrefixSuffixMeaning = prefixSuffixMeaningInput.value.trim();
    const getQuestion = questionInput.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getPrefixSuffix) {
        notifObject.notify("Please enter a prefix/suffix", "error");
        return;
    }

    if (!getPrefixSuffixMeaning) {
        notifObject.notify("Please enter the meaning", "error");
        return;
    }

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
        originalPrefixSuffix = getPrefixSuffix;
        originalPrefixSuffixMeaning = getPrefixSuffixMeaning;
    }

    const newQuestion = {
        prefixSuffix: getPrefixSuffix,
        prefixSuffixMeaning: getPrefixSuffixMeaning,
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
        
        // Compare individual properties
        const prefixSuffixSame = existingQuestion.prefixSuffix === newQuestion.prefixSuffix;
        const prefixSuffixMeaningSame = existingQuestion.prefixSuffixMeaning === newQuestion.prefixSuffixMeaning;
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        // Compare choices array
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = prefixSuffixSame && prefixSuffixMeaningSame && questionTextSame && answerSame && choicesSame;
        
        console.log("Prefix/Suffix same?", prefixSuffixSame);
        console.log("Meaning same?", prefixSuffixMeaningSame);
        console.log("Question text same?", questionTextSame);
        console.log("Answer same?", answerSame);
        console.log("Choices same?", choicesSame);
        console.log("Question unchanged?", questionUnchanged);
    } else {
        console.log("No existing question at index", currentQuestion);
    }

    // Exit early if nothing changed
    if (questionUnchanged && !audioChanged) {
        console.log("No changes detected - skipping save");
        setFormToViewMode();
        return;
    }

    console.log("Changes detected - Question:", !questionUnchanged, "Audio:", audioChanged);

    const loadingId = `loading-save-${Date.now()}`;
    notifObject.notify("Saving question...", "loading", null, null, loadingId);

    // Save audio if changed
    if (audioChanged) {
        try {
            const formDataTts = new FormData();
            console.log(ttsObject);
        
            formDataTts.append('ttsId', ttsId);
            formDataTts.append('ttsAudios', JSON.stringify(ttsObject));
            const speechUrl = '/update-speech';
    
            const response = await fetch(speechUrl, {
                method: 'POST',
                body: formDataTts
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                console.log("Audios stored successfully");
                sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
            } else {
                console.log(result.message);
                notifObject.dismissLoading(loadingId);
                notifObject.notify(result.message, "error");
                return;
            }
        } catch (error) {
            console.log(error);
            notifObject.dismissLoading(loadingId);
            notifObject.notify("Cannot save audio", "error");
            return;
        }
    }

    // Save question if changed
    if (!questionUnchanged) {
        const questionExist = Boolean(questionObject[currentQuestion]);
        if (questionExist) {
            console.log("Updating existing question");
            questionObject[currentQuestion] = newQuestion;
        } else {
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
            
            if (response.ok && result.status) {
                console.log(result.message);
                notifObject.notify('Question saved successfully!', 'success');
            } else {
                console.log("Error saving content:", result.message);
                notifObject.notify('Failed to save question', 'error');
                return;
            }
        } catch (error) {
            notifObject.dismissLoading(loadingId);
            console.error(error);
            notifObject.notify('Error saving question', 'error');
            return;
        }
    } else {
        notifObject.dismissLoading(loadingId);
        console.log("Question unchanged - skipping question save");
    }

    setFormToViewMode();
}

// Save and Exit function
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

    const getPrefixSuffix = prefixSuffixInput.value.trim();
    const getPrefixSuffixMeaning = prefixSuffixMeaningInput.value.trim();
    const getQuestion = questionInput.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getPrefixSuffix) {
        notifObject.notify("Please enter a prefix/suffix", "error");
        return;
    }

    if (!getPrefixSuffixMeaning) {
        notifObject.notify("Please enter the meaning", "error");
        return;
    }

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
        originalPrefixSuffix = getPrefixSuffix;
        originalPrefixSuffixMeaning = getPrefixSuffixMeaning;
    }

    const newQuestion = {
        prefixSuffix: getPrefixSuffix,
        prefixSuffixMeaning: getPrefixSuffixMeaning,
        question: getQuestion,
        choices: currentChoices,
        answer: getAnswer
    };

    const existingQuestion = questionObject[currentQuestion];
    let questionUnchanged = false;

    if (existingQuestion) {
        console.log("Comparing questions:");
        console.log("Existing:", existingQuestion);
        console.log("New:", newQuestion);
        
        const prefixSuffixSame = existingQuestion.prefixSuffix === newQuestion.prefixSuffix;
        const prefixSuffixMeaningSame = existingQuestion.prefixSuffixMeaning === newQuestion.prefixSuffixMeaning;
        const questionTextSame = existingQuestion.question === newQuestion.question;
        const answerSame = existingQuestion.answer === newQuestion.answer;
        
        const choicesSame = existingQuestion.choices.length === newQuestion.choices.length && existingQuestion.choices.every((choice, index) => choice === newQuestion.choices[index]);
        
        questionUnchanged = prefixSuffixSame && prefixSuffixMeaningSame && questionTextSame && answerSame && choicesSame;
        
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

    if (audioChanged) {
        try {
            const formDataTts = new FormData();
            console.log(ttsObject);
        
            formDataTts.append('ttsId', ttsId);
            formDataTts.append('ttsAudios', JSON.stringify(ttsObject));
            const speechUrl = '/update-speech';
    
            const response = await fetch(speechUrl, {
                method: 'POST',
                body: formDataTts
            });
    
            const result = await response.json();
    
            if (response.ok && result.status) {
                console.log("Audios stored successfully");
                sessionStorage.setItem("ttsInputs", JSON.stringify(ttsObject));
            } else {
                console.log(result.message);
                notifObject.dismissLoading(loadingId);
                notifObject.notify(result.message, "error");
                return;
            }
        } catch (error) {
            console.log(error);
            notifObject.dismissLoading(loadingId);
            notifObject.notify("Cannot save audio", "error");
            return;
        }
    }

    if (!questionUnchanged) {
        const questionExist = Boolean(questionObject[currentQuestion]);
        if (questionExist) {
            console.log("Updating existing question");
            questionObject[currentQuestion] = newQuestion;
        } else {
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
            
            if (response.ok && result.status) {
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
            } else {
                console.log("Error saving content:", result.message);
                notifObject.notify('Failed to save question', 'error');
                return;
            }
        } catch (error) {
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
    originalPrefixSuffix = "";
    originalPrefixSuffixMeaning = "";
    updateTtsButtonStates(true);
    
    prefixSuffixInput.value = "";
    prefixSuffixMeaningInput.value = "";
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
        if (currentQuestion === questionObject.length) {
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
    prefixSuffixInput.value = questionData.prefixSuffix || "";
    prefixSuffixMeaningInput.value = questionData.prefixSuffixMeaning || "";
    questionInput.value = questionData.question || "";
    
    originalQuestionText = questionData.question || "";
    originalPrefixSuffix = questionData.prefixSuffix || "";
    originalPrefixSuffixMeaning = questionData.prefixSuffixMeaning || "";

    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index]) {
        if (ttsData[index].audioUrl) {
            keyWordTtsObj.setAudioFile(ttsData[index].audioUrl);
        } else {
            keyWordTtsObj.clearAudioFile();
        }
    } else {
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
    
    updateTtsButtonStates(false);
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