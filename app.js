import {solvePendulumNonLinear, pid} from './modules/solver.js';

//preparation for drawn pendulum
// const cartWidth = 50
// const cartHeight = 30
// const pendulumWidth = 10
// const pendulumHeight = 300

// load canvas
const canvas = document.getElementById("pidGame");
const canvasForce = document.getElementById("force");
const ctx = canvas.getContext("2d");
const ctxForce = canvasForce.getContext("2d");

//  1 m = 3779.5 px
const m2px = 100; // scaling constant from px to something

//image loading
const segwayImage = new Image();
segwayImage.src = 'img/segway.png';

//segway image parameters
const segwayScale = 3;
const segwayAxis = {
    y: 454/segwayScale, //segway rotation axis
    x: 75/segwayScale  //segway rotation axis
}

//datetime and force init
// let d = new Date();
let f = 0;
let forceScale = 0.05;

//model parameters
let mC = 1.0; //Cart mass
let mP = 0.5; // Pendulum mass
let b =  0.9; // Cart friction
let g = 9.81; // gravity
let l = 1.0; // pendulum length
let lt = l/2; // pendulum center of mass
let inertia = (4*mP*lt**2)/3; // pendulum inertia

//model init conditions
let x0 = (canvas.width / 2 - 30)/m2px;
let y0 = (canvas.height / 2 - 100)/m2px;
let xDot0 = 0.0;
let fi0 = 0.0;
let fiDot0 = 0;

//pid parameters
let r0 = -50;
let rI = -20;
let rD = -10;
let e;
let w = 0;
let eLast = 0;
let eLast2 = 0;
let uLast = 0;

// setting a period for simulation animation [s]
let deltaT = 0.025;

// variable declaration of segway object and solver result
let segway;
let result;

//mouse position init
let mouseCoords = {
    x: innerWidth / 2,
    y: innerHeight / 2,
    b: 0
}

//get canvas position
let canvasRect = canvas.getBoundingClientRect();
let xCanvas =  canvasRect.left;
let yCanvas = canvasRect.top;

let canvasRectForce = canvasForce.getBoundingClientRect();
let xCanvasForce =  canvasRectForce.left;
let yCanvasForce = canvasRectForce.top - yCanvas;

// force scale center
let forceReference = {
    x: canvasForce.width / 2,
    y: canvasForce.height
}

// TODO: think about better mouse position and button reading
//get mouse position when mouse is moving
window.onmousemove = function(e) {
    mouseCoords.x = e.clientX - xCanvas; // mouse position relative to canvas corner
    mouseCoords.y = e.clientY - yCanvas; // mouse position relative to canvas corner
    mouseCoords.b = e.buttons; // mouse button
    }

//get mouse position when mouse does not move and button is down
window.onmousedown = function(e) {
    mouseCoords.x = e.clientX - xCanvas; // mouse position relative to canvas corner
    mouseCoords.y = e.clientY - yCanvas; // mouse position relative to canvas corner
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
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
    }

    //draw in force canvas
    drawForce(){
        ctxForce.fillStyle = this.color;
        ctxForce.fillRect(this.x, this.y, this.width, this.height);
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
        ctxForce.beginPath();
        ctxForce.moveTo(this.x1, this.y1);
        ctxForce.lineTo(this.x2, this.y2);
        ctxForce.lineTo(this.x3, this.y3);
        ctxForce.fillStyle = this.color;
        ctxForce.fill();

        // draw arrow line
        ctxForce.fillStyle = this.color;
        ctxForce.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2-forceReference.x), 4);
    }

    //draw in game canvas
    drawGame(){
        //draw arrow triangle
        ctx.beginPath();
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.lineTo(this.x3, this.y3);
        ctx.fillStyle = this.color;
        ctx.fill();

        // draw arrow line
        ctx.fillStyle = this.color;
        ctx.fillRect(this.xRect, this.y1 - 2, Math.abs(this.x2-forceReference.x), 4);
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
        this.width = img.width/segwayScale;
        this.height = img.height/segwayScale;
        this.img = img;
        this.x = x;
        this.y = y;
        this.speedX = speedX;
        this.fi = fi;
        this.speedFi = speedFi;
    }

    draw(){
        ctx.drawImage(this.img, 0, 0, this.width, this.height);
    }
    transform(){
        ctx.setTransform(1, 0, 0, 1, 0, 0);// reset coordinates system
        ctx.transform(1, 0, 0, 1, this.x*m2px + segwayAxis.x, this.y*m2px + segwayAxis.y);// shift to the axis
        ctx.transform(Math.cos(this.fi), Math.sin(this.fi), -Math.sin(this.fi), Math.cos(this.fi), 0, 0);// rotate
        ctx.transform(1, 0, 0, 1, -segwayAxis.x, -segwayAxis.y); // shift to the img corner
    }

}


