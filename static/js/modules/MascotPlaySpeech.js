class MascotPlaySpeech {
    #currentAudio = null
    #progressInterval = null
    #onEndedCallback = null
    #idleVideoElement = "idleOwlVideo";
    #talkingVideoElement = "talkingOwlVideo";

    play(audioFile, onEndedCallback = null) {
        if (this.#currentAudio) {
            this.#stop();
        }
        
        this.#onEndedCallback = onEndedCallback;
        
        // Switch to talking video
        this.#switchToTalking();
        
        this.#currentAudio = new Audio(audioFile);
        console.log(this.#currentAudio);
        
        this.#currentAudio.addEventListener('loadedmetadata', () => {
            const duration = this.#currentAudio.duration;
            const startTime = Date.now();
            
            // Start playing
            this.#currentAudio.play();
            
            // Update progress
            this.#progressInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = (elapsed / duration) * 100;
                
                if (progress >= 100) {
                    this.#stop();
                }
            }, 50);
        });
        
        this.#currentAudio.onended = () => {
            this.#stop();
        };
        
        this.#currentAudio.onerror = () => {
            console.error('Error playing audio');
            this.#stop();
        };
    }

    #switchToTalking() {
        const idleVideo = document.getElementById(this.#idleVideoElement);
        const talkingVideo = document.getElementById(this.#talkingVideoElement);
        
        idleVideo.classList.remove('active');
        talkingVideo.classList.add('active');
    }

    #switchToIdle() {
        const idleVideo = document.getElementById(this.#idleVideoElement);
        const talkingVideo = document.getElementById(this.#talkingVideoElement);
        
        talkingVideo.classList.remove('active');
        idleVideo.classList.add('active');
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
        
        // Switch back to idle video
        this.#switchToIdle();
        
        if (this.#onEndedCallback) {
            setTimeout(() => {
                this.#onEndedCallback();
                this.#onEndedCallback = null;
            }, 2000);
        }
    }
}

export default MascotPlaySpeech;