
let owlData;
let framesPreloaded = [];

fetch('../../static/animation/idle-owl.json')
    .then(response => response.json())
    .then(data => {
        owlData = data;
        preloadFrames();
    });

    // Preload all frames to avoid flickering
    function preloadFrames() {
        owlData.idle.forEach(path => {
            const img = new Image();
            img.src = path;
            framesPreloaded.push(img);
        });
        startIdleAnimation();
    }

    function startIdleAnimation() {
        const img = document.getElementById('owl');
        let frame = 0;
        const totalFrames = owlData.idle.length;
        const fps = 24;
        const interval = 1000 / fps;
        let lastTime = 0;

        function animate(time) {
            if (!lastTime) lastTime = time;
            const elapsed = time - lastTime;

            if (elapsed > interval) {
            img.src = framesPreloaded[frame].src; // use preloaded image
            frame = (frame + 1) % totalFrames;    // seamless loop
            lastTime = time;
            }

            requestAnimationFrame(animate);
        }

        requestAnimationFrame(animate);
    }
