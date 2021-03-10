export class controler_PID {

    constructor() {
        this.name = "pid"
        this.params = {
            r0: -50,
            rI: -20,
            rD: -10,
            e: 0,
            w: 0,
            eLast: 0,
            eLast2: 0,
            uLast: 0
        };
    }

    init() {
        this.reset()

        $("#controler_settings").html(
            "<div><label>P</label>" + "<input type='number' name='r0' value='" + this.params.r0 + "'></div>" +
            "<div><label>I</label>" + "<input type='number' name='rI' value='" + this.params.rI + "'></div>" +
            "<div><label>D</label>" + "<input type='number' name='rD' value='" + this.params.rD + "'></div>" +
            "<div><button>Set</button></div>"
        );

        var self = this;
        $("#controler_settings button").click(function() {
            // TODO: validace vstupu
            self.params.r0 = parseFloat($("#controler_settings input[name='r0']").val());
            self.params.rI = parseFloat($("#controler_settings input[name='rI']").val());
            self.params.rD = parseFloat($("#controler_settings input[name='rD']").val());
            $("#controler_settings").hide();
            $("#reset_controler").show();
            $("#game_panel").show();
        });
    }

    execute(e, eLast, eLast2, uLast, r0, rI, rD, deltaT) {
        return uLast + r0*(e - eLast) + rI*e*deltaT + rD*(e - 2*eLast + eLast2)/deltaT
    }

    reset() {
        this.params.eLast = 0;
        this.params.eLast2 = 0;
        this.params.uLast = 0;
    }

}