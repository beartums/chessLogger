/**
 * Object to coordinate Chess.js and chessboard.js and game status and persistence
 */
/**
 * Utility function to bind a function to a particular scope
 * @param {object} scope the scope to apply
 * @param {function} fn The function to be bound
 * @returns {Function} The axecutable function with the specifeid scope
 */
	function bind(scope, fn) {
		return function () {
				return fn.apply(scope, arguments);
		};
	}
	/**
	 * Object to coordinate Chess.js and chessboard.js and manage game persistence
	 * @constructor
	 * @param {object} boardCfg Configuration variables
	 * @param {object} gameObj Current active game being managed
	 */
	function ChessWrapper(boardCfg, gameObj) {

		this.boardCfg = boardCfg;

		this.selectedTempo = this.TEMPO0; // set start postion
		
		// Need to be able to determine when the piece draggin begins, and need to set the context
		var onDragStart = bind(this, this.onDragStart);
		boardCfg.onDragStart = onDragStart;
		
		// Allow the calling program to spec ify the function to handle promotion selection and 
		// 	digesting activity out of scope
		this.digest = boardCfg.digest;
		this.promotionSelector = boardCfg.promotionSelector; // calling proc returns a promise which waits for the selected piece
		
		this.board = new ChessBoard(boardCfg.boardDiv,boardCfg);
		this.game = this.initGame(gameObj)
		this.board.position(this.game.fen());
		
	}
	
	/**
	 * Initialize a game position
	 * @param {object} gameObj set position and history for this game object
	 * @returns {object} this game as understod by chess.js
	 */
	ChessWrapper.prototype.initGame = function(gameObj) {
		this.gameInfo = gameObj ? gameObj.gameInfo : new GameInfo();
		this.gameId = gameObj ? gameObj.id : "";
		this.line = new Line();
		this.rootLine = this.line;
		this.line.tempos = gameObj && gameObj.line ? this.temposFromJSON(gameObj.line.tempos).tempos : [];
		
		var game = new Chess(this.line.fen && this.line.fen != "" ? this.line.fen : this.START_FEN);
		
		return game;
		
	}	
	/**
	 * Is this tempo in the active line?
	 * A tempo is in the active line if it is in the current line or before the branch in a previous line
	 * @param {Tempo} tempo The tempo to test
	 * @returns {boolean}
	 */
	ChessWrapper.prototype.isActive = function(tempo) {
		var l = this.line;
		var branchIndex = 9999;
		while (l) {
			var tIndex = l.tempos.indexOf(tempo)
			if (tIndex>-1 && tIndex<=branchIndex) {
				return true;
			} else if (tIndex>branchIndex) {
				return false;
			}
			if (l.parentTempo) {
				branchIndex = l.parentTempo.parentLine.tempos.indexOf(l.parentTempo);
				l = l.parentTempo.parentLine;
			} else {
				l = null;
			}
		}
		return false;
	}

	/**
	 * @constant
	 */
	ChessWrapper.prototype.TEMPO0 = {tempoNum:0};
	/**
	 * @constant
	 */
	ChessWrapper.prototype.START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	
	/**
	 * Actions when the user releases a piece, indicating the end of a move
	 * 
	 * @param {string} source Algebraic notation for the square from which the move started
	 * @param {string} target Algebraic notation of the target square
	 * @param {string} piece 2-byte representation of the piece dropped
	 * @param {object} newPos Position resulting from the piece drop
	 * @param {object) oldPos Position resulting form the move
	 * @param {string} orientation How the board is currently oriented
	 * 
	 * @todo Move newLine instantiation here so we can test if the line already exists
	 */
	ChessWrapper.prototype.onDrop = function(source, target, piece, newPos, oldPos, orientation) {

		var moveObj = {from:source, to:target}
		var game = new Chess(this.selectedTempo.fen)
		
		if (!this.isValidMove(source,target,game)) return "snapback";
		
		// must do this pass before setting a new line so that we can get the SAN
		//console.log(this.game.fen(),game.fen());
		if (this.isPromotion(target,piece)) { // if promoting a pawn, select the piece
			//
			this.promotionSelector().then(bind(this,function(selectedPiece) {
				moveObj.promotion = selectedPiece;
				this.processDrop(game, moveObj);
			}));
		} else {
			this.processDrop(game, moveObj);
		}
	}
		
	/**
	 * In order to do the same things after a promotion modal (returning a promise) and after an 
	 * ordinary move, we have to break the post-modal processing into a separate routine that can be
	 * bound to this instance of ChessWrapper
	 * @param {object} game The game in which the move is made
	 * @param {object} moveObj The move information to be used to make the move
	 */
		
	ChessWrapper.prototype.processDrop = function(game, moveObj) {
		// don't start a new line if the move has already been made
		//var x = this.game.fen()
		if (!this.atEndOfMoveList()) { 					
			var tempos = []
			// collect the already-made next-moves
			if (this.line.tempos.length>this.line.tempos.indexOf(this.selectedTempo)+1) {
				tempos.push(this.line.tempos[this.line.tempos.indexOf(this.selectedTempo)+1]);
			}
			if (this.selectedTempo.lines && this.seltectedTempo.lines.length>0) {	// already other lines?
				for (var i = 0; i < this.selectedTempo.lines.length; i++) {
					tempos.push(this.selectedTempo.lines[i].tempos[0]);
				}
			}
			// test all the next-moves to see if they are the same.  if so set the position and exit
			var g = new Chess(game.fen());
			var move = g.move(moveObj);
			for (var i = 0; i < tempos.length; i++) {
				if (tempos[i].san==move.san) {
					this.setPosition(tempos[i]);
					return;
				}
			}
			// otherwise, this is a new line
			this.setNewLine();
		}
		// now make the actual move
		//var x = this.game.fen()
		move = game.move(moveObj);
		if (!move) return 'snapback';
		this.game=game;
		this.addMove(move);

	}

	/**
	 * Convert this object into a JSON format that the backend can save
	 * 
	 * @returns {object} mongo-saveable json representation 
	 */
	ChessWrapper.prototype.getSaveableGame = function() {
			var line = {
					fen: this.rootLine.fen,
					priorTempos: this.rootLine.priorTempos,
					tempos: []
				};
			
			line.tempos = this.temposToJSON(this.rootLine.tempos);
			var game = this.gameFromLine(this.rootLine)
			
			var gameObj = {gameInfo: this.gameInfo,
							pgn: game.pgn(),
							line: line
							};	
		return gameObj;					
	}
	
	/**
	 * Convert a Line object to a chess.js-readable game
	 * 
	 * @param {Line} line Line object
	 * @returns {object} chess.js game object
	 */
	ChessWrapper.prototype.gameFromLine = function(line) {
		var game = new Chess(line.fen);
		for (var i = 0; i < line.tempos; i++) {
			game.move(line.tempos[i].san);
		}
		return game;
	}
		
	/**
	 * Identify if this is a move requiring player to select a piece to promote to
	 * 
	 * @param {string} targetSquare Square that the piece is moving into
	 * @param {string} piece String representation of the piece moving into the target square
	 * @return {boolean} true if this is a promotion-causing move
	 */
	ChessWrapper.prototype.isPromotion = function(targetSquare, piece) {
		return (piece=='bP' && targetSquare.indexOf('1')>-1) ||
				(piece=='wP' && targetSquare.indexOf('8')>-1) 
	}

	/**
	 * Function to monitor the beginning of a move and not allow it if it is not valid
	 * @param {string} Sqare the piece is moving from
	 * @param {string} piece being moved
	 * @param {object} Current game position (unused)
	 * @param {string} Current board orientation (unused)
	 * @returns {boolean} false if the move should not be allowed
	 */
	ChessWrapper.prototype.onDragStart = function(source, piece, position, orientation) {
			var game = this.game;
			//implementing multiple lines: if not at end of game, you can start a new line by 
			// moving the appropriate color from a specific tempo if the settings allow it
			var atEnd = this.atEndOfMoveList();
			if (!atEnd && this.boardCfg.allowMultipleLines) {
				var gameLine = new Chess(this.selectedTempo.fen); // create a new game line
				//Disallow movements of the wrong color
				if ((gameLine.turn() == 'w' && piece.search(/^b/) !== -1) ||
					(gameLine.turn() == 'b' && piece.search(/^w/) !== -1)) {
					return false;
				}
				//this.setNewLine();	// Instantiate the new line			
				return true;
			}
			
			// Otherwise, if the last move is currently selected, just check to see if the move is valid
			var side = game.turn();
			
			if (game.game_over() === true || 
					(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
					(game.turn() === 'b' && piece.search(/^w/) !== -1)||
					(!atEnd)
				) { 
				return false;
			}
		//})();
	}
	
	/**
	 * Create a new Line object, starting from the current selected position, and change the active line to the new line
	 * 
	 */
	ChessWrapper.prototype.setNewLine = function() {
		// set the current state to a new line.  Current line will be the parent
		var line = new Line();
		line.fen = this.selectedTempo.fen; // Set the base fen to the current tempo's fen
		// set the number of tempos up to this point
		line.priorTempos = this.line.tempos.indexOf(this.selectedTempo)+1+this.line.priorTempos;
		line.parentTempo = this.selectedTempo; // set the current tempo as the parent tempo
		this.line = line;
		this.selectedTempo = this.TEMPO0; // TEMPO0 is always the first tempo in every line
		this.game = new Chess(line.fen); // switch the game over to the new line
		
		if (!this.line.parentTempo.lines) this.line.parentTempo.lines=[];
		this.line.parentTempo.lines.push(line);
	}
	
	/**
	 * Tempo number is based on current line.  This method gets the tempo count in the game if there are previous lines
	 * 
	 * @param {number} num postion of the selected tempo within the current line
	 * @returns {number}
	 */

	ChessWrapper.prototype.getTempoByNumber = function(num) {
		if (num < 1) return this.TEMPO0;
		if (num > this.game.history().length) return this.selectedTempo;
		return this.line.tempos[num-1];
	}

	/**
	 * Is the selected move at the end of the move list, or are there more moves
	 * @returns {boolean}
	 */
	ChessWrapper.prototype.atEndOfMoveList = function() {
		if (this.line.tempos.length==0) return true;
		
		if (this.line.tempos[this.line.tempos.length-1]==this.selectedTempo) return true;
		return false;
	}
			
	/**
	 * Testing for a valid move after drop
	 * @param {string} start square for the move
	 * @param {string} target Final square for the move
	 * @param {object} (optional) game object to assess validity
	 * @returns {boolean}
	 */
	ChessWrapper.prototype.isValidMove = function(source,target,game) {
		game = game || this.game;
		var vMoves = game.moves({verbose:true});
		for (var i = 0; i < vMoves.length; i++) if (source==vMoves[i].from && target==vMoves[i].to) return true;
		
		return false;
	}

	/**
	 * Add a Tempo to the current Line
	 * @param {object} a Move object
	 */
	ChessWrapper.prototype.addMove = function(move) {
		var tempo = new Tempo();
		tempo.san = move.san;
		tempo.fen = this.game.fen();
		tempo.color = move.color;
		tempo.tempoNumber = this.line.priorTempos + this.line.tempos.length+1;
		tempo.parentLine = this.line;
		
		this.selectedTempo = tempo;
		this.line.tempos.push(tempo);
		if (move.flags.search(/[epkq]/i) > -1)	this.board.position(tempo.fen, false); // update for weird moves
	}

	/**
	 * JSONify the current game (obsolete)
	 */
	/*ChessWrapper.prototype.toJSON = function() {
		var game = {};
		game.gameInfo = this.gameInfo;
		game.pgn = this.game.pgn();
		game.tempos = [];
		game.tempos = this.temposToJSON(this.rootline.tempos)
	}*/
	
	/**
	 * Create a JSONifiable array of tempos (with recursion)
	 * @param {Tempo[]} tempos to JSONify
	 * @returns {array}
	 */
	ChessWrapper.prototype.temposToJSON = function(tempos) {
		var tmps = [];
		for (var i = 0; i < tempos.length; i++) {
			var tempo = tempos[i];
			var tmp = {
				fen: tempo.fen,
				san: tempo.san,
				tempoNum: tempo.tempoNum,
				color: tempo.color
			};
			
			if (tempo.lines && tempo.lines.length>0) {
				tmp.lines = [];
				for (var j = 0; j < tempo.lines.length; j++) {
					tmp.lines.push(this.temposToJSON(tempo.lines[j].tempos));
				}
			}
			tmps.push(tmp);
		}
		return tmps;
	}
	
	/**
	 * Rehydrate a Line object from  array of tempos (with recursion)
	 * @param {array} tempos The JSON-ready array of tempos from JSON
	 * @param {Tempo} parentTempo The parent tempo of this line
	 * @returns {Line}
	 */
	ChessWrapper.prototype.temposFromJSON = function(tempos,parentTempo) {
		var line = new Line();
		var index = parentTempo ? parentTempo.parentLine.tempos.indexOf(parentTempo) + 1 : 0;
		line.priorTempos = parentTempo ? parentTempo.parentLine.priorTempos + index  : 0;
		line.fen = parentTempo ? parentTempo.fen : "";
		line.parentTempo = parentTempo;
		line.tempos = [];
		
		for (var i = 0; i < tempos.length; i++) {
			var tmpo = tempos[i];
			var tempo = new Tempo();
			var tempo = {
				fen: tmpo.fen,
				san: tmpo.san,
				tempoNum: tmpo.tempoNum,
				color: tmpo.color,
				parentLine: line
			};
			
			line.tempos.push(tempo);
						
			if (tmpo.lines && tmpo.lines.length>0) {
				tempo.lines = [];
				for (var j = 0; j < tmpo.lines.length; j++) {
					tempo.lines.push(this.temposFromJSON(tmpo.lines[j],tempo));
				}
			}

		}
		return line;
	}
	
	/**
	 * Set the board position for the selected tempo
	 * @param {Tempo} Tempo to set to position at
	 */
	ChessWrapper.prototype.setPosition = function(tempo) {
		if (tempo==this.TEMPO0) {
			this.board.start();
			this.line = this.rootLine;
		} else {
			this.board.position(tempo.fen);
			this.selectedTempo = tempo;
			if (this.line.tempos.indexOf(this.selectedTempo)<0) {
				this.line = tempo.parentLine;
				this.game = new Chess(this.selectedTempo.fen);
			}
		}
	}

	/**
	 * Set the board at the start position
	 */
	ChessWrapper.prototype.goToStart = function() {
		this.board.start();
		this.selectedTempo = this.TEMPO0;
	}

	/**
	 * Set the board position and selected tempo to the last tempo in the active line
	 */
	ChessWrapper.prototype.goToEnd = function() {
	
		if (this.line.tempos.length==0) return
		this.setPosition(this.line.tempos[this.line.tempos.length-1]);
	}

	/**
	 * Move to the next tempo in this line (if any)
	 */
	ChessWrapper.prototype.goForwardOne = function() {
		var idx = this.line.tempos.indexOf(this.selectedTempo);
		
		// TODO: what line to follow if there are multiple future lines
		if (idx >= this.line.tempos.length-1) return;
		
		// if tempo not found, then is tempo0 and at start, therefore value of -1 for idx is fine	
		this.selectedTempo = this.line.tempos[idx+1];
		
		this.setPosition(this.selectedTempo);
	}

	/** 
	 * Move to previous tempo in this line or (if none) to this line's parent tempo (if any)
	 */
	ChessWrapper.prototype.goBackOne = function() {
		var idx = this.line.tempos.indexOf(this.selectedTempo);
		
		if (idx<0) return;
		
		if (idx==0) {
			if (this.line.priorTempos==0) {
				this.selectedTempo = this.TEMPO0;
			} else {
				this.selectedTempo = this.selectedTempo.parentLine.parentTempo
			}
		} else {
			this.selectedTempo = this.line.tempos[idx-1];
		}
		
		this.setPosition(this.selectedTempo);
	}

	/** 
	 * Take back the last move
	 */
	ChessWrapper.prototype.undo = function() {
		if (this.game.undo()) { // if undo succeeded
			this.removeLastTempo()
		}
	}

	/**
	 * Erase the last tempo in this line
	 */
	ChessWrapper.prototype.removeLastTempo = function() {
		var lastTempo = this.line.tempos.pop();
		var line = this.line;
		var newSelectedTempo = this.TEMPO0;
		
		if (this.line.tempos.length==0) {
			line = this.lineStack.pop();
			if (!line) return;
		}
		
		this.line = line;
		// if the currently selected tempo is being undone
		if (lastTempo==this.selectedTempo) {
			newSelectedTempo = line.tempos.length ? line.tempos[line.tempos.length-1] : this.TEMPO0;
		}
		
		if (newSelectedTempo) {
			this.setPosition(newSelectedTempo);
		}
	}
		// TODO: show board in popup when mousing over a position.
	ChessWrapper.prototype.peekPosition = function(tempo) {
	}

	/**
	 * Get the full game PGN object 
	 * @returns {object} 
	 */
	ChessWrapper.prototype.pgn = function() {
		return this.game.pgn();
	} 

	/**
	 * Set the game up based on a fen string
	 * @param {string} fen String depicting the position on the board
	 */
	ChessWrapper.prototype.load_pgn = function(fen) {
		this.game.load_pgn(fen);
	}

	/** 
	 * Function to physically flip the board
	 */
	ChessWrapper.prototype.flipBoard = function() {
		this.board.flip();
	}
	
//	return ChessWrapper;
//});