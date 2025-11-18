export async function checkAttemptsByStudentID(student_id){
    const url = `/achievement/finished_attempts/${student_id}`

    const response = await fetch(url)
    const result = await response.json()
    if (response.ok && result.status){
        console.log("ACHIEVEMENT DETECTED")
        addAchievementId(result.achievementId)
    }
    else{
        console.log(result.message)
    }
}

export async function checkActivityAttemptsByStudentID(student_id){
    const url = `/achievement/activity/finished_attempts/${student_id}`

    const response = await fetch(url)
    const result = await response.json()
    if (response.ok && result.status){
        console.log("ACTIVITY ACHIEVEMENT DETECTED")
        addAchievementId(result.achievementId)
    }
    else{
        console.log(result.message)
    }
}

export async function checkAssessmentAttemptsByStudentID(student_id){
    const url = `/achievement/assessment/finished_attempts/${student_id}`

    const response = await fetch(url)
    const result = await response.json()
    if (response.ok && result.status){
        console.log("ASSESSMENT ACHIEVEMENT DETECTED")
        addAchievementId(result.achievementId)
    }
    else{
        console.log(result.message)
    }
}

export async function checkPerfectScoresByStudentID(student_id){
    const url = `/achievement/perfect_scores/${student_id}`

    const response = await fetch(url)
    const result = await response.json()
    if (response.ok && result.status){
        console.log("PERFECT SCORE ACHIEVEMENT DETECTED")
        addAchievementId(result.achievementId)
    }
    else{
        console.log(result.message)
    }
}

function addAchievementId(achievementId){
    const achievementIds = JSON.parse(sessionStorage.getItem("achievementIds")) || []
    achievementIds.push(achievementId)
    sessionStorage.setItem("achievementIds", JSON.stringify(achievementIds))
}