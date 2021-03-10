import {controler_PID} from "/static/controlers/pid/app.js";
import {controler_manual} from "/static/controlers/manual/app.js";

// TODO plotting

let CONTROLERS = {
    "manual": controler_manual,
    "pid": controler_PID
}

function hide_all() {
    $("#game_panel").hide();
    $("#model_panel").hide();
    $("#controler_panel").hide();
    $("#select_controler_panel").hide();
}


function show_controler_selection_panel(controlers) {
    $("#controler_menu").html("")
    var i;
    let html_src, name;
    for (i = 0; i < controlers.length; i++) {
        name = controlers[i];
        html_src = '<button name="' + name + '">' + name + '</button>';
        $("#controler_menu").append(html_src)
    };

    $("#controler_menu button").click(function() {
        hide_all();
        let name = $( this ).attr('name');
        window.controler = new CONTROLERS[name]();
        window.controler.init();
        window.game.game_reset();
        show_controler_panel();
    });

    $("#select_controler_panel").show();
}

function show_controler_panel() {
    if (window.controler.name === "manual") {
        $("#game_panel").show();
    } else {
        $("#controler_panel").show();
    }
}


function show_model_panel() {
    hide_all();
    $("#model_panel").show();

    $("#model_panel .trigger").click(function() {
        hide_all()
        show_controler_selection_panel(window.available_controlers);
    });
}

window.controler;
show_model_panel();

//$("#reset_controler").click(function() {
//    $("#controler_settings").show();
//    $("#reset_controler").hide();
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








