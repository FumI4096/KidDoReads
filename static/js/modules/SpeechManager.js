class SpeechManager{
    #generateUrl = "/api/generate-speech"
    #generateKidUrl = '/api/generate-speech-kid'
    #deleteUrl = "/api/delete-speech"
    #text = ""
    #id = ""
    #audioFile = ""

    #currentAudio = null
    #progressInterval = null
    #currentButton = null

    async generateSpeech(input, id, content_type, voice){
        try{
            let url = ""
            if(voice == 1 || voice == 2){
                url = this.#generateUrl
            }
            else{
                url = this.#generateKidUrl
            }
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    text: input,
                    id: id,
                    content_type: content_type,
                    voice: voice != null ? voice : null
                })
            })

            if (!response.ok){
                console.log(response.status)
                
            }

            const result = await response.json()

            if (result.status){
                this.setAudioFile(result.audio_url)
            }
            else{
                console.log("Error generating speech:", result.message)
            }
        }
        catch (error){
            console.log(error)
        }
    }

    play(audioFile = null, button) {
        if (this.#currentAudio) {
            this.#stop();
        }
        
        this.#currentButton = button;
        this.#currentAudio = new Audio(audioFile);
        
        this.#currentAudio.addEventListener('loadedmetadata', () => {
            const duration = this.#currentAudio.duration;
            const startTime = Date.now();
            
            // Reset button style if provided
            if (this.#currentButton) {
                this.#currentButton.style.background = 'linear-gradient(to right, #4CAF50 0%, #ccc 0%)';
            }
            
            // Start playing
            this.#currentAudio.play();
            
            // Update progress
            this.#progressInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = (elapsed / duration) * 100;
                
                if (progress >= 100) {
                    this.#stop();
                } else if (this.#currentButton) {
                    this.#currentButton.style.background = `linear-gradient(to right, #4CAF50 ${progress}%, #ccc ${progress}%)`;
                }
            }, 50); // Update every 50ms
        });
        
        this.#currentAudio.onended = () => {
            this.#stop();
        };
        
        this.#currentAudio.onerror = () => {
            console.error('Error playing audio');
            this.#stop();
        };
    }

    #stop() {
        if (this.#currentAudio) {
            this.#currentAudio.pause();
            this.#currentAudio.currentTime = 0;
            this.#currentAudio = null;
        }
        
        if (this.#progressInterval) {
            clearInterval(this.#progressInterval);
            this.#progressInterval = null;
        }
        
        // Reset button style
        if (this.#currentButton) {
            this.#currentButton.style.background = '';
            this.#currentButton.disabled = false;
            this.#currentButton = null;
        }
    }

    async deleteSpeech() {
        if (!this.#audioFile) {
            console.error('No audio URL to delete');
            return false;
        }
        const filename = this.#audioFile.split('/').pop();

        try {
            const response = await fetch(this.#deleteUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filename: filename
                })
            });

            const result = await response.json();

            if (response.ok && result.status) {
                console.log('Speech deleted successfully');
                this.clearAudioFile();
                return true;
            } else {
                console.error('Failed to delete speech:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error deleting speech:', error);
            return false;
        }
    }

    #setText(text){
        this.#text = text
    }

    
    #setId(id){
        this.#id = id
    }
    
    
    setAudioFile(aFile){
        this.#audioFile = aFile
    }

    getText(){
        return this.#text
    }

    getId(){
        return this.#id
    }
    
    getAudioFile(){
        return this.#audioFile
    }
    
    clearText(){
        this.#text = ''
    }

    clearAudioFile(){
        this.#audioFile = ''
    }
    
    clearId(){
        this.#id = ''
    }

}

export default SpeechManager;