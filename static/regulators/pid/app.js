export class regulator_PID {

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

        $("#regulator_settings").html(
            "<div><label>P</label>" + "<input type='number' name='r0' value='" + this.params.r0 + "'></div>" +
            "<div><label>I</label>" + "<input type='number' name='rI' value='" + this.params.rI + "'></div>" +
            "<div><label>D</label>" + "<input type='number' name='rD' value='" + this.params.rD + "'></div>" +
            "<div><button>Set</button></div>"
        );

        var self = this;
        $("#regulator_settings button").click(function() {
            // TODO: validace vstupu
            self.params.r0 = parseFloat($("#regulator_settings input[name='r0']").val());
            self.params.rI = parseFloat($("#regulator_settings input[name='rI']").val());
            self.params.rD = parseFloat($("#regulator_settings input[name='rD']").val());
            $("#regulator_settings").hide();
            $("#reset_regulator").show();
            $("#game_panel").show();
        });
        $("#regulator_settings").show();
    }

    execute(e, eLast, eLast2, uLast, r0, rI, rD, deltaT) {
        return uLast + r0*(e - eLast) + rI*e*deltaT + rD*(e - 2*eLast + eLast2)/deltaT
    }

}