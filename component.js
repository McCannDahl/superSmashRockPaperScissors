
function component(socketNum) {
    this.socketNum = socketNum;
    this.width = 20;
    this.height = 20;
    this.actionWidth = 4;
    this.actionHeight = 20;
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
        ctx.fillRect(this.x, this.y-this.actionHeight-4, this.health, 4);
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
                ctx.fillRect(this.x+10-(this.actionHeight/2), this.y-this.actionWidth, this.actionHeight, this.actionWidth);
            }
            if(this.actionDirection == "down"){
                ctx.fillRect(this.x+10-(this.actionHeight/2), this.y+20, this.actionHeight, this.actionWidth);
            }
            if(this.actionDirection == "left"){
                ctx.fillRect(this.x-this.actionWidth, this.y+10-(this.actionHeight/2), this.actionWidth, this.actionHeight);
            }
            if(this.actionDirection == "right"){
                ctx.fillRect(this.x+20, this.y+10-(this.actionHeight/2), this.actionWidth, this.actionHeight);
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
        this.hitOthersWithAction();
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
            if(this.velX>deathVelocity){
                die();
            }
            this.velX = restitution*(-this.velX);
        }
    }
    this.hitOthersWithAction = function() {
        if(this.action!=""){
            for (var i in myGamePieces) {
                if(i!=this.socketNumber){
                    if(myGamePieces[i]){
                        var w = 0;
                        if(this.actionDirection=="left"){
                            if(myGamePieces[i].actionDirection=="right"){
                                w = this.actionWidth;
                            }
                            if(myGamePieces[i].x+20+w > this.x-this.actionWidth){
                                if(myGamePieces[i].x < this.x){
                                    if(myGamePieces[i].y > this.y-20){
                                        if(myGamePieces[i].y < this.y+20){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection);
                                            if(w!=0){
                                                console.log("I got hit");
                                                getHit(myGamePieces[i].action,myGamePieces[i].actionDirection,this.action);
                                            }
                                            unaction();
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="right"){
                            w = 0;
                            if(myGamePieces[i].actionDirection=="left"){
                                w = this.actionWidth;
                            }
                            if(myGamePieces[i].x+20 > this.x+20){
                                if(myGamePieces[i].x-w < this.x+20+this.actionWidth){
                                    if(myGamePieces[i].y > this.y-20){
                                        if(myGamePieces[i].y < this.y+20){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection);
                                            if(w!=0){
                                                console.log("I got hit");
                                                getHit(myGamePieces[i].action,myGamePieces[i].actionDirection,this.action);
                                            }
                                            unaction();
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="up"){
                            w = 0;
                            if(myGamePieces[i].actionDirection=="down"){
                                w = this.actionWidth;
                            }
                            if(myGamePieces[i].y+20+w > this.y-this.actionWidth){
                                if(myGamePieces[i].y < this.y){
                                    if(myGamePieces[i].x+20 > this.x){
                                        if(myGamePieces[i].x < this.x+20){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection);
                                            if(w!=0){
                                                console.log("I got hit");
                                                getHit(myGamePieces[i].action,myGamePieces[i].actionDirection,this.action);
                                            }
                                            unaction();
                                        }
                                    }
                                }
                            }
                        }else if(this.actionDirection=="down"){
                            w = 0;
                            if(myGamePieces[i].actionDirection=="up"){
                                w = this.actionWidth;
                            }
                            if(myGamePieces[i].y+20 > this.y+20){
                                if(myGamePieces[i].y-w < this.y+20+this.actionWidth){
                                    if(myGamePieces[i].x+20 > this.x){
                                        if(myGamePieces[i].x < this.x+20){
                                            console.log("I hit someone!"+this.actionDirection);
                                            hit(i,this.action,this.actionDirection);
                                            if(w!=0){
                                                console.log("I got hit");
                                                getHit(myGamePieces[i].action,myGamePieces[i].actionDirection,this.action);
                                            }
                                            unaction();
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



