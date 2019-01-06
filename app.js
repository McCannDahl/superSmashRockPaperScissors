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
var socketNumber = 0;


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
      game.currentNumberOfPlayers = gamesJson.games[i].players.length;
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
      console.log("game is undefined");
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
      console.log("gameID is invalid");
      res.render('index');
   }
});
app.post('/joinSpecificGame', function(req, res) {
   var data = {
      password:req.body.password,
      gameID:req.body.gameID,
      myName:req.body.myName,
   };
   console.log("joinSpecificGame");
   console.log(data);
   //todo check to see if player name is taken
   if(passwordIsCorrect(data.password,data.gameID)){
      if(addPlayerToGame(data.myName,data.gameID)){
         res.render('game',{gameID:data.gameID,name:data.myName,password:data.password});
         console.log("added player");
         console.log(gamesJson);
      }else{
         console.log("player not added to game");
         res.render('index');
      }
   }else{
      console.log("password incorrect");
      res.render('index');
   }
});


io.on('connection', function(socket) {
   console.log('A user connected');
   socket.emit('socketNumber',{ socketNumber: socketNumber});
   var mySocketNumber = socketNumber;
   var gameID = null;
   var name = null;
   var password = null;
   var isValid = false;
   var velX = 0;
   var leftKeyDown = false;
   var rightKeyDown = false;

   socketNumber++;
   socket.on('disconnect', function () {
      console.log('A user disconnected '+mySocketNumber);
   });
   socket.on('validate', function (data) {
      console.log('validating user');
      if(validateUser(data.gameID,data.name,data.password)){
         gameID = data.gameID;
         name = data.name;
         password = password;
         isValid = true;
         socket.join("room-"+gameID);
         console.log("user is valid");
         socket.emit('validation',{ valid: true});
         io.sockets.in("room-"+gameID).emit('welcomeMe',{name:name});
      }else{
         console.log("user is not vlaid");
         socket.emit('validation',{ valid: false});
      }
   });


   socket.on('leftKeyPressed', function () {
      velX = -2;
   });
   socket.on('rightKeyPressed', function () {
      velX = 2;
   });
   socket.on('upKeyPressed', function () {
   });
   socket.on('downKeyPressed', function () {
   });
   socket.on('rockKeyPressed', function () {
   });
   socket.on('paperKeyPressed', function () {
   });
   socket.on('scissorsKeyPressed', function () {
   });
   socket.on('leftKeyReleased', function () {
      leftKeyDown = false;
      velX = 0;
   });
   socket.on('rightKeyReleased', function () {
      rightKeyDown = false;
      velX = 0;
   });
   socket.on('upKeyReleased', function () {
   });
   socket.on('downKeyReleased', function () {
   });
   socket.on('rockKeyReleased', function () {
   });
   socket.on('paperKeyReleased', function () {
   });
   socket.on('scissorsKeyReleased', function () {
   });

   //////////////update position/////////////
   setInterval(function() {
      if(isValid && gamesJson.games[gameID]){
         gamesJson.games[gameID].players[name].x += velX;
      }
   }, 50);

});

/////////////////////////send data to game clients///////////////////////
setInterval(function() {
   for (var i = 0; i < gamesJson.games.length; i++) {
      io.sockets.in("room-"+gamesJson.games[i].gameID).emit('playersPositions',{players:gamesJson.games[i].players});
   }
 }, 50);


http.listen(3000, function() {
   console.log('listening on localhost:3000');
});

function createNewGame(data) {
   data.gameID = gamesJson.games.length;
   data.players = {};
   gamesJson.games.push(data);
   return gamesJson.games.length-1;
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
function getGameIndexFromGameID(gameID){
   console.log("getGameIndexFromGameID "+gameID);
   console.log(gamesJson);
   if(gameID){
      for (var i = 0; i < gamesJson.games.length; i++) { 
         if(gamesJson.games[i].gameID == gameID){
            return i;
         }
      }
   }
   return null;
}

function passwordIsCorrect(pass,gameID){
   console.log("passwordIsCorrect "+pass+" "+gameID);
   if(typeof gameID != "undefined"){
      if(typeof pass != "undefined"){
         console.log("getting game...");
         var game = getGameFromGameID(gameID);
         if(game!=null){
            if(game.password == pass){
               return true;
            }
         }
      }
   }
   console.log("returning false");
   return false;
}

function addPlayerToGame(name,gameID){
   console.log("addPlayerToGame "+gameID+" "+name);
   if(typeof gameID != "undefined"){
      if(typeof name != "undefined"){
         var gameIndex = getGameIndexFromGameID(gameID);
         gamesJson.games[gameIndex].players[name] = {x:0,y:0};
         return true;
      }
   }
   return false;
}

function validateUser(gameID,name,pass){
   console.log("validateUser "+gameID+", "+name+", "+pass);
   if(passwordIsCorrect(pass,gameID)){
      var gameIndex = getGameIndexFromGameID(gameID);
      if(gamesJson.games[gameIndex].players != null){
         console.log("validateUser "+gameID+", "+name+", "+pass+" going through players");
         console.log("gamesJson.games[gameIndex].players ");
         console.log(gamesJson.games[gameIndex].players);
         if(typeof(gamesJson.games[gameIndex].players[name]) != "undefined"){
               return true;
         }
      }
   }
   return false;
}