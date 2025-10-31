const displayActivityTitle = document.getElementById('display-activity-title');
const toDashboardPageButton = document.getElementById('to-dashboard-page-button');
const questionContainer = document.querySelector(".question-container");
const choicesContainer = document.querySelector(".choices-container");
const buttonContainer = document.getElementById('button-container')
const nextButton = document.getElementById("next-button");
const previousButton = document.getElementById("previous-button");
const answerContainer = document.getElementById("answer-container"); 

answerContainer.style.display = 'none'

let questionObject = JSON.parse(sessionStorage.getItem("questions") || "[]");

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

if(sessionStorage.getItem("role") === "student"){
    toDashboardPageButton.style.display = 'none'
    displayActivityTitle.textContent = `Title: ${currentTitle}`;
}
else if(sessionStorage.getItem("role") === "teacher"){
    toDashboardPageButton.textContent = "Exit Preview"; 
    displayActivityTitle.textContent = `Preview Title: ${currentTitle}`;
    toDashboardPageButton.addEventListener('click', () => {
        window.location.href = '/teacher_dashboard';
    });

}

submitButton.addEventListener("click", () => {
    saveAndNavigate(2);
})

nextButton.addEventListener("click", () => { saveAndNavigate(1); }); 

previousButton.addEventListener("click", () => { saveAndNavigate(-1); });

loadQuestion(0);

function saveAndNavigate(direction) {
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

    const questionElement = document.getElementById("question-text");
    questionElement.textContent = questionData.question;

    choicesContainer.innerHTML = '';
    
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

function showFinalScore() {
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

    const displayScore = document.getElementById('question-number-display')

    nextButton.style.display = 'none';
    previousButton.style.display = 'none';
    submitButton.style.display = 'none'
    toDashboardPageButton.style.display = 'none'

    displayScore.textContent = `Total Score: ${finalScore} / ${totalQuestions}`
    buttonContainer.appendChild(finishButton)
    buttonContainer.style.justifyContent = 'flex-end'

    if(sessionStorage.getItem("role") === "student"){
        
        finishButton.addEventListener("click" , async () => {
            const formData = new FormData()
            
            formData.append("student_id", sessionStorage.getItem("id"))
            formData.append("content_id", sessionStorage.getItem("currentContentId"))
            formData.append("score", finalScore)
            
            const response = await fetch('/attempt', {
                method: "POST",
                body: formData
            })
            
            const result = await response.json()
    
            try{
                if (response.ok && result.status){
                    sessionStorage.removeItem('questions')
                    sessionStorage.removeItem('currentContentId')
                    sessionStorage.removeItem('currentActivityTitle')
                    sessionStorage.removeItem("userAnswers")
                    console.log("Success")
                    window.location.href = '/student_dashboard';
                }
                else{
                    console.log(result.message)
                }
            }
            catch (error){
                console.log(error)
            }
        })


    }
    else if(sessionStorage.getItem("role") === "teacher"){
        sessionStorage.removeItem('questions')
        sessionStorage.removeItem('currentActivityTitle')
        sessionStorage.removeItem('userAnswers')

        finishButton.addEventListener("click", () => {
            window.location.href = '/teacher_dashboard';
        })

    }
}