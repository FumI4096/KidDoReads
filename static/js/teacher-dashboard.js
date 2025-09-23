const activityNavButton = document.getElementById("activities-record-button");
const assessmentNavButton = document.getElementById("assessments-record-button");
const progressNavButton = document.getElementById("progress-record-button");
const logOutButton = document.getElementById('log-out-button');

const contents = document.getElementById("content-container");
const addContentButton = document.getElementById("add-content-button");
const defaultProfilePicture = "../static/images/default_profile_picture.png";


logOutButton.addEventListener('click', () => {
    sessionStorage.clear();
    window.location.href = '/logout'
})


activityNavButton.addEventListener('click', (e) => {
    // showRecords('/students')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

assessmentNavButton.addEventListener('click', (e) => {
    // showRecords('/teachers')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    progressNavButton.style.pointerEvents = 'auto'
    progressNavButton.classList.remove('toggle-user')
})

progressNavButton.addEventListener('click', (e) => {
    // showRecords('/admins')
    e.target.disabled = true
    e.target.style.pointerEvents = 'none'
    e.target.classList.add('toggle-user')
    activityNavButton.style.pointerEvents = 'auto'
    activityNavButton.classList.remove('toggle-user')
    assessmentNavButton.style.pointerEvents = 'auto'
    assessmentNavButton.classList.remove('toggle-user')
})

addContentButton.addEventListener("click", testContent);

function testContent(){
    const contentContainer = document.createElement("div");
    contentContainer.setAttribute('id', "content-input-container");

    const closeContentButton = document.createElement("ion-icon");
    closeContentButton.name = "close-outline";
    closeContentButton.setAttribute('id', "close-content-button");
    closeContentButton.style.color = 'white';

    const contentHeaderStatement = document.createElement("p");
    contentHeaderStatement.setAttribute('id', 'content-header-statement')
    contentHeaderStatement.textContent = "Create an Activity";

    const createContent = document.createElement("div");
    createContent.setAttribute('id', "create-content");

    const contentTitle = document.createElement("input");
    contentTitle.setAttribute('id',"content-title");
    contentTitle.type = "text";
    contentTitle.placeholder = "Enter Content Title";

    const submitContentButton = document.createElement("button");
    submitContentButton.innerHTML = "Confirm";
    submitContentButton.setAttribute('id',"submit-content");

    createContent.appendChild(closeContentButton);
    createContent.appendChild(contentHeaderStatement)
    createContent.appendChild(contentTitle);
    contentContainer.appendChild(createContent);

    const contentTypeContainer = document.createElement("div");
    contentTypeContainer.setAttribute('id',"content-type-container");

    const selectContent = document.createElement("select");
    selectContent.setAttribute('id', "content-type");
    selectContent.id = "content-type";
    selectContent.name = "content-type";

    const contentTypes = [
        {value: '', text: 'Activity Type'},
        {value: 'activity1', text: 'Activity 1'}, 
        {value: 'activity2', text: 'Activity 2'}, 
        {value: 'activity3', text: 'Activity 3'}
    ];
    contentTypes.forEach(type => {
        const optionElement = document.createElement('option');
        optionElement.value = type.value;
        optionElement.textContent = type.text;

        selectContent.appendChild(optionElement)
    });
    
    contentTypeContainer.appendChild(selectContent);
    createContent.appendChild(contentTypeContainer);
    createContent.appendChild(submitContentButton);
    document.body.appendChild(contentContainer);

    submitContentButton.addEventListener('click', addContent)

    closeContentButton.addEventListener("click", () => {
        document.body.removeChild(contentContainer);
    });

    function addContent(){
        const newContent = document.createElement("div");
        const testElement = document.createElement("p");
        testElement.innerHTML = "test";
        newContent.classList.add("content");
        newContent.appendChild(testElement);
        contents.appendChild(newContent);
        contents.appendChild(addContentButton); // Re-add button
        document.body.removeChild(contentContainer);
    }
}

document.addEventListener("DOMContentLoaded", async function() {
    const id = localStorage.getItem("id")

    const url = `/user/${id}`;
    const getInfo = await fetch(url);

    const user = await getInfo.json();

    if (user.status){
        localStorage.setItem("fullName", user.data[0].fullName);

        const teacherName = document.getElementById('teacher_name')
        const teacherPicture = document.getElementById('teacher_picture')

        teacherName.textContent = localStorage.getItem("fullName")
        if (user.data[0].image){
            localStorage.setItem("image", user.data[0].image)
            teacherPicture.src = localStorage.getItem("image")
        }
        else{
            localStorage.setItem("image", defaultProfilePicture)
            teacherPicture.src = localStorage.getItem("image")
        }

    }
});
