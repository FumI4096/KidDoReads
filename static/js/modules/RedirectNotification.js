import Notification from './Notification.js'

const notifyObj = new Notification()

export function loginSuccess(){
    console.log("Test")
    if (sessionStorage.getItem("loginSuccess")){
        console.log("G")
        notifyObj.notify("Logged in Successfully!", "success")
        sessionStorage.removeItem("loginSuccess")
    }
}

export function notifyStudentAchievement(achievementId){
    console.log(achievementId)
    const achievements = [
        {id: 1, title: "First Step Hero", description: "Finished your first activity! — Every great learner starts with one amazing step!", image: '../../../static/images/check.png'},
        {id: 2, title: "Brain Starter!", description: "Finished your first assessment! — Keep the momentum going!", image: '../../../static/images/check.png'},
        {id: 3, title: "Starter Star", description: "Finished 3 assessments and activities! — Keep shining bright, Star Learner", image: '../../../static/images/check.png'},
        {id: 4, title: "Learning Explorer", description: "Completed 5 assessments and activities! — You’re exploring new lessons like a true adventurer", image: '../../../static/images/check.png'},
        {id: 5, title: "Super Scholar!", description: "Completed 10 assessments and activities! — Your hard work is really paying off! Keep it up, Super Scholar!", image: '../../../static/images/check.png'},
        {id: 6, title: "Learning Legend!", description: "Completed 20 assessments and activities! You’re now a true Learning Legend — a hero of knowledge!", image: '../../../static/images/check.png'},
        {id: 12, title: "Perfect Start!", description: "Achieved your 1st perfect score!", image: '../../../static/images/check.png'},
        {id: 13, title: "Perfect Streak!", description: "Achieved your 5th perfect score! — You’re becoming a real master of learning — keep that streak going!", image: '../../../static/images/check.png'},
        {id: 14, title: "Perfect Pro!", description: "Achieved your 10th perfect score! — You’re a true learning champion who always aims high!", image: '../../../static/images/check.png'}
    ]

    const achievement = achievements.find(a => a.id === parseInt(achievementId)
);

    console.log(achievement)

    if (sessionStorage.getItem("achievementSuccess")){
        notifyObj.notify(achievement.description, "achievement", achievement.title, achievement.image)

        sessionStorage.removeItem("achievementSuccess")
        sessionStorage.removeItem("achievementId")
    }
}