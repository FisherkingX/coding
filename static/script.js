let socket, peer, roomID, myName, myId, localStream;

async function startApp() {
    roomID = document.getElementById('roomInput').value;
    myName = document.getElementById('nameInput').value;
    if (!roomID || !myName) return alert("Fill all fields");
    
    document.getElementById('setupModal').style.display = 'none';
    document.getElementById('room-display').innerText = "ROOM: " + roomID;
    document.getElementById('user-display').innerText = "User: " + myName;

    // Initialize Camera/Mic
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic access denied!"); }

    socket = io();
    myId = Math.floor(100000 + Math.random() * 900000);
    peer = new Peer('user-' + myId);
    socket.emit('join', { room: roomID, name: myName, id: myId });
}

function sendMessage() {
    const msg = document.getElementById('user-msg').value;
    socket.emit('message', { name: myName, text: msg, room: roomID, senderId: myId });
    document.getElementById('user-msg').value = "";
}

function toggleMic() {
    const track = localStream.getAudioTracks()[0];
    track.enabled = !track.enabled;
}

function toggleCam() {
    const track = localStream.getVideoTracks()[0];
    track.enabled = !track.enabled;
}

function sendFile() {
    const file = document.getElementById('file-input').files[0];
    const reader = new FileReader();
    reader.onload = () => {
        socket.emit('message', { name: myName, file: reader.result, fileName: file.name, room: roomID });
    };
    reader.readAsDataURL(file);
}