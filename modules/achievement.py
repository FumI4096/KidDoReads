def checkCount(count):
    if count == 3:
        return True, 3
    if count == 5:
        return True, 4
    if count == 10:
        return True, 5
    if count == 20:
        return True, 6
    
    return False, count

def firstFinishedGame(row, studentHasAchievement):
    if row and not studentHasAchievement:
        return True
    else:
        return False
    
def checkPerfectScoreCount(count):
    if count == 1:
        return True, 12,
    if count == 5:
        return True, 14,
    if count == 10:
        return True, 14,
    
    return False, count
    