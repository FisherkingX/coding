let socket, peer, roomID, myName, myId;
let localStream;

async function startApp() {
    roomID = document.getElementById('roomInput').value;
    myName = document.getElementById('nameInput').value;
    if (!roomID || !myName) return alert("Fill fields");
    document.getElementById('setupModal').style.display = 'none';

    // 1. Initialize camera IMMEDIATELY on button click
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic access denied!"); }

    // 2. Initialize socket
    socket = io();
    myId = Math.floor(100000 + Math.random() * 900000);
    peer = new Peer('user-' + myId);
    
    document.getElementById('room-display').innerText = "ROOM: " + roomID;
    socket.emit('join', { room: roomID, name: myName, id: myId });
}

function sendMessage() {
    const msg = document.getElementById('user-msg').value;
    socket.emit('message', { name: myName, text: msg, room: roomID, senderId: myId });
}