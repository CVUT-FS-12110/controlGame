import {solvePendulumNonLinear, pid} from '/static/js/solver.js';

function create_html() {
    let wid = $("#game_screen").width();
    let hei = Math.round(wid / 5 * 4)

    let game_screen_html = '<canvas id="pidGame" width="' + wid + '" height="' + hei + '" ></canvas>';
    $("#game_screen").html(game_screen_html);

    let game_controls_html = '<canvas class="pointer" id="force" width="' + wid + '" height="40" ></canvas>'
    $("#game_controls").html(game_controls_html);
}

function game_init() {
    create_html()

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


}


game_init()

// load canvas
window.canvas_params = {};
window.canvas_params.canvas = document.getElementById("pidGame");
window.canvas_params.canvasForce = document.getElementById("force");
window.canvas_params.ctx = window.canvas_params.canvas.getContext("2d");
window.canvas_params.ctxForce = window.canvas_params.canvasForce.getContext("2d");

// 100 px for every 500px of canvas width
window.canvas_params.m2px = 500 / window.canvas_params.canvas.width * 100; // ?

//segway image parameters
window.segway_params = {};
window.segway_params.segwayImage = new Image();
window.segway_params.segwayImage.src = '/static/games/segway/segway.png';
window.segway_params.segwayScale = 500 / window.canvas_params.canvas.width * 3;
window.segway_params.segwayAxis = {
    y: 454 / window.segway_params.segwayScale, //segway rotation axis
    x: 75 / window.segway_params.segwayScale  //segway rotation axis
}

//datetime and force init
// let d = new Date();
let f = 0;
let forceScale = 500 / window.canvas_params.canvas.width * 0.05; // TODO: What is that?


//model init conditions
let x0 = (window.canvas_params.canvas.width / 2 - (window.segway_params.segwayImage.width / 2 / window.segway_params.segwayScale)) / window.canvas_params.m2px;
let y0 = (window.canvas_params.canvas.height / 3) / window.canvas_params.m2px;
let xDot0 = 0.0;
let fi0 = 0.5;
let fiDot0 = 0;

// setting a period for simulation animation [s]
let deltaT = 0.025;

// variable declaration of segway object and solver result
window.segway_params.segway;
let result;

//mouse position init
let mouseCoords = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    b: 0
}

//get canvas position
window.canvas_params.canvasRect = window.canvas_params.canvas.getBoundingClientRect();
window.canvas_params.xCanvas =  window.canvas_params.canvasRect.left;
window.canvas_params.yCanvas = window.canvas_params.canvasRect.top;

window.canvas_params.canvasRectForce = window.canvas_params.canvasForce.getBoundingClientRect();
window.canvas_params.xCanvasForce =  window.canvas_params.canvasRectForce.left;
window.canvas_params.yCanvasForce = window.canvas_params.canvasRectForce.top - window.canvas_params.yCanvas;

// force scale center
let forceReference = {
    x: window.canvas_params.canvasForce.width / 2,
    y: window.canvas_params.canvasForce.height
}

// TODO: think about better mouse position and button reading
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
        if (this.x1 < forceReference.x) {
            this.x2 = this.x1 + 8;
            this.x3 = this.x2;
            this.xRect = this.x2;

        }
        // arrow to the right from the center
        else {
            this.x2 = this.x1 - 8;
            this.x3 = this.x2;
            this.xRect = forceReference.x;
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
        window.canvas_params.ctxForce.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2-forceReference.x), 4);
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
        window.canvas_params.ctx.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2-forceReference.x), 4);
    }
}

// draw force center
let forceLine = new componentRect(3,30,"black", forceReference.x,5);
forceLine.drawForce();

// instance of force arrow
let forceArrow = new componentArrow(20,20,"red");

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


window.start_game = function() {
    if (simulation === 0) {
        simulation = setInterval(updateGameArea, deltaT * 1000);
    }
}

