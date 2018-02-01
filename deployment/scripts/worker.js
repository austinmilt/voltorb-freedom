(function() {
    

///////////////////////////////////////////////////////////////////////////////
// CLASSES FOR DEFINING CELL VALUE CONSTANTS //////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
class CellID {
    constructor(string='') { this.s = string; }
    string() { return this.s; }
    toString() { return this.string(); }
}

class Voltorb extends CellID {
    constructor() { super('*'); }
}

class Unknown extends CellID {
    constructor() { super('?'); }
}

class Multiplier extends CellID {
    constructor(value=0) { 
        super(value, value.toString());
        if (!Number.isInteger(value)) {
            throw new Error('Value must be an integer.');
        }
        this.v = value;
    }
    value() { return this.v; }
    equals(other) { return this.v == other.value(); }
}

class One extends Multiplier { constructor() { super(1); } }
class Two extends Multiplier { constructor() { super(2); } }
class Three extends Multiplier { constructor() { super(3); } }


///////////////////////////////////////////////////////////////////////////////
// CELL VALUE CONSTANTS ///////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////
const VOLTORB = new Voltorb();
const UNKNOWN = new Unknown();
const ONE = new One();
const TWO = new Two();
const THREE = new Three();
const IDS = new Set([VOLTORB, UNKNOWN, ONE, TWO, THREE]);
const ROWS = 5;
const COLUMNS = 5;
const MAX_MULT = THREE.value();
const T2ID = {'?': UNKNOWN, '*': VOLTORB, '1': ONE, '2': TWO, '3': THREE};


///////////////////////////////////////////////////////////////////////////////
// CELLS //////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

class Cell {
    constructor(i=0, j=0, id=UNKNOWN, options=null) {
        this.i = i;
        this.j = j;
        this.id = null;
        this.options = null;
        this.set_id(id);
        this.set_options(options);
    }
    
    string() { return '(' + this.i + ', ' + this.j + ', ' + this.id + ')'; }
    toString() { return this.string(); }
    get_position() { return [this.i, this.j]; }
    get_id() { return this.id; }
    is(id) { return this.id === id; }
    
    min_multiplier() {
        var m = Number.POSITIVE_INFINITY;
        for (var v of this.options) {
            if ((v instanceof Multiplier) && (v.value() < m)) {
                m = v;
            }
        }
        if (m == Number.POSITIVE_INFINITY) { return null; }
        return m;
    }
    
    max_multiplier() {
        var m = Number.NEGATIVE_INFINITY;
        for (var v of this.options) {
            if ((v instanceof Multiplier) && (v.value() > m)) {
                m = v;
            }
        }
        if (m == Number.NEGATIVE_INFINITY) { return null; }
        return m;
    }
    
    set_id(id=UNKNOWN) {
        if (!IDS.has(id)) { throw new Error('Invalid Cell ID.'); }
        this.id = id;
        this.set_options();
        postMessage({'type': 'cell_update', 'i': this.i, 'j': this.j, 'id': this.id.string()});
    }
    
    
    add_option(option) {
        if (!IDS.has(option)) {
            throw new Error('Invalid option value.');
        }
        return this.options.add(option);
    }
    

    remove_option(option) { return this.options.delete(option); }
    
    
    // sets the ids this cell can take
    set_options(options=null) {
        
        // if the user gave some options, add them one at a time
        if (options !== null) {
            for (var option in options) {
                this.add_option(option);
            }
        }
        
        // if the user didnt give options and the value is unknown
        // (i.e. in initation) then set to the default options
        else if ((options === null) && (this.id === UNKNOWN)) {
            this.options = new Set([ONE, TWO, THREE, VOLTORB]);
        }

        
        // if the value is known, then its only option is the value
        // itself
        else if ((options === null) && (this.id !== UNKNOWN)) {
            this.options = new Set([this.id]);
        }
    }
    
    
    set(id=null, options=null) {
        this.set_id(id);
        this.set_options(options);
    }
    
}



///////////////////////////////////////////////////////////////////////////////
// GRID LAYOUT ////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

function humanify(i) {
    var teen = ((i >= 10) && (i < 20));
    var last = i.toString()[i.toString().length-1];
    if ((!teen) && (last == 0)){ return (i+1) + 'st';}
    else if ((!teen) && (last == 1)) { return (i+1) + 'nd'; }
    else if ((!teen) && (last == 2)) { return (i+1) + 'rd'; }
    else { return (i+1) + 'th'; }
}


function ValidationError(message) {
    this.name = 'ValidationError';
    this.message = message;
    this.stack = (new Error()).stack;
}
ValidationError.prototype = new Error;


class Grid {
    constructor(sums, cells=null, rows=ROWS, cols=COLUMNS) {
        
        // update user options
        if (cells === null) { cells = []; }
        this.cells = {};
        this.height = rows;
        this.width = cols;
        
        // convert the supplied cells to something easier to
        // set cell values in the next step
        var c2 = {};
        for (var cell of cells) {
            var i = cell[0];
            var j = cell[1];
            var id = cell[2];
            if (!c2.hasOwnProperty(i)) { c2[i] = {}; }
            c2[i][j] = id;
        }
        
        // set up the cells we're guessing
        for (var i = 0; i < this.height; i++) {
            this.cells[i] = {};
            for (var j = 0; j < this.width; j++) {
                this.cells[i][j] = null;
                
                // if user supplied the id for this cell, set it. Otherwise
                // fill it with an UNKNOWN
                if (c2.hasOwnProperty(i) && c2[i].hasOwnProperty(j)) {
                    this.cells[i][j] = new Cell(i, j, c2[i][j]);
                }
                else {
                    this.cells[i][j] = new Cell(i, j, UNKNOWN);
                }
            }
        }
        
        // set up the known row and column sums
        this.mr = [];
        this.mc = [];
        this.vr = [];
        this.vc = [];
        for (var i = 0; i < this.height; i++) {
            this.mr.push(sums['multipliers']['rows'][i]);
            this.vr.push(sums['voltorbs']['rows'][i]);
        }
        for (var j = 0; j < this.width; j++) {
            this.mc.push(sums['multipliers']['columns'][j]);
            this.vc.push(sums['voltorbs']['columns'][j]);
        }
        this.validate();
    }
    
    
    get(i, j=null) {
        if (j === null) { return this.cells[parseInt(i/this.width)][i % this.width]; }
        return this.cells[i][j]; 
    }
    
    
    list_cells() {
        var output = [];
        for (var i = 0; i < this.height; i++) {
            for (var j = 0; j < this.width; j++) {
                output.push(this.get(i, j));
            }
        }
        return output;
    }
    
    
    // count the number of cells along a dimension that have a given value
    _cv(ind, v, dim=0) {
        var count = 0;
        if (dim == 0) {
            for (var j = 0; j < this.width; j++) {
                if (this.get(ind,j).is(v)) { count += 1; }
            }
        }
        else if (dim == 1) {
            for (var i = 0; i < this.height; i++) {
                if (this.get(i,ind).is(v)) { count += 1; }
            }
        }
        else { throw new Error('Unacceptable dimension.'); }
        return count;
    }
    
    
    // count the number of cells with the given option
    _co(ind, o, dim=0, unknownOnly=true) {
        var count = 0;
        if (dim == 0) {
            for (var j = 0; j < this.width; j++) {
                if (unknownOnly && !this.cells[ind][j].is(UNKNOWN)) { continue; }
                if (this.get(ind,j).options.has(o)) { count += 1; }
            }
        }
        else if (dim == 1) {
            for (var i = 0; i < this.height; i++) {
                if (unknownOnly && !this.cells[i][ind].is(UNKNOWN)) { continue; }
                if (this.get(i,ind).options.has(o)) { count += 1; }
            }
        }
        else { throw new Error('Unacceptable dimension.'); }
        return count;
    }
    
    
    // sum the values of cells along a given dimension
    _sv(ind, dim=0) {
        var sum = 0;
        if (dim == 0) {
            for (var j = 0; j < this.width; j++) {
                if (this.cells[ind][j].id instanceof Multiplier) {
                    sum += this.get(ind,j).get_id().value();
                }
            }
        }
        else if (dim == 1) {
            for (var i = 0; i < this.height; i++) {
                if (this.cells[i][ind].id instanceof Multiplier) {
                    sum += this.get(i,ind).get_id().value();
                }
            }
        }
        else { throw new Error('Unacceptable dimension.'); }
        return sum;
    }
    
    
    // sum the max option value along a dimension
    _smo(ind, dim=0, unknownOnly=true) {
        var sum = 0;
        if (dim == 0) {
            for (var j = 0; j < this.width; j++) {
                if (unknownOnly && !this.get(ind,j).is(UNKNOWN)) { continue; }
                var maxopt = this.get(ind,j).max_multiplier();
                if (maxopt) { sum += maxopt; }
            }
        }
        else if (dim == 1) {
            for (var i = 0; i < this.height; i++) {
                if (unknownOnly && !this.get(i,ind).is(UNKNOWN)) { continue; }
                var maxopt = this.get(i,ind).max_multiplier();
                if (maxopt) { sum += maxopt; }
            }
        }
        else { throw new Error('Unacceptable dimension.'); }
        return sum;
    }
    
    
    // check that the grid is valid based on row and column sums, known
    // and optional values
    validate() {
        
        // row checks
        for (var i = 0; i < this.height; i++) {
            
            // check that number of known voltorbs doesnt exceed the total
            var totalVoltorbs = this.vr[i];
            var knownVoltorbs = this._cv(i, VOLTORB, 0);
            if (knownVoltorbs > totalVoltorbs) {
                throw new ValidationError(`Known voltorbs (${knownVoltorbs}) exceeds total in ${humanify(i)} row.`);
            }
            
            // nor is the total possible less than the known total
            var optionalVoltorbs = this._co(i, VOLTORB, 0, true);
            var possibleVoltorbs = knownVoltorbs + optionalVoltorbs;
            if (possibleVoltorbs < totalVoltorbs) {
                throw new ValidationError(`Total possible voltorbs (${possibleVoltorbs}) is less than the total given in ${humanify(i)} row.`);
            }
            
            // that the sum of known multipliers doesnt exceed the total
            var totalMult = this.mr[i];
            var knownMult = this._sv(i, 0);
            if (knownMult > totalMult) {
                throw new ValidationError(`Known multipliers (${knownMult}) exceeds total in ${humanify(i)} row.`);
            }
            
            // nor is the total possible less than the known total
            var optionalMult = this._smo(i, 0, true);
            var possibleMult = knownMult + optionalMult;
            if (possibleMult < totalMult) {
                throw new ValidationError(`Total possible multipliers (${possibleMult}) is less than total given in ${humanify(i)} row.`);
            }
        }
        
        
        // column checks
        for (var j = 0; j < this.width; j++) {
            
            // check that number of known voltorbs doesnt exceed the total
            var totalVoltorbs = this.vc[j];
            var knownVoltorbs = this._cv(j, VOLTORB, 1);
            if (knownVoltorbs > totalVoltorbs) {
                throw new ValidationError(`Known voltorbs (${knownVoltorbs}) exceeds total in ${humanify(j)} column.`);
            }
            
            // nor is the total possible less than the known total
            var optionalVoltorbs = this._co(j, VOLTORB, 1, true);
            if ((knownVoltorbs + optionalVoltorbs) < totalVoltorbs) {
                throw new ValidationError(`Total possible voltorbs (${possibleVoltorbs}) is less than the total given in ${humanify(j)} column.`);
            }
            
            // that the sum of known multipliers doesnt exceed the total
            var totalMult = this.mc[j];
            var knownMult = this._sv(j, 1);
            if (knownMult > totalMult) {
                throw new ValidationError(`Known multipliers (${knownMult}) exceeds total in ${humanify(j)} column.`);
            }
            
            // nor is the total possible less than the known total
            var optionalMult = this._smo(j, 1, true);
            if ((knownMult + optionalMult) < totalMult) {
                throw new ValidationError(`Total possible multipliers (${possibleMult}) is less than total given in ${humanify(j)} column.`);
            }
        }
    }
    
    
    // try a value without crashing
    try_id(i, j, id) {
        
        // check inputs
        var cell = this.get(i,j);
        if (!cell.is(UNKNOWN)) {
            throw new ValidationError(`ID of cell at (${i+1},${j+1}) is already known.`);
        }
        else if (!cell.options.has(id)) {
            throw new ValidationError(`${id} is not an option for cell at (${i+1},${j+1}).`);
        }
        
        // set the value and validate
        var prev = cell.get_id();
        var prevOptions = new Set(cell.options);
        try { 
            cell.set_id(id); 
            this.validate();
        }
        catch (e) {
            if (e instanceof ValidationError) { cell.set(prev, prevOptions); }
            throw e;
        }
    }
}



///////////////////////////////////////////////////////////////////////////////
// OPTIMIZATION ///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

// pre-solve stuff that just applies known rules to reduce the size of the full
// optimization
function presolve(grid) {
    
    // any rows or columns with zero voltorbs can all be flipped
    var getter = {'1': ONE, '2': TWO, '3': THREE, '?': UNKNOWN, '*': VOLTORB};
    var promptZero = function(i, j) {
        msg = `Cell on ${humanify(i)} row, ${humanify(j)} column is not a Voltorb. Flip it and tell me the ID (1 or 2 or 3).`;
        postMessage({'type': 'prompt_cell_id', 'i': i, 'j': j, 'message': msg});
        close();
        // return getter[prompt_and_wait(msg)];
    }
    for (var i = 0; i < grid.height; i++) {
        if (grid.vr[i] === 0) {
            for (var j = 0; j < grid.width; j++) {
                if (grid.get(i,j).is(UNKNOWN)) {
                    var newID = promptZero(i, j);
                    grid.get(i,j).set_id(newID);
                    postMessage({'type': 'cell_fixed', 'i': i, 'j': j, 'id': newID.string()});
                }
            }
        }
    }
    for (var j = 0; j < grid.width; j++) {
        if (grid.vc[j] === 0) {
            for (var i = 0; i < grid.height; i++) {
                if (grid.get(i,j).is(UNKNOWN)) {
                    var newID = promptZero(i, j);
                    grid.get(i,j).set_id(newID);
                    postMessage({'type': 'cell_fixed', 'i': i, 'j': j, 'id': newID.string()});
                }
            }
        }
    }
    
    // if the sum of voltorbs and multipliers is the size of the row/column,
    // then it's either a 1 or voltorb so reduce the options
    for (var i = 0; i < grid.height; i++) {
        if ((grid.vr[i] + grid.mr[i]) == grid.width) {
            for (var j = 0; j < grid.width; j++) {
                grid.get(i,j).remove_option(TWO);
                grid.get(i,j).remove_option(THREE);
            }
        }
    }
    for (var j = 0; j < grid.width; j++) {
        if ((grid.vc[j] + grid.mc[j]) == grid.height) {
            for (var i = 0; i < grid.height; i++) {
                grid.get(i,j).remove_option(TWO);
                grid.get(i,j).remove_option(THREE);
            }
        }
    }
    
    // if there are only voltorbs in a row/column based on the sum, we
    // can set those
    for (var i = 0; i < grid.height; i++) {
        var totalMult = grid.mr[i];
        var knownMult = grid._sv(i, 0);
        var totalVoltorbs = grid.vr[i];
        if ((totalMult == knownMult) || (totalVoltorbs == grid.width)) {
            for (var j = 0; j < grid.width; j++) {
                var cell = grid.get(i,j);
                if (cell.is(UNKNOWN)) {
                    cell.set_id(VOLTORB); 
                    postMessage({'type': 'cell_fixed', 'i': i, 'j': j, 'id': VOLTORB.string()});
                }
            }
        }
    }
    for (var j = 0; j < grid.width; j++) {
        var totalMult = grid.mc[j];
        var knownMult = grid._sv(j, 1);
        var totalVoltorbs = grid.vc[j];
        if ((totalMult == knownMult) || (totalVoltorbs == grid.height)) {
            for (var i = 0; i < grid.height; i++) {
                var cell = grid.get(i,j);
                if (cell.is(UNKNOWN)) {
                    cell.set_id(VOLTORB); 
                    postMessage({'type': 'cell_fixed', 'i': i, 'j': j, 'id': VOLTORB.string()});
                }
            }
        }
    }
}


// determine a good order to work with cells
function decide_cell_order(grid) {
    
    // order by increasing number of options so that you can cut more of
    // the tree with inspecting fewer options
    var order = [];
    var nopt = [];
    var N = grid.height*grid.width;
    for (var i = 0; i < N; i++) { 
        order.push(i); 
        nopt.push(grid.get(i).options.size); 
    }
    order.sort(function(i1, i2) { return nopt[i1] - nopt[i2]; });
    return order;
    
}


// re-formats a solution to send to the main script for digestion
function format_solution(grid, solution) {
    var output = {};
    for (var i = 0; i < solution.length; i++) {
        var cell = grid.get(i);
        if (!output.hasOwnProperty(cell.i)) { output[cell.i] = {}; }
        output[cell.i][cell.j] = solution[i].string();
    }
    return output;
}


// solve by brute force depth first search
function solve(grid, doPresolve=true) {
    

    // do some setup
    if (doPresolve) { presolve(grid); }
    var N = grid.height*grid.width;
    var solutions = [];
    var order = decide_cell_order(grid);
    var ids = [];
    var nOpt = [];
    var optionIndices = [];
    options = [];
    for (var i of order) {
        var cell = grid.get(i);
        options.push(Array.from(cell.options));
        ids.push(cell.get_id());
        nOpt.push(cell.options.size);
        optionIndices.push(0);
    }
    var orderIndex = 0;
    var cur = null;
    var direction = 1;
    var ccc = 0;
    var last = N - 1;
    var first = true;
    
    // count the total possible solutions so we can update on progress of
    // those found
    var possibleSolutions = 1;
    var solutionsDeeper = [];
    var solutionsCovered = 0;
    for (var i = last; i >= 0; i--) {
        possibleSolutions *= options[i].length;
        var prev;
        if (i == last) { 
            solutionsDeeper[i] = 0;
            prev = 1; 
        }
        else {
            solutionsDeeper[i] = prev*options[i+1].length;
            prev = solutionsDeeper[i];
        }
    }
    
    // find all solutions
    while (true) {
        
        ////////////////////////////////////////////////////
        if ((true) && ((ccc % 1000) == 0)) {
            var toshow = [];
            for (var i = 0; i < N; i++) {
                if (i == orderIndex) { toshow.push(`[${optionIndices[i]}]`); }
                else { toshow.push(optionIndices[i]); }
            }
            msg = `${parseInt(100*solutionsCovered/possibleSolutions)}% covered (of ${parseInt(possibleSolutions/1000000000)} billion) solutions.`;
            msg += ` Found ${solutions.length} feasible solutions.`;
            postMessage({'type': 'progress', 'message': msg, 'covered': solutionsCovered, 'possible': possibleSolutions});
            // postMessage({'type': 'progress', 'message': toshow.join('') + ' ' + solutions.length + ' ' + ccc});
        }
        ccc += 1;
        /////////////////////////////////////////////////////
        
        var curIndex = order[orderIndex];
        cur = grid.get(curIndex);
        
        // if the value is known, skip it
        if (ids[orderIndex] !== UNKNOWN) {
            
            // exhausted all posibilities (potentially)
            if (orderIndex == 0) {
                if (first) { first = false; }
                else { break; }
            }
            
            // found a valid solution
            else if (orderIndex == last) {
                direction = -1;
                var solution = [];
                for (var i of order) { solution[i] = grid.get(i).get_id(); }
                solutions.push(solution);
                postMessage({'type': 'solution', 'data': format_solution(grid, solution)});
            }
            
            // go to the next cell
            orderIndex += direction;
            continue;
            
        }
        
        // if we've exhausted all options for this cell, reset and go up
        // a level
        var optionIndex = optionIndices[orderIndex];
        if (optionIndex == nOpt[orderIndex]) {
            solutionsCovered += 1;
            cur.set(ids[orderIndex], new Set(options[orderIndex]));
            optionIndices[orderIndex] = 0;
            if (orderIndex == 0) { break; } // seen all solutions
            direction = -1;
            orderIndex += direction;
            continue;
        }
        
        // set the option value and validate
        var optionValue = options[orderIndex][optionIndex];
        optionIndices[orderIndex] += 1;
        if (direction == -1) {
            cur.set(ids[orderIndex], new Set(options[orderIndex])); // need to "unset" before setting again
        }
        try { grid.try_id(cur.i, cur.j, optionValue); }
        catch (e) {
            if (e instanceof ValidationError) {
                solutionsCovered += solutionsDeeper[orderIndex];
                // postMessage({'type': 'message', 'message': e.message});
                continue;
            }
            else {
                postMessage({'type': 'error', 'message': e.message});
                throw e; 
            }
        }
        
        // if we've reached the last cell and this is a valid solution, add it
        // to the solutions
        if (orderIndex == last) {
            var solution = [];
            for (var i of order) { solution[i] = grid.get(i).get_id(); }
            solutions.push(solution);
            postMessage({'type': 'solution', 'data': format_solution(grid, solution)});
            cur.set(ids[last], new Set(options[orderIndex])); // reset it but dont reset the option index
            solutionsCovered += 1;
        }
        
        // otherwise, dive deeper
        else {
            direction = 1;
            orderIndex += direction;
        }

    }
    
    
    
    ///////////////////////////////////////////////////////////////////////////
    // post-processing. Get solution frequencies and summary stats
    postMessage({'type': 'progress', 'message': `Finished! Found ${solutions.length} feasible solutions.`});
    
    // counts of cell values in solutions
    var counts = {};
    for (var solution of solutions) {
        for (var c = 0; c < N; c++) {
            var cell = grid.get(c);
            var sid = solution[c];
            if (!counts.hasOwnProperty(cell.i)) { counts[cell.i] = {}; }
            if (!counts[cell.i].hasOwnProperty(cell.j)) { counts[cell.i][cell.j] = {}; }
            if (!counts[cell.i][cell.j].hasOwnProperty(sid)) { counts[cell.i][cell.j][sid] = 0; }
            counts[cell.i][cell.j][sid] += 1;
        }
    }
    
    // quick function to compile suggestions to the user
    function make_suggestion(i, j, prob, msg, volt) {
        var qual;
        if (prob == 100) { qual = 'GUARANTEED'; }
        else if (prob >= 85) { qual = 'VERY LIKELY'; }
        else if (prob >= 75) { qual = 'LIKELY'; }
        else if (prob >= 50) { qual = 'FAIRLY LIKELY'; }
        else { qual = 'UNLIKELY'; }
        msg = `(${humanify(i)} row, ${humanify(j)} column) ${msg} is ${qual} (${parseInt(prob)}%) and ${parseInt(volt)}% chance of Voltorb`;
        return msg;
    }
    
    // frequency(probaility) of cell values
    var nsol = solutions.length;
    var probs = {};
    var certainFlag = false;
    if (solutions.length > 0) {
        var suggestions = [];
        var suggestionProb = [];
        for (var i = 0; i < grid.height; i++) {
            probs[i] = {};
            for (var j = 0; j < grid.width; j++) {
                
                // calculate the probability
                var cell = grid.get(i, j);
                var cellCounts = counts[cell.i][cell.j];
                probs[i][j] = {};
                for (var id of IDS) {
                    var prob = 0.0;
                    if (cellCounts.hasOwnProperty(id)) {
                        prob = 100.0*cellCounts[id] / nsol;
                    }
                    probs[i][j][id] = prob;
                }
                
                // make suggestions to the user
                if (cell.is(UNKNOWN)) {
                    var p1 = probs[i][j][ONE];
                    var p2 = probs[i][j][TWO];
                    var p3 = probs[i][j][THREE];
                    var pV = probs[i][j][VOLTORB];
                    var p23 = p2 + p3;
                    var p123 = p23 + p1;
                    
                    // set cells we are certain of
                    for (var id of [ONE, TWO, THREE, VOLTORB]) {
                        try {
                            if (100 <= (probs[i][j][id] + 0.00001)) {
                                certainFlag = true;
                                cell.set_id(id);
                                postMessage({'type': 'cell_fixed', 'i': cell.i, 'j': cell.j, 'id': id.string()});
                            }
                        }
                        catch (e) {
                            console.log(e);
                        }
                    }
                    
                    // build suggestions
                    if (p123 == 100) { suggestions.push(make_suggestion(i, j, p123, '1/2/3', pV)); suggestionProb.push(p123); }
                    else if (p23 >= 85) { suggestions.push(make_suggestion(i, j, p23, '2/3', pV)); suggestionProb.push(p23); }
                    else if (p123 >= 85) { suggestions.push(make_suggestion(i, j, p123, '1/2/3', pV)); suggestionProb.push(p123); }
                    else if (p23 >= 75) { suggestions.push(make_suggestion(i, j, p23, '2/3', pV)); suggestionProb.push(p23); }
                    else if (p123 >= 75) { suggestions.push(make_suggestion(i, j, p123, '1/2/3', pV)); suggestionProb.push(p123); }
                    else if (p23 >= 50) { suggestions.push(make_suggestion(i, j, p23, '2/3', pV)); suggestionProb.push(p23); }
                    else if (p123 >= 50) { suggestions.push(make_suggestion(i, j, p123, '1/2/3', pV)); suggestionProb.push(p123); }
                }
            }
        }
        
        
        // display the suggestions if any. If none came up there, show all the
        // cell probabilities
        if (suggestions.length > 0) {
            var suggestionOrder = []; for (var i = 0; i < suggestions.length; i++) { suggestionOrder.push(i); }
            suggestionOrder.sort(function(i1, i2) { return suggestionProb[i2] - suggestionProb[i1]; });
            for (var i of suggestionOrder) {
                var suggestion = suggestions[i];
                postMessage({'type': 'message', 'message': suggestion});
            }
        }
        else {
            postMessage({'type': 'message', 'message': 'Not sure of anything. Printing all post-optimization probabilities, ranked by increasing probability of Voltorb.'});
            var printOrder = grid.list_cells().sort(function(k1, k2) { return probs[k1.i][k1.j][VOLTORB] - probs[k2.i][k2.j][VOLTORB] });
            for (var cell of printOrder) {
                if (cell.is(UNKNOWN)) {
                    msg = [humanify(cell.i), 'row,', humanify(cell.j), 'column'].join(' ');
                    for (var id of IDS) {
                        if (id !== UNKNOWN) {
                            msg = ['  ', parseInt(probs[cell.i][cell.j][id]), 'chance to be', id].join(' ');
                            postMessage({'type': 'message', 'message': msg});
                        }
                    }
                }
            }
        }
    }
    
    // indicate if there were any 100% certain cells so we can run again
    // without killing the worker
    return certainFlag;
    
}


// wait for instruction from main
var running = false;
onmessage = function(event) {
    var msg = event.data;
    if (msg.type == 'start') {
        if (!running) {
            var sums = msg.data['sums'];
            var cells = msg.data['cells'];
            try {
                
                // convert strings to consts since we cant pass cell values through messages
                for (var i = 0; i < cells.length; i++) { cells[i][2] = T2ID[cells[i][2]]; }
                var grid = new Grid(sums, cells);
                var flag = solve(grid);
                while (flag) {
                    postMessage({'type': 'resolve'});
                    flag = solve(grid); 
                }
                postMessage({'type': 'finished'});
                close();
            }
            catch (e) {
                postMessage({'type': 'error', 'message': e.message});
                throw e;
            }
        }
    }
    else if (msg.type == 'prompt_response') { promptResponse = msg.value; console.log(msg.value);}
}
})();