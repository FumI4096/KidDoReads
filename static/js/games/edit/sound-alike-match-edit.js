import SpeechManager from '../../modules/SpeechManager.js'
import Notification from '../../modules/Notification.js'

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
console.log(ttsObject[currentQuestion])
let originalKeyWordText = "" // Track original keyword text
let originalSentenceText = "" // Track original sentence text

const teacherId = sessionStorage.getItem("id")
const contentId = sessionStorage.getItem("currentActivityId")
const ttsId = sessionStorage.getItem("currentTtsId")
const currentTitle = sessionStorage.getItem("currentActivityTitle")

const categoryDisplay = document.getElementById("category-display")
const contentDisplay = document.getElementById("content-display")

const storedTypes = JSON.parse(sessionStorage.getItem("contentType"))

const ttsConvertButton1 = document.getElementById('tts-convert-button-1')
const ttsPlayButton1 = document.getElementById('tts-play-button-1')

const ttsConvertButton2 = document.getElementById('tts-convert-button-2')
const ttsPlayButton2 = document.getElementById('tts-play-button-2')

const notifObject = new Notification()
const keyWordTtsObj = new SpeechManager() // For keyword
const sentenceTtsObj = new SpeechManager() // For sentence

categoryDisplay.textContent = storedTypes.category
contentDisplay.textContent = storedTypes.content

displayActivityTitle.textContent = `Title: ${currentTitle}`

toTeacherPageButton.addEventListener('click', async () => {
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
    setFormToViewMode();
    previousButton.disabled = true;
} 
else {
    clearForm();
    editButton.style.display = "none";
    saveButton.style.display = "inline";
    nextButton.disabled = true;
    previousButton.disabled = true;
    saveButton.disabled = true;
}

function hasKeyWordTextChanged() {
    const currentText = keyWordInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion, 'keyword') !== null;
    
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalKeyWordText;
}

function hasSentenceTextChanged() {
    const currentText = sentenceInput.value.trim();
    const audioExists = getAudioForQuestion(currentQuestion, 'sentence') !== null;
    
    if (!audioExists) {
        return false;
    }
    
    return currentText !== originalSentenceText;
}

function getAudioForQuestion(index, type) {
    // Check for newly generated audio (not yet saved)
    const ttsManager = type === 'keyword' ? keyWordTtsObj : sentenceTtsObj;
    const currentAudioFile = ttsManager.getAudioFile();
    
    if (index === currentQuestion && currentAudioFile) {
        return currentAudioFile;
    }
    
    // Check stored TTS object
    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index]) {
        if (type === 'keyword' && ttsData[index].keywordUrl) {
            return ttsData[index].keywordUrl;
        }
        if (type === 'sentence' && ttsData[index].sentenceAudio) {
            return ttsData[index].sentenceAudio;
        }
    }
    
    return null;
}

function updateKeywordTtsButtonStates(isEditMode = false) {
    const audioUrl = getAudioForQuestion(currentQuestion, 'keyword');
    const hasAudio = audioUrl !== null;
    const hasText = keyWordInput.value.trim() !== '';
    const textChanged = hasKeyWordTextChanged();
    
    if (isEditMode) {
        if (hasAudio && !textChanged) {
            ttsConvertButton1.disabled = false;
            ttsPlayButton1.disabled = false;
            changeTtsConvertButtonText(ttsConvertButton1, "Reconvert Keyword");
        } 
        else if (hasAudio && textChanged) {
            ttsConvertButton1.disabled = false;
            ttsPlayButton1.disabled = false;
            changeTtsConvertButtonText(ttsConvertButton1, "Reconvert Keyword (Required)");
        } 
        else if (hasText) {
            ttsConvertButton1.disabled = false;
            ttsPlayButton1.disabled = true;
            changeTtsConvertButtonText(ttsConvertButton1, "Convert Keyword");
        } 
        else {
            ttsConvertButton1.disabled = true;
            ttsPlayButton1.disabled = true;
            changeTtsConvertButtonText(ttsConvertButton1, "Convert Keyword");
        }
    } 
    else {
        ttsConvertButton1.disabled = true;
        ttsPlayButton1.disabled = !hasAudio;
        
        if (hasAudio) {
            changeTtsConvertButtonText(ttsConvertButton1, "Converted");
        } 
        else {
            changeTtsConvertButtonText(ttsConvertButton1, "Convert Keyword");
        }
    }
    
    console.log(`Keyword TTS - Question ${currentQuestion + 1}, Audio: ${hasAudio ? 'Yes' : 'No'}, Changed: ${textChanged}, Edit: ${isEditMode}`);
}


