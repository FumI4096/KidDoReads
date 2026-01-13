export default function BackgroundHandler() {
    const activityType = document.body.dataset.activity;

    if (!activityType) return;

    const backgrounds = {
        wordAudioMatch: "../static/images/activities-background-images/1.png",
        listenAndChoose: "../static/images/activities-background-images/2.png",
        soundAlikeMatch: "../static/images/activities-background-images/3.png",
        meaningMaker: "../static/images/activities-background-images/4.png",
        whatHappensNext: "../static/images/activities-background-images/5.png",
        picturesClues: "../static/images/activities-background-images/6.png",
    };

const bg = backgrounds[activityType] || backgrounds.default;

    // Add a CSS variable for the background image
    document.body.style.setProperty('--activity-bg', `url('${bg}')`);

    // Make sure the pseudo-element exists only once
    if (!document.body.classList.contains('bg-handler-applied')) {
        document.body.classList.add('bg-handler-applied');

        // Add CSS for ::before pseudo-element
        const style = document.createElement('style');
        style.innerHTML = `
            body::before {
                content: "";
                position: fixed;
                inset: 0;
                z-index: -1;
                background-image: linear-gradient(
                        rgba(0, 0, 0, 0.5),
                        rgba(0, 0, 0, 0.5)
                     ),
                     var(--activity-bg);
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                opacity: 0.9; 
            }
        `;
        document.head.appendChild(style);
    }
}