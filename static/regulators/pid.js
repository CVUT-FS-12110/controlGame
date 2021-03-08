export class regulator_PID {

    init() {
        window.params_pid = {
            r0: -50,
            rI: -20,
            rD: -10,
            e: 0,
            w: 0,
            eLast: 0,
            eLast2: 0,
            uLast: 0
        }

        $("#regulator_settings").html(
            "<div><label>P</label>" + "<input type='number' name='r0' value='" + window.params_pid.r0 + "'></div>" +
            "<div><label>I</label>" + "<input type='number' name='rI' value='" + window.params_pid.rI + "'></div>" +
            "<div><label>D</label>" + "<input type='number' name='rD' value='" + window.params_pid.rD + "'></div>" +
            "<div><button>Set</button></div>"
        );

        $("#regulator_settings button").click(function() {
            // TODO: validace vstupu
            window.params_pid.r0 = parseFloat($("#regulator_settings input[name='r0']").val());
            window.params_pid.rI = parseFloat($("#regulator_settings input[name='rI']").val());
            window.params_pid.rD = parseFloat($("#regulator_settings input[name='rD']").val());
            $("#regulator_settings").hide();
            $("#reset_regulator").show();
            $("#game_panel").show();
        });
        $("#regulator_settings").show();
    }

}