function updateSentenceTtsButtonStates(isEditMode = false) {
    const audioUrl = getAudioForQuestion(currentQuestion, 'sentence');
    const hasAudio = audioUrl !== null;
    const hasText = sentenceInput.value.trim() !== '';
    const textChanged = hasSentenceTextChanged();
    
    if (isEditMode) {
        if (hasAudio && !textChanged) {
            ttsConvertButton2.disabled = false;
            ttsPlayButton2.disabled = false;
            changeTtsConvertButtonText(ttsConvertButton2, "Reconvert Sentence");
        } 
        else if (hasAudio && textChanged) {
            ttsConvertButton2.disabled = false;
            ttsPlayButton2.disabled = false;
            changeTtsConvertButtonText(ttsConvertButton2, "Reconvert Sentence (Required)");
        } 
        else if (hasText) {
            ttsConvertButton2.disabled = false;
            ttsPlayButton2.disabled = true;
            changeTtsConvertButtonText(ttsConvertButton2, "Convert Sentence");
        } 
        else {
            ttsConvertButton2.disabled = true;
            ttsPlayButton2.disabled = true;
            changeTtsConvertButtonText(ttsConvertButton2, "Convert Sentence");
        }
    } 
    else {
        ttsConvertButton2.disabled = true;
        ttsPlayButton2.disabled = !hasAudio;
        
        if (hasAudio) {
            changeTtsConvertButtonText(ttsConvertButton2, "Converted");
        } 
        else {
            changeTtsConvertButtonText(ttsConvertButton2, "Convert Sentence");
        }
    }
    
    console.log(`Sentence TTS - Question ${currentQuestion + 1}, Audio: ${hasAudio ? 'Yes' : 'No'}, Changed: ${textChanged}, Edit: ${isEditMode}`);
}

function changeTtsConvertButtonText(button, text) {
    const span = button.querySelector('span');
    if (span) {
        span.textContent = text;
    } else {
        button.textContent = text;
    }
}

function hasDuplicateKeyword() {
    const currentKeyword = keyWordInput.value.trim().toLowerCase();
    
    if (!currentKeyword) return false;
    
    for (let i = 0; i < questionObject.length; i++) {
        // Skip current question
        if (i === currentQuestion) continue;
        
        const otherKeyword = questionObject[i].keyWord?.trim().toLowerCase();
        const otherSentence = questionObject[i].sentence?.trim().toLowerCase();
        
        if (otherKeyword === currentKeyword || otherSentence === currentKeyword) {
            return true;
        }
    }
    
    return false;
}


function hasDuplicateSentence() {
    const currentSentence = sentenceInput.value.trim().toLowerCase();
    
    if (!currentSentence) return false;
    
    for (let i = 0; i < questionObject.length; i++) {
        // Skip current question
        if (i === currentQuestion) continue;
        
        const otherKeyword = questionObject[i].keyWord?.trim().toLowerCase();
        const otherSentence = questionObject[i].sentence?.trim().toLowerCase();
        
        if (otherKeyword === currentSentence || otherSentence === currentSentence) {
            return true;
        }
    }
    
    return false;
}

