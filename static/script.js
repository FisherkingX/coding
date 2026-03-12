let localStream, isMic = true, isCam = false;
const state = { room: "", online: 0 };

async function startApp() {
    state.room = document.getElementById('roomInput').value;
    state.online = 1; // Simulate user joining
    document.getElementById('room-name').innerText = `Room: ${state.room}`;
    document.getElementById('online-count').innerText = `Online: ${state.online}`;
    document.getElementById('setupModal').style.display = 'none';
}

function toggleCam() {
    const video = document.getElementById('local-video');
    isCam = !isCam;
    if (isCam) {
        navigator.mediaDevices.getUserMedia({video: true}).then(s => {
            localStream = s;
            video.srcObject = s;
            video.style.display = 'block';
            document.getElementById('cam-btn').classList.remove('active');
        });
    } else {
        video.style.display = 'none';
        document.getElementById('cam-btn').classList.add('active');
    }
}

function toggleMic() {
    isMic = !isMic;
    document.getElementById('mic-btn').classList.toggle('active', !isMic);
}

function togglePrivate() {
    document.getElementById('priv-btn').classList.toggle('active');
}