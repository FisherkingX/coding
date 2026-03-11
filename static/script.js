let localStream;
let isMuted = false;
let isCamOff = false;
let isPrivate = false;

async function startApp() {
    const room = document.getElementById('roomInput').value;
    const name = document.getElementById('nameInput').value;
    if (!room || !name) return alert("Please fill in both fields to join.");
    
    document.getElementById('setupModal').style.display = 'none';

    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
        console.log("Media stream initialized successfully.");
    } catch (err) {
        console.error("Access denied:", err);
        alert("Camera/Mic access is required. Please ensure you are on HTTPS.");
    }
}

function sendMessage() {
    const input = document.getElementById('msgInput');
    if (!input.value.trim()) return;
    
    const chat = document.getElementById('chat-window');
    const msg = document.createElement('div');
    msg.className = 'message-bubble';
    msg.textContent = input.value;
    chat.appendChild(msg);
    
    input.value = "";
    chat.scrollTop = chat.scrollHeight;
}

function toggleMic() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    document.getElementById('mic-btn').classList.toggle('muted', isMuted);
}

function toggleCam() {
    if (!localStream) return;
    isCamOff = !isCamOff;
    localStream.getVideoTracks()[0].enabled = !isCamOff;
    document.getElementById('cam-btn').classList.toggle('muted', isCamOff);
}

function togglePrivate() {
    isPrivate = !isPrivate;
    document.getElementById('lock-btn').style.background = isPrivate ? '#fca5a5' : '#30363d';
    alert("Private Messaging: " + (isPrivate ? "ON" : "OFF"));
}

function sendFile() {
    const fileInput = document.getElementById('file-input');
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const chat = document.getElementById('chat-window');
        const img = document.createElement('div');
        img.className = 'message-bubble';
        img.innerHTML = `<img src="${e.target.result}" style="width:100%; border-radius:8px;">`;
        chat.appendChild(img);
    };
    reader.readAsDataURL(file);
}