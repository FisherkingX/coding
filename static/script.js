let localStream;

async function startApp() {
    const roomID = document.getElementById('roomInput').value;
    const myName = document.getElementById('nameInput').value;
    if (!roomID || !myName) return alert("Fill all fields");

    // 1. Hide the modal immediately
    document.getElementById('setupModal').style.display = 'none';

    // 2. Request Camera/Mic permission on user action
    try {
        localStream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
        document.getElementById('local-video').srcObject = localStream;
    } catch (e) {
        alert("Camera/Mic access denied! Please allow permissions in your browser settings.");
    }
}

function toggleMic() {
    if (localStream) {
        const audio = localStream.getAudioTracks()[0];
        audio.enabled = !audio.enabled;
    }
}

function toggleCam() {
    if (localStream) {
        const video = localStream.getVideoTracks()[0];
        video.enabled = !video.enabled;
    }
}