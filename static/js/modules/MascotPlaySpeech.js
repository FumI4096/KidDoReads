class MascotPlaySpeech{

    #currentAudio = null
    #progressInterval = null
    #currentImageElement = null;
    #defaultImage = null;
    #afterButtonPressedImage = null;

    play(audioFile, imageElement, defaultImage, afterButtonPressedImage) {
        if (this.#currentAudio) {
            this.#stop();
        }
        
        // Store the image element and both images for this playback
        this.#currentImageElement = imageElement;
        this.#defaultImage = defaultImage;
        this.#afterButtonPressedImage = afterButtonPressedImage;
        
        // Switch to playing image
        imageElement.src = this.#afterButtonPressedImage;
        
        // Add bounce animation
        imageElement.style.animation = 'none';
        // Trigger reflow to restart animation
        void imageElement.offsetWidth;
        imageElement.style.animation = 'bounce 0.6s ease-in-out';
        
        this.#currentAudio = new Audio(audioFile);
        
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
        
        // Revert to default image when stopped
        if (this.#currentImageElement && this.#defaultImage) {
            this.#currentImageElement.src = this.#defaultImage;
            // Remove animation when stopped
            this.#currentImageElement.style.animation = 'none';
        }
    }

}

export default MascotPlaySpeech;