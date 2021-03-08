let regulators = ["manual", "pid"];


function init_regulator_pid() {

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