// Keyword TTS Convert Button
ttsConvertButton1.addEventListener("click", async () => {
    const audioUrl = getAudioForQuestion(currentQuestion, 'keyword');
    const isReconvert = audioUrl !== null;

    if(sentenceInput.value === keyWordInput.value || hasDuplicateKeyword()){
        notifObject.notify("Duplicated word detected in keyword! Please provide a different text", 'error')

        return;
    }
    
    ttsConvertButton1.disabled = true;
    changeTtsConvertButtonText(ttsConvertButton1, isReconvert ? "Reconverting..." : "Converting...");
    
    try {
        if (isReconvert) {
            keyWordTtsObj.setAudioFile(audioUrl);
            const deleted = await keyWordTtsObj.deleteSpeech();
            
            if (deleted) {
                ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
                console.log(ttsObject)
                if (ttsObject[currentQuestion]) {
                    ttsObject[currentQuestion].keywordUrl = "";
                }
                sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
                keyWordTtsObj.clearAudioFile();
            } else {
                throw new Error("Failed to delete old speech");
            }
        }
        
        await keyWordTtsObj.generateSpeech(keyWordInput.value, ttsId.toString());
        originalKeyWordText = keyWordInput.value.trim();

        console.log("Generated Speech for Keyword: " + keyWordTtsObj.getAudioFile())

        updateKeywordTtsButtonStates(true);
        checkInputState();
        
        notifObject.notify(
            isReconvert ? 'Keyword reconverted successfully!' : 'Keyword converted successfully!', 
            'success'
        );
        
    } catch (error) {
        console.error('Error generating keyword speech:', error);
        notifObject.notify(
            isReconvert ? 'Failed to reconvert keyword' : 'Failed to generate keyword speech', 
            'error'
        );
        
        updateKeywordTtsButtonStates(true);
    }
});

// Keyword TTS Play Button
ttsPlayButton1.addEventListener("click", () => {
    const audioUrl = getAudioForQuestion(currentQuestion, 'keyword');
    
    if (audioUrl) {
        keyWordTtsObj.play(audioUrl, ttsPlayButton1);
    } else {
        notifObject.notify("No keyword speech to play", "error");
    }
});

// Sentence TTS Convert Button
ttsConvertButton2.addEventListener("click", async () => {
    const audioUrl = getAudioForQuestion(currentQuestion, 'sentence');
    const isReconvert = audioUrl !== null;

    if(sentenceInput.value === keyWordInput.value || hasDuplicateSentence()){
        notifObject.notify("Duplicated word detected in sentence! Please provide a different text", 'error')

        return;
    }
    
    ttsConvertButton2.disabled = true;
    changeTtsConvertButtonText(ttsConvertButton2, isReconvert ? "Reconverting..." : "Converting...");
    
    try {
        if (isReconvert) {
            sentenceTtsObj.setAudioFile(audioUrl);
            const deleted = await sentenceTtsObj.deleteSpeech();
            
            if (deleted) {
                ttsObject = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
                console.log(ttsObject)
                if (ttsObject[currentQuestion]) {
                    ttsObject[currentQuestion].sentenceAudio = "";
                }
                sessionStorage.setItem('ttsInputs', JSON.stringify(ttsObject));
                console.log(ttsObject)
            } else {
                throw new Error("Failed to delete old speech");
            }
        }
        
        await sentenceTtsObj.generateSpeech(sentenceInput.value, ttsId.toString());
        originalSentenceText = sentenceInput.value.trim();

        console.log("Generated Speech for Sentence: " + sentenceTtsObj.getAudioFile())

        updateSentenceTtsButtonStates(true);
        checkInputState();
        
        notifObject.notify(
            isReconvert ? 'Sentence reconverted successfully!' : 'Sentence converted successfully!', 
            'success'
        );
        
    } catch (error) {
        console.error('Error generating sentence speech:', error);
        notifObject.notify(
            isReconvert ? 'Failed to reconvert sentence' : 'Failed to generate sentence speech', 
            'error'
        );
        
        updateSentenceTtsButtonStates(true);
    }
});

// Sentence TTS Play Button
ttsPlayButton2.addEventListener("click", () => {
    const audioUrl = getAudioForQuestion(currentQuestion, 'sentence');
    
    if (audioUrl) {
        sentenceTtsObj.play(audioUrl, ttsPlayButton2);
    } else {
        notifObject.notify("No sentence speech to play", "error");
    }
});

// Input listeners for text changes
keyWordInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion, 'keyword') !== null;
        const hasText = keyWordInput.value.trim() !== '';
        const textChanged = hasKeyWordTextChanged();
        
        if (hasAudio && textChanged && hasText) {
            changeTtsConvertButtonText(ttsConvertButton1, "Reconvert Keyword (Required)");
        } else if (hasAudio && !textChanged) {
            changeTtsConvertButtonText(ttsConvertButton1, "Reconvert Keyword");
        } else if (!hasAudio && hasText) {
            changeTtsConvertButtonText(ttsConvertButton1, "Convert Keyword");
        }
        
        updateKeywordTtsButtonStates(true);
    }
    checkInputState();
});

