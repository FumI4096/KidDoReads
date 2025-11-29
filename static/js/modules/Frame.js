
const totalFrames = 48; // Replace with the number of frames you have
let frame = 0;
const img = document.getElementById('owl');

function pad(num, size) {
    let s = "00000" + num;
    return s.substr(s.length - size);
}

setInterval(() => {
    img.src = `static/animation/frame/frame_${pad(frame, 5)}.png`;
    frame = (frame + 1) % totalFrames; // loops continuously
}, 1000 / 24); // 24 fps, adjust as needed
