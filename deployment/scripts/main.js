(function(){

const UNKNOWN = '?';
const VOLTORB = '*';
const ONE = '1';
const TWO = '2';
const THREE = '3';
const MAX_PRINTOUT = 100;
const PRINTOUT_SPEED = 1; // milliseconds
const ROWS = 5;
const COLUMNS = 5;

const MR2ID = {0: 'ggmr0', 1: 'ggmr1', 2: 'ggmr2', 3: 'ggmr3', 4: 'ggmr4'};
const MC2ID = {0: 'ggmc0', 1: 'ggmc1', 2: 'ggmc2', 3: 'ggmc3', 4: 'ggmc4'};
const VR2ID = {0: 'ggvr0', 1: 'ggvr1', 2: 'ggvr2', 3: 'ggvr3', 4: 'ggvr4'};
const VC2ID = {0: 'ggvc0', 1: 'ggvc1', 2: 'ggvc2', 3: 'ggvc3', 4: 'ggvc4'};
const IJ2ID = {
    0: {0: 'gg00', 1: 'gg01', 2: 'gg02', 3: 'gg03', 4: 'gg04'},
    1: {0: 'gg10', 1: 'gg11', 2: 'gg12', 3: 'gg13', 4: 'gg14'},
    2: {0: 'gg20', 1: 'gg21', 2: 'gg22', 3: 'gg23', 4: 'gg24'},
    3: {0: 'gg30', 1: 'gg31', 2: 'gg32', 3: 'gg33', 4: 'gg34'},
    4: {0: 'gg40', 1: 'gg41', 2: 'gg42', 3: 'gg43', 4: 'gg44'},
}

const CMR2ID = {0: 'cgmr0', 1: 'cgmr1', 2: 'cgmr2', 3: 'cgmr3', 4: 'cgmr4'};
const CMC2ID = {0: 'cgmc0', 1: 'cgmc1', 2: 'cgmc2', 3: 'cgmc3', 4: 'cgmc4'};
const CVR2ID = {0: 'cgvr0', 1: 'cgvr1', 2: 'cgvr2', 3: 'cgvr3', 4: 'cgvr4'};
const CVC2ID = {0: 'cgvc0', 1: 'cgvc1', 2: 'cgvc2', 3: 'cgvc3', 4: 'cgvc4'};
const CIJ2ID = {
    0: {0: 'cg00_coin', 1: 'cg01_coin', 2: 'cg02_coin', 3: 'cg03_coin', 4: 'cg04_coin'},
    1: {0: 'cg10_coin', 1: 'cg11_coin', 2: 'cg12_coin', 3: 'cg13_coin', 4: 'cg14_coin'},
    2: {0: 'cg20_coin', 1: 'cg21_coin', 2: 'cg22_coin', 3: 'cg23_coin', 4: 'cg24_coin'},
    3: {0: 'cg30_coin', 1: 'cg31_coin', 2: 'cg32_coin', 3: 'cg33_coin', 4: 'cg34_coin'},
    4: {0: 'cg40_coin', 1: 'cg41_coin', 2: 'cg42_coin', 3: 'cg43_coin', 4: 'cg44_coin'},
}

const SMR2ID = {0: 'sgmr0', 1: 'sgmr1', 2: 'sgmr2', 3: 'sgmr3', 4: 'sgmr4'};
const SMC2ID = {0: 'sgmc0', 1: 'sgmc1', 2: 'sgmc2', 3: 'sgmc3', 4: 'sgmc4'};
const SVR2ID = {0: 'sgvr0', 1: 'sgvr1', 2: 'sgvr2', 3: 'sgvr3', 4: 'sgvr4'};
const SVC2ID = {0: 'sgvc0', 1: 'sgvc1', 2: 'sgvc2', 3: 'sgvc3', 4: 'sgvc4'};
const SIJ2ID = {
    0: {0: 'sg00', 1: 'sg01', 2: 'sg02', 3: 'sg03', 4: 'sg04'},
    1: {0: 'sg10', 1: 'sg11', 2: 'sg12', 3: 'sg13', 4: 'sg14'},
    2: {0: 'sg20', 1: 'sg21', 2: 'sg22', 3: 'sg23', 4: 'sg24'},
    3: {0: 'sg30', 1: 'sg31', 2: 'sg32', 3: 'sg33', 4: 'sg34'},
    4: {0: 'sg40', 1: 'sg41', 2: 'sg42', 3: 'sg43', 4: 'sg44'},
}

const ID_IMAGES = {};
ID_IMAGES[UNKNOWN] = 'resources/input/UNKNOWN.png';
ID_IMAGES[VOLTORB] = 'resources/input/VOLTORB.png';
ID_IMAGES[ONE] = 'resources/input/ONE.png';
ID_IMAGES[TWO] = 'resources/input/TWO.png';
ID_IMAGES[THREE] = 'resources/input/THREE.png';
const ID_NEXT = {};
ID_NEXT[UNKNOWN] = ONE;
ID_NEXT[ONE] = TWO;
ID_NEXT[TWO] = THREE;
ID_NEXT[THREE] = VOLTORB;
ID_NEXT[VOLTORB] = UNKNOWN;


// set the cell ID of a cell in the input table
function set_cell(elem, id) {
    elem.src = ID_IMAGES[id];
    elem.setAttribute('cell_id', id);
}

function set_chance_cell(elem, prop) {
    elem.style.width = `calc(8.47%*${1-prop})`;
}

function set_solution_cell(elem, id) {
    elem.src = ID_IMAGES[id];
}


document.addEventListener("DOMContentLoaded", function(event) {
    
    // get the DOM elements for the cells and sums and set click callbacks
    var MR = {};
    var MC = {};
    var VR = {};
    var VC = {};
    var IJ = {};
    
    var CMR = {};
    var CMC = {};
    var CVR = {};
    var CVC = {};
    var CIJ = {};
    
    var SMR = {};
    var SMC = {};
    var SVR = {};
    var SVC = {};
    var SIJ = {};
    
    var chances = {};
    var solutions = [];
    for (var i = 0; i < ROWS; i++) {
        MR[i] = document.getElementById(MR2ID[i]);
        VR[i] = document.getElementById(VR2ID[i]);
        IJ[i] = {};
        CMR[i] = document.getElementById(CMR2ID[i]);
        CVR[i] = document.getElementById(CVR2ID[i]);
        CIJ[i] = {};
        SMR[i] = document.getElementById(SMR2ID[i]);
        SVR[i] = document.getElementById(SVR2ID[i]);
        SIJ[i] = {};
        chances[i] = {};
        for (var j = 0; j < COLUMNS; j++) {
            if (i == 0) {
                MC[j] = document.getElementById(MC2ID[j]);
                VC[j] = document.getElementById(VC2ID[j]);
                CMC[j] = document.getElementById(CMC2ID[j]);
                CVC[j] = document.getElementById(CVC2ID[j]);
                SMC[j] = document.getElementById(SMC2ID[j]);
                SVC[j] = document.getElementById(SVC2ID[j]);
            }
            
            // set up the cell flipping callbacks
            var cell = document.getElementById(IJ2ID[i][j]);
            IJ[i][j] = cell;
            set_cell(cell, UNKNOWN);
            cell.addEventListener('click', function(e) { 
                set_cell(e.target, ID_NEXT[e.target.getAttribute('cell_id')]);
            });
            
            // set up the chances grid image overlay
            var cell = document.getElementById(CIJ2ID[i][j]);
            CIJ[i][j] = cell;
            set_chance_cell(cell, 0);
            chances[i][j] = 0;
            
            // assign the solutions grid elements
            var cell = document.getElementById(SIJ2ID[i][j]);
            SIJ[i][j] = cell;
            set_solution_cell(cell, UNKNOWN);
        }
    }
    
    
    // pull solver input data from the grid
    function pull_grid_data() {
        sums = {};
        sums['multipliers'] = {};
        sums['multipliers']['rows'] = {};
        sums['multipliers']['columns'] = {};
        sums['voltorbs'] = {};
        sums['voltorbs']['rows'] = {};
        sums['voltorbs']['columns'] = {};
        known = [];
        for (var i = 0; i < ROWS; i++) {
            sums['multipliers']['rows'][i] = parseInt(MR[i].value);
            sums['voltorbs']['rows'][i] = parseInt(VR[i].value);
            for (var j = 0; j < COLUMNS; j++) {
                if (i == 0) {
                    sums['multipliers']['columns'][j] = parseInt(MC[j].value);
                    sums['voltorbs']['columns'][j] = parseInt(VC[j].value);
                }
                known.push([i, j, IJ[i][j].getAttribute('cell_id')]);
            }
        }
        return {'sums': sums, 'cells': known};
    }
    
    
    // keep track of solution data for chances grid
    function update_chances(solution, clear=false) {
        for (var i = 0; i < ROWS; i++) {
            for (var j = 0; j < COLUMNS; j++) {
                if (clear) { chances[i][j] = 0; }
                else if (solution[i][j] == VOLTORB) { chances[i][j] += 1; }
            }
        }
    }
    
    
    // update the grid cells in the chances tab
    function update_chances_grid() {
        var nsol = solutions.length;
        for (var i = 0; i < ROWS; i++) {
            for (var j = 0; j < COLUMNS; j++) {
                var cellVolts = chances[i][j];
                if (nsol > 0) { set_chance_cell(CIJ[i][j], cellVolts/nsol); }
                else { set_chance_cell(CIJ[i][j], 0); }
            }
        }
    }
    
    
    // update the row and column sums in the chances tab
    function update_chances_sums() {
        for (var i = 0; i < ROWS; i++) {
            CMR[i].innerText = MR[i].value;
            CVR[i].innerText = VR[i].value;
        }
        for (var j = 0; j < COLUMNS; j++) {
            CMC[j].innerText = MC[j].value;
            CVC[j].innerText = VC[j].value;
        }
    }
    
    
    // update the grid image in the solutions tab
    function update_solutions_grid(solution, clear=false) {
        for (var i = 0; i < ROWS; i++) {
            for (var j = 0; j < COLUMNS; j++) {
                if (clear) { set_solution_cell(SIJ[i][j], UNKNOWN); }
                else { set_solution_cell(SIJ[i][j], solution[i][j]); }
            }
        }
    }
    
    
    // update the row and column sums in the solutions tab
    function update_solutions_sums() {
       for (var i = 0; i < ROWS; i++) {
            SMR[i].innerText = MR[i].value;
            SVR[i].innerText = VR[i].value;
        }
        for (var j = 0; j < COLUMNS; j++) {
            SMC[j].innerText = MC[j].value;
            SVC[j].innerText = VC[j].value;
        } 
    }
    
    
    // add a single solution to the solutions list table
    var solutionsTable = document.getElementById('solutions_table');
    var solTableClicked = null;
    function add_solution_to_table(solution, i) {
        var clickable = document.createElement('td');
        clickable.innerText = i;
        clickable.addEventListener('click', function() {
            var i = parseInt(this.innerText);
            if (solTableClicked) { solTableClicked.classList.remove('clicked'); }
            this.classList.add('clicked');
            update_solutions_grid(solutions[i]);
            solTableClicked = this;
        });
        solutionsTable.appendChild(clickable);
    }
    
    
    // fill in the solutions list table
    function popuplate_solutions_list() {
        solutionsTable.innerHTML = '';
        for (var i = 0; i < solutions.length; i++) {
            add_solution_to_table(solutions[i], i);
        }
    }
    
    
    // function for printing messages 
    var running = false;
    var messages = [];
    var nPrintout = 0;
    var messagesElem = document.getElementById("messages");
    var messagePrinterInterval = null;
    var finishMessages = false
    var consume_message = function() {
        var msg = messages.shift();
        if (msg) {
            if (nPrintout == MAX_PRINTOUT) { 
                messagesElem.firstChild.remove(); 
                nPrintout -= 1;
            }
            var newMessage = document.createElement('span');
            newMessage.innerHTML = msg + '<br>';
            messagesElem.appendChild(newMessage);
            nPrintout += 1;
        }
        if (finishMessages && (messages.length == 0) && messagePrinterInterval) {
            clearInterval(messagePrinterInterval);
        }
    }
    
    // open one of the content tabs 
    var activeTab = null;
    function open_tab(tabID=null, buttonID=null) {
        
        // open the tab of the given button
        if (tabID === null) {
            if (buttonID === null) { throw new Error('Invalid arguments to open_tab().'); }
            var button = document.getElementById(buttonID);
            open_tab(button.getAttribute('opens'));
            for (var b2 of document.getElementsByClassName('menu_button')) { b2.classList.remove('bfocus'); }
            button.classList.add('bfocus');
        }
        
        // open the given tab
        else if (tabID != activeTab) {
            if (activeTab) { document.getElementById(activeTab).style.display = 'none'; }
            if (tabID == 'chances_tab') { update_chances_sums(); update_chances_grid(); }
            else if (tabID == 'solutions_tab') {
                update_solutions_sums();
                popuplate_solutions_list(); 
                if ((solutions.length > 0) && (solTableClicked)) {
                    solTableClicked.dispatchEvent(new Event('click')); 
                    solTableClicked.classList.add('clicked');
                }
            }
            document.getElementById(tabID).style.display = 'inline';
            activeTab = tabID;
        }
    }
    
    // callbacks for tab buttons
    open_tab(null, 'input_button');
    var menuButtons = document.getElementsByClassName('menu_button');
    for (var button of menuButtons) {
        button.addEventListener('mousedown', function() { this.classList.add('bactive'); });
        button.addEventListener('mouseup', function() {
            for (var b2 of menuButtons) { b2.classList.remove('bfocus'); }
            this.classList.remove('bactive'); 
            open_tab(this.getAttribute('opens'));
            this.classList.add('bfocus');
        });
    }

    
    // set stuff in main when the worker finishes
    var worker = null;
    function stop() {
        if (worker) { worker.terminate(); }
        running = false;
        document.getElementById('action_button_text').innerText = 'Solve!';
        finishMessages = true;
    }
    
    
    // callback for start button
    var progressText = document.getElementById('progress_foreground');
    var progressBar = document.getElementById('progress_bar');
    var actionButton = document.getElementById('action_button');
    function start_worker() {
        if (running) { stop(); }
        else {
            
            // start the message consumer
            messagesElem.innerHTML = '';
            nPrintout = 0;
            messages = [];
            messagePrinterInterval = setInterval(consume_message, PRINTOUT_SPEED);
            finishMessages = false;
            
            // start a working running
            worker = new Worker('scripts/worker.js');
            solutions = [];
            var solutions2 = solutions;
            worker.onmessage = function(event) {
                var msg = event.data;
                if (msg.type == 'progress') {
                    progressText.innerText = msg.message;
                    progressBar.style.width = `${100*msg.covered/msg.possible}%`;
                }
                else if (msg.type == 'cell_update') {
                    // NEED TO REPLACE WITH A TEXT TABEL THAT CAN UPDATE FASTER
                    // IJ[msg.i][msg.j].src = ID_IMAGES[msg.id];
                }
                else if (msg.type == 'cell_fixed') {
                    set_cell(IJ[msg.i][msg.j], msg.id);
                }
                else if (msg.type == 'message') {
                    messages.push(msg.message);
                }
                else if (msg.type == 'error') {
                    alert(msg.message);
                }
                else if (msg.type == 'solution') {
                    var solution = msg.data;
                    solutions2.push(solution);
                    update_chances(solution);
                    add_solution_to_table(solution, solutions.length-1);
                    if (activeTab == 'chances_tab') { update_chances_grid(); }
                }
                else if (msg.type == 'prompt_cell_id') {
                    
                    // get the cell value and start over
                    open_tab(null, 'input_button');
                    var answer = prompt(msg.message);
                    if (!answer) { stop(); }
                    else {
                        if (ID_IMAGES.hasOwnProperty(answer)) { set_cell(IJ[msg.i][msg.j], answer); }
                        stop();
                        start_worker();
                    }
                }
                else if (msg.type == 'resolve') {
                    progressBar.style.width = '0%';
                    solutions2 = [];
                    solTableClicked = null;
                    update_chances(null, true);
                    update_solutions_grid(null, true);
                    if (activeTab == 'chances_tab') { update_chances_grid(); }
                }
                else if (msg.type == 'finished') {
                    progressBar.style.width = '100%';
                    stop();
                }
                
            }
            worker.postMessage({'type': 'start', 'data': pull_grid_data()});
            running = true;
            document.getElementById('action_button_text').innerText = 'Stop!';
            update_chances(null, true);
            update_chances_grid();
            open_tab(null, 'chances_button');
        }
    }
    actionButton.addEventListener('click', start_worker);
    
    
    // callback for reset button
    var resetButton = document.getElementById('reset_button');
    resetButton.addEventListener('click', function() {
        if (running) { stop(); }
        solutions = [];
        solTableClicked = null;
        update_chances(null, true);
        update_chances_grid();
        update_solutions_grid(null, true);
        for (var i = 0; i < ROWS; i++) {
            MR[i].value = 0;
            VR[i].value = 0;
            for (var j = 0; j < COLUMNS; j++) {
                if (i == 0) {
                    MC[j].value = 0;
                    VC[j].value = 0;
                }
                set_cell(IJ[i][j], UNKNOWN);
            }
        }
        update_chances_sums();
        update_solutions_sums();
        progressText.innerText = '0% Progress. Fill in the sums and click Solve!';
    });
});

})();