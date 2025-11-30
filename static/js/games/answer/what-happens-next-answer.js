import { decrypt } from '../../modules/SessionHandling.js'
import MascotPlaySpeech from '../../modules/MascotPlaySpeech.js'
import { checkAttemptsByStudentID, checkActivityAttemptsByStudentID, checkAssessmentAttemptsByStudentID, checkPerfectScoresByStudentID } from '../../modules/Achievement.js';
import Notification from '../../modules/Notification.js'
import ScoreEvaluator from '../../modules/ScoreEvaluation.js'  

const scoreAudios = {
    perfect: new Audio('/static/upload_score_voices/perfect_score_1764465112187.mp3'),
    great: new Audio('/static/upload_score_voices/great_job_1764465111173.mp3'),
    good: new Audio('/static/upload_score_voices/good_work_1764465111836.mp3'),
    bad: new Audio('/static/upload_score_voices/keep_trying_1764465111887.mp3')
};

// Preload all
Object.values(scoreAudios).forEach(audio => {
    audio.preload = 'auto';
    audio.load();
});

const displayActivityTitle = document.getElementById('display-activity-title');
const toDashboardPageButton = document.getElementById('to-dashboard-page-button');
const questionContainer = document.querySelector(".question-container");
const choicesContainer = document.querySelector(".choices-container");
const buttonContainer = document.getElementById('button-container')
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");
const answerContainer = document.getElementById("answer-container"); 
const ttsSpeakerButton = document.getElementById('tts-speaker-button')

answerContainer.style.display = 'none'

let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]"); /* revert from keyword -> question */
let ttsObject = JSON.parse(sessionStorage.getItem("ttsObjects") || "[]");
let currentAudio = ""

const ttsMascotPlay = new MascotPlaySpeech()
const notifObject = new Notification()
const studentId = await decrypt(sessionStorage.getItem("id"))

let currentQuestion = 0;
let finalScore = 0; 

const submitButton = document.createElement('button')
const finishButton = document.createElement('button')
finishButton.setAttribute('id', 'finish-button')
finishButton.textContent = "Finish"
submitButton.setAttribute('id', 'submit-button')
submitButton.textContent = 'Submit'

const storedAnswers = sessionStorage.getItem("userAnswers");
const userAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};

const currentTitle = sessionStorage.getItem("currentActivityTitle");

if(await decrypt(sessionStorage.getItem("role")) === "student"){
    toDashboardPageButton.textContent = 'Save and Exit'
    displayActivityTitle.textContent = `Title: ${currentTitle}`;
    toDashboardPageButton.addEventListener('click', async () => {
        const loadingId = `loading-save-exit-${Date.now()}`;
        notifObject.notify("Saving and exiting...", "loading", null, null, loadingId);
        try{
            const attemptId = await decrypt(sessionStorage.getItem('currentAttemptId'));
            const url = (sessionStorage.getItem("currentAttemptId") == 1) ? '/save_attempt/activity' : '/save_attempt/assessment'
    
            const formData = new FormData()
            formData.append("attempt_id", attemptId)
            formData.append("answer", JSON.stringify(userAnswers))
            
            const response = await fetch(url, {
                method: 'PATCH',
                body: formData
            });
    
            const result = await response.json()
    
            console.log(result.status)
    
            if (response.ok && result.status){
    
                sessionStorage.removeItem('questions')
                sessionStorage.removeItem('currentContentId')
                sessionStorage.removeItem('currentActivityTitle')
                sessionStorage.removeItem('ttsObjects')
                sessionStorage.removeItem("userAnswers")
                sessionStorage.removeItem('currentAttemptId');
                window.location.href = '/student_dashboard';
            }
            else{
                console.log(result.message)
                notifObject.notify(result.message || "Failed to save progress", "error");
            }

        }
        catch (error) {
            notifObject.dismissLoading(loadingId);
            console.error(error);
            notifObject.notify("Error saving progress", "error");
        }
    })
}
else if(await decrypt(sessionStorage.getItem("role")) === "teacher"){
    toDashboardPageButton.textContent = "Exit Preview"; 
    displayActivityTitle.textContent = `Preview Title: ${currentTitle}`;
    toDashboardPageButton.addEventListener('click', () => {

        sessionStorage.removeItem('questions')
        sessionStorage.removeItem('ttsObjects')
        sessionStorage.removeItem('currentActivityTitle')
        sessionStorage.removeItem('userAnswers')
        window.location.href = '/teacher_dashboard';
    });

}

