import {controler_PID} from "/static/controlers/pid/app.js";
import {controler_manual} from "/static/controlers/manual/app.js";

// TODO plotting

let CONTROLERS = {
    "manual": controler_manual,
    "pid": controler_PID
}

function switch_controler(name) {
    window.controler = new CONTROLERS[name]();
    $("#game_controls").hide()
    window.controler.init();
    window.game.game_reset();
}

function show_controler_menu(controlers) {
    $("#controler_menu").html("")
    var i;
    let html_src, name;
    for (i = 0; i < controlers.length; i++) {
        name = controlers[i];
        html_src = '<button name="' + name + '">' + name + '</button>';
        $("#controler_menu").append(html_src)
    };
    $("#controler_menu button").click(function() {
        switch_controler($( this ).attr('name'))
    });
    $("#controler_menu").show()

}

show_controler_menu(window.available_controlers)
window.controler;
switch_controler("manual");

$("#reset_controler").click(function() {
    $("#controler_settings").show();
    $("#reset_controler").hide();
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





