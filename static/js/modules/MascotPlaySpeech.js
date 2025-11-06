class MascotPlaySpeech{

    #currentAudio = null
    #progressInterval = null
    #currentButton = null

    play(audioFile) {
        if (this.#currentAudio) {
            this.#stop();
        }
        
        this.#currentAudio = new Audio(audioFile);
        
        this.#currentAudio.addEventListener('loadedmetadata', () => {
            const duration = this.#currentAudio.duration;
            const startTime = Date.now();
            
            // Reset button style if provided
            // if (this.#currentButton) {
            //     this.#currentButton.style.background = 'linear-gradient(to right, #4CAF50 0%, #ccc 0%)';
            // }
            // will be changed into images, hence the name mascot
            
            // Start playing
            this.#currentAudio.play();
            
            // Update progress
            this.#progressInterval = setInterval(() => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = (elapsed / duration) * 100;
                
                if (progress >= 100) {
                    this.#stop();
                }
                // } else if (this.#currentButton) {
                //     this.#currentButton.style.background = `linear-gradient(to right, #4CAF50 ${progress}%, #ccc ${progress}%)`;
                // }
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
    }

}

export default MascotPlaySpeech;