sentenceInput.addEventListener("input", () => {
    const isEditMode = editButton.style.display === "none";
    if (isEditMode) {
        const hasAudio = getAudioForQuestion(currentQuestion, 'sentence') !== null;
        const hasText = sentenceInput.value.trim() !== '';
        const textChanged = hasSentenceTextChanged();
        
        if (hasAudio && textChanged && hasText) {
            changeTtsConvertButtonText(ttsConvertButton2, "Reconvert Sentence (Required)");
        } else if (hasAudio && !textChanged) {
            changeTtsConvertButtonText(ttsConvertButton2, "Reconvert Sentence");
        } else if (!hasAudio && hasText) {
            changeTtsConvertButtonText(ttsConvertButton2, "Convert Sentence");
        }
        
        updateSentenceTtsButtonStates(true);
    }
    checkInputState();
});

function checkInputState() {
    const getKeyWord = keyWordInput.value.trim();
    const getSentence = sentenceInput.value.trim();
    const checkedRadioButton = document.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";
    const getChoices = Array.from(choicesContainer.querySelectorAll(".choice-box .choice"));
    const hasEmptyChoice = getChoices.some(choice => choice.value.trim() === "");
    
    // Check both audio URLs
    const hasKeywordAudio = getAudioForQuestion(currentQuestion, 'keyword') !== null;
    const hasSentenceAudio = getAudioForQuestion(currentQuestion, 'sentence') !== null;
    const keywordChanged = hasKeyWordTextChanged();
    const sentenceChanged = hasSentenceTextChanged();

    // Can't save if either text changed but hasn't been reconverted
    const needsKeywordReconvert = hasKeywordAudio && keywordChanged;
    const needsSentenceReconvert = hasSentenceAudio && sentenceChanged;
    
    const isComplete = getKeyWord && getSentence && getAnswer && hasKeywordAudio && hasSentenceAudio && !hasEmptyChoice && !needsKeywordReconvert && !needsSentenceReconvert;

    saveButton.disabled = !isComplete;
}

function setFormToViewMode() {
    console.log("View Mode - Question", currentQuestion + 1);
    
    updateKeywordTtsButtonStates(false);
    updateSentenceTtsButtonStates(false);
    
    saveButton.style.display = "none";
    editButton.style.display = "inline";
    nextButton.disabled = false;
    
    answerRadioButtonsDisable(true);
    keyWordInput.readOnly = true;
    sentenceInput.readOnly = true;
    choicesContainer.querySelectorAll(".choice-box .choice").forEach(choice => {
        choice.readOnly = true;
    });

    previousButton.disabled = currentQuestion === 0;
}

