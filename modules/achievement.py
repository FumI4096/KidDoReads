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
    