let socket, peer, roomID, myName, myId, currentAction;

async function startApp() {
    roomID = document.getElementById('roomInput').value;
    myName = document.getElementById('nameInput').value;
    if (!roomID || !myName) return alert("Fill fields");
    document.getElementById('setupModal').style.display = 'none';

    socket = io();
    myId = Math.floor(100000 + Math.random() * 900000);
    peer = new Peer('user-' + myId);
    
    document.getElementById('room-display').innerText = "ROOM: " + roomID;
    socket.emit('join', { room: roomID, name: myName, id: myId });
}

function openTargetModal(action) {
    currentAction = action;
    document.getElementById('target-modal').style.display = 'flex';
}

function submitTarget() {
    const target = document.getElementById('targetInput').value;
    socket.emit('request_action', { type: currentAction, fromName: myName, fromId: myId, toId: target, room: roomID });
    document.getElementById('target-modal').style.display = 'none';
}

function sendMessage() {
    const msg = document.getElementById('user-msg').value;
    socket.emit('message', { name: myName, text: msg, room: roomID, senderId: myId });
}