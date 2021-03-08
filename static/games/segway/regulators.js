let regulators = ["manual", "pid"];


function init_regulator_pid() {
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
        alert("set");
    });
    $("#regulator_settings").show();

}

function init_regulator_manual() {
    $("#game_controls").show()
}

function switch_regulator(name) {
    window.regulator = name;
    $("#game_controls").hide()
    REGULATORS[name]();
}


function show_regulator_menu(regulators) {
    $("#regulator_menu").html("")

    var i;
    let html_src, name;
    for (i = 0; i < regulators.length; i++) {
        name = regulators[i];
        html_src = '<button name="' + name + '">' + name + '</button>';
        $("#regulator_menu").append(html_src)

    };

    $("#regulator_menu button").click(function() {
        switch_regulator($( this ).attr('name'))
    });
    $("#regulator_menu").show()

}

let REGULATORS = {
    "manual": init_regulator_manual,
    "pid": init_regulator_pid
}


show_regulator_menu(regulators)
window.regulator;
switch_regulator("manual");



