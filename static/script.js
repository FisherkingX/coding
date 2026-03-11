let socket, peer, localStream, privateTargetId = null;

async function startApp() {
    const room = document.getElementById('roomInput').value;
    const name = document.getElementById('nameInput').value;
    if (!room || !name) return alert("All fields required");

    document.getElementById('setupModal').style.display = 'none';

    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic access denied!"); }

    socket = io();
    socket.emit('join', { room, name });
}

function sendMessage() {
    const msg = document.getElementById('msgInput').value;
    socket.emit('message', { text: msg, targetId: privateTargetId });
    document.getElementById('msgInput').value = "";
}

function togglePrivate() {
    const id = prompt("Enter Target ID:");
    if(id) { privateTargetId = id; alert("Private mode ON for " + id); }
}

function toggleMic() {
    const t = localStream.getAudioTracks()[0];
    t.enabled = !t.enabled;
}

function toggleCam() {
    const t = localStream.getVideoTracks()[0];
    t.enabled = !t.enabled;
}

function sendFile() {
    const file = document.getElementById('file-input').files[0];
    const reader = new FileReader();
    reader.onload = (e) => socket.emit('message', { file: e.target.result });
    reader.readAsDataURL(file);
}