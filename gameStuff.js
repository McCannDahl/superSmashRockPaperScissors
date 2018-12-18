var myGamePieces = [];

function addUser(n) {
    myGamePieces[n] = new component(n);
}
function removeUser(n) {
    myGamePieces[n] = null;
}

function startGame() {
    myGamePieces[socketNumber] = new component(socketNumber);
    myGamePieces[socketNumber].accY = 0.05;
    myGameArea.start();
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 800;
        this.canvas.height = 400;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function component(socketNum) {
    this.socketNum = socketNum;
    this.width = 20;
    this.height = 20;
    this.actionWidth = 4;
    this.accX = 0;
    this.accY = 0; 
    this.gravity = 0.6; 
    this.velX = 0;
    this.velXMax = 4;
    this.velY = 50;
    this.x = 0;
    this.y = 0;
    this.jumping = false;
    this.flying = false;
    this.action = "";
    this.actionDirection = "";

    if(starting_positions[socketNum]){
        this.x = starting_positions[socketNum];
    }else{
        console.log("error 23948567");
        this.x = 400;
    }

    this.update = function() {
        ctx = myGameArea.context;
        if(colors[socketNum]){
            ctx.fillStyle = colors[socketNum];
        }else{
            console.log("error 29384567");
            ctx.fillStyle = "red";
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
<<<<<<< HEAD
    this.newPos = function() {
        if(!rock && !paper && !scissors){
            if(left && !right){
                this.velX = -3;
            }
            if(!left && right){
                this.velX = 3;
            }
            if(left && right){
                this.velX = 0;
            }
            if(!left && !right){
                this.velX = 0;
            }
        }else{
            this.velX = 0;
        }

        //this.velX += this.accX;
        this.velY += this.accY + this.gravity;
=======
    this.updateActions = function() {
        ctx = myGameArea.context;
        if(this.action != ""){
            if(this.action == "rock"){
                ctx.fillStyle = "brown";
            }
            if(this.action == "paper"){
                ctx.fillStyle = "grey";
            }
            if(this.action == "scissors"){
                ctx.fillStyle = "blue";
            }
            if(this.actionDirection == "up"){
                ctx.fillRect(this.x, this.y-this.actionWidth, 20, this.actionWidth);
            }
            if(this.actionDirection == "down"){
                ctx.fillRect(this.x, this.y+20, 20, this.actionWidth);
            }
            if(this.actionDirection == "left"){
                ctx.fillRect(this.x-this.actionWidth, this.y, this.actionWidth, 20);
            }
            if(this.actionDirection == "right"){
                ctx.fillRect(this.x+20, this.y, this.actionWidth, 20);
            }
        }
    }

    this.newPos = function() {
        if(this.action == "" || this.jumping){
            if(left && !right){
                this.accX = -0.5;
            }
            if(!left && right){
                this.accX = 0.5;
            }
            if((!left && !right) || (left && right)){
                if(this.velX > 0){
                    this.accX = -0.5;
                }
                if(this.velX < 0){
                    this.accX = 0.5;
                }
            }
        }else{
            if(this.velX > 0){
                this.accX = -0.5;
            }
            if(this.velX < 0){
                this.accX = 0.5;
            }
        }
        if(!(this.velX <= this.velXMax && this.velX+this.accX > this.velXMax) && !(this.velX >= -this.velXMax && this.velX+this.accX < -this.velXMax)){
            this.velX += this.accX;
        }

        this.velY += this.accY;
>>>>>>> origin/master
        this.x += this.velX;
        this.y += this.velY;
        this.hitBottom();
        this.hitTop();
        this.hitLeft();
        this.hitRight();
<<<<<<< HEAD
=======
        this.hitOthersWithAction();
        this.hitOtherActionsWithAction();
        sendSocketData();
>>>>>>> origin/master
    }
    this.hitBottom = function() {
        var rockbottom = myGameArea.canvas.height - this.height;
        if (this.y > rockbottom) {
            this.y = rockbottom;
            this.velY = 0;
            this.accY = 0;
            this.jumping = false;
            this.flying = false;
        }
    }
    this.hitTop = function() {
        var rocktop = 0;
        if (this.y < 0) {
            this.y = 0;
            this.velY = -this.velY;
        }
    }
    this.hitLeft = function() {
        var rockleft = 0;
        if (this.x < 0) {
            this.x = 0;
            this.velX = 0;
        }
    }
    this.hitRight = function() {
        var rockRight = myGameArea.canvas.width - this.width;
        if (this.x > rockRight) {
            this.x = rockRight;
            this.velX = 0;
        }
    }
    this.hitOthersWithAction = function() {
        if(this.action!=""){
            for (var i in myGamePieces) {
                if(i!=this.socketNumber){
                    if(myGamePieces[i]){
                        if(this.actionDirection=="left"){
                            if(myGamePieces[i].x+20 > this.x-this.actionWidth){
                                if(myGamePieces[i].x < this.x){
                                    if(myGamePieces[i].y > this.y-20){
                                        if(myGamePieces[i].y < this.y+20){
                                            hit(i,this.action,this.actionDirection);
                                        }
                                    }
                                }
                            }
                        }
                        if(this.actionDirection=="right"){
                            if(myGamePieces[i].x+20 > this.x+20){
                                if(myGamePieces[i].x < this.x+20+this.actionWidth){
                                    if(myGamePieces[i].y > this.y-20){
                                        if(myGamePieces[i].y < this.y+20){
                                            hit(i,this.action,this.actionDirection);
                                        }
                                    }
                                }
                            }
                        }
                        if(this.actionDirection=="up"){
                            if(myGamePieces[i].y+20 > this.y-this.actionWidth){
                                if(myGamePieces[i].y < this.y){
                                    if(myGamePieces[i].x+20 > this.x){
                                        if(myGamePieces[i].x < this.x+20){
                                            hit(i,this.action,this.actionDirection);
                                        }
                                    }
                                }
                            }
                        }
                        if(this.actionDirection=="down"){
                            if(myGamePieces[i].y+20 > this.y+20){
                                if(myGamePieces[i].y < this.y+20+this.actionWidth){
                                    if(myGamePieces[i].x+20 > this.x){
                                        if(myGamePieces[i].x < this.x+20){
                                            hit(i,this.action,this.actionDirection);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    this.hitOtherActionsWithAction = function() {

    }
}

function getHit(action,dir){
    myGamePieces[socketNumber].flying = true;
    if(dir == "left"){
        myGamePieces[socketNumber].velY -= 25;
        myGamePieces[socketNumber].accY = 0.6;
        myGamePieces[socketNumber].velX = -25;
    }
    if(dir == "right"){
        myGamePieces[socketNumber].velY -= 25;
        myGamePieces[socketNumber].accY = 0.6;
        myGamePieces[socketNumber].velX = 25;
    }
    if(dir == "up"){
        myGamePieces[socketNumber].velY -= 25;
        myGamePieces[socketNumber].accY = 0.6;
    }
    if(dir == "down"){
        myGamePieces[socketNumber].velY = 25;
        myGamePieces[socketNumber].accY = 0.6;
    }
}

function updateGameArea() {
    myGameArea.clear();
    myGamePieces[socketNumber].newPos();
    for (var i in myGamePieces) {
        if(myGamePieces[i]){
            if(i!=socketNumber){
                checkForColissions(i);
            }
            myGamePieces[i].update();
            myGamePieces[i].updateActions();
        }
    }
    sendSocketData();
}

function jump() {
    if(!myGamePieces[socketNumber].jumping){
<<<<<<< HEAD
        myGamePieces[socketNumber].jumping = true;
        myGamePieces[socketNumber].velY -= 15;
        //myGamePieces[socketNumber].accY += 0.6;
    }
}

function checkForColissions(n){
    
    if (myGamePieces[socketNumber].y > myGamePieces[n].y-20) {
        if (myGamePieces[socketNumber].y < myGamePieces[n].y) {
            if (myGamePieces[socketNumber].x > myGamePieces[n].x-20) {
                if (myGamePieces[socketNumber].x < myGamePieces[n].x+20) {
                    console.log("colision on top");
                    if(myGamePieces[socketNumber].velY>0){
                        myGamePieces[socketNumber].y = myGamePieces[n].y-20;
                        myGamePieces[socketNumber].velY = 0;
                        myGamePieces[socketNumber].accY = 0;
                        myGamePieces[socketNumber].jumping = false;
                    }
                }
            }
        }
    }
    if (myGamePieces[socketNumber].y > myGamePieces[n].y) {
        if (myGamePieces[socketNumber].y < myGamePieces[n].y+20) {
            if (myGamePieces[socketNumber].x > myGamePieces[n].x-20) {
                if (myGamePieces[socketNumber].x < myGamePieces[n].x+20) {
                    console.log("colision on bottom");
                    myGamePieces[socketNumber].y = myGamePieces[n].y+20;
                    myGamePieces[socketNumber].yvel = -myGamePieces[socketNumber].yvel ;
                }
            }
        }
    }

    if (myGamePieces[socketNumber].x > myGamePieces[n].x-20) {
        if (myGamePieces[socketNumber].x < myGamePieces[n].x) {
            if (myGamePieces[socketNumber].y > myGamePieces[n].y-10) {
                if (myGamePieces[socketNumber].y < myGamePieces[n].y+10) {
                    console.log("colision on left");
                    myGamePieces[socketNumber].x = myGamePieces[n].x-20;
                    myGamePieces[socketNumber].xvel = 0;
                }
            }
        }
    }
    if (myGamePieces[socketNumber].x > myGamePieces[n].x) {
        if (myGamePieces[socketNumber].x < myGamePieces[n].x+20) {
            if (myGamePieces[socketNumber].y > myGamePieces[n].y-10) {
                if (myGamePieces[socketNumber].y < myGamePieces[n].y+10) {
                    console.log("colision on right");
                    myGamePieces[socketNumber].x = myGamePieces[n].x+20;
                    myGamePieces[socketNumber].xvel = 0;
                }
            }
=======
        if(myGamePieces[socketNumber].action == ""){
            myGamePieces[socketNumber].jumping = true;
            myGamePieces[socketNumber].velY -= 15;
            myGamePieces[socketNumber].accY = 0.6;
        }
    }
}

function actionAfterMove(){
    if(rock){
        rockf();
    }
    if(paper){
        paperf();
    }
    if(scissors){
        scissorsf();
    }
}

function rockf() {
    if(up || down || left || right){
        if(myGamePieces[socketNumber].action == ""){
            myGamePieces[socketNumber].action = "rock";
            actionf();
        }
    }
}

function paperf() {
    if(up || down || left || right){
        if(myGamePieces[socketNumber].action == ""){
            myGamePieces[socketNumber].action = "paper";
            actionf();
        }
    }
}

function scissorsf() {
    if(up || down || left || right){
        if(myGamePieces[socketNumber].action == ""){
            myGamePieces[socketNumber].action = "scissors";
            actionf();
>>>>>>> origin/master
        }
    }
}

<<<<<<< HEAD
var rock = false;
var paper = false;
var scissors = false;
=======
function actionf(){
    if(up){
        myGamePieces[socketNumber].actionDirection = "up";
    }
    if(down){
        myGamePieces[socketNumber].actionDirection = "down";
    }
    if(left){
        myGamePieces[socketNumber].actionDirection = "left";
    }
    if(right){
        myGamePieces[socketNumber].actionDirection = "right";
    }
    sendActionSocketData();
    setTimeout(unaction, 500);
}

function unaction(){
    myGamePieces[socketNumber].action = "";
    myGamePieces[socketNumber].actionDirection = "";
    sendActionSocketData();
}

>>>>>>> origin/master
var up = false;
var down = false;
var left = false;
var right = false;
<<<<<<< HEAD
=======
var rock = false;
var paper = false;
var scissors = false;
>>>>>>> origin/master

window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);
function keysPressed(e) {
    // left
    if (e.keyCode == 37) {
        left = true;
<<<<<<< HEAD
=======
        actionAfterMove();
>>>>>>> origin/master
    }
    // right
    if (e.keyCode == 39) {
        right = true;
<<<<<<< HEAD
=======
        actionAfterMove();
>>>>>>> origin/master
    }
    // up
    if (e.keyCode == 38) {
        up = true;
<<<<<<< HEAD
        if(!rock && !paper && !scissors){
            jump();
        }
=======
        actionAfterMove();
        jump();
>>>>>>> origin/master
    }
    // down
    if (e.keyCode == 40) {
        down = true;
<<<<<<< HEAD
    }

    // rock
=======
        actionAfterMove();
    }

    // a
>>>>>>> origin/master
    if (e.keyCode == 65) {
        rock = true;
        paper = false;
        scissors = false;
<<<<<<< HEAD
    }
    // paper
=======
        rockf();
    }
    // s
>>>>>>> origin/master
    if (e.keyCode == 83) {
        rock = false;
        paper = true;
        scissors = false;
<<<<<<< HEAD
    }
    // scissors
=======
        paperf();
    }
    // d
>>>>>>> origin/master
    if (e.keyCode == 68) {
        rock = false;
        paper = false;
        scissors = true;
<<<<<<< HEAD
=======
        scissorsf();
>>>>>>> origin/master
    }
 
    e.preventDefault();
}
 
function keysReleased(e) {
    // left
    if (e.keyCode == 37) {
        left = false;
    }
    // right
    if (e.keyCode == 39) {
        right = false;
    }
    // up
    if (e.keyCode == 38) {
        up = false;
    }
    // down
    if (e.keyCode == 40) {
        down = false;
    }

<<<<<<< HEAD
    // rock
    if (e.keyCode == 65) {
        rock = false;
    }
    // paper
    if (e.keyCode == 83) {
        paper = false;
    }
    // scissors
=======
    // a
    if (e.keyCode == 65) {
        rock = false;
    }
    // s
    if (e.keyCode == 83) {
        paper = false;
    }
    // d
>>>>>>> origin/master
    if (e.keyCode == 68) {
        scissors = false;
    }
 
    e.preventDefault();
}

var starting_positions = [ 10, 800-20-10, 400-10, 200-10, 600-10 ];
var colors = ["black","red","orange","olive","green","blue","purple","fuchsia","teal","aqua"];
//var CSS_COLOR_NAMES = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];