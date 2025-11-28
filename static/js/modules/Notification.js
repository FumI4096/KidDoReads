class Notification{
    #container = document.getElementById('notification-container')
    #notificationColor = 'rgb(255, 255, 255)'
    #successfulBorder = 'solid 2px rgba(59, 197, 66, 1)'
    #errorBorder = 'solid 2px rgb(207, 0, 44)'
    #loadingBorder = 'solid 2px rgba(59, 130, 246, 1)'
    #borderRadius = '12px'
    #width = '350px'
    #height = '80px'
    #padding = '10px 20px 10px 20px'
    #displayTime = 2500;
    #notificationTimeouts = new WeakMap();
    #loadingNotifications = new Map(); // Track loading notifications by ID

    notify(statement, type, title = null, image = null, loadingId = null){
        if (typeof(statement) == "string"){
            const existingNotifications = this.#container ? this.#container.querySelectorAll(".notification-box") : [];
            for (const notification of existingNotifications) {
                if (notification.textContent.includes(statement)) {
                    return;
                }
            }
            if (!this.#container) {
                this.#container = this.notificationContainerStructure();
                document.body.appendChild(this.#container);
            }

            let notificationBox;
            if (type === "error"){
                notificationBox = this.error(statement)
            }
            else if (type === "success"){
                notificationBox = this.success(statement)
            }
            else if (type === "achievement"){
                notificationBox = this.achievement(title, statement, image)
            }
            else if (type === "loading"){
                notificationBox = this.loading(statement)
                if (loadingId) {
                    this.#loadingNotifications.set(loadingId, notificationBox);
                }
            }

            this.#container.append(notificationBox);

            // Don't auto-remove loading notifications
            if (type !== "loading") {
                const allNotifications  = this.#container.querySelectorAll(".notification-box")
                const displayTime = type === "achievement" ? 5000 : this.#displayTime;
                const delay = allNotifications.length * displayTime

                const timeoutId = setTimeout(() => {
                    notificationBox.remove();
                }, delay);

                this.#notificationTimeouts.set(notificationBox, timeoutId);
            }
        }
    }

    // Method to dismiss a loading notification
    dismissLoading(loadingId){
        const notificationBox = this.#loadingNotifications.get(loadingId);
        if (notificationBox) {
            notificationBox.remove();
            this.#loadingNotifications.delete(loadingId);
        }
    }

    notificationContainerStructure(){
        const notificationContainer = document.createElement('div')
        notificationContainer.style.width = 'auto';
        notificationContainer.style.height = 'auto';
        notificationContainer.style.position = 'fixed';
        notificationContainer.style.top = '10px';
        notificationContainer.style.right = '10px';        
        notificationContainer.style.display = 'flex'
        notificationContainer.style.flexDirection = 'column-reverse';
        notificationContainer.style.gap = '10px'
        notificationContainer.setAttribute('id','notification-container')

        return notificationContainer
    }

    notificationStructure(){
        const notificationBox = document.createElement('div');
        notificationBox.style.width = this.#width;
        notificationBox.style.height = this.#height;
        notificationBox.style.padding = this.#padding;
        notificationBox.style.borderRadius = this.#borderRadius;
        notificationBox.style.backgroundColor = this.#notificationColor;
        notificationBox.style.display = "flex";
        notificationBox.style.alignItems = "center";
        notificationBox.style.gap = "1rem";
        notificationBox.style.fontFamily = 'Light-Poppins'
        notificationBox.style.fontSize = '0.9rem'
        notificationBox.classList.add('notification-box')

        return notificationBox;
    } 

    error(statement){
        const errorBox = this.notificationStructure()
        errorBox.style.border = this.#errorBorder
        const errorImageElement = document.createElement('img')
        const errorImage = "static/images/cross.png"

        errorImageElement.alt = "Error Image";
        errorImageElement.src = errorImage;
        errorImageElement.style.height = "90%";

        errorBox.append(errorImageElement, statement)
        return errorBox
        
    }

    success(statement){
        const successBox = this.notificationStructure()
        successBox.style.border = this.#successfulBorder
        const successImageElement = document.createElement('img')
        const successImage = "static/images/check.png"

        successImageElement.alt = "Success Image";
        successImageElement.src = successImage;
        successImageElement.style.height = "90%";

        successBox.append(successImageElement, statement)

        return successBox

    }

    loading(statement){
        const loadingBox = this.notificationStructure()
        loadingBox.style.border = this.#loadingBorder
        
        // Create spinner element
        const spinner = document.createElement('div')
        spinner.style.width = '40px'
        spinner.style.height = '40px'
        spinner.style.border = '4px solid rgba(59, 130, 246, 0.2)'
        spinner.style.borderTop = '4px solid rgba(59, 130, 246, 1)'
        spinner.style.borderRadius = '50%'
        spinner.style.animation = 'spin 1s linear infinite'
        
        // Add keyframes for spinner animation if not already added
        if (!document.getElementById('spinner-keyframes')) {
            const style = document.createElement('style')
            style.id = 'spinner-keyframes'
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `
            document.head.appendChild(style)
        }

        loadingBox.append(spinner, statement)
        return loadingBox
    }

    achievement(title, statement, image){
        const achievementBox = this.notificationStructure()
        achievementBox.style.border = 'solid 2px rgba(255, 153, 0, 1)'
        achievementBox.style.backgroundColor = 'rgba(255, 250, 240, 1)'
        
        const achievementImageElement = document.createElement('img')
        const achievementImage = image

        achievementImageElement.alt = "Achievement Icon";
        achievementImageElement.src = achievementImage;
        achievementImageElement.style.height = "90%";

        const textContainer = document.createElement('div')
        textContainer.style.display = 'flex'
        textContainer.style.flexDirection = 'column'
        textContainer.style.gap = '0.25rem'

        const titleElement = document.createElement('strong')
        titleElement.textContent = title
        titleElement.style.fontSize = '1rem'
        titleElement.style.color = 'rgba(255, 153, 0, 1)'

        const statementElement = document.createElement('span')
        statementElement.textContent = statement
        statementElement.style.fontSize = '0.85rem'
        statementElement.style.color = 'rgba(0, 0, 0, 0.7)'

        textContainer.append(titleElement, statementElement)
        achievementBox.append(achievementImageElement, textContainer)

        return achievementBox
    }
}

export default Notification