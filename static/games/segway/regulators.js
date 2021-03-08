
function init_regulator_pid() {

}

function init_regulator_manual() {

    $("#game_controls").show()
}



function show_regulator_menu(regulators) {
    html_src = "";

    var i;
    for (i = 0; i < cars.regulators; i++) {
        name += regulators[i];
        html_src += '<input type="radio" name="regulator" value="' + name + '">';
        html_src += '<label for="' + + '">' + + '</label><br>';
    };
}


let REGULATORS = {
    "manual": init_regulator_manual,
    "pid": init_regulator_pid
}





let regulators = ["manual", "pid"];

let regulator = "pid";


REGULATORS[regulator]();


