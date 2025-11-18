import Notification from './Notification.js'

const notifyObj = new Notification()

export function loginSuccess(){
    console.log("Test")
    if (sessionStorage.getItem("loginSuccess")){
        notifyObj.notify("Logged in Successfully!", "success")
        sessionStorage.removeItem("loginSuccess")
    }
}

export function notifyStudentAchievement(achievementId){
    console.log(achievementId)
    const achievements = [
        {id: 1, title: "First Step Hero", description: "Finished your first activity!", image: '../../../static/images/check.png'},
        {id: 2, title: "Brain Starter!", description: "Finished your first assessment!", image: '../../../static/images/check.png'},
        {id: 3, title: "Starter Star", description: "Finished 3 assessments and activities!", image: '../../../static/images/check.png'},
        {id: 4, title: "Learning Explorer", description: "Completed 5 assessments and activities!", image: '../../../static/images/check.png'},
        {id: 5, title: "Super Scholar!", description: "Completed 10 assessments and activities! Keep it up, Super Scholar!", image: '../../../static/images/check.png'},
        {id: 6, title: "Learning Legend!", description: "Completed 20 assessments and activities! You’re now a true Learning Legend!", image: '../../../static/images/check.png'},
        {id: 7, title: "Sound & Spell Star!", description: "Completed the Word Audio Match Assessment!", image: '../../../static/images/check.png'},
        {id: 8, title: "Phonics Pro!", description: "Completed the Listen and Choose Assessment!", image: '../../../static/images/check.png'},
        {id: 9, title: "Wizard Knowledge!", description: "Completed the Meaning Maker Assessment!", image: '../../../static/images/check.png'},
        {id: 10, title: "The Detective!", description: "Completed the Sound-Alike Match Assessment!", image: '../../../static/images/check.png'},
        {id: 11, title: "Story Predictor!", description: "Completed the What Happens Next? Assessment!", image: '../../../static/images/check.png'},
        {id: 12, title: "Clue Finder!", description: "Completed the Picture + Clues Assessment!", image: '../../../static/images/check.png'},
        {id: 13, title: "Perfect Start!", description: "Achieved your 1st perfect score!", image: '../../../static/images/check.png'},
        {id: 14, title: "Perfect Streak!", description: "Achieved your 5th perfect score! — You’re becoming a real master of learning — keep that streak going!", image: '../../../static/images/check.png'},
        {id: 15, title: "Perfect Pro!", description: "Achieved your 10th perfect score! You’re a true learning champion", image: '../../../static/images/check.png'}
    ]

    const achievement = achievements.find(a => a.id === parseInt(achievementId)
);

    console.log(achievement)

    notifyObj.notify(achievement.description, "achievement", achievement.title, achievement.image)

    
}