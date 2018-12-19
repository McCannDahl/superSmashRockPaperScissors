
function component(socketNum) {
    this.socketNum = socketNum;
    this.width = 20;
    this.height = 20;
    this.actionX = 0;
    this.actionY = 0;
    this.actionWidth = 8;
    this.actionHeight = 10;
    this.accX = 0;
    this.accY = 0; 
    this.gravity = 0.6; 
    this.velX = 0;
    this.velXMax = 4;
    this.velY = 0;
    this.x = 0;
    this.y = 400 - this.height;
    this.action = "";
    this.actionDirection = "";
    this.health = this.width;
    this.healthHeight = 4;
    this.hitSomeone = false;
    this.gotHitBySomeone = false;

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
        ctx.fillStyle = "green";
        ctx.fillRect(this.x, this.y-this.actionWidth-this.healthHeight, this.health, this.healthHeight);
    }
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
                ctx.fillRect(this.actionX, this.actionY, this.actionHeight, this.actionWidth);
            }
            if(this.actionDirection == "down"){
                ctx.fillRect(this.actionX, this.actionY, this.actionHeight, this.actionWidth);
            }
            if(this.actionDirection == "left"){
                ctx.fillRect(this.actionX, this.actionY, this.actionHeight, this.actionWidth);
            }
            if(this.actionDirection == "right"){
                ctx.fillRect(this.actionX, this.actionY, this.actionHeight, this.actionWidth);
            }
        }
    }

    this.newPos = function() {
        if(this.action == "" || jumping){
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

        if(this.velX<.5 && this.velX>-0.5){
            this.velX = 0;
        }
        if(this.accX<notMovingAcceleration && this.accX>-notMovingAcceleration){
            this.accX = 0;
        }
        //console.log(this.accX);
        //console.log(this.velX);

        this.velY += this.accY + this.gravity;
        this.x += this.velX;
        this.y += this.velY;
        this.hitBottom();
        this.hitTop();
        this.hitLeft();
        this.hitRight();
    }
    this.updateActionsXY = function(){
        if(this.actionDirection == "up"){
            this.actionX = this.x+(this.width/2)-(this.actionHeight/2);
            this.actionY = this.y-this.actionWidth;
        }
        if(this.actionDirection == "down"){
            this.actionX = this.x+(this.width/2)-(this.actionHeight/2);
            this.actionY = this.y+this.height;
        }
        if(this.actionDirection == "left"){
            this.actionX = this.x-this.actionWidth;
            this.actionY = this.y+(this.height/2)-(this.actionHeight/2);
        }
        if(this.actionDirection == "right"){
            this.actionX = this.x+this.width;
            this.actionY = this.y+(this.height/2)-(this.actionHeight/2);
        }
    }
    this.calculateActionsCollisions = function(){
        this.hitSomeone = false;
        this.gotHitBySomeone = false;
        this.hitOthersWithAction();
        this.hitOtherActionsWithAction();
        if(this.hitSomeone || this.gotHitBySomeone){
            unaction();
        }
        sendSocketData();
    }

    this.hitBottom = function() {
        if (this.y > myGameArea.canvas.height - this.height) {
            this.y = myGameArea.canvas.height - this.height;
            if(this.velY>deathVelocity){
                die();
            }
            if(this.velY>(notMovingVelocity*2)){
                this.velY = (restitution*restitution)*(-this.velY);
            }else{
                this.velY = 0;
                jumping = false;
            }
        }
    }
    this.hitTop = function() {
        if (this.y < 0) {
            this.y = 0;
            if(this.velY<-deathVelocity){
                die();
            }
            this.velY = restitution*(-this.velY);
        }
    }
    this.hitLeft = function() {
        if (this.x < 0) {
            this.x = 0;
            if(this.velX<-deathVelocity){
                die();
            }
            this.velX = restitution*(-this.velX);
        }
    }
    this.hitRight = function() {
        if (this.x > myGameArea.canvas.width - this.width) {
            this.x = myGameArea.canvas.width - this.width;
            if(this.velX > deathVelocity){
                die();
            }
            this.velX = restitution*(-this.velX);
        }
    }
    this.hitOthersWithAction = function() {
        if(this.action!=""){
            for (var i in myGamePieces) {
                if(i!=this.socketNum){
                    if(myGamePieces[i]){
                        if(this.actionDirection=="left"){
                            if(myGamePieces[i].x+this.width > this.x-this.actionWidth){
                                if(myGamePieces[i].x < this.x){
                                    if(myGamePieces[i].y > this.y-this.height){
                                        if(myGamePieces[i].y < this.y+this.height){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection,myGamePieces[i].action,myGamePieces[i].actionDirection);
                                            this.hitSomeone = true;
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="right"){
                            if(myGamePieces[i].x+this.width > this.x+this.width){
                                if(myGamePieces[i].x < this.x+this.width+this.actionWidth){
                                    if(myGamePieces[i].y > this.y-this.height){
                                        if(myGamePieces[i].y < this.y+this.height){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection,myGamePieces[i].action,myGamePieces[i].actionDirection);
                                            this.hitSomeone = true;
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="up"){
                            if(myGamePieces[i].y+this.height > this.y-this.actionWidth){
                                if(myGamePieces[i].y < this.y){
                                    if(myGamePieces[i].x+this.width > this.x){
                                        if(myGamePieces[i].x < this.x+this.width){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection,myGamePieces[i].action,myGamePieces[i].actionDirection);
                                            this.hitSomeone = true;
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="down"){
                            if(myGamePieces[i].y+this.height > this.y+this.height){
                                if(myGamePieces[i].y < this.y+this.height+this.actionWidth){
                                    if(myGamePieces[i].x+this.width > this.x){
                                        if(myGamePieces[i].x < this.x+this.width){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection,myGamePieces[i].action,myGamePieces[i].actionDirection);
                                            this.hitSomeone = true;
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
    this.hitOtherActionsWithAction = function(){
        if(this.action!="" && this.actionDirection!=""){
            for (var i in myGamePieces) {
                if(i!=this.socketNum){
                    if(myGamePieces[i]){
                        if(myGamePieces[i].action!="" && myGamePieces[i].actionDirection!=""){
                            if(myGamePieces[i].actionX+this.actionWidth > this.actionX){
                                if(myGamePieces[i].actionX < this.actionX+this.actionWidth){
                                    if(myGamePieces[i].actionY+this.actionHeight > this.actionY){
                                        if(myGamePieces[i].actionY < this.actionY+this.actionHeight){
                                            console.log("We hit each other!"+this.actionDirection);
                                            console.log("i = "+i+" this.socketNum = "+this.socketNum);
                                            console.log({a:this.action,b:this.actionDirection,c:myGamePieces[i].action,d:myGamePieces[i].actionDirection});
                                            getHit(myGamePieces[i].action,myGamePieces[i].actionDirection,this.action,this.actionDirection);
                                            hit(i,this.action,this.actionDirection,myGamePieces[i].action,myGamePieces[i].actionDirection);
                                            this.gotHitBySomeone = true;
                                            this.hitSomeone = true;
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
}