ttsSpeakerButton.addEventListener('click', () => {
    playAudio(currentAudio)
})

submitButton.addEventListener("click", () => {
    saveAndNavigate(2);
})

nextButton.addEventListener("click", () => { saveAndNavigate(1); }); 

previousButton.addEventListener("click", () => { saveAndNavigate(-1); });

loadQuestion(0);

function setupRadioListeners() {
    const radios = document.querySelectorAll('input[name="answer"]');
    radios.forEach(radio => {
        radio.addEventListener('change', () => {
            // Save answer immediately when radio is clicked
            userAnswers[currentQuestion] = radio.value;
            sessionStorage.setItem("userAnswers", JSON.stringify(userAnswers));
            console.log(`Saved answer for question ${currentQuestion}:`, radio.value);
        });
    });
}

function saveAndNavigate(direction) {
    const selectedRadio = document.querySelector('input[name="answer"]:checked');
    if (selectedRadio) {
        userAnswers[currentQuestion] = selectedRadio.value;
    } else if (userAnswers[currentQuestion]) {
        delete userAnswers[currentQuestion]; 
    }

    sessionStorage.setItem("userAnswers", JSON.stringify(userAnswers));

    if (direction === 2){
        console.log(sessionStorage.getItem("userAnswers"))
        showFinalScore()
    }

    if (direction === 1) { 
        if (currentQuestion < questionObject.length - 1) {
            currentQuestion++;
            loadQuestion(currentQuestion);
        } 
    } else if (direction === -1) { 
        if (currentQuestion > 0) {
            currentQuestion--;
            loadQuestion(currentQuestion);
        }
    }
}

function playAudio(audio){
    ttsMascotPlay.play(audio)
}

function updateNavigationButtons() {

    if (currentQuestion === questionObject.length - 1) {
        nextButton.remove()
        previousButton.insertAdjacentElement('afterend', submitButton)
    } else {
        submitButton.remove()
        previousButton.insertAdjacentElement('afterend', nextButton)
    }

    previousButton.disabled = (currentQuestion === 0);
    nextButton.disabled = (questionObject.length === 0);
}

function loadQuestion(index) {
    console.log(index)
    console.log("loadQuestion() called with index:", index);
    console.log("questionObject:", questionObject);
    console.log("questionObject length:", questionObject ? questionObject.length : "undefined");

    if (index < 0 || index >= questionObject.length) {
        console.error("Invalid question index");
        return;
    }

    const questionData = questionObject[index];
    const ttsData = ttsObject[index]

    currentAudio = ttsData.audioUrl

    const title = document.getElementById("title");
    title.textContent = questionData.passageTitle;
    const passage = document.getElementById("passage")
    passage.textContent = questionData.question;
    
    const qNum = document.getElementById("question-number-display");
    qNum.textContent = `Question ${index + 1} of ${questionObject.length}`;

    const choiceA = document.getElementById('choice-a')
    const choiceB = document.getElementById('choice-b')
    const choiceC = document.getElementById('choice-c')

    console.log(choiceA)

    choiceA.textContent = questionData.choices[0] || "";
    choiceB.textContent = questionData.choices[1] || "";
    choiceC.textContent = questionData.choices[2] || "";

    const radioA = document.getElementById('answer-a');
    const radioB = document.getElementById('answer-b');
    const radioC = document.getElementById('answer-c');

    if (radioA) radioA.checked = (userAnswers[index] === 'a');
    if (radioB) radioB.checked = (userAnswers[index] === 'b');
    if (radioC) radioC.checked = (userAnswers[index] === 'c');
    
    currentQuestion = index;
    previousButton.disabled = (currentQuestion === 0);
    nextButton.disabled = (currentQuestion === questionObject.length - 1);

    updateNavigationButtons();
    setupRadioListeners();
}

async function showFinalScore() {
    const showAnswer = document.querySelector('tbody');

    questionContainer.style.display = 'none';
    choicesContainer.style.display = 'none';
    answerContainer.style.display = 'block';

    showAnswer.innerHTML = "";

    let correctCount = 0;
    questionObject.forEach((question, index) => {
        const userAnswer = userAnswers[index] || "No answer";
        const correctAnswer = question.answer;
        const isCorrect = userAnswer === correctAnswer;

        if (isCorrect) correctCount++;

        // Create a new table row
        const row = document.createElement('tr');
        const questionNoCell = document.createElement('td')
        questionNoCell.textContent = `${index + 1}.`
        const userCell = document.createElement('td');
        userCell.textContent = userAnswer;
        const correctCell = document.createElement('td');
        correctCell.textContent = correctAnswer;
        const resultCell = document.createElement('td');
        resultCell.textContent = isCorrect ? "✅ Correct" : "❌ Wrong";

        row.style.textAlign = "center"
        // Optional styling for clarity
        if (isCorrect) {
            row.style.backgroundColor = "#d4edda"; // light green for correct
        } else {
            row.style.backgroundColor = "#f8d7da"; // light red for wrong
        }

        // Append all cells to the row
        row.appendChild(questionNoCell)
        row.appendChild(userCell);
        row.appendChild(correctCell);
        row.appendChild(resultCell);

        // Append the row to the table body
        showAnswer.appendChild(row);
    });
    finalScore = correctCount;

    const totalQuestions = questionObject.length;

    const category = ScoreEvaluator.getCategory(finalScore, totalQuestions);
    console.log("Category:", category);

    if (scoreAudios[category]) {
        // Pass the audio URL (the src property) to play
        playAudio(scoreAudios[category].src);
    }

    const displayScore = document.getElementById('question-number-display')

    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
    submitButton.style.display = 'none'
    toDashboardPageButton.style.display = 'none'

    displayScore.textContent = `Total Score: ${finalScore} / ${totalQuestions}`
    buttonContainer.appendChild(finishButton)
    buttonContainer.style.justifyContent = 'flex-end'

    if(await decrypt(sessionStorage.getItem("role")) === "student"){
        
        finishButton.addEventListener("click" , async () => {
            const loadingId = `loading-finish-${Date.now()}`;
            notifObject.notify("Submitting answers...", "loading", null, null, loadingId);
            try{
                const formData = new FormData()
                const url = (sessionStorage.getItem("currentAttemptId") == 1) ? '/finish_attempt/activity' : '/finish_attempt/assessment'
                formData.append("answer", JSON.stringify(userAnswers))
                formData.append("attempt_id", await decrypt(sessionStorage.getItem("currentAttemptId")))
                formData.append("score", finalScore)
                
                const response = await fetch(url, {
                    method: "PATCH",
                    body: formData
                })
                
                const result = await response.json()
    
            
                if (response.ok && result.status){
                    await checkAttemptsByStudentID(studentId)
                    if(sessionStorage.getItem('categoryTypeNum') == 1){
                        await checkActivityAttemptsByStudentID(studentId)
                    }
                    else if(sessionStorage.getItem('categoryTypeNum') == 2){
                        await checkAssessmentAttemptsByStudentID(studentId)
                    }
                    await checkPerfectScoresByStudentID(studentId)
                    notifObject.dismissLoading(loadingId);
                    notifObject.notify("Activity completed successfully! Redirecting...", "success");

                    setTimeout(() => {
                        sessionStorage.removeItem('categoryTypeNum')
                        sessionStorage.removeItem('questions')
                        sessionStorage.removeItem('currentContentId')
                        sessionStorage.removeItem('currentActivityTitle')
                        sessionStorage.removeItem('currentAttemptId')
                        sessionStorage.removeItem('ttsObjects')
                        sessionStorage.removeItem("userAnswers")
                        window.location.href = '/student_dashboard';
                    }, 1000);
                }
                else{
                    console.log(result.message)
                    notifObject.dismissLoading(loadingId);
                    notifObject.notify(result.message || "Failed to submit answers", "error");
                }
            }
            catch (error){
                console.log(error)
                notifObject.dismissLoading(loadingId);
                notifObject.notify("Error submitting answers", "error");
            }
        })


    }
    else if(await decrypt(sessionStorage.getItem("role")) === "teacher"){
        sessionStorage.removeItem('questions')
        sessionStorage.removeItem('ttsObjects')
        sessionStorage.removeItem('currentActivityTitle')
        sessionStorage.removeItem('userAnswers')

        finishButton.addEventListener("click", () => {
            window.location.href = '/teacher_dashboard';
        })

    }
}