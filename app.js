import {solvePendulum, solvePendulumNonLinear} from './modules/solver.js';

// const cartWidth = 50
// const cartHeight = 30
// const pendulumWidth = 10
// const pendulumHeight = 300

// load canvas
const canvas = document.getElementById("pidGame");
const ctx = canvas.getContext("2d");

// const m2px = 3779.5;
const m2px = 100;


//image loading
const segwayImage = new Image();
segwayImage.src = 'img/segway.png';

//segway image parameters
const segwayScale = 3;
const segwayAxis = {
    y: 454/segwayScale,
    x: 75/segwayScale
}

//datetime and force init
let d = new Date();
let F = 0;

//model parameters
let mC = 1.0;
let mP = 0.5;
let b =  0.9;
let g = 9.81;
let l = 1.0;
let lt = l/2;
let inertia = (4*mP*lt**2)/3;

//model init conditions
let x0 = (canvas.width / 2 - segwayImage.width / (2 * segwayScale))/m2px;
let y0 = (canvas.height / 2 - segwayImage.height / (2 * segwayScale))/m2px;
let xDot0 = 0.0;
let fi0 = 3.14;
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

//get mouse position event
window.onmousemove = function(e) {
    mouseCoords.x = e.clientX - xCanvas;
    mouseCoords.y = e.clientY - yCanvas;
    mouseCoords.b = e.buttons;
    document.getElementById("demo").innerHTML = "X coords: " + mouseCoords.x + ", Y coords: " + mouseCoords.y +
        ", button = " + mouseCoords.b + ", logx = " + segway.x + ", logF = " + F + ", fi = " + fi0;
}


// drawn component class
class component{
    constructor(width, height, color, x, y) {
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
        this.color = color;
    }
    move(xPos){
        this.x = xPos;
    }
    draw(){
        ctx.fillStyle = this.color;
        ctx.fillRect(0, 0, this.width, this.height);
    }
    // rotate(){
    //
    // }
}

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

    move(xPos){
        if (xPos < 0) {
            this.x = 0;
        }
        else if (xPos > canvas.width - 50){
            this.x = canvas.width - 50;
            }
        else {
            this.x = xPos;
        }
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

//Start updating canvas. Time in [ms]
// if(segwayImage.complete){
//
// }

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
    //clear canvas
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    //get time
    d = new Date();
    //artificial force generation
    F = Math.sin(d.getTime()/500);

    // if (mouseCoords.b === 1) {
    //     segway.move(mouseCoords.x);
    // }

    //call solver
    result = solvePendulumNonLinear(segway.x, segway.speedX, segway.fi, segway.speedFi,F,deltaT, mC, mP, inertia, b, lt, -g);
    //update state variables
    segway.x = result.x1;
    segway.speedX = result.x2;
    segway.fi = result.x3;
    segway.speedFi = result.x4;
    segway.transform();
    //draw new segway position
    segway.draw();
}