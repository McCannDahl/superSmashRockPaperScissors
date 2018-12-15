var socket = io();
var socketNumber = 0;
socket.on('newUser', function(data) {
    console.log("newUser");
    console.log(data);
    addUser(data.number);
});
socket.on('socketNumber', function(data) {
    console.log("socketNumber");
    console.log(data);
    socketNumber = data.number;
    startGame();
});
socket.on('socketDisconnected', function(data) {
    console.log("socketDisconnected");
    console.log(data);
    removeUser(data.number);
});
socket.on('socketUpdate', function(data) {
    myGamePieces[data.number].x = data.position.x;
    myGamePieces[data.number].y = data.position.y;
});
function sendSocketData() {
    socket.emit('socketUpdate', {number : socketNumber, position : {x:myGamePieces[socketNumber].x,y:myGamePieces[socketNumber].y} });
};