// Start stop and reset simulation by clicking on buttons
let simulation = 0;
let startButton = document.getElementById("start");
let pauseButton = document.getElementById("pause");
let resetButton = document.getElementById("reset");

startButton.onclick = function(){
    if (simulation === 0) {
        simulation = setInterval(updateGameArea, deltaT * 1000);
    }
}

pauseButton.onclick = function(){
    if (simulation !== 0) {
        clearInterval(simulation);
        simulation = 0;
    }
}

resetButton.onclick = function(){
    if (simulation !== 0) {
        clearInterval(simulation);
        simulation = 0;
    }
    // pid reset
    eLast = 0;
    eLast2 = 0;
    uLast = 0;

    //simulation reset
    segway.x = x0;
    segway.speedX = xDot0;
    segway.fi = fi0;
    segway.speedFi = fiDot0;
    f = 0;

    //clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    segway.transform();
    segway.draw();
}

// image loading check TODO: probably needs more robust solution.
window.onload = function (){
    if (segwayImage.complete) {
        segway = new ImgComponent(segwayImage, x0, y0, fi0, xDot0, fiDot0);
        segway.transform();
        segway.draw();
    }
    else {
    document.getElementById("errors").innerHTML = "Error loading image, try to refresh"
    }
}


//function for force calculation and visualization according to mouse position in force canvas
function mouseForce(){
    //check if the mouse is in the force field and left button is down
    if (mouseCoords.b === 1 && (yCanvasForce < mouseCoords.y) && ((yCanvasForce + canvasForce.height) > mouseCoords.y)) {
        //force saturation
        if (mouseCoords.x < 0) {
            f = (-forceReference.x)*forceScale;

            //draw saturated arrow
            forceArrow.update(0);
            forceArrow.drawForce();
        }
        else if (mouseCoords.x > canvasForce.width) {
            f = (canvasForce.width - forceReference.x)*forceScale;

            //draw saturated arrow
            forceArrow.update(canvasForce.width);
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
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    //clear force canvas
    ctxForce.clearRect(0, 0, canvasForce.width, canvasForce.height);

    //draw force center line
    forceLine.drawForce();

    //draw and calculate force
    mouseForce();

    //pid
    e = w - segway.fi;
    f = pid(e, eLast, eLast2, uLast, r0, rI, rD, deltaT)*forceScale;
    eLast2 = eLast;
    eLast = e;
    uLast = f;

    //call solver
    result = solvePendulumNonLinear(segway.x, segway.speedX, segway.fi, segway.speedFi,f,deltaT, mC, mP, inertia, b, lt, -g);

    //update state variables
    segway.x = result.x1;
    segway.speedX = result.x2;
    segway.fi = result.x3;
    segway.speedFi = result.x4;

    // segway drawing saturation
    if (segway.x <= 0) {
        segway.x = 0;
        segway.speedX = 0;
    }
    if (segway.x*m2px >= canvas.width - 50){
        segway.x = (canvas.width-50)/m2px;
        segway.speedX = 0;
    }

    // segway motion update
    segway.transform();

    //draw new segway position
    segway.draw();

    // log line update
    document.getElementById("demo").innerHTML = "mouse x: " + mouseCoords.x + ", mouse y: " + mouseCoords.y
                                                        + ", button = " + mouseCoords.b + ", x cart = " + segway.x*m2px
                                                        + ", y cart = " + segway.y*m2px + " F = " + f*forceScale + ", fi = "
                                                        + segway.fi*180/Math.PI;
}