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
var canvasWidth = 800;
var canvasHeight = 400;


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
      game.mapID = gamesJson.games[i].mapID;
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
      mapID:req.body.mapID,
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
      color:req.body.color,
   };
   console.log("joinSpecificGame");
   console.log(data);
   //todo check to see if player name is taken
   if(passwordIsCorrect(data.password,data.gameID)){
      if(addPlayerToGame(data.myName,data.gameID,data.color)){
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
   var keysAccX = 0;
   var keysAccY = 0;
   var dragAccX = 0;
   var dragAccY = 0;
   var frictionAccX = 0;
   var frictionAccY = 0;
   var gravity = 3;
   var velX = 0;
   var velY = 0;
   var leftKeyDown = false;
   var rightKeyDown = false;
   var canJump = true;
   var ongound = false;
   var tryingToJump = false;
   var mapID = 0;
   var map = {};
   var width = 0;
   var height = 0;
   var x = 300;
   var y = 0;
   var movementDirection = "front";
   var collisionSideThickness = 8;
   var collided = false;

   socketNumber++;
   socket.on('disconnect', function () {
      console.log('A user disconnected '+mySocketNumber);
      isValid = false;
   });
   socket.on('validate', function (data) {
      console.log('validating user');
      if(validateUser(data.gameID,data.name,data.password)){
         gameID = data.gameID;
         name = data.name;
         password = password;
         socket.join("room-"+gameID);
         console.log("user is valid");
         io.sockets.in("room-"+gameID).emit('welcomeMe',{name:name});
         mapID = gamesJson.games[gameID].mapID;
         map = getMap(mapID);
         socket.emit('validation',{ valid: true,map:map});
         isValid = true;
      }else{
         console.log("user is not vlaid");
         socket.emit('validation',{ valid: false});
      }
   });


   socket.on('leftKeyPressed', function () {
      keysAccX = -2.5;
      movementDirection = "left";
   });
   socket.on('rightKeyPressed', function () {
      keysAccX = 2.5;
      movementDirection = "right";
   });
   socket.on('upKeyPressed', function () {
      if(canJump){
         velY = -25;
         movementDirection = "jump";
         canJump = false;
      }
   });
   socket.on('downKeyPressed', function () {
      keysAccY = 3;
   });
   socket.on('rockKeyPressed', function () {
   });
   socket.on('paperKeyPressed', function () {
   });
   socket.on('scissorsKeyPressed', function () {
   });
   socket.on('leftKeyReleased', function () {
      leftKeyDown = false;
      keysAccX = 0;
      movementDirection = "front";
   });
   socket.on('rightKeyReleased', function () {
      rightKeyDown = false;
      keysAccX = 0;
      movementDirection = "front";
   });
   socket.on('upKeyReleased', function () {
      keysAccY = 0;
   });
   socket.on('downKeyReleased', function () {
      keysAccY = 0;
   });
   socket.on('rockKeyReleased', function () {
   });
   socket.on('paperKeyReleased', function () {
   });
   socket.on('scissorsKeyReleased', function () {
   });

   //////////////update position function/////////////
   setInterval(function() {
      if(isValid && gamesJson.games[gameID]){

         //////////////Drag calc/////////////
         calculateDrag();
         function calculateDrag(){
            if(velX>0){
               dragAccX = -.2*velX;
            }else if(velX<0){
               dragAccX = -.2*velX;
            }else{
               dragAccX = 0;
            }


            if(velY>0){
               //dragAccY = -.2*velY;
               dragAccY = 0;
            }else if(velY<0){
               //dragAccY = -.2*velY;
               dragAccY = 0;
            }else{
               dragAccY = 0;
            }
         }


         //////////////update velocities/////////////
         updateVelocity();
         function updateVelocity(){
            velX += keysAccX + dragAccX + frictionAccX;
            velY += keysAccY + dragAccY + frictionAccY + gravity;
            
            if(velX>-.2 && velX<.2 ){
               velX = 0;
            }
            if(velY>-.2 && velY<.2 ){
               velY = 0;
            }
            
         }
         
         //////////////update position/////////////
         x += velX;
         y += velY;

         //////////////check for collisions with blocks/////////////
         if(isValid == true){
            frictionAccX = 0;
            frictionAccY = 0;
            setWidthAndHeight();
            if(map.hasOwnProperty("blocks")){
               for (var key in map.blocks) {
                  collided = false;
                  if(blocksCollide(getBottomSide(),map.blocks[key]) && !collided){
                     //if(canJump==false && velY<0){
                        //trying to jump?
                     //   console.log("are you trying to jump?");
                     //}else{
                        y = map.blocks[key].y - map.blocks[key].height;
                        collided = true;
                        velY = 0;
                        accY = 0;
                        canJump = true;
                        if(movementDirection == "jump"){
                           movementDirection = "front";
                        }
                        if(velX>0){
                           frictionAccX = -0.2;
                        }
                        if(velX<0){
                           frictionAccX = 0.2;
                        }
                     //}
                  }
                  if(blocksCollide(getTopSide(),map.blocks[key]) && !collided){
                     y = map.blocks[key].y + height;
                     collided = true;
                     velY = 0;
                     accY = 0;
                     if(velX>0){
                        frictionAccX = -0.2;
                     }
                     if(velX<0){
                        frictionAccX = 0.2;
                     }
                  }
                  if(blocksCollide(getLeftSide(),map.blocks[key]) && !collided){
                     x = map.blocks[key].x+map.blocks[key].width/2.0+width/2.0;
                     collided = true;
                     velX = 0;
                     accX = 0;
                     if(velY>0){
                        frictionAccY = -0.2;
                     }
                     if(velY<0){
                        frictionAccY = 0.2;
                     }
                  }
                  if(blocksCollide(getRightSide(),map.blocks[key]) && !collided){
                     x = map.blocks[key].x-map.blocks[key].width/2.0-width/2.0;
                     collided = true;
                     velX = 0;
                     accX = 0;
                     if(velY>0){
                        frictionAccY = -0.2;
                     }
                     if(velY<0){
                        frictionAccY = 0.2;
                     }
                  }
               }
            }
         }

         function setWidthAndHeight(){
            if(movementDirection=="right"){
               width = 66;
               height = 48;
           }else if(movementDirection=="left"){
               width = 66;
               height = 48;
           }else if(movementDirection=="jump"){
               width = 55;
               height = 70;
           }else{
               width = 31;
               height = 64;
           }
         }

         function getLeftSide(){
            var side = {};
            side.x = x-width/2.0+collisionSideThickness/2.0;
            side.y = y-collisionSideThickness;
            side.width = collisionSideThickness;
            side.height = height-collisionSideThickness*2;
            return side;
         }
         function getRightSide(){
            var side = {};
            side.x = x+width/2.0-collisionSideThickness/2.0;
            side.y = y-collisionSideThickness;
            side.width = collisionSideThickness;
            side.height = height-collisionSideThickness*2;
            return side;
         }
         function getTopSide(){
            var side = {};
            side.x = x;
            side.y = y-height+collisionSideThickness;
            side.width = width-collisionSideThickness*2;
            side.height = collisionSideThickness;
            return side;
         }
         function getBottomSide(){
            var side = {};
            side.x = x;
            side.y = y;
            side.width = width-collisionSideThickness*2;
            side.height = collisionSideThickness;
            return side;
         }
         function blocksCollide(side,block){
            if(side.x+side.width/2.0 > block.x-block.width/2.0){
               if(side.x-side.width/2.0 < block.x+block.width/2.0){
                  if(side.y > block.y-block.height){
                     if(side.y-side.height < block.y){
                        return true;
                     }
                  }
               }
            }
            return false;
         }
         
         /*
         if(gamesJson.games[gameID].players[name].y>=400){
            gamesJson.games[gameID].players[name].y = 400;
            velY = 0;
            accY = 0;
            if(gamesJson.games[gameID].players[name].movementDirection == "jump"){
               gamesJson.games[gameID].players[name].movementDirection = "front";
            }
            canJump = true;
            if(velX>0){
               frictionAccX = -0.2;
            }
            if(velX<0){
               frictionAccX = 0.2;
            }
         }
         */

         /////////////update actual variables///////////
         gamesJson.games[gameID].players[name].movementDirection = movementDirection;
         gamesJson.games[gameID].players[name].x = x;
         gamesJson.games[gameID].players[name].y = y;
   
      }
   }, 30);

});

/////////////////////////send data to game clients///////////////////////
setInterval(function() {
   for (var i = 0; i < gamesJson.games.length; i++) {
      io.sockets.in("room-"+gamesJson.games[i].gameID).emit('playersPositions',{players:gamesJson.games[i].players});
   }
 }, 30);


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

function addPlayerToGame(name,gameID,color){
   console.log("addPlayerToGame "+gameID+" "+name);
   if(typeof gameID != "undefined"){
      if(typeof name != "undefined"){
         var gameIndex = getGameIndexFromGameID(gameID);
         gamesJson.games[gameIndex].players[name] = {
            x:500,
            y:100,
            color:color,
            movementDirection:"front"
         };
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

function getMap(mapID){
   //if(mapID == 1){
      var map = {};
      map.blocks = [];
      //remember x is in the middle and y is on the bottom
      map.blocks.push({
         x:canvasWidth/2,
         y:canvasHeight+180,
         width:canvasWidth-100,
         height:200
      });
      map.blocks.push({
         x:canvasWidth/2,
         y:canvasHeight-100,
         width:100,
         height:10
      });
      return map;
   //}
}