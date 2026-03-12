let localStream;
const chat = document.getElementById('chat-window');

async function startApp() {
    const room = document.getElementById('roomInput').value;
    const name = document.getElementById('nameInput').value;
    if (!room || !name) return;
    document.getElementById('setupModal').style.display = 'none';
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Enable Cam/Mic permissions!"); }
}

function sendMessage() {
    const input = document.getElementById('msgInput');
    if (!input.value.trim()) return;
    const div = document.createElement('div');
    div.className = 'msg';
    div.innerText = input.value;
    chat.appendChild(div);
    input.value = "";
    chat.scrollTop = chat.scrollHeight;
}

function toggleMic() {
    const t = localStream.getAudioTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('mic-btn').classList.toggle('active', !t.enabled);
}

function toggleCam() {
    const t = localStream.getVideoTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('cam-btn').classList.toggle('active', !t.enabled);
}