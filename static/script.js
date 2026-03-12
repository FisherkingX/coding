const socket = io();

let roomID;
let myName;
let myId;
let peer;
let localStream;
let privateTargetId = null;
let activeCalls = {};

document.getElementById("join-btn").onclick = () => {

roomID = document.getElementById("room-input").value.trim();
myName = document.getElementById("name-input").value.trim();

if(!roomID || !myName){
alert("Enter name and room");
return;
}

document.getElementById("join-screen").style.display = "none";
document.querySelector(".chat-app").style.display = "flex";

startApp();
};

function startApp(){

myId = Math.floor(100000 + Math.random() * 900000);

peer = new Peer('user-' + myId);

document.getElementById("room-display").innerText = "ROOM: " + roomID;
document.getElementById("display-name").innerText = myName;
document.getElementById("display-id").innerText = "ID: " + myId;

init();

socket.emit('join', {room:roomID,name:myName,id:myId});

}

async function init(){

try{

localStream = await navigator.mediaDevices.getUserMedia({
video:true,
audio:true
});

document.getElementById("local-video").srcObject = localStream;

}catch(e){

alert("Camera / Mic error");

}

}



function sendMessage(){

const input = document.getElementById("user-msg");

if(!input.value.trim()) return;

const data = {
name:myName,
text:input.value,
room:roomID,
senderId:myId
};

if(privateTargetId) data.targetId = privateTargetId;

socket.emit("message",data);

input.value="";
}



socket.on("render_msg",(d)=>{

if(d.targetId && d.targetId!=myId && d.senderId!=myId) return;

const div=document.createElement("div");

div.className=d.senderId==myId?"msg-right":"msg-left";

div.innerHTML=`<b>${d.name}</b>: ${d.text}`;

const win=document.getElementById("chat-window");

win.appendChild(div);

win.scrollTop=win.scrollHeight;

});



function toggleMic(){

const t=localStream.getAudioTracks()[0];

t.enabled=!t.enabled;

}



function toggleCam(){

const t=localStream.getVideoTracks()[0];

t.enabled=!t.enabled;

}



function startCallRequest(){

const target=prompt("Target ID");

if(target){
socket.emit("request_action",{
type:"call",
fromName:myName,
fromId:myId,
toId:target,
room:roomID
});
}

}



function startPrivateRequest(){

const target=prompt("Target ID");

if(target){
privateTargetId=target;
}

}



function sendFile(){

const file=document.getElementById("file-input").files[0];

if(!file) return;

const reader=new FileReader();

reader.onload=()=>{

const data={
name:myName,
file:reader.result,
fileName:file.name,
type:file.type,
room:roomID,
senderId:myId
};

socket.emit("message",data);

};

reader.readAsDataURL(file);

}



function endCall(){

Object.values(activeCalls).forEach(call=>call.close());

activeCalls={};

}