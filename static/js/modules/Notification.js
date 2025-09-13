class Notification{
    #container = document.getElementById('notification-container')
    #notificationColor = 'rgb(255, 255, 255)'
    #successfulBorder = 'solid 2px rgba(59, 197, 66, 1)'
    #errorBorder = 'solid 2px rgb(207, 0, 44)'
    #borderRadius = '12px'
    #width = '350px'
    #height = '80px'
    #padding = '10px 20px 10px 20px'
    #displayTime = 2000;
    #notificationTimeouts = new WeakMap();

    notify(statement, type){
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

            this.#container.append(notificationBox);

            const allNotifications  = this.#container.querySelectorAll(".notification-box")

            const delay = allNotifications.length * this.#displayTime

            const timeoutId = setTimeout(() => {
                notificationBox.remove();
            }, delay);

            this.#notificationTimeouts.set(notificationBox, timeoutId);
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

        successImageElement.alt = "Error Image";
        successImageElement.src = successImage;
        successImageElement.style.height = "90%";

        successBox.append(successImageElement, statement)

        return successBox

    }
}

export default Notification