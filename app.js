import {solvePendulum, solvePendulumNonLinear} from './modules/solver.js';

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

// const m2px = 3779.5 scaling px to meters
const m2px = 100;

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
let d = new Date();
let f = 0;

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

// setting a period for simulation animation [s]
const deltaT = 0.025;

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
let yCanvasForce = canvasRectForce.top;

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

    drawGame(){
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
    }

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
        this.x2 = this.x1 + 8;
        this.y2 = this.y1 + 8;
        this.x3 = this.x2;
        this.y3 = this.y1 - 8;
        this.xRect = this.x2;
        this.color = color;
    }

    update(x){
        this.x1 = x;
        if (this.x1 < forceReference.x) {
            this.x2 = this.x1 + 8;
            this.x3 = this.x2;
            this.xRect = this.x2;

        }
        else {
            this.x2 = this.x1 - 8;
            this.x3 = this.x2;
            this.xRect = forceReference.x;
        }
    }

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
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.transform(1, 0, 0, 1, this.x*m2px + segwayAxis.x, this.y*m2px + segwayAxis.y);
        ctx.transform(Math.cos(this.fi), Math.sin(this.fi), -Math.sin(this.fi), Math.cos(this.fi), 0, 0);
        ctx.transform(1, 0, 0, 1, -segwayAxis.x, -segwayAxis.y);
    }

}


// Start and stop simulation by clicking
let simulation = 0;
let startButton = document.getElementById("start");
let stopButton = document.getElementById("stop");

startButton.onclick = function(){
    if (simulation === 0) {
        simulation = setInterval(updateGameArea, deltaT * 1000);
    }
}
stopButton.onclick = function(){
    clearInterval(simulation);
    simulation = 0;
}


// image loading check
let segway;
let result;
// TODO: probably needs more robust solution.
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
// segway object


// drawn pendulum on a cart init
// cart = new component(cartWidth, cartHeight, "grey", canvas.width/2 - cartWidth/2, 120);
// pendulum = new component(pendulumWidth, pendulumHeight, "black", cart.x + cart.width/2 - pendulumWidth/2,
//                          cart.y + cart.height);

// function for calling simulation and animation update
function updateGameArea(){
    //clear game canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    //clear force canvas
    ctxForce.clearRect(0, 0, canvasForce.width, canvasForce.height);
    //update force canvas
    if (mouseCoords.b === 1 && (450.0 < mouseCoords.y) && (550.0 > mouseCoords.y)  ) {
        forceArrow.update(mouseCoords.x);
        forceArrow.drawForce();
        //user force generation
        f = (mouseCoords.x - forceReference.x)/20;
    }
    else {
        f = 0.0;
    }
    forceLine.drawForce();

    //get time
    d = new Date();

    //call solver
    result = solvePendulumNonLinear(segway.x, segway.speedX, segway.fi, segway.speedFi,f,deltaT, mC, mP, inertia, b, lt, -g);
    //update state variables
    segway.x = result.x1;
    segway.speedX = result.x2;
    segway.fi = result.x3;
    segway.speedFi = result.x4;
    if (segway.x <= 0) {
        segway.x = 0;
    }
    if (segway.x*m2px >= canvas.width - 50){
        segway.x = (canvas.width-50)/m2px;
    }
    segway.transform();
    //draw new segway position
    segway.draw();
    document.getElementById("demo").innerHTML = "mouse x: " + mouseCoords.x + ", mouse y: " + mouseCoords.y +
        ", button = " + mouseCoords.b + ", x cart = " + segway.x + ", y cart = " + segway.y + " F = " + f + ", fi = " + segway.fi*180/Math.PI;
}