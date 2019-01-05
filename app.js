var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var publicDir = require('path').join(__dirname,'/public');
app.use(express.static(publicDir));

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());

app.set('views', __dirname + '\\views');
app.set('view engine', 'ejs');

///////////variables//////////////
var gamesJson = {games:[]};


///////////routes/////////////////
app.get('/', function(req, res) {
   res.render('index');
});
app.post('/tutorial', function(req, res) {
   res.render('tutorial');
});
app.get('/joinGame', function(req, res) {
   console.log(gamesJson);
   res.render('joinGame');
});
app.post('/getGamesData', function(req, res) {
   console.log("getGamesData");
   console.log("gamesJson");
   console.log(gamesJson);
   var data = {games:[]};
   for (var i = 0; i < gamesJson.games.length; i++) { 
      var game = {};
      game.nameOfGame = gamesJson.games[i].nameOfGame;
      game.maxNumberOfPlayers = gamesJson.games[i].maxNumberOfPlayers;
      game.timeLives = gamesJson.games[i].timeLives;
      game.time = gamesJson.games[i].time;
      game.lives = gamesJson.games[i].lives;
      game.privatePublic = gamesJson.games[i].privatePublic;
      game.map = gamesJson.games[i].map;
      game.gameID = gamesJson.games[i].gameID;
      data.games.push(game);
   }
   res.json(data);
});
app.post('/joinGameClicked', function(req, res) {
   console.log("joinGameClicked "+req.body.gameID);
   var game = getGameFromGameID(req.body.gameID);
   console.log("game ");
   console.log(game);
   if(game){
      var isTherePassword = false;
      if(game.password){
         if(game.password!=""){
            isTherePassword = true;
         }
      }
      res.render('joinSpecificGame',{gameID:game.gameID,isTherePassword:isTherePassword,password:""});
   }else{
      res.render('index');
   }
});
app.post('/joinGame', function(req, res) {
   res.render('joinGame');
});
app.post('/newGame', function(req, res) {
   res.render('newGame');
});
app.get('/newGame', function(req, res) {
   res.render('newGame');
});
app.post('/createNewGame', function(req, res) {
   var data = {
      nameOfGame:req.body.nameOfGame,
      maxNumberOfPlayers:req.body.maxNumberOfPlayers,
      timeLives:req.body.timeLives,
      time:req.body.time,
      lives:req.body.lives,
      privatePublic:req.body.privatePublic,
      password:req.body.password,
      map:req.body.map,
   };
   var isTherePassword = false;
   if(data.password){
      if(data.password!=""){
         isTherePassword = true;
      }
   }
   console.log("data");
   console.log(data);
   var gameID = createNewGame(data);
   if(gameID!=-1){
      res.render('joinSpecificGame',{gameID:gameID,isTherePassword:isTherePassword,password:data.password});
   }else{
      res.render('index');
   }
});
app.post('/joinSpecificGame', function(req, res) {
   var data = {
      gameID:req.body.gameID,
      myName:req.body.myName,
   };
   console.log(data);
   res.render('index');
});

/*
io.on('connection', function(socket) {
   console.log('A user connected'+userNumber);
   io.sockets.emit('newUser',{ number: userNumber});
   socket.emit('socketNumber',{ number: userNumber});
   socket.on('socketUpdate', function(data) {
      io.sockets.emit('socketUpdate', data);
   });
   socket.on('disconnect', function () {
      console.log('A user disconnected '+mySocketNumber);
      users[mySocketNumber] = "";
      io.sockets.emit('socketDisconnected', { number: mySocketNumber});
   });

});
*/

http.listen(3000, function() {
   console.log('listening on localhost:3000');
});


function createNewGame(data) {
   data.gameID = gamesJson.games.length+1;
   gamesJson.games.push(data);
   return gamesJson.games.length;
}

function getGameFromGameID(gameID){
   console.log("getGameFromGameID "+gameID);
   console.log(gamesJson);
   if(gameID){
      for (var i = 0; i < gamesJson.games.length; i++) { 
         if(gamesJson.games[i].gameID == gameID){
            return gamesJson.games[i];
         }
      }
   }
   return null;
}