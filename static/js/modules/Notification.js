class Notification{
    #container = document.getElementById('notification-container')
    #notificationColor = 'rgb(255, 255, 255)'
    #successfulBorder = 'solid 10px rgb(77, 233, 86)'
    #errorBorder = 'solid 3px rgb(207, 0, 44)'
    #borderRadius = '12px'
    #width = '350px'
    #height = '80px'
    #padding = '10px 20px 10px 20px'
    #displayTime = 2000;
    #notificationTimeouts = new WeakMap();

    notify(statement, type, image = ""){
        if (typeof(statement) == "string"){
            if (!this.#container) {
                this.#container = this.notificationContainerStructure();
                document.body.appendChild(this.#container);
            }

            let notificationBox;
            if (type === "error"){
                notificationBox = this.error(statement, image)
            }
            else if (type === "success"){
                notificationBox = this.success(statement, image)
            }

            this.#container.append(notificationBox);

            const existingNotifications = this.#container.querySelectorAll(".notification-box")

            const delay = existingNotifications.length * this.#displayTime

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
        notificationBox.style.justifyContent = "center";
        notificationBox.style.alignItems = "center";
        notificationBox.style.gap = "1rem";
        notificationBox.style.fontFamily = 'Light-Poppins'
        notificationBox.style.fontSize = '0.9rem'
        notificationBox.classList.add('notification-box')

        return notificationBox;
    } 

    error(statement, image){
        const errorBox = this.notificationStructure()
        errorBox.style.border = this.#errorBorder

        if (this.imageExist(image)){
            errorBox.append(image)
        }

        errorBox.append(statement)
        return errorBox
        
    }

    success(statement, image){
        const successBox = this.notificationStructure()
        successBox.style.border = this.#successfulBorder

        if (this.imageExist(image)){
            successBox.append(image)
        }

        successBox.append(statement)

        return successBox

    }

    imageExist(image){
        if (image != ""){
            return true
        }
        else{
            return false
        }

    }
}

export default Notification