window.reset_game = function()  {
    if (simulation !== 0) {
        clearInterval(simulation);
        simulation = 0;
    }
    // pid reset TODO manage globally
//    eLast = 0;
//    eLast2 = 0;
//    uLast = 0;

    //simulation reset
    window.segway_params.segway.x = x0;
    window.segway_params.segway.speedX = xDot0;
    window.segway_params.segway.fi = fi0;
    window.segway_params.segway.speedFi = fiDot0;
    f = 0;

    //clear canvas
    window.canvas_params.ctx.clearRect(0, 0, window.canvas_params.canvas.width, window.canvas_params.canvas.height);
    window.segway_params.segway.transform();
    window.segway_params.segway.draw();
}

window.pause_game = function()  {
    if (simulation !== 0) {
        clearInterval(simulation);
        simulation = 0;
    }
}

$("#start").click(function() {
    window.start_game();
});

$("#reset").click(function() {
    window.reset_game();
});

$("#pause").click(function() {
    window.pause_game();
});


let simulation = 0;


// image loading check TODO: probably needs more robust solution.
window.onload = function (){
    if (window.segway_params.segwayImage.complete) {
        window.segway_params.segway = new ImgComponent(window.segway_params.segwayImage, x0, y0, fi0, xDot0, fiDot0);
        window.segway_params.segway.transform();
        window.segway_params.segway.draw();
    }
    else {
    document.getElementById("errors").innerHTML = "Error loading image, try to refresh"
    }
}


//function for force calculation and visualization according to mouse position in force canvas
function mouseForce(){
    //check if the mouse is in the force field and left button is down
    if (mouseCoords.b === 1 && (window.canvas_params.yCanvasForce < mouseCoords.y) && ((window.canvas_params.yCanvasForce + window.canvas_params.canvasForce.height) > mouseCoords.y)) {
        //force saturation
        if (mouseCoords.x < 0) {
            f = (-forceReference.x)*forceScale;

            //draw saturated arrow
            forceArrow.update(0);
            forceArrow.drawForce();
        }
        else if (mouseCoords.x > window.canvas_params.canvasForce.width) {
            f = (window.canvas_params.canvasForce.width - forceReference.x)*forceScale;

            //draw saturated arrow
            forceArrow.update(window.canvas_params.canvasForce.width);
            forceArrow.drawForce();
        }
        //when the mouse is in force canvas
        else {
            f = (mouseCoords.x - forceReference.x)*forceScale;

            //draw arrow
            forceArrow.update(mouseCoords.x);
            forceArrow.drawForce();
        }
    }
    else {
        f = 0.0;
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

    forceLine.drawForce();
    mouseForce();

    // control
     if (window.regulator === "pid") {
        window.params_pid.e = window.params_pid.w - window.segway_params.segway.fi;
        f = pid(
            window.params_pid.e,
            window.params_pid.eLast,
            window.params_pid.eLast2,
            window.params_pid.uLast,
            window.params_pid.r0,
            window.params_pid.rI,
            window.params_pid.rD,
            deltaT
        );
        window.params_pid.eLast2 = window.params_pid.eLast;
        window.params_pid.eLast = window.params_pid.e;
        window.params_pid.uLast = f;
    }

    //call solver
    result = solvePendulumNonLinear(
        window.segway_params.segway.x,
        window.segway_params.segway.speedX,
        window.segway_params.segway.fi,
        window.segway_params.segway.speedFi,
        f,
        deltaT,
        window.game_params.mC,
        window.game_params.mP,
        window.game_params.inertia,
        window.game_params.b,
        window.game_params.lt,
        -window.game_params.g);

    //update state variables
    window.segway_params.segway.x = result.x1;
    window.segway_params.segway.speedX = result.x2;
    window.segway_params.segway.fi = result.x3;
    window.segway_params.segway.speedFi = result.x4;

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
                                                        + ", y cart = " + window.segway_params.segway.y * window.canvas_params.m2px + " F = " + f*forceScale + ", fi = "
                                                        + window.segway_params.segway.fi*180/Math.PI;
}