import {controller_PID} from "/static/controllers/pid/app.js";
import {controller_manual} from "/static/controllers/manual/app.js";

// TODO plotting

let CONTROLLERS = {
    "manual": controller_manual,
    "pid": controller_PID
}

function hide_all() {
    $("#game_panel").hide();
    $("#model_panel").hide();
    $("#controller_panel").hide();
    $("#select_controller_panel").hide();
}


function show_controller_selection_panel(controllers) {
    $("#controller_menu").html("")
    var i;
    let html_src, name;
    for (i = 0; i < controllers.length; i++) {
        name = controllers[i];
        html_src = '<button name="' + name + '">' + name + '</button>';
        $("#controller_menu").append(html_src)
    };

    $("#controller_menu button").click(function() {
        hide_all();
        let name = $( this ).attr('name');
        window.controller = new CONTROLLERS[name]();
        window.controller.init();
        window.game.game_reset();
        show_controller_panel();
    });

    $("#select_controller_panel").show();
}

function show_controller_panel() {
    if (window.controller.name === "manual") {
        $("#game_panel").show();
    } else {
        $("#controller_panel").show();
    }
}


function show_model_panel() {
    hide_all();
    $("#model_panel").show();

    $("#model_panel .trigger").click(function() {
        hide_all()
        show_controller_selection_panel(window.available_controllers);
    });
}

window.controller;
show_model_panel();

//$("#reset_controller").click(function() {
//    $("#controller_settings").show();
//    $("#reset_controller").hide();
//    $("#game_panel").hide();
//});


$("#start").click(function() {
    window.game.game_start();
});

$("#reset").click(function() {
    window.game.game_reset();
});

$("#pause").click(function() {
    window.game.game_pause();
});








