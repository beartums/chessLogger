/**
* ChessLoggerObjLib
*
**/

function Line() {
	this.fen=''; //FEN at beginning of line
	this.priorTempos= 0; //tempos in previous line up to this one
	this.parentTempo= null; //tempo from which this line deviates
	this.pgn= ''; //PGN at the end of the line
	this.tempos= []; //moves in this line
};


function Tempo() {
	this.fen= ''; //Fen after this tempo
	this.san= ''; // Algebraic notation of this move
	this.color= ''; //w/b color making this move
	this.tempoNum= 0; //tempo nomber in this line
	this.parentLine= null; //parent line object
	this.lines= []; //alternate lines branching from this tempo
}

function GameInfo() {
	this.event = "Casual Game";
	this.date = new Date();
	this.location = "";
	this.white = "";
	this.black = "";
	this.result = "*";
}