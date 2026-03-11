let localStream, privateMode = false;

async function startApp() {
    document.getElementById('setupModal').style.display = 'none';
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) { alert("Camera/Mic access denied!"); }
}

function togglePrivate() {
    privateMode = !privateMode;
    // Visually toggle button
    document.getElementById('private-btn').style.background = privateMode ? '#fca5a5' : '#21262d';
    // This logic connects to your existing messaging function
    if(privateMode) {
        // Here you would prompt for Target ID using a custom modal div
        // to avoid the "white box" native prompt.
    }
}

function toggleMic() {
    if(localStream) localStream.getAudioTracks()[0].enabled = !localStream.getAudioTracks()[0].enabled;
}

function toggleCam() {
    if(localStream) localStream.getVideoTracks()[0].enabled = !localStream.getVideoTracks()[0].enabled;
}