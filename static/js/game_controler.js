import {regulator_PID} from "/static/regulators/pid.js";
import {regulator_manual} from "/static/regulators/manual.js";

let REGULATORS = {
    "manual": new regulator_manual,
    "pid": new regulator_PID()
}

// place holders
window.start_game = function() {}
window.reset_game = function() {}
window.pause_game = function() {}


function switch_regulator(name) {
    window.regulator = name;
    $("#game_controls").hide()
    REGULATORS[name].init();
    window.reset_game();
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

// set and bind defaults

show_regulator_menu(window.available_regulators)
window.regulator;
switch_regulator("manual");

$("#reset_regulator").click(function() {
    $("#regulator_settings").show();
    $("#reset_regulator").hide();
    $("#game_panel").hide();
});

$("#start").click(function() {
    window.start_game();
});

$("#reset").click(function() {
    window.reset_game();
});

$("#pause").click(function() {
    window.pause_game();
});


