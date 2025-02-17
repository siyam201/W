
const shareBtn = io();
let localStream;

// Password protection
const correctPassword = "rom2025"; // Change this to your desired password

function checkPassword() {
  const password = document.getElementById('passwordInput').value;
  if (password === correctPassword) {
    document.getElementById('loginScreen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
  } else {
    document.getElementById('loginError').textContent = 'Incorrect password';
  }
}
let peerConnection;
const configuration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
};

const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const createBtn = document.getElementById('createBtn');
const joinBtn = document.getElementById('joinBtn');
const leaveBtn = document.getElementById('leaveBtn');
const roomIdInput = document.getElementById('roomId');
const callStatus = document.getElementById('callStatus');
const fileInput = document.getElementById('fileInput');
const shareBtn = document.getElementById('shareBtn');
const fileList = document.getElementById('fileList');

createBtn.addEventListener('click', createRoom);
shareBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', handleFileSelect);
joinBtn.addEventListener('click', joinRoom);functionon createRoom() {
  const roomId = Math.random().toString(36).substring(7);
  roomIdInput.value = roomId;
  joinRoom();
}
leaveBtn.addEventListener('click', leaveRoom);

async function joinRoom() {
  if (!roomIdInput.value) {
    callStatus.textContent = 'Please enter a room ID';
    return;
  }
  
  callStatus.textContent = 'Requesting camera and microphone access...';
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    localVideo.srcObject = localStream;
    socket.emit('join', roomIdInput.value);
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
  } catch (err) {
    console.error('Error accessing media devices:', err);
    if (err.name === 'NotAllowedError') {
      callStatus.textContent = 'Please allow camera and microphone access';
    } else {
      callStatus.textContent = 'Error accessing camera/microphone. Please check your permissions';
    }
  }
}

function leaveRoom() {
  if (peerConnection) {
    peerConnection.close();
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
  }
  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
  joinBtn.disabled = false;
  leaveBtn.disabled = true;
  callStatus.textContent = '';
}

async function createPeerConnection() {
  peerConnection = new RTCPeerConnection(configuration);
  
  localStream.getTracks().forEach(track => {
    peerConnection.addTrack(track, localStream);
  });

  peerConnection.ontrack = event => {
    remoteVideo.srcObject = event.streams[0];
  };

  peerConnection.onicecandidate = event => {
    if (event.candidate) {
      socket.emit('ice-candidate', event.candidate, roomIdInput.value);
    }
  };
}

socket.on('joined', async (roomId) => {
  callStatus.textContent = 'Connected to room: ' + roomId;
  await createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.emit('offer', offer, roomId);
});

socket.on('offer', async (offer) => {
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.emit('answer', answer, roomIdInput.value);
});

socket.on('answer', async (answer) => {
  await peerConnection.setRemoteDescription(answer);
});

socket.on('ice-candidate', async (candidate) => {
  try {
    await peerConnection.addIceCandidate(candidate);
  } catch (e) {
    console.error('Error adding ice candidate:', e);
  }
});

socket.on('full', () => {
  callStatus.textContent = 'Room is full';
  leaveRoom();
});

function handleFileSelect(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const fileData = {
        name: file.name,
        type: file.type,
        data: e.target.result
      };
      socket.emit('file-share', fileData, roomIdInput.value);
      displayFile(fileData, true);
    };
    reader.readAsDataURL(file);
  }
}

function displayFile(fileData, isSender) {
  const fileItem = document.createElement('div');
  fileItem.className = 'file-item';
  fileItem.innerHTML = `
    <span>${fileData.name}</span>
    <button onclick="downloadFile('${fileData.name}', '${fileData.data}')">
      ${isSender ? 'Download' : 'Save'}
    </button>
  `;
  fileList.appendChild(fileItem);
}

function downloadFile(filename, dataUrl) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

socket.on('file-share', (fileData) => {
  displayFile(fileData, false);
});

// Update joinRoom to enable share button
async function joinRoom() {
  if (!roomIdInput.value) {
    callStatus.textContent = 'Please enter a room ID';
    return;
  }
  
  callStatus.textContent = 'Requesting camera and microphone access...';
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    });
    localVideo.srcObject = localStream;
    socket.emit('join', roomIdInput.value);
    joinBtn.disabled = true;
    leaveBtn.disabled = false;
    shareBtn.disabled = false;
  } catch (err) {
    console.error('Error accessing media devices:', err);
    if (err.name === 'NotAllowedError') {
      callStatus.textContent = 'Please allow camera and microphone access';
    } else {
      callStatus.textContent = 'Error accessing camera/microphone. Please check your permissions';
    }
  }
}