function setFormToEditMode() {
    console.log("Edit Mode - Question", currentQuestion + 1);
    
    originalKeyWordText = keyWordInput.value.trim();
    originalSentenceText = sentenceInput.value.trim();
    
    updateKeywordTtsButtonStates(true);
    updateSentenceTtsButtonStates(true);
    
    saveButton.style.display = "inline";
    editButton.style.display = "none";
    checkInputState();
    
    keyWordInput.readOnly = false;
    sentenceInput.readOnly = false;
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

    const getKeyWord = keyWordInput.value.trim();
    const getSentence = sentenceInput.value.trim();
    const getChoices = choicesContainer.querySelectorAll(".choice-box .choice");
    const checkedRadioButton = answerContainer.querySelector('input[name="answer"]:checked');
    const getAnswer = checkedRadioButton ? checkedRadioButton.value : "";

    if (!getKeyWord) {
        notifObject.notify("Please enter a keyword", "error");
        return;
    }

    if (!getSentence) {
        notifObject.notify("Please enter a sentence", "error");
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

    const keywordAudioUrl = getAudioForQuestion(currentQuestion, 'keyword');
    const sentenceAudioUrl = getAudioForQuestion(currentQuestion, 'sentence');

    if (!ttsObject[currentQuestion]) {
        ttsObject[currentQuestion] = {};
    }
    
    if (!keywordAudioUrl) {
        notifObject.notify("Please generate speech for keyword", "error");
        return;
    }

    if (!sentenceAudioUrl) {
        notifObject.notify("Please generate speech for sentence", "error");
        return;
    }

    // Save both audio URLs
    const currentKeywordAudio = keyWordTtsObj.getAudioFile();
    const currentSentenceAudio = sentenceTtsObj.getAudioFile();
    
    let audioChanged = false;

    if (currentKeywordAudio) {
        // Check if keyword audio is different from stored audio
        const storedKeywordAudio = ttsObject[currentQuestion]?.keywordUrl;
        if (storedKeywordAudio !== currentKeywordAudio) {
            audioChanged = true;
            console.log("Keyword audio changed:", storedKeywordAudio, "->", currentKeywordAudio);
        }
        ttsObject[currentQuestion].keywordUrl = currentKeywordAudio;
        keyWordTtsObj.clearAudioFile();
        originalKeyWordText = getKeyWord;
    }
    
    if (currentSentenceAudio) {
        // Check if sentence audio is different from stored audio
        const storedSentenceAudio = ttsObject[currentQuestion]?.sentenceAudio;
        if (storedSentenceAudio !== currentSentenceAudio) {
            audioChanged = true;
            console.log("Sentence audio changed:", storedSentenceAudio, "->", currentSentenceAudio);
        }
        ttsObject[currentQuestion].sentenceAudio = currentSentenceAudio;
        sentenceTtsObj.clearAudioFile();
        originalSentenceText = getSentence;
    }

    const newQuestion = {
        keyWord: getKeyWord,
        sentence: getSentence,
        choices: currentChoices,
        answer: getAnswer
    };

    if (audioChanged) {
        try {
            const formDataTts = new FormData();
            
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
                notifObject.notify('Audios updated succesfully for this question!', 'success')
            }
            else{
                console.log(result.message)
                notifObject.notify(result.message, "error")

            }
        } 
        catch (error) {
            console.log(error);
            notifObject.notify("Cannot save audio files", "error");
            return;
        }
    }

    const questionUnchanged = JSON.stringify(newQuestion) === JSON.stringify(questionObject[currentQuestion]);

    
    if (!questionUnchanged){
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
            
            if (response.ok && result.status) {
                console.log(result.message);
                notifObject.notify('Question saved successfully!', 'success');
            } else {
                console.log("Error saving content:", result.message);
                notifObject.notify('Failed to save question', 'error');
            }
        } catch (error) {
            console.error(error);
            notifObject.notify('Error saving question', 'error');
        }
    }

    setFormToViewMode();
}

function clearForm() {
    keyWordTtsObj.clearAudioFile();
    sentenceTtsObj.clearAudioFile();
    originalKeyWordText = "";
    originalSentenceText = "";
    
    updateKeywordTtsButtonStates(true);
    updateSentenceTtsButtonStates(true);
    
    keyWordInput.value = "";
    sentenceInput.value = "";
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
            const hasGeneratedKeywordSpeech = keyWordTtsObj.getAudioFile() !== "";
            const hasGeneratedSentenceSpeech = sentenceTtsObj.getAudioFile() !== "";
            
            if (hasGeneratedKeywordSpeech || hasGeneratedSentenceSpeech) {
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
    keyWordInput.value = questionData.keyWord || "";
    sentenceInput.value = questionData.sentence || "";
    
    originalKeyWordText = questionData.keyWord || "";
    originalSentenceText = questionData.sentence || "";

    const ttsData = JSON.parse(sessionStorage.getItem("ttsInputs") || "[]");
    if (ttsData[index]) {
        if (ttsData[index].keywordUrl) {
            keyWordTtsObj.setAudioFile(ttsData[index].keywordUrl);
        } else {
            keyWordTtsObj.clearAudioFile();
        }
        
        if (ttsData[index].sentenceAudio) {
            sentenceTtsObj.setAudioFile(ttsData[index].sentenceAudio);
        } else {
            sentenceTtsObj.clearAudioFile();
        }
    } else {
        // No audio for this question yet
        keyWordTtsObj.clearAudioFile();
        sentenceTtsObj.clearAudioFile();
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
    
    updateKeywordTtsButtonStates(false);
    updateSentenceTtsButtonStates(false);
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