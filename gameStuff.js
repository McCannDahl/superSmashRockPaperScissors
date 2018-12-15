var myGamePieces = [];

function addUser(n) {
    myGamePieces[n] = new component(30, 30, "green", 100, 120);
}

function startGame() {
    myGamePieces[socketNumber] = new component(30, 30, "red", 10, 120);
    myGamePieces[socketNumber].accY = 0.05;
    myGameArea.start();
}

var myGameArea = {
    canvas : document.createElement("canvas"),
    start : function() {
        this.canvas.width = 480;
        this.canvas.height = 270;
        this.context = this.canvas.getContext("2d");
        document.body.insertBefore(this.canvas, document.body.childNodes[0]);
        this.interval = setInterval(updateGameArea, 20);
        },
    clear : function() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

function component(width, height, color, x, y, type) {
    this.type = type;
    this.score = 0;
    this.width = width;
    this.height = height;
    this.accX = 0;
    this.accY = 0; 
    this.velX = 0;
    this.velY = 0; 
    this.x = x;
    this.y = y;
    this.movingLeft = false;
    this.movingRight = false;
    this.jumping = false;
    this.update = function() {
        ctx = myGameArea.context;
        ctx.fillStyle = color;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    this.newPos = function() {
        if(myGamePieces[socketNumber].movingLeft){
            this.velX = -3;
        }
        if(myGamePieces[socketNumber].movingRight){
            this.velX = 3;
        }
        if(myGamePieces[socketNumber].movingLeft && myGamePieces[socketNumber].movingRight){
            this.velX = 0;
        }
        if(!myGamePieces[socketNumber].movingLeft && !myGamePieces[socketNumber].movingRight){
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
        myGamePieces[i].update();
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