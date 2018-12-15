var socket = io();
var socketNumber = 0;
function sendSocketData() {
    socket.emit('socketUpdate', {number : socketNumber, position : {x:myGamePieces[socketNumber].x,y:myGamePieces[socketNumber].y} });
};
socket.on('socketUpdate', function(data) {
    myGamePieces[data.number].x = data.position.x;
    myGamePieces[data.number].y = data.position.y;
});
socket.on('newUser', function(data) {
    console.log("newUser");
    console.log(data);
    addUser(data.number);
});
socket.on('socketNumber', function(data) {
    console.log("socketNumber");
    console.log(data);
    socketNumber = data.number;
    for (var i = 0; i < socketNumber; i++) { 
        addUser(i);
    }
    startGame();
});