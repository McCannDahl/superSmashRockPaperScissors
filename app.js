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

var userNumber = 0;
var users = [];
io.on('connection', function(socket) {
   console.log('A user connected'+userNumber);
   var mySocketNumber = userNumber;
   users[userNumber] = "bob";
   io.sockets.emit('newUser',{ number: userNumber});
   for(i in users) {
      socket.emit('newUser',{ number: i});
   }
   socket.emit('socketNumber',{ number: userNumber});
   userNumber++;


   
   socket.on('socketUpdate', function(data) {
      io.sockets.emit('socketUpdate', data);
   });

   socket.on('disconnect', function () {
      console.log('A user disconnected '+mySocketNumber);
      users[mySocketNumber] = "";
      io.sockets.emit('socketDisconnected', { number: mySocketNumber});
   });

});

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});