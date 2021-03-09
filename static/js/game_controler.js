import {regulator_PID} from "/static/regulators/pid/app.js";
import {regulator_manual} from "/static/regulators/manual/app.js";

let REGULATORS = {
    "manual": regulator_manual,
    "pid": regulator_PID
}


function switch_regulator(name) {
    window.regulator = new REGULATORS[name]();
    $("#game_controls").hide()
    window.regulator.init();
    window.game.game_reset();
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

show_regulator_menu(window.available_regulators)
window.regulator;
switch_regulator("manual");

$("#reset_regulator").click(function() {
    $("#regulator_settings").show();
    $("#reset_regulator").hide();
    $("#game_panel").hide();
});



$("#start").click(function() {
    window.game.game_start();
});

$("#reset").click(function() {
    window.game.game_reset();
});

$("#pause").click(function() {
    window.game.game_pause();
});





