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
   var hitAccX = 0;
   var hitAccY = 0;
   var frictionAccX = 0;
   var frictionAccY = 0;
   var gravity = 3;
   var velX = 0;
   var velY = 0;
   var canJump = true;
   var mapID = 0;
   var map = {};
   var width = 0;
   var height = 0;
   var x = 300;
   var y = 0;
   var movementDirection = "front";
   var actionDirection = "";
   var collisionSideThickness = 8;
   var collided = false;
   var rockKeyPressed = false;
   var paperKeyPressed = false;
   var scissorsKeyPressed = false;
   var upKeyPressed = false;
   var downKeyPressed = false;
   var leftKeyPressed = false;
   var rightKeyPressed = false;
   var action = "";
   var actionObject = {x:0,y:0,width:0,height:0};
   var health = 100;

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
      leftKeyPressed = true;
      setAction();
   });
   socket.on('rightKeyPressed', function () {
      rightKeyPressed = true;
      setAction();
   });
   socket.on('upKeyPressed', function () {
      upKeyPressed = true;
      setAction();
   });
   socket.on('downKeyPressed', function () {
      downKeyPressed = true;
      setAction();
   });
   socket.on('rockKeyPressed', function () {
      rockKeyPressed = true;
      setAction();
   });
   socket.on('paperKeyPressed', function () {
      paperKeyPressed = true;
      setAction();
   });
   socket.on('scissorsKeyPressed', function () {
      scissorsKeyPressed = true;
      setAction();
   });
   socket.on('leftKeyReleased', function () {
      leftKeyPressed = false;
      keysAccX = 0;
      if(action==""){
         movementDirection = "front";
         if(downKeyPressed){
            movementDirection = "down";
         }
         if(leftKeyPressed){
            keysAccX = -2.5;
            movementDirection = "left";
         }
         if(rightKeyPressed){
            keysAccX = 2.5;
            movementDirection = "right";
         }
         if(upKeyPressed){
            if(canJump && !rockKeyPressed && !paperKeyPressed && !scissorsKeyPressed){
               velY = -25;
               movementDirection = "jump";
               canJump = false;
            }
         }
         if(downKeyPressed){
            keysAccY = 3;
         }
      }
   });
   socket.on('rightKeyReleased', function () {
      rightKeyPressed = false;
      keysAccX = 0;
      if(action==""){
         movementDirection = "front";
         if(downKeyPressed){
            movementDirection = "down";
         }
         if(leftKeyPressed){
            keysAccX = -2.5;
            movementDirection = "left";
         }
         if(rightKeyPressed){
            keysAccX = 2.5;
            movementDirection = "right";
         }
         if(upKeyPressed){
            if(canJump && !rockKeyPressed && !paperKeyPressed && !scissorsKeyPressed){
               velY = -25;
               movementDirection = "jump";
               canJump = false;
            }
         }
         if(downKeyPressed){
            keysAccY = 3;
         }
      }
   });
   socket.on('upKeyReleased', function () {
      upKeyPressed = false;
      keysAccY = 0;
   });
   socket.on('downKeyReleased', function () {
      downKeyPressed = false;
      keysAccY = 0;
   });
   socket.on('rockKeyReleased', function () {
      rockKeyPressed = false;
   });
   socket.on('paperKeyReleased', function () {
      paperKeyPressed = false;
   });
   socket.on('scissorsKeyReleased', function () {
      scissorsKeyPressed = false;
   });

   //////////////set and unset actions functions/////////////
   function setAction(){
      if(action == "" && (upKeyPressed || downKeyPressed || leftKeyPressed || rightKeyPressed)){
         if(rockKeyPressed){
            action = "rock";
            setTimeout(unsetAction, 1000);
         }else if(paperKeyPressed){
            action = "paper";
            setTimeout(unsetAction, 1000);
         }else if(scissorsKeyPressed){
            action = "scissors";
            setTimeout(unsetAction, 1000);
         }else{
            movementDirection = "front";
            if(downKeyPressed){
               keysAccY = 3;
               movementDirection = "down";
            }
            if(upKeyPressed){
               if(canJump && !rockKeyPressed && !paperKeyPressed && !scissorsKeyPressed){
                  velY = -25;
                  movementDirection = "jump";
                  canJump = false;
               }
            }
            if(leftKeyPressed){
               keysAccX = -2.5;
               movementDirection = "left";
            }
            if(rightKeyPressed){
               keysAccX = 2.5;
               movementDirection = "right";
            }
         }
         if(rockKeyPressed || paperKeyPressed || scissorsKeyPressed){
            if(downKeyPressed){
               actionDirection = "down";
            }
            if(upKeyPressed){
               movementDirection = "jump";
               actionDirection = "up";
            }
            if(leftKeyPressed){
               movementDirection = "left";
               actionDirection = "left";
            }
            if(rightKeyPressed){
               movementDirection = "right";
               actionDirection = "right";
            }
         }
      }
   }
   function unsetAction(){
      action = "";
      actionDirection = "";
      movementDirection = "front";
      if(downKeyPressed){
         movementDirection = "down";
      }
      if(leftKeyPressed){
         keysAccX = -2.5;
         movementDirection = "left";
      }
      if(rightKeyPressed){
         keysAccX = 2.5;
         movementDirection = "right";
      }
      if(upKeyPressed){
         if(canJump && !rockKeyPressed && !paperKeyPressed && !scissorsKeyPressed){
            velY = -25;
            movementDirection = "jump";
            canJump = false;
         }
      }
      if(downKeyPressed){
         keysAccY = 3;
      }
   }

   //////////////update position function/////////////
   setInterval(function() {
      if(isValid && gamesJson.games[gameID]){

         //////////////Set Action/////////////
         if(action != ""){
            keysAccX = 0;
            keysAccY = 0;
         }

         //////////////Drag calc/////////////
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
         calculateDrag();
         

         //////////////update velocities/////////////
         function updateVelocity(){
            velX += keysAccX + dragAccX + frictionAccX + hitAccX;
            velY += keysAccY + dragAccY + frictionAccY + hitAccY + gravity;
            
            if(velX>-.2 && velX<.2 ){
               velX = 0;
            }
            if(velY>-.2 && velY<.2 ){
               velY = 0;
            }
            
         }
         updateVelocity();
         
         if(hitAccX!=0){
            hitAccX = 0;
         }
         if(hitAccY!=0){
            hitAccY = 0;
         }

         //////////////update position/////////////
         x += velX;
         y += velY;

         //////////////check for collisions with blocks/////////////
         function checkForCollisionsWithBlocks(){
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
         }
         checkForCollisionsWithBlocks();

         //////////////check for collisions with other players/////////////
         //do this last


         //////////////check for collisions with death lines/////////////
         
         //////////////check for collisions of action with other players/////////////
         function checkForCollisionsWithActions(){
            if(isValid == true){
               setWidthAndHeight();
               if(gamesJson.games[gameID].hasOwnProperty("players")){
                  for (var key in gamesJson.games[gameID].players) {
                     if(key != name && gamesJson.games[gameID].players[key].action != ""){
                        setWidthHeightXAndYOfAction(key);
                        if(actionsCollide()){
                           getHit(key);
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

            function setWidthHeightXAndYOfAction(key){
               if(gamesJson.games[gameID].players[key].actionDirection=="right"){
                  actionObject.x = 33-5;
                  actionObject.y = -24+10;
               }else if(gamesJson.games[gameID].players[key].actionDirection=="left"){
                  actionObject.x = -33+5;
                  actionObject.y = -24+10;
               }else if(gamesJson.games[gameID].players[key].actionDirection=="up"){
                  actionObject.x = 0;
                  actionObject.y = -72+20;
               }else if(gamesJson.games[gameID].players[key].actionDirection=="down"){
                  actionObject.x = 0;
                  actionObject.y = 10;
               }
               actionObject.x += gamesJson.games[gameID].players[key].x;
               actionObject.y += gamesJson.games[gameID].players[key].y;
               actionObject.width = 20;
               actionObject.height = 20;

            }
            function actionsCollide(){
               if(x+width/2.0 > actionObject.x-actionObject.width/2.0){
                  if(x-width/2.0 < actionObject.x+actionObject.width/2.0){
                     if(y > actionObject.y-actionObject.height){
                        if(y-height < actionObject.y){
                           return true;
                        }
                     }
                  }
               }
               return false;
            }
         }
         checkForCollisionsWithActions();
         
         function getHit(key){

            if(gamesJson.games[gameID].players[key].action != ""){

               var power = 0;
               var damage = 0;

               if(gamesJson.games[gameID].players[key].action == "rock"){
                  power = .8;
                  damage = .2;
               }else if(gamesJson.games[gameID].players[key].action == "paper"){
                  power = .5;
                  damage = .5;
               }else if(gamesJson.games[gameID].players[key].action == "scissors"){
                  power = .2;
                  damage = .8;
               }

               if(gamesJson.games[gameID].players[key].actionDirection == "right"){
                  hitAccX = (30*power)*(100/health);
                  hitAccY = (10*power)*(100/health);
               }else if(gamesJson.games[gameID].players[key].actionDirection == "left"){
                  hitAccX = (-30*power)*(100/health);
                  hitAccY = (10*power)*(100/health);
               }else if(gamesJson.games[gameID].players[key].actionDirection == "up"){
                  hitAccY = (-30*power)*(100/health);
               }else if(gamesJson.games[gameID].players[key].actionDirection == "down"){
                  hitAccY = (30*power)*(100/health);
               }

               health -= health*damage;
               if(health<1){
                  health = 1;
               }
            }
         }

         /////////////update actual variables///////////
         gamesJson.games[gameID].players[name].movementDirection = movementDirection;
         gamesJson.games[gameID].players[name].actionDirection = actionDirection;
         gamesJson.games[gameID].players[name].x = x;
         gamesJson.games[gameID].players[name].y = y;
         gamesJson.games[gameID].players[name].action = action;
         gamesJson.games[gameID].players[name].health = health;
   
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
            movementDirection:"front",
            action:"",
            actionDirection:"",
            health: 100,
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