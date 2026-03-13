const socket = io();
const myId = Math.floor(100000 + Math.random() * 900000);
const peer = new Peer('user-' + myId);
let localStream, privateTargetId = null;
let activeCalls = {};
let roomID, myName;

// ✅ FIX #2: init() now called inside joinSession() AFTER user interaction
function joinSession() {
    roomID = document.getElementById('room-input').value;
    myName = document.getElementById('name-input').value;
    if (!roomID || !myName) return alert("Please fill both fields");
    document.getElementById('session-modal').style.display = 'none';
    document.getElementById('room-display').innerText = "ROOM: " + roomID;
    document.getElementById('display-name').innerText = myName;
    document.getElementById('display-id').innerText = "ID: " + myId;
    socket.emit('join', { room: roomID, name: myName, id: myId });
    init(); // ✅ Start camera AFTER user has interacted with the page
}

function startPrivateRequest() {
    if (privateTargetId) {
        privateTargetId = null;
        document.getElementById('private-btn').classList.remove('active-mode');
        alert("Private Mode Off");
        return;
    }
    document.getElementById('private-modal').style.display = 'flex';
}

function confirmPrivate() {
    const target = document.getElementById('target-id-input').value;
    if (target) {
        socket.emit('request_action', { type: 'private', fromName: myName, fromId: myId, toId: target, room: roomID });
        document.getElementById('private-modal').style.display = 'none';
        document.getElementById('target-id-input').value = "";
    }
}

function startCallRequest() {
    document.getElementById('call-modal').style.display = 'flex';
}

function confirmCall() {
    const target = document.getElementById('call-id-input').value;
    if (target) {
        socket.emit('request_action', { type: 'call', fromName: myName, fromId: myId, toId: target, room: roomID });
        document.getElementById('call-modal').style.display = 'none';
        document.getElementById('call-id-input').value = "";
    }
}

async function init() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        document.getElementById('local-video').srcObject = localStream;
        monitorAudio(localStream, 'local-video');
    } catch (e) {
        // ✅ FIX #4: Specific error messages
        if (e.name === 'NotAllowedError') {
            alert("Camera/mic permission denied. Please allow access in your browser settings.");
        } else if (e.name === 'NotFoundError') {
            alert("No camera or microphone found on this device.");
        } else if (e.name === 'NotReadableError') {
            alert("Camera is in use by another application.");
        } else {
            alert("Media Error: " + e.message);
        }
    }
}

// ✅ Removed the bare init() call here — it's now called inside joinSession()

function monitorAudio(stream, elementId) {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    function check() {
        analyser.getByteFrequencyData(data);
        const volume = data.reduce((a, b) => a + b) / data.length;
        const el = document.getElementById(elementId);
        if (el) el.classList.toggle('speaking', volume > 30);
        requestAnimationFrame(check);
    }
    check();
}

function sendFile() {
    const file = document.getElementById('file-input').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
        const data = { name: myName, file: reader.result, fileName: file.name, type: file.type, room: roomID, senderId: myId };
        if (privateTargetId) data.targetId = privateTargetId;
        socket.emit('message', data);
    };
    reader.readAsDataURL(file);
}

socket.on('incoming_request', (data) => {
    if (data.toId != myId) return;
    const modal = document.getElementById('request-modal');
    document.getElementById('modal-text').innerText = `${data.fromName} (ID: ${data.fromId}) wants a ${data.type}!`;
    modal.style.display = 'flex';
    document.getElementById('accept-btn').onclick = () => {
        modal.style.display = 'none';
        if (data.type === 'private') {
            privateTargetId = data.fromId;
            document.getElementById('private-btn').classList.add('active-mode');
        }
        socket.emit('respond_action', { ...data, status: 'accept' });
    };
    document.getElementById('reject-btn').onclick = () => {
        modal.style.display = 'none';
        socket.emit('respond_action', { ...data, status: 'reject' });
    };
});

socket.on('action_response', (data) => {
    if (data.fromId != myId) return;
    if (data.status === 'accept') {
        if (data.type === 'call') setupCall(peer.call('user-' + data.toId, localStream));
        if (data.type === 'private') {
            privateTargetId = data.toId;
            document.getElementById('private-btn').classList.add('active-mode');
        }
    } else alert("Rejected");
});

peer.on('call', (c) => {
    c.answer(localStream);
    setupCall(c);
});

function setupCall(call) {
    activeCalls[call.peer] = call;
    document.getElementById('hangup-btn').style.display = 'block';
    call.on('stream', (s) => {
        let v = document.getElementById('remote-' + call.peer);
        if (!v) {
            v = document.createElement('video');
            v.id = 'remote-' + call.peer;
            v.autoplay = true; v.playsinline = true;
            document.getElementById('video-grid').appendChild(v);
            monitorAudio(s, v.id);
        }
        v.srcObject = s;
    });
    call.on('close', () => { removeRemoteVideo(call.peer); });
}

function endCall() {
    Object.values(activeCalls).forEach(call => call.close());
    activeCalls = {};
    document.getElementById('hangup-btn').style.display = 'none';
}

function removeRemoteVideo(peerId) {
    const v = document.getElementById('remote-' + peerId);
    if (v) v.remove();
    if (Object.keys(activeCalls).length === 0) document.getElementById('hangup-btn').style.display = 'none';
}

function sendMessage() {
    const input = document.getElementById('user-msg');
    if (!input.value.trim()) return;
    const data = { name: myName, text: input.value, room: roomID, senderId: myId };
    if (privateTargetId) data.targetId = privateTargetId;
    socket.emit('message', data);
    input.value = "";
}

socket.on('render_msg', (d) => {
    if (d.targetId && d.targetId != myId && d.senderId != myId) return;
    const div = document.createElement('div');
    div.className = d.senderId == myId ? 'msg-right' : 'msg-left';
    let prefix = d.targetId ? "🔒 " : "";
    let content = `<span class="sender-tag">${prefix}${d.name} [ID:${d.senderId}]</span>`;
    if (d.file) {
        if (d.type.startsWith('image/')) content += `<img src="${d.file}" style="max-width:100%; border-radius:10px;">`;
        else if (d.type.startsWith('video/')) content += `<video src="${d.file}" controls style="max-width:100%; border-radius:10px;"></video>`;
        else content += `<a href="${d.file}" download="${d.fileName}" style="color:cyan;">📁 ${d.fileName}</a>`;
    } else content += d.text;
    div.innerHTML = content;
    const win = document.getElementById('chat-window');
    win.appendChild(div);
    win.scrollTop = win.scrollHeight;
});

// ✅ FIX #3: Null-guards so these don't crash if camera failed
function toggleMic() {
    if (!localStream) return alert("Microphone not available.");
    const t = localStream.getAudioTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    document.getElementById('mic-btn').classList.toggle('off-status', !t.enabled);
}

function toggleCam() {
    if (!localStream) return alert("Camera not available.");
    const t = localStream.getVideoTracks()[0];
    if (!t) return;
    t.enabled = !t.enabled;
    document.getElementById('cam-btn').classList.toggle('off-status', !t.enabled);
}

document.getElementById('user-msg').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

socket.on('update_room_count', (count) => {
    document.getElementById('member-count').innerText = count;
});