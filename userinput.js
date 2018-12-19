

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
        }
    }
}


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

var up = false;
var down = false;
var left = false;
var right = false;
var jumping = false;

var rock = false;
var paper = false;
var scissors = false;

window.addEventListener("keydown", keysPressed, false);
window.addEventListener("keyup", keysReleased, false);
function keysPressed(e) {
    // left
    if (e.keyCode == 37) {
        if(!left){
            left = true;
            actionAfterMove();
        }
    }
    // right
    if (e.keyCode == 39) {
        if(!right){
            right = true;
            actionAfterMove();
        }
    }
    // up
    if (e.keyCode == 38) {
        if(!up){
            up = true;
            actionAfterMove();
            jump();
        }
    }
    // down
    if (e.keyCode == 40) {
        if(!down){
            down = true;
            actionAfterMove();
        }
    }

    // a
    if (e.keyCode == 65) {
        if(!rock){
            rock = true;
            paper = false;
            scissors = false;
            rockf();
        }
    }
    // s
    if (e.keyCode == 83) {
        if(!paper){
            rock = false;
            paper = true;
            scissors = false;
            paperf();
        }
    }
    // d
    if (e.keyCode == 68) {
        if(!scissors){
            rock = false;
            paper = false;
            scissors = true;
            scissorsf();
        }
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

    // a
    if (e.keyCode == 65) {
        rock = false;
    }
    // s
    if (e.keyCode == 83) {
        paper = false;
    }
    // d
    if (e.keyCode == 68) {
        scissors = false;
    }
 
    e.preventDefault();
}