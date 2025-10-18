const displayActivityTitle = document.getElementById('display-activity-title');
const toTeacherPageButton = document.getElementById('to-teacher-page-button');
const choicesContainer = document.querySelector(".choices-container");
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");
const answerContainer = document.getElementById("answer-container"); 

let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");

console.log(questionObject)
let currentQuestion = 0;
let finalScore = 0; 

const storedAnswers = sessionStorage.getItem("userAnswers");
const userAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};

const currentTitle = localStorage.getItem("currentActivityTitle");
displayActivityTitle.textContent = `Preview: ${currentTitle}`;

toTeacherPageButton.textContent = "Exit Preview"; // Change button text
toTeacherPageButton.addEventListener('click', () => {
    // Clear session storage if necessary, or just redirect
    window.location.href = '/teacher_dashboard';
});

nextButton.addEventListener("click", () => { saveAndNavigate(1); }); 
previousButton.addEventListener("click", () => { saveAndNavigate(-1); });

loadQuestion(0);

// 3. Core Logic (Simplified for Preview)

function saveAndNavigate(direction) {
    // 1. SAVE: Store the current selection before leaving the question
    const selectedRadio = document.querySelector('input[name="preview_answer"]:checked');
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

    if (direction === 1) { // Moving NEXT or SUBMIT
        if (currentQuestion < questionObject.length - 1) {
            currentQuestion++;
            loadQuestion(currentQuestion);
        } 
    } else if (direction === -1) { // Moving PREVIOUS
        if (currentQuestion > 0) {
            currentQuestion--;
            loadQuestion(currentQuestion);
        }
    }
}

function showFinalScore() {
    // 1. Calculate the final score
    let correctCount = 0;
    questionObject.forEach((question, index) => {
        if (userAnswers[index] === question.answer) {
            correctCount++;
        }
    });
    finalScore = correctCount;

    // 2. Display the results page
    const totalQuestions = questionObject.length;
    
    // Clear the main content areas
    document.querySelector(".question-container").innerHTML = '';
    choicesContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    
    // Display the score
    const scoreMessage = document.createElement('h2');
    scoreMessage.textContent = "Quiz Complete!";
    
    const resultDetails = document.createElement('p');
    resultDetails.innerHTML = `You answered <strong>${finalScore}</strong> out of <strong>${totalQuestions}</strong> questions correctly.`;
    resultDetails.style.fontSize = '1.2em';
    
    choicesContainer.append(scoreMessage, resultDetails);

    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
}

function updateNavigationButtons() {
    if (currentQuestion === questionObject.length - 1) {
        nextButton.textContent = "Submit";
        nextButton.addEventListener("click", () => { saveAndNavigate(2); });
    } else {
        nextButton.removeEventListener('click', showFinalScore);
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", () => { saveAndNavigate(1); });
    }

    previousButton.disabled = (currentQuestion === 0);
    nextButton.disabled = (questionObject.length === 0);
}

function loadQuestion(index) {
    console.log(index)
    if (index < 0 || index >= questionObject.length) {
        console.error("Invalid question index");
        return;
    }

    const questionData = questionObject[index];

    const questionElement = document.getElementById("question-text");
    questionElement.textContent = questionData.question;

    choicesContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    
    const qNum = document.getElementById("question-number-display");
    qNum.textContent = `Question ${index + 1} of ${questionObject.length}`;

    const choiceLetters = ['A', 'B', 'C', 'D']; 
    
    questionData.choices.forEach((choiceText, i) => {
        const choiceBox = document.createElement('div');
        choiceBox.className = 'choice-box';

        const choiceLabel = document.createElement('label');
        choiceLabel.className = 'choice-label';

        const answerRadioButton = document.createElement("input");
        answerRadioButton.type = "radio";
        answerRadioButton.name = "preview_answer"; 
        answerRadioButton.value = choiceLetters[i].toLowerCase(); 
        
        if (userAnswers[index] === answerRadioButton.value) {
            answerRadioButton.checked = true;
        }

        const choiceLetter = document.createElement('p');
        choiceLetter.className = 'choice-letter';
        choiceLetter.textContent = choiceLetters[i] + ".";
        
        const choiceContent = document.createElement('span');
        choiceContent.className = 'choice-text';
        choiceContent.textContent = choiceText; 
        

        choiceLabel.append(answerRadioButton, choiceLetter, choiceContent);
        choiceBox.appendChild(choiceLabel);
        choicesContainer.appendChild(choiceBox);
    });
    
    currentQuestion = index;
    previousButton.disabled = (currentQuestion === 0);
    nextButton.disabled = (currentQuestion === questionObject.length - 1);

    updateNavigationButtons();
}