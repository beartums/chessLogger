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
/**
 * Configuration obect used by ChessWrapper to integrate Chessboard.js and Chess.js with angular and ChessLoggerCtrl
 * @class
 * @property {string} [pieceTheme='assets/pieces/{piece\}.png'] Location of the piece images.
 * @property {string} [position='start'] Starting position of the game
 * @property {string} [boardDiv='board1'] Name of the HTML index that will host the board
 * @property {boolean} [draggable=true] Whether the pieces will be draggable
 * @property {string} [dropOffBoard='snapback'] Strategy for handling pieces that are dropped off the board
 * @property {boolean} [allowMultipleLines=true] Allow user to start a branching line from a previously-made move
 * @property {function} onDrop Function called after chessboardjs and chessjs handle a dropped piece.  Needed to allow angular to $digest the changes
 * @property {function} digest Angular $digest function injected into chesswrapper.  Have not been able to make this work (multiple updates) so instead use the passed onDrop function and $digest it in {@link ChessLoggerCtrl#onDrop|ChessLoggerCtrl.onDrop}
 * @property {function) promotionsSelector Function which displays the interface to select a promotions piece.  Returns a piece initial (qrbn)
 */
function BoardCfg() {
	this.pieceTheme= 'assets/pieces/{piece}.png';
	this.position= 'start';
	this.boardDiv= 'board1';
	this.draggable= true;
	this.dropOffBoard= 'snapback';
	this.allowMultipleLines= true;
	this.onDrop= function() {};
	this.digest= function() {};
	this.promotionSelector= function(){};
}