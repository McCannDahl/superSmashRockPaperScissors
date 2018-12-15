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
    this.score = 0;
    this.width = 20;
    this.height = 20;
    this.accX = 0;
    this.accY = 0; 
    this.velX = 0;
    this.velY = 50;
    this.x = 0;
    this.y = 0;
    this.movingLeft = false;
    this.movingRight = false;
    this.jumping = false;

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
    this.newPos = function() {
        if(this.movingLeft && !this.movingRight){
            this.velX = -3;
        }
        if(!this.movingLeft && this.movingRight){
            this.velX = 3;
        }
        if(this.movingLeft && this.movingRight){
            this.velX = 0;
        }
        if(!this.movingLeft && !this.movingRight){
            this.velX = 0;
        }
        //this.velX += this.accX;
        this.velY += this.accY;
        this.x += this.velX;
        this.y += this.velY;
        this.hitBottom();
        this.hitTop();
        this.hitLeft();
        this.hitRight();
        sendSocketData();
    }
    this.hitBottom = function() {
        var rockbottom = myGameArea.canvas.height - this.height;
        if (this.y > rockbottom) {
            this.y = rockbottom;
            this.velY = 0;
            this.accY = 0;
            this.jumping = false;
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
}

function updateGameArea() {
    myGameArea.clear();
    myGamePieces[socketNumber].newPos();
    for (var i in myGamePieces) {
        if(myGamePieces[i]){
            myGamePieces[i].update();
        }
    }
}

function jump() {
    if(!myGamePieces[socketNumber].jumping){
        myGamePieces[socketNumber].jumping = true;
        myGamePieces[socketNumber].velY -= 15;
        myGamePieces[socketNumber].accY += 0.6;
    }
}
 
window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);
function keysPressed(e) {
    // left
    if (e.keyCode == 37) {
        myGamePieces[socketNumber].movingLeft = true;
    }
    // right
    if (e.keyCode == 39) {
        myGamePieces[socketNumber].movingRight = true;
    }
    // down
    if (e.keyCode == 38) {
      jump();
    }
    // down
    if (e.keyCode == 40) {
    }
 
    e.preventDefault();
}
 
function keysReleased(e) {
    // left
    if (e.keyCode == 37) {
        myGamePieces[socketNumber].movingLeft = false;
    }
    // right
    if (e.keyCode == 39) {
        myGamePieces[socketNumber].movingRight = false;
    }
 
    e.preventDefault();
}

var starting_positions = [ 10, 800-20-10, 400-10, 200-10, 600-10 ];
var colors = ["black","red","orange","olive","green","blue","purple","fuchsia","teal","aqua"];
//var CSS_COLOR_NAMES = ["AliceBlue","AntiqueWhite","Aqua","Aquamarine","Azure","Beige","Bisque","Black","BlanchedAlmond","Blue","BlueViolet","Brown","BurlyWood","CadetBlue","Chartreuse","Chocolate","Coral","CornflowerBlue","Cornsilk","Crimson","Cyan","DarkBlue","DarkCyan","DarkGoldenRod","DarkGray","DarkGrey","DarkGreen","DarkKhaki","DarkMagenta","DarkOliveGreen","Darkorange","DarkOrchid","DarkRed","DarkSalmon","DarkSeaGreen","DarkSlateBlue","DarkSlateGray","DarkSlateGrey","DarkTurquoise","DarkViolet","DeepPink","DeepSkyBlue","DimGray","DimGrey","DodgerBlue","FireBrick","FloralWhite","ForestGreen","Fuchsia","Gainsboro","GhostWhite","Gold","GoldenRod","Gray","Grey","Green","GreenYellow","HoneyDew","HotPink","IndianRed","Indigo","Ivory","Khaki","Lavender","LavenderBlush","LawnGreen","LemonChiffon","LightBlue","LightCoral","LightCyan","LightGoldenRodYellow","LightGray","LightGrey","LightGreen","LightPink","LightSalmon","LightSeaGreen","LightSkyBlue","LightSlateGray","LightSlateGrey","LightSteelBlue","LightYellow","Lime","LimeGreen","Linen","Magenta","Maroon","MediumAquaMarine","MediumBlue","MediumOrchid","MediumPurple","MediumSeaGreen","MediumSlateBlue","MediumSpringGreen","MediumTurquoise","MediumVioletRed","MidnightBlue","MintCream","MistyRose","Moccasin","NavajoWhite","Navy","OldLace","Olive","OliveDrab","Orange","OrangeRed","Orchid","PaleGoldenRod","PaleGreen","PaleTurquoise","PaleVioletRed","PapayaWhip","PeachPuff","Peru","Pink","Plum","PowderBlue","Purple","Red","RosyBrown","RoyalBlue","SaddleBrown","Salmon","SandyBrown","SeaGreen","SeaShell","Sienna","Silver","SkyBlue","SlateBlue","SlateGray","SlateGrey","Snow","SpringGreen","SteelBlue","Tan","Teal","Thistle","Tomato","Turquoise","Violet","Wheat","White","WhiteSmoke","Yellow","YellowGreen"];