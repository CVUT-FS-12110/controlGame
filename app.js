import {solve} from './modules/solver.js';

// const cartWidth = 50
// const cartHeight = 30
// const pendulumWidth = 10
// const pendulumHeight = 300

// load canvas
const canvas = document.getElementById("pidGame");
const ctx = canvas.getContext("2d");

// setting a period for simulation animation [s]
const deltaT = 0.025;

//Start updating canvas. Time in [ms]
setInterval(updateGameArea, deltaT*1000);

//image loading
const segwayImage = new Image();
segwayImage.src = 'img/segway.png';

//datetime and force init
let d = new Date();
let F = 0;

//segway image parameters
const segwayScale = 3;
const segwayAxis = {
    x: 454/segwayScale,
    y: 75/segwayScale
}

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
        ", button = " + mouseCoords.b + ", logx = " + segway.x + ", logF = " + F;
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
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }
    // rotate(){
    //
    // }
}

// image component class
class ImgComponent{
    constructor(img, x, y) {
        this.width = img.width/segwayScale;
        this.height = img.height/segwayScale;
        this.img = img;
        this.x = x;
        this.y = y;
        this.speedX = 0;
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
        ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
    }
    // transform(){
    //     ctx.transform(0,0,0,0, 100,100);
    // }

}

// segway object
let segway = new ImgComponent(segwayImage, canvas.width/2 - segwayImage.width/(2*segwayScale),
                           canvas.height/2 - segwayImage.height/(2*segwayScale));
//solver init
let result = solve(segway.x, segway.speedX, F, deltaT,1,1,0.9);


// drawn pendulum on a cart init
// cart = new component(cartWidth, cartHeight, "grey", canvas.width/2 - cartWidth/2, 120);
// pendulum = new component(pendulumWidth, pendulumHeight, "black", cart.x + cart.width/2 - pendulumWidth/2,
//                          cart.y + cart.height);

// function for calling simulation and animation update
function updateGameArea(){
    //clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    //get time
    d = new Date();
    //artificial force generation
    F = 50*Math.sin(d.getTime()/1000);

    // if (mouseCoords.b === 1) {
    //     segway.move(mouseCoords.x);
    // }

    //call solver
    result = solve(segway.x, segway.speedX, F, deltaT,1,1,0.9);
    //update state variables
    segway.x += result.x1;
    segway.speedX = result.x2;
    //draw new segway position
    segway.draw();
}