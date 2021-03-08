import {solvePendulumNonLinear, pid} from '/static/js/solver.js';

// image component class
class ImgComponent{
    constructor(img, x, y, fi, speedX, speedFi) {
        this.width = img.width / window.segway_params.segwayScale;
        this.height = img.height / window.segway_params.segwayScale;
        this.img = img;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.fi = fi;
        this.speedFi = speedFi;
    }

    draw(){
        window.canvas_params.ctx.drawImage(this.img, 0, 0, this.width, this.height);
    }
    transform(){
        window.canvas_params.ctx.setTransform(1, 0, 0, 1, 0, 0);// reset coordinates system
        window.canvas_params.ctx.transform(1, 0, 0, 1, this.x * window.canvas_params.m2px + window.segway_params.segwayAxis.x, this.y * window.canvas_params.m2px + window.segway_params.segwayAxis.y);// shift to the axis
        window.canvas_params.ctx.transform(Math.cos(this.fi), Math.sin(this.fi), -Math.sin(this.fi), Math.cos(this.fi), 0, 0);// rotate
        window.canvas_params.ctx.transform(1, 0, 0, 1, -window.segway_params.segwayAxis.x, -window.segway_params.segwayAxis.y); // shift to the img corner
    }

}

// drawn arrow class
class componentArrow{
    constructor(x, y, color) {
        this.x1 = x;
        this.y1 = y;
        this.x2 = this.x1 + 8; //size of an arrow
        this.y2 = this.y1 + 8; // size of an arrow
        this.x3 = this.x2;
        this.y3 = this.y1 - 8;// size of an arrow
        this.xRect = this.x2;
        this.color = color;
    }

    update(x){
        this.x1 = x;
        // arrow to the left from center
        if (this.x1 < window.params.forceReference.x) {
            this.x2 = this.x1 + 8;
            this.x3 = this.x2;
            this.xRect = this.x2;

        }
        // arrow to the right from the center
        else {
            this.x2 = this.x1 - 8;
            this.x3 = this.x2;
            this.xRect = window.params.forceReference.x;
        }
    }

    //draw in force canvas
    drawForce(){
        //draw arrow triangle
        window.canvas_params.ctxForce.beginPath();
        window.canvas_params.ctxForce.moveTo(this.x1, this.y1);
        window.canvas_params.ctxForce.lineTo(this.x2, this.y2);
        window.canvas_params.ctxForce.lineTo(this.x3, this.y3);
        window.canvas_params.ctxForce.fillStyle = this.color;
        window.canvas_params.ctxForce.fill();

        // draw arrow line
        window.canvas_params.ctxForce.fillStyle = this.color;
        window.canvas_params.ctxForce.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2 - window.params.forceReference.x), 4);
    }

    //draw in game canvas
    drawGame(){
        //draw arrow triangle
        window.canvas_params.ctx.beginPath();
        window.canvas_params.ctx.moveTo(this.x1, this.y1);
        window.canvas_params.ctx.lineTo(this.x2, this.y2);
        window.canvas_params.ctx.lineTo(this.x3, this.y3);
        window.canvas_params.ctx.fillStyle = this.color;
        window.canvas_params.ctx.fill();

        // draw arrow line
        window.canvas_params.ctx.fillStyle = this.color;
        window.canvas_params.ctx.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2 - window.params.forceReference.x), 4);
    }

}


// drawn rectangle component class
class componentRect{
    constructor(width, height, color, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = color;
    }

    // draw in game canvas
    drawGame(){
        window.canvas_params.ctx.fillStyle = this.color;
        window.canvas_params.ctx.fillRect(0, 0, this.width, this.height);
    }

    //draw in force canvas
    drawForce(){
        window.canvas_params.ctxForce.fillStyle = this.color;
        window.canvas_params.ctxForce.fillRect(this.x, this.y, this.width, this.height);
    }
}

function create_html() {
    let wid = $("#game_screen").width();
    let hei = Math.round(wid / 5 * 4)

    let game_screen_html = '<canvas id="pidGame" width="' + wid + '" height="' + hei + '" ></canvas>';
    $("#game_screen").html(game_screen_html);

    let game_controls_html = '<canvas class="pointer" id="force" width="' + wid + '" height="40" ></canvas>'
    $("#game_controls").html(game_controls_html);
}

function game_init() {
    //model parameters
    window.game_params = {
        mC: 1.0, //Cart mass
        mP: 0.5, // Pendulum mass
        b:  0.9, // Cart friction
        g: 9.81, // gravity
        l: 1.0, // pendulum length
    };
    window.game_params.inertia = (4 * window.game_params.mP * window.game_params.lt**2) / 3;
    window.game_params.lt = window.game_params.l / 2; // pendulum center of mass

    // load canvas
    window.canvas_params = {};
    window.canvas_params.canvas = document.getElementById("pidGame");
    window.canvas_params.canvasForce = document.getElementById("force");
    window.canvas_params.ctx = window.canvas_params.canvas.getContext("2d");
    window.canvas_params.ctxForce = window.canvas_params.canvasForce.getContext("2d");

    // 100 px for every 500px of canvas width
    window.canvas_params.m2px = 500 / window.canvas_params.canvas.width * 100; // ?

    //segway image parameters

    window.segway_params.segwayScale = 500 / window.canvas_params.canvas.width * 3;
    window.segway_params.segwayAxis = {
        y: 454 / window.segway_params.segwayScale, //segway rotation axis
        x: 75 / window.segway_params.segwayScale  //segway rotation axis
    }

    //datetime and force init
    window.params = {};
    window.params.f = 0;
    window.params.forceScale = 500 / window.canvas_params.canvas.width * 0.05; // TODO: What is that?


    //model init conditions
    window.params.x0 = (window.canvas_params.canvas.width / 2 - (window.segway_params.segwayImage.width / 2 / window.segway_params.segwayScale)) / window.canvas_params.m2px;
    window.params.y0 = (window.canvas_params.canvas.height / 3) / window.canvas_params.m2px;
    window.params.xDot0 = 0.0;
    window.params.fi0 = 0.5;
    window.params.fiDot0 = 0;

    // setting a period for simulation animation [s]
    window.params.deltaT = 0.025;

    // variable declaration of segway object and solver result
    window.segway_params.segway;
    window.params.result;

    //get canvas position
    window.canvas_params.canvasRect = window.canvas_params.canvas.getBoundingClientRect();
    window.canvas_params.xCanvas =  window.canvas_params.canvasRect.left;
    window.canvas_params.yCanvas = window.canvas_params.canvasRect.top;

    window.canvas_params.canvasRectForce = window.canvas_params.canvasForce.getBoundingClientRect();
    window.canvas_params.xCanvasForce =  window.canvas_params.canvasRectForce.left;
    window.canvas_params.yCanvasForce = window.canvas_params.canvasRectForce.top - window.canvas_params.yCanvas;

    // force scale center
    window.params.forceReference = {
        x: window.canvas_params.canvasForce.width / 2,
        y: window.canvas_params.canvasForce.height
    }

    //get mouse position when mouse is moving
    window.onmousemove = function(e) {
        mouseCoords.x = e.clientX - window.canvas_params.xCanvas; // mouse position relative to canvas corner
        mouseCoords.y = e.clientY - window.canvas_params.yCanvas; // mouse position relative to canvas corner
        mouseCoords.b = e.buttons; // mouse button
        }

    //get mouse position when mouse does not move and button is down
    window.onmousedown = function(e) {
        mouseCoords.x = e.clientX - window.canvas_params.xCanvas; // mouse position relative to canvas corner
        mouseCoords.y = e.clientY - window.canvas_params.yCanvas; // mouse position relative to canvas corner
        mouseCoords.b = e.buttons; // mouse button
    }

    // must update mouse button information when not moving
    window.onmouseup = function(e) {
        mouseCoords.b = e.buttons; // mouse button
    }

    // draw force center
    window.params.forceLine = new componentRect(3,30,"black", window.params.forceReference.x,5); // TODO co jsou ty konstanty?
    window.params.forceLine.drawForce();

    window.params.simulation = 0;

    // instance of force arrow
    window.params.forceArrow = new componentArrow(20,20,"red");
}

window.segway_params = {};
window.segway_params.segwayImage = new Image();
window.segway_params.segwayImage.src = '/static/games/segway/segway.png';

window.segway_params.segwayImage.onload = function(e){
    window.segway_params.segway = new ImgComponent(window.segway_params.segwayImage, window.params.x0, window.params.y0, window.params.fi0, window.params.xDot0, window.params.fiDot0);
    window.segway_params.segway.transform();
    window.segway_params.segway.draw();
}

create_html()
game_init();



//setTimeout(function (){
//    create_html()
//    game_init();
//
//}, 5000);








//mouse position init
let mouseCoords = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    b: 0
}


window.start_game = function() {
    if (window.params.simulation === 0) {
        window.params.simulation = setInterval(updateGameArea, window.params.deltaT * 1000);
    }
}

window.pause_game = function()  {
    if (window.params.simulation !== 0) {
        clearInterval(window.params.simulation);
        window.params.simulation = 0;
    }
}

window.reset_game = function()  {
    if (window.params.simulation !== 0) {
        clearInterval(window.params.simulation);
        window.params.simulation = 0;
    }
    // pid reset TODO manage globally
//    eLast = 0;
//    eLast2 = 0;
//    uLast = 0;

    //simulation reset
    window.segway_params.segway.x = window.params.x0;
    window.segway_params.segway.speedX = window.params.xDot0;
    window.segway_params.segway.fi = window.params.fi0;
    window.segway_params.segway.speedFi = window.params.fiDot0;
    window.params.f = 0;

    //clear canvas
    window.canvas_params.ctx.clearRect(0, 0, window.canvas_params.canvas.width, window.canvas_params.canvas.height);
    window.segway_params.segway.transform();
    window.segway_params.segway.draw();
}





//function for force calculation and visualization according to mouse position in force canvas
function mouseForce(){
    //check if the mouse is in the force field and left button is down
    if (mouseCoords.b === 1 && (window.canvas_params.yCanvasForce < mouseCoords.y) && ((window.canvas_params.yCanvasForce + window.canvas_params.canvasForce.height) > mouseCoords.y)) {
        //force saturation
        if (mouseCoords.x < 0) {
            window.params.f = (-window.params.forceReference.x) * window.params.forceScale;

            //draw saturated arrow
            window.params.forceArrow.update(0);
            window.params.forceArrow.drawForce();
        }
        else if (mouseCoords.x > window.canvas_params.canvasForce.width) {
            window.params.f = (window.canvas_params.canvasForce.width - window.params.forceReference.x) * window.params.forceScale;

            //draw saturated arrow
            window.params.forceArrow.update(window.canvas_params.canvasForce.width);
            window.params.forceArrow.drawForce();
        }
        //when the mouse is in force canvas
        else {
            window.params.f = (mouseCoords.x - window.params.forceReference.x) * window.params.forceScale;

            //draw arrow
            window.params.forceArrow.update(mouseCoords.x);
            window.params.forceArrow.drawForce();
        }
    }
    else {
        window.params.f = 0.0;
    }
}

// function for calling simulation and animation update
function updateGameArea(){
    //clear game canvas
    window.canvas_params.ctx.save();
    window.canvas_params.ctx.setTransform(1, 0, 0, 1, 0, 0);
    window.canvas_params.ctx.clearRect(0, 0, window.canvas_params.canvas.width, window.canvas_params.canvas.height);
    window.canvas_params.ctx.restore();

    //clear force canvas
    window.canvas_params.ctxForce.clearRect(0, 0, window.canvas_params.canvasForce.width, window.canvas_params.canvasForce.height);

    window.params.forceLine.drawForce();
    mouseForce();

    // control
     if (window.regulator === "pid") {
        window.params_pid.e = window.params_pid.w - window.segway_params.segway.fi;
        window.params.f = pid(
            window.params_pid.e,
            window.params_pid.eLast,
            window.params_pid.eLast2,
            window.params_pid.uLast,
            window.params_pid.r0,
            window.params_pid.rI,
            window.params_pid.rD,
            window.params.deltaT
        );
        window.params_pid.eLast2 = window.params_pid.eLast;
        window.params_pid.eLast = window.params_pid.e;
        window.params_pid.uLast = window.params.f;
    }

    //call solver
    window.params.result = solvePendulumNonLinear(
        window.segway_params.segway.x,
        window.segway_params.segway.speedX,
        window.segway_params.segway.fi,
        window.segway_params.segway.speedFi,
        window.params.f,
        window.params.deltaT,
        window.game_params.mC,
        window.game_params.mP,
        window.game_params.inertia,
        window.game_params.b,
        window.game_params.lt,
        -window.game_params.g);

    //update state variables
    window.segway_params.segway.x = window.params.result.x1;
    window.segway_params.segway.speedX = window.params.result.x2;
    window.segway_params.segway.fi = window.params.result.x3;
    window.segway_params.segway.speedFi = window.params.result.x4;

    // segway drawing saturation
    if (window.segway_params.segway.x <= 0) {
        window.segway_params.segway.x = 0;
        window.segway_params.segway.speedX = 0;
    }
    if (window.segway_params.segway.x * window.canvas_params.m2px >= window.canvas_params.canvas.width - 50){
        window.segway_params.segway.x = (window.canvas_params.canvas.width - 50) / window.canvas_params.m2px;
        window.segway_params.segway.speedX = 0;
    }

    // segway motion update
    window.segway_params.segway.transform();

    //draw new segway position
    window.segway_params.segway.draw();

    // log line update
    document.getElementById("demo").innerHTML = "mouse x: " + mouseCoords.x + ", mouse y: " + mouseCoords.y
                                                        + ", button = " + mouseCoords.b + ", x cart = " + window.segway_params.segway.x * window.canvas_params.m2px
                                                        + ", y cart = " + window.segway_params.segway.y * window.canvas_params.m2px + " F = " + window.params.f * window.params.forceScale + ", fi = "
                                                        + window.segway_params.segway.fi*180/Math.PI;
}