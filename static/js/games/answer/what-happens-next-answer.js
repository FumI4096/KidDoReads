const displayActivityTitle = document.getElementById('display-activity-title');
const toDashboardPageButton = document.getElementById('to-dashboard-page-button');
const choicesContainer = document.querySelector(".choices-container");
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");
const answerContainer = document.getElementById("answer-container"); 

let keywordObject = JSON.parse(sessionStorage.getItem("keywords") || "[]");

let currentKeyword = 0;
let finalScore = 0; 

const storedAnswers = sessionStorage.getItem("userAnswers");
const userAnswers = storedAnswers ? JSON.parse(storedAnswers) : {};

const currentTitle = sessionStorage.getItem("currentActivityTitle");

if(sessionStorage.getItem("role") === "student"){
    toDashboardPageButton.style.display = 'none'
    displayActivityTitle.textContent = `Preview: ${currentTitle}`;
}
else if(sessionStorage.getItem("role") === "teacher"){
    toDashboardPageButton.textContent = "Exit Preview"; 
    displayActivityTitle.textContent = currentTitle;
    toDashboardPageButton.addEventListener('click', () => {
        window.location.href = '/teacher_dashboard';
    });

}

nextButton.addEventListener("click", () => { saveAndNavigate(1); }); 
previousButton.addEventListener("click", () => { saveAndNavigate(-1); });

loadKeyword(0);

// 3. Core Logic (Simplified for Preview)

function saveAndNavigate(direction) {
    const selectedRadio = document.querySelector('input[name="preview_answer"]:checked');
    if (selectedRadio) {
        userAnswers[currentKeyword] = selectedRadio.value;
    } else if (userAnswers[currentKeyword]) {
        delete userAnswers[currentKeyword]; 
    }

    sessionStorage.setItem("userAnswers", JSON.stringify(userAnswers));

    if (direction === 2){
        console.log(sessionStorage.getItem("userAnswers"))
        showFinalScore()
    }

    if (direction === 1) { 
        if (currentKeyword < keywordObject.length - 1) {
            currentKeyword++;
            loadKeyword(currentKeyword);
        } 
    } else if (direction === -1) { 
        if (currentKeyword > 0) {
            currentKeyword--;
            loadKeyword(currentKeyword);
        }
    }
}

function showFinalScore() {
    // 1. Calculate the final score
    let correctCount = 0;
    keywordObject.forEach((keyword, index) => {
        if (userAnswers[index] === keyword.answer) {
            correctCount++;
        }
    });
    finalScore = correctCount;

    // 2. Display the results page
    const totalKeywords = keywordObject.length;
    
    // Clear the main content areas
    document.querySelector(".keyword-container").innerHTML = '';
    choicesContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    
    // Display the score
    const scoreMessage = document.createElement('h2');
    scoreMessage.textContent = "Quiz Complete!";
    
    const resultDetails = document.createElement('p');
    resultDetails.innerHTML = `You answered <strong>${finalScore}</strong> out of <strong>${totalKeywords}</strong> keywords correctly.`;
    resultDetails.style.fontSize = '1.2em';
    
    choicesContainer.append(scoreMessage, resultDetails);

    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
}

function updateNavigationButtons() {
    if (currentKeyword === keywordObject.length - 1) {
        nextButton.textContent = "Submit";
        nextButton.addEventListener("click", () => { saveAndNavigate(2); });
    } else {
        nextButton.removeEventListener('click', showFinalScore);
        nextButton.textContent = "Next";
        nextButton.addEventListener("click", () => { saveAndNavigate(1); });
    }

    previousButton.disabled = (currentKeyword === 0);
    nextButton.disabled = (keywordObject.length === 0);
}

function loadKeyword(index) {
    console.log(index)
    if (index < 0 || index >= keywordObject.length) {
        console.error("Invalid keyword index");
        return;
    }

    const keywordData = keywordObject[index];

    const keywordElement = document.getElementById("keyword-text");
    keywordElement.textContent = keywordData.keyword;

    choicesContainer.innerHTML = '';
    answerContainer.innerHTML = '';
    
    const qNum = document.getElementById("keyword-number-display");
    qNum.textContent = `Keyword ${index + 1} of ${keywordObject.length}`;

    const choiceLetters = ['A', 'B', 'C', 'D']; 
    
    keywordData.choices.forEach((choiceText, i) => {
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
    
    currentKeyword = index;
    previousButton.disabled = (currentKeyword === 0);
    nextButton.disabled = (currentKeyword === keywordObject.length - 1);

    updateNavigationButtons();
}