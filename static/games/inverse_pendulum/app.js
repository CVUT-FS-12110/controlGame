// TODO draw ground in canvas
// TODO disallow to crash stick to ground
// TODO nonlinear manual force
// TODO max force in model params!
// TODO manage walls on sides in better way (no magic constants)

class Stick{

    constructor(canvas_width, ctx, m2px) {
        this.ctx = ctx;
        this.m2px = m2px
        this.scale = 500 / canvas_width * 3;
        this.axis = {
            y: 454 / this.scale,
            x: 75 / this.scale
        };
    }

    setup(img, fi, speedX, speedFi, canvas) {
        this.orig_width = img.width;
        this.orig_height = img.height;
        this.width = img.width / this.scale;
        this.height = img.height / this.scale;
        this.img = img;

        this.x = (canvas.width / 2 - (img.width / 2 / this.scale)) / this.m2px;
        this.y = (canvas.height / 9) / this.m2px;
        this.speedX = speedX;
        this.fi = fi;
        this.speedFi = speedFi;
    }

    draw(){
        this.ctx.drawImage(this.img, 0, 0, this.width, this.height);
    }

    transform(){
        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.transform(1, 0, 0, 1, this.x * this.m2px + this.axis.x, this.y * this.m2px + this.axis.y);// shift to the axis
        this.ctx.transform(Math.cos(this.fi), Math.sin(this.fi), -Math.sin(this.fi), Math.cos(this.fi), 0, 0);// rotate
        this.ctx.transform(1, 0, 0, 1, -this.axis.x, -this.axis.y); // shift to the img corner
    }

}

class App {

    constructor() {
        this.title = "Inverse pendulum";
        this.plots = [
            {
                id: "f",
                title: "Force",
                unit: "N"
            },
            {
                id: "fi",
                title: "Angle",
                unit: "rad"
            }
        ];
        this.available_controllers = ["manual", "pid"];

        // TODO Matous: static folder as parameter
        let custom_style = '<link rel="stylesheet" href="/controlGame/static/games/inverse_pendulum/styles.css">';
        $("head").append(custom_style);
        this.game_params = { // TODO Matous: possible defaults from constructor
            mC: 1.0, //Cart mass
            mP: 0.5, // Pendulum mass
            b:  0.9, // Cart friction
            g: 9.81, // gravity
            l: 1.0, // pendulum length
        };
        this.simulation = 0;
        this.params = {};
        this.canvas_params = {};
        this.result = {};
        this.init();
    }

    init() {
        this.create_html();
        this.set_parameters();
    }

    game_start() {
        var self = this;
        if (this.simulation === 0) {
            this.simulation = setInterval(function() { self.update(); }, this.params.deltaT * 1000);
        }
    }

    game_pause() {
        if (this.simulation !== 0) {
            clearInterval(this.simulation);
            this.simulation = 0;
        }
    }

    game_reset() {
        if (this.simulation !== 0) {
            clearInterval(this.simulation);
            this.simulation = 0;
        }

        this.clear_canvas();
        this.set_parameters();

    }


    create_html() {
        $("#model_settings").html(
            "<div><label>Cart mass</label>" + "<input type='number' name='mC' value='" + this.game_params.mC + "'></div>" +
            "<div><label>Pendulum mass</label>" + "<input type='number' name='mP' value='" + this.game_params.mP + "'></div>" +
            "<div><label>Cart friction</label>" + "<input type='number' name='b' value='" + this.game_params.b + "'></div>" +
            "<div><label>Gravity</label>" + "<input type='number' name='g' value='" + this.game_params.g + "'></div>" +
            "<div><label>Pendulum length</label>" + "<input type='number' name='l' value='" + this.game_params.l + "'></div>"
        );
//        $("#model_settings").show();

        var self = this;
        $("#model_panel .trigger").click(function() {
            // TODO: validace vstupu
            self.game_params.mC = parseFloat($("#model_settings input[name='mC']").val());
            self.game_params.mP = parseFloat($("#model_settings input[name='mP']").val());
            self.game_params.b = parseFloat($("#model_settings input[name='b']").val());
            self.game_params.g = parseFloat($("#model_settings input[name='g']").val());
            self.game_params.l = parseFloat($("#model_settings input[name='l']").val());
        });

        // game field
        let wid = $("#game_screen").width();
        let hei = Math.round(wid / 5 * 2.5);

        let game_screen_html = '<canvas id="pidGame" width="' + wid + '" height="' + hei + '" ></canvas>';
        $("#game_screen").html(game_screen_html);

        let game_controls_html = '<input type="range" min="-1000" max="1000" value="0" class="slider" id="pendulum_game_slider">';
        $("#game_controls").html(game_controls_html);

        $("#pendulum_game_slider").mouseup(function(e) {
            e.preventDefault();
            $('#pendulum_game_slider').val(0);
        });

        var self = this;
        $("#pendulum_game_slider").mousedown(function(e) {
//            self.game_start();
            $("#start").click();
        });

    }

    set_parameters() {
        let self = this;

        // game params
        this.game_params.inertia = (4 * this.game_params.mP * this.game_params.lt**2) / 3;
        this.game_params.lt = this.game_params.l / 2; // pendulum center of mass

        // canvas params
        this.canvas_params.canvas = document.getElementById("pidGame");
        this.canvas_params.ctx = this.canvas_params.canvas.getContext("2d");
        this.canvas_params.m2px = 500 / this.canvas_params.canvas.width * 100; // ?

        // params
        this.params = {};
        this.params.f = 0;
        this.params.xDot0 = 0.0;
        this.params.fi0 = 0.5;
        this.params.fiDot0 = 0;
        this.params.deltaT = 0.025;
        this.time_index = 0;


        let stickImage = new Image();
        stickImage.src = '/controlGame/static/games/inverse_pendulum/segway.png';

        this.stick = new Stick(
            this.canvas_params.canvas.width,
            this.canvas_params.ctx,
            this.canvas_params.m2px
            );

        stickImage.onload = function(e){

            self.stick.setup(stickImage, self.params.fi0,
                    self.params.xDot0, self.params.fiDot0, self.canvas_params.canvas
                    );
            self.stick.transform();
            self.stick.draw();
        }
    }

    clear_canvas() {
        this.canvas_params.ctx.save();
        this.canvas_params.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.canvas_params.ctx.clearRect(0, 0, this.canvas_params.canvas.width, this.canvas_params.canvas.height);
        this.canvas_params.ctx.restore();
    }


    update() {
        this.clear_canvas();

        // control
        if (window.controller.name === "pid") {
            window.controller.params.e = window.controller.params.w - this.stick.fi;
            this.params.f = window.controller.execute(
                window.controller.params.e,
                window.controller.params.eLast,
                window.controller.params.eLast2,
                window.controller.params.uLast,
                window.controller.params.r0,
                window.controller.params.rI,
                window.controller.params.rD,
                this.params.deltaT
            );
            window.controller.params.eLast2 = window.controller.params.eLast;
            window.controller.params.eLast = window.controller.params.e;
            window.controller.params.uLast = this.params.f;
        } else if (window.controller.name === "manual") {
            let slider_value = $('#pendulum_game_slider').val();
            this.params.force_scale = 500 / this.canvas_params.canvas.width * 0.05; // TODO better force scale!
            this.params.f = slider_value * this.params.force_scale;
        }

        //call solver
        this.result = this.solvePendulumNonLinear(
            this.stick.x,
            this.stick.speedX,
            this.stick.fi,
            this.stick.speedFi,
            this.params.f,
            this.params.deltaT,
            this.game_params.mC,
            this.game_params.mP,
            this.game_params.inertia,
            this.game_params.b,
            this.game_params.lt,
            -this.game_params.g);

        //update state variables
        this.stick.x = this.result.x1;
        this.stick.speedX = this.result.x2;
        this.stick.fi = this.result.x3;
        this.stick.speedFi = this.result.x4;

        // stick drawing saturation
        if (this.stick.x <= 0) {
            this.stick.x = 0;
            this.speedX = 0;
        } // TODO why 50?
        if (this.stick.x * this.canvas_params.m2px >= this.canvas_params.canvas.width - 50){
            this.stick.x = (this.canvas_params.canvas.width - 50) / this.canvas_params.m2px;
            this.stick.speedX = 0;
        }

        // stick motion update
        this.stick.transform();
        this.stick.draw();

        // plot
        let plot_data = {
            fi: this.stick.fi,
            f: this.params.f
        }
        this.time_index += this.params.deltaT;
        window.plot(plot_data, this.time_index);
    }


    solvePendulumNonLinear(x, xDot, fi, fiDot, u, deltaT, mC, mP, inertia, b, lt, g) {
        if (xDot > 0){
            u = u - 5;      
        } else if (xDot < 0){
            u = u + 5;
        }
        //denominator for shorter eqn
        let denom = ((7*lt**2*mP**2)/3 - lt**2*mP**2*Math.cos(fi)**2 + (7*mC*lt**2*mP)/3);

        //explicit euler solver
        let x2e = xDot + deltaT*((7*u*lt**2*mP)/3 - (7*b*xDot*lt**2*mP)/3 + (7*fiDot**2*lt**3*mP**2*Math.sin(fi))/3 + g*lt**2*mP**2*Math.cos(fi)*Math.sin(fi))/denom;
        let x3e= fi + deltaT*fiDot;
        let x4e = fiDot - deltaT*(lt*mP*(lt*mP*Math.cos(fi)*Math.sin(fi)*fiDot**2 + u*Math.cos(fi) + g*mP*Math.sin(fi) + mC*g*Math.sin(fi) - b*xDot*Math.cos(fi)))/denom;

        //implicit euler solver
        denom = ((7*lt**2*mP**2)/3 - lt**2*mP**2*Math.cos(x3e)**2 + (7*mC*lt**2*mP)/3);

        return {
            x1: x + deltaT*x2e,
            x2: xDot + deltaT*((7*u*lt**2*mP)/3 - (7*b*x2e*lt**2*mP)/3 + (7*x4e**2*lt**3*mP**2*Math.sin(x3e))/3 + g*lt**2*mP**2*Math.cos(x3e)*Math.sin(x3e))/denom,
            x3: fi + deltaT*x4e,
            x4: fiDot - deltaT*(lt*mP*(lt*mP*Math.cos(x3e)*Math.sin(x3e)*x4e**2 + u*Math.cos(x3e) + g*mP*Math.sin(x3e) + mC*g*Math.sin(x3e) - b*x2e*Math.cos(x3e)))/denom
        }
    }

}



window.game = new App();