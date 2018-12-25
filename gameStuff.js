var myGamePieces = [];

function addUser(n) {
    myGamePieces[n] = new component(n);
}
function removeUser(n) {
    myGamePieces[n] = null;
}

function startGame() {
    myGamePieces[socketNumber] = new component(socketNumber);
    //myGamePieces[socketNumber].accY = 0.05;
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


function getHit(action,direction,myaction,mydirection){
    console.log("I got hit "+direction);

    var flyPower = 0;
    var healthHitter = 0;

    if(action=="rock"){
        flyPower = .2;
        healthHitter = 0;
        if(myaction){
            if(myaction == "rock"){
                flyPower = .1;
                healthHitter = 0;
            }else if(myaction == "paper"){
                flyPower = 0;
                healthHitter = 0;
            }else if(myaction == "scissors"){
                flyPower = .4;
                healthHitter = 0;
            }
        }
    }else if(action=="paper"){
        flyPower = .1;
        healthHitter = .1;
        if(myaction){
            if(myaction == "rock"){
                flyPower = .2;
                healthHitter = .2;
            }else if(myaction == "paper"){
                flyPower = .05;
                healthHitter = .05;
            }else if(myaction == "scissors"){
                flyPower = 0;
                healthHitter = 0;
            }
        }
    }else if(action=="scissors"){
        flyPower = 0;
        healthHitter = .2;
        if(myaction){
            if(myaction == "rock"){
                flyPower = 0;
                healthHitter = 0;
            }else if(myaction == "paper"){
                flyPower = 0;
                healthHitter = .4;
            }else if(myaction == "scissors"){
                flyPower = 0;
                healthHitter = .1;
            }
        }
    }

    myGamePieces[socketNumber].health -= myGamePieces[socketNumber].width*healthHitter;

    if(myGamePieces[socketNumber].health<1){
        myGamePieces[socketNumber].health = 1;
    }

    var healthPercentage = myGamePieces[socketNumber].health/myGamePieces[socketNumber].width;

    if(direction == "left"){
        myGamePieces[socketNumber].velY -= (flyPower/healthPercentage)*deathVelocity;
        myGamePieces[socketNumber].velX += -(flyPower/healthPercentage)*deathVelocity;
    }else if(direction == "right"){
        myGamePieces[socketNumber].velY -= (flyPower/healthPercentage)*deathVelocity;
        myGamePieces[socketNumber].velX += (flyPower/healthPercentage)*deathVelocity;
    }else if(direction == "up"){
        myGamePieces[socketNumber].velY -= (flyPower/healthPercentage)*deathVelocity;
    }else if(direction == "down"){
        myGamePieces[socketNumber].velY += (flyPower/healthPercentage)*deathVelocity;
    }else{
        console.log("error 9240857 "+direction);
    }
    
    shake(4);

    sendHealthSocketData();
}

function updateGameArea() {
    myGameArea.clear();
    myGamePieces[socketNumber].newPos();
    myGamePieces[socketNumber].updateActionsXY();
    myGamePieces[socketNumber].calculateActionsCollisions();
    for (var i in myGamePieces) {
        if(myGamePieces[i]){
            if(i!=socketNumber){
                checkForColissions(i);
                myGamePieces[i].updateActionsXY();
                myGamePieces[i].updateActions();
                myGamePieces[i].update();
            }
        }
    }
    myGamePieces[socketNumber].updateActions();
    myGamePieces[socketNumber].update();
    sendSocketData();
}

function jump() {
    if(!jumping){
        if(myGamePieces[socketNumber].action == ""){
            jumping = true;
            myGamePieces[socketNumber].velY -= jumpingVelocity;
            //myGamePieces[socketNumber].accY = 0.6;
        }
    }
}
function checkForColissions(n){
    
    if (myGamePieces[socketNumber].y > myGamePieces[n].y-myGamePieces[socketNumber].height) {
        if (myGamePieces[socketNumber].y <= myGamePieces[n].y) {
            if (myGamePieces[socketNumber].x > myGamePieces[n].x-(myGamePieces[socketNumber].width-5)) {
                if (myGamePieces[socketNumber].x < myGamePieces[n].x+(myGamePieces[socketNumber].width-5)) {
                    if(myGamePieces[socketNumber].velY>=0){
                        //console.log("colision on top");
                        myGamePieces[socketNumber].y = myGamePieces[n].y-myGamePieces[socketNumber].height;
                        //if(myGamePieces[socketNumber].velY<notMovingVelocity){
                            myGamePieces[socketNumber].velY = 0;
                        //}else{
                        //    myGamePieces[socketNumber].velY = restitution*(-myGamePieces[socketNumber].velY);
                        //}
                        //myGamePieces[socketNumber].accY = 0;
                        jumping = false;
                    }
                }
            }
        }
    }
    if (myGamePieces[socketNumber].y > myGamePieces[n].y) {
        if (myGamePieces[socketNumber].y < myGamePieces[n].y+myGamePieces[socketNumber].height) {
            if (myGamePieces[socketNumber].x > myGamePieces[n].x-(myGamePieces[socketNumber].width-5)) {
                if (myGamePieces[socketNumber].x < myGamePieces[n].x+(myGamePieces[socketNumber].width-5)) {
                    if(myGamePieces[socketNumber].velY<0){
                        //console.log("colision on bottom");
                        myGamePieces[socketNumber].y = myGamePieces[n].y+myGamePieces[socketNumber].height;
                        if(myGamePieces[socketNumber].velY>-notMovingVelocity){
                            myGamePieces[socketNumber].velY = 0;
                        }else{
                            myGamePieces[socketNumber].velY = restitution*(-myGamePieces[socketNumber].velY);
                        }
                    }
                }
            }
        }
    }

    if (myGamePieces[socketNumber].x > myGamePieces[n].x-myGamePieces[socketNumber].width) {
        if (myGamePieces[socketNumber].x < myGamePieces[n].x) {
            if (myGamePieces[socketNumber].y > myGamePieces[n].y-(myGamePieces[socketNumber].height-5)) {
                if (myGamePieces[socketNumber].y < myGamePieces[n].y+(myGamePieces[socketNumber].height-5)) {
                    if(myGamePieces[socketNumber].velX>0){
                        console.log("colision on right");
                        myGamePieces[socketNumber].x = myGamePieces[n].x-myGamePieces[socketNumber].width;
                        if(myGamePieces[socketNumber].velX<notMovingVelocity){
                            myGamePieces[socketNumber].velX = 0;    
                        }else{
                            myGamePieces[socketNumber].velX = restitution*(-myGamePieces[socketNumber].velX);
                        }                        
                        myGamePieces[socketNumber].accX = 0;
                    }
                }
            }
        }
    }
    if (myGamePieces[socketNumber].x > myGamePieces[n].x) {
        if (myGamePieces[socketNumber].x < myGamePieces[n].x+myGamePieces[socketNumber].width) {
            if (myGamePieces[socketNumber].y > myGamePieces[n].y-(myGamePieces[socketNumber].height-5)) {
                if (myGamePieces[socketNumber].y < myGamePieces[n].y+(myGamePieces[socketNumber].height-5)) {
                    if(myGamePieces[socketNumber].velX<0){
                        //console.log("colision on left");
                        myGamePieces[socketNumber].x = myGamePieces[n].x+myGamePieces[socketNumber].width;
                        if(myGamePieces[socketNumber].velX>-notMovingVelocity){
                            myGamePieces[socketNumber].velX = 0;
                        }else{
                            myGamePieces[socketNumber].velX = restitution*(-myGamePieces[socketNumber].velX);
                        }
                        myGamePieces[socketNumber].accX = 0;
                    }
                }
            }
        }
    }
}

var starting_positions = [ 10, 800-20-10, 400-10, 200-10, 600-10 ];
var colors = ["black","red","orange","olive","green","blue","purple","fuchsia","teal","aqua"];
//var CSS_COLOR_NAMES = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];

var restitution = 0.6;
var jumpingVelocity = 12;
var notMovingVelocity = jumpingVelocity;
var notMovingAcceleration = 1;
var deathVelocity = 50;

