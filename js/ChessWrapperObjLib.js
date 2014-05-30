/**
 * Objects used by the {@link ChessWrapper} Library
*
**/

/**
 * A group of moves (tempos).  Not necessarily starting at the beginning of the game
 * @class
 * @property {string} fen FEN at beginning of line
 * @property {number} priorTempos tempo count in previous line up to this one
 * @property {object} parentTempo {@link Tempo} from which this line deviates
 * @property {string} pgn PGN representation of this game at the end of the Line
 * @property {array} tempos The actual moves in this Line
 */
function Line() {
	this.fen=''; 
	this.priorTempos= 0; 
	this.parentTempo= null; 
	this.pgn= ''; //PGN at the end of the line
	this.tempos= []; //moves in this line
};

/**
 * A move.  One move of one player. contains the Algebraic notation of the move as well as the FEN after the move
 * @class
 * @property {string} fen Position afeter this move
 * @property {string} san This move in Standard Algebraic Notation
 * @property {string} color w/b color making this move
 * @property {string} tempoNum Number of this tempo within this {@link Line}
 * @property {object} parentLine The {@link Line} from which this line branches
 * @property {array} lines alternate lines branching from this tempo
 */
function Tempo() {
	this.fen= ''; 
	this.san= ''; 
	this.color= ''; 
	this.tempoNum= 0; //
	this.parentLine= null; //parent line object
	this.lines= []; //
}

/**
 * Header information for a game -- attached to the whole game and not any specific {@link Line} or {@link Tempo}. This is intended to grow dynamically -- properties are not just the predefined ones
 * @class
 * @property {string} event Event Description
 * @property {date} date Date the game started
 * @property {string} location Place the game happened
 * @property {string} white White Player Name
 * @property {string} black Black player name
 * @property {string} result Standard result notation
 */
function GameInfo() {
	this.event = "Casual Game";
	this.date = new Date();
	this.location = "";
	this.white = "";
	this.black = "";
	this.result = "*";
}