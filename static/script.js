let socket, peer, roomID, myName, myId, localStream;
let privateTargetId = null;

async function startApp() {
    roomID = document.getElementById('roomInput').value;
    myName = document.getElementById('nameInput').value;
    if (!roomID || !myName) return alert("Fill fields");
    document.getElementById('setupModal').style.display = 'none';

    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic denied"); }

    socket = io();
    myId = Math.floor(100000 + Math.random() * 900000);
    peer = new Peer('user-' + myId);
    socket.emit('join', { room: roomID, name: myName, id: myId });
}

function sendMessage() {
    const input = document.getElementById('user-msg');
    const data = { name: myName, text: input.value, room: roomID, senderId: myId };
    if (privateTargetId) data.targetId = privateTargetId;
    socket.emit('message', data);
    input.value = "";
}

function togglePrivate() {
    privateTargetId = privateTargetId ? null : prompt("Enter Target ID:");
    document.getElementById('private-btn').style.background = privateTargetId ? '#fca5a5' : '';
}

function toggleMic() {
    const t = localStream.getAudioTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('mic-btn').style.opacity = t.enabled ? '1' : '0.5';
}

function toggleCam() {
    const t = localStream.getVideoTracks()[0];
    t.enabled = !t.enabled;
    document.getElementById('cam-btn').style.opacity = t.enabled ? '1' : '0.5';
}

function sendFile() {
    const file = document.getElementById('file-input').files[0];
    const reader = new FileReader();
    reader.onload = () => {
        const data = { name: myName, file: reader.result, room: roomID, senderId: myId };
        if (privateTargetId) data.targetId = privateTargetId;
        socket.emit('message', data);
    };
    reader.readAsDataURL(file);
}