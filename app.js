var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.get('/', function(req, res) {
    res.sendfile('index.html');
 });
 app.get('/socketStuff.js', function(req, res) {
    res.sendfile('socketStuff.js');
 });
 app.get('/gameStuff.js', function(req, res) {
    res.sendfile('gameStuff.js');
 });

userNumber = 0;
io.on('connection', function(socket) {
   console.log('A user connected');
   io.sockets.emit('newUser',{ number: userNumber});
   socket.emit('socketNumber',{ number: userNumber});
   userNumber++;


   
    socket.on('socketUpdate', function(data) {
        io.sockets.emit('socketUpdate', data);
    });

});

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});