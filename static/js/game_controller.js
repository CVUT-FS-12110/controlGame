import {controller_PID} from "/controlGame/static/controllers/pid/app.js";
import {controller_manual} from "/controlGame/static/controllers/manual/app.js";

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


function show_select_controller_panel() {
    hide_all()
    $("#stepback_controller").hide();
    $("#stepback_select_controller").hide();
    $("#stepback_model").show();

    var controllers = window.game.available_controllers;
    $("#controller_menu").html("")
    var i;
    let html_src, name;
    for (i = 0; i < controllers.length; i++) {
        name = controllers[i];
        html_src = '<button name="' + name + '">' + name + '</button>';
        $("#controller_menu").append(html_src)
    };

    $("#controller_menu button").click(function() {
        let name = $( this ).attr('name');
        show_controller_panel(name);
    });

    $("#select_controller_panel").show();
}

function show_controller_panel(name) {
    hide_all();
    $("#stepback_controller").hide();
    $("#stepback_select_controller").show();
    $("#stepback_model").show();

    if (name != false) {
        window.controller = new CONTROLLERS[name]();
        window.controller.init();
    };
    window.game.game_reset();

    $("#controller_panel .trigger").click(function() {
        show_game_panel();
        $("#stepback_controller").show();
    });

    if (window.controller.name === "manual") {
        show_game_panel();
        $("#game_controls").show();
    } else {
        $("#controller_panel").show();
        $("#game_controls").hide();
    }

}

function show_game_panel() {
    hide_all();
    $("#game_panel").show();
    $("#stepback_select_controller").show();
}


function show_model_panel() {
    hide_all();
    $("#model_panel").show();
    $("#stepback_model").hide();

    $("#model_panel .trigger").click(function() {
        show_select_controller_panel();
    });
}

function create_plots() {
    $("#charts_panel").html("");
    var i;
    for (i = 0; i < window.game.plots.length; i++) {
        var layout = {
            yaxis: {
                title: {
                  text: window.game.plots[i].title + " [" +  window.game.plots[i].unit + "]",
                }
              }
        };
        let plot_id = 'plot_' + window.game.plots[i].id;
        $("#charts_panel").append("<div id='" + plot_id + "'></div>");
        Plotly.plot(plot_id,[{
            x:[], y:[], type:'line'
        }], layout);
    };
}


window.controller = {reset: function() {}};
show_model_panel();
create_plots();
$("#pause").hide();

$("head").append('<title>' + window.game.title + '</title>');
$("h1").html(window.game.title);


window.plot = function(data, time_index) {
    console.log(data);
    var i;
    var keys = Object.keys(data);
    for (i = 0; i < keys.length; i++) {
        let plot_id = 'plot_' + keys[i];
        Plotly.extendTraces(plot_id,{
            x: [[time_index]],
            y: [[data[keys[i]]]]
        }, [0]);
    };
};

function stepback_reset() {
    window.game.game_reset();
    window.controller.reset();
    create_plots();
    $("#pause").hide();
    $("#start").show();
}

$("#start").click(function() {
    window.game.game_start();
    $("#pause").show();
    $("#start").hide();
});

$("#pause").click(function() {
    window.game.game_pause();
    $("#pause").hide();
    $("#start").show();
});

$("#reset").click(function() {
    stepback_reset();
});

$(".stepback_button").click(function() {
    stepback_reset()
});


$("#stepback_select_controller").click(function() {
    show_select_controller_panel();
});

$("#stepback_controller").click(function() {
    show_controller_panel(false);
});

$("#stepback_model").click(function() {
    window.game.game_reset();
    show_model_panel();
});


// model override
function test_override(name) {
    window.controller = new CONTROLLERS[name]();
    window.controller.init();
    // manually override params of controller or game here

    window.game.game_reset();
    show_game_panel()
}
//test_override("pid");



