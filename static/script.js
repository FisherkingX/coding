let localStream;
async function startApp() {
    document.getElementById('setupModal').style.display = 'none';
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic access denied!"); }
}
function sendMessage() {
    const msg = document.getElementById('msgInput').value;
    if (msg) { console.log("Sending:", msg); document.getElementById('msgInput').value = ""; }
}
function toggleMic() {
    if (localStream) {
        const t = localStream.getAudioTracks()[0];
        t.enabled = !t.enabled;
        event.target.style.background = t.enabled ? '#30363d' : '#8b0000';
    }
}
function toggleCam() {
    if (localStream) {
        const t = localStream.getVideoTracks()[0];
        t.enabled = !t.enabled;
        event.target.style.background = t.enabled ? '#30363d' : '#8b0000';
    }
}