export async function checkAttemptsByStudentID(student_id){
    const url = `/achievement/finished_attempts/${student_id}`

    const response = await fetch(url)
    const result = await response.json()
    if (response.ok && result.status){
        console.log("ACHIEVEMENT DETECTED")
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
    }
    else{
        console.log(result.message)
    }
}