const socket = io({ reconnectionAttempts: 5 });
const myId = Math.floor(100000 + Math.random() * 900000);

const peer = new Peer('user-' + myId, {
    debug: 2,
    config: { 
        'iceServers': [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ] 
    }
});

let localStream = null;
let activeCalls = {};
let roomID = null;
let myName = null;
let isMuted = false;
let isVideoOff = false;

window.addEventListener('load', async () => {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('local-video').srcObject = localStream;
    } catch (err) {
        console.error("Failed to get local stream", err);
        alert("Please allow camera and microphone access.");
    }
});

function joinSession() {
    roomID = document.getElementById('room-input').value.trim();
    myName = document.getElementById('name-input').value.trim();
    if (!roomID || !myName) return alert("Enter room and name.");
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('main-chat').style.display = 'block';
    socket.emit('join', { room: roomID, name: myName, id: myId });
}

function sendMessage() {
    const input = document.getElementById('user-msg');
    const text = input.value.trim();
    if (!text) return;
    const data = { 
        name: myName, 
        text: text, 
        room: roomID, 
        senderId: myId, 
        time: new Date().toLocaleTimeString() 
    };
    socket.emit('message', data);
    input.value = "";
    appendMessageUI(data, true);
}

function appendMessageUI(data, isMine) {
    const chat = document.getElementById('chat-window');
    const div = document.createElement('div');
    div.className = isMine ? 'msg-right' : 'msg-left';
    div.innerHTML = `<strong>${data.name}</strong> <span>${data.time}</span><br>${data.text}`;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

socket.on('render_msg', (data) => {
    if (data.senderId !== myId) {
        appendMessageUI(data, false);
    }
});

socket.on('update_room_count', (count) => {
    document.getElementById('room-count').innerText = `Users in room: ${count}`;
});

socket.on('member_joined', (data) => {
    const chat = document.getElementById('chat-window');
    const sysMsg = document.createElement('div');
    sysMsg.className = 'system-msg';
    sysMsg.innerText = `${data.name} joined the room.`;
    chat.appendChild(sysMsg);
    connectToNewUser(data.id, localStream);
});

peer.on('open', (id) => {
    console.log('My peer ID is: ' + id);
});

peer.on('call', (call) => {
    call.answer(localStream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream, call.peer);
    });
    call.on('close', () => {
        video.remove();
    });
    activeCalls[call.peer] = call;
});

function connectToNewUser(userId, stream) {
    const call = peer.call('user-' + userId, stream);
    const video = document.createElement('video');
    call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream, 'user-' + userId);
    });
    call.on('close', () => {
        video.remove();
    });
    activeCalls['user-' + userId] = call;
}

function addVideoStream(video, stream, peerId) {
    video.srcObject = stream;
    video.autoplay = true;
    video.playsInline = true;
    video.id = peerId;
    const grid = document.getElementById('video-grid');
    if (!document.getElementById(peerId)) {
        grid.appendChild(video);
    }
}

function toggleMute() {
    if (!localStream) return;
    isMuted = !isMuted;
    localStream.getAudioTracks()[0].enabled = !isMuted;
    const btn = document.getElementById('mute-btn');
    btn.innerText = isMuted ? "Unmute" : "Mute";
    btn.style.backgroundColor = isMuted ? "red" : "green";
}

function toggleVideo() {
    if (!localStream) return;
    isVideoOff = !isVideoOff;
    localStream.getVideoTracks()[0].enabled = !isVideoOff;
    const btn = document.getElementById('video-btn');
    btn.innerText = isVideoOff ? "Turn Video On" : "Turn Video Off";
    btn.style.backgroundColor = isVideoOff ? "red" : "green";
}

async function startScreenShare() {
    try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        const videoTrack = screenStream.getVideoTracks()[0];
        for (let peerId in activeCalls) {
            const sender = activeCalls[peerId].peerConnection.getSenders().find(s => s.track.kind === videoTrack.kind);
            sender.replaceTrack(videoTrack);
        }
        videoTrack.onended = () => stopScreenShare();
    } catch (err) {
        console.error("Screen share failed", err);
    }
}

function stopScreenShare() {
    const videoTrack = localStream.getVideoTracks()[0];
    for (let peerId in activeCalls) {
        const sender = activeCalls[peerId].peerConnection.getSenders().find(s => s.track.kind === videoTrack.kind);
        sender.replaceTrack(videoTrack);
    }
}

peer.on('disconnected', () => {
    console.log("Peer disconnected, trying to reconnect.");
    peer.reconnect();
});

socket.on('disconnect', () => {
    console.log("Socket disconnected.");
});