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
	 * @returns
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
	 * @constant
	 */
	ChessWrapper.prototype.TEMPO0 = {tempoNum:0};
	/**
	 * @constant
	 */
	ChessWrapper.prototype.START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
	
	/**
	 * Actions when the user releases a piece
	 * 
	 * @param {string} source Algebraic notation for the square from which the move started
	 * @param {string} target Algebraic notation of the target square
	 * @param {string} piece 2-byte representation of the piece dropped
	 * @param {object} newPos Position resulting from the piece drop
	 * @param {object) oldPos Position resulting form the move
	 * @param {string} orientation How the board is currently oriented
	 */
	ChessWrapper.prototype.onDrop = function(source, target, piece, newPos, oldPos, orientation) {

			var promo = '';
			var move = {from:source, to:target}
			
			if (!this.isValidMove(source,target)) return "snapback";
			
			var validMove = {};
			
			if (this.isPromotion(target,piece)) {
				var thisObj = this;
				this.promotionSelector().then(function(selectedPiece) {
					validMove = thisObj.game.move({from:source, to:target, promotion: selectedPiece});
					thisObj.addMove(validMove);
				});
			} else {
				validMove = this.game.move({from:source, to:target});
				this.addMove(validMove);
			}
		//	}
		//)();
	}

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
	
	ChessWrapper.prototype.gameFromLine = function(line) {
		var game = new Chess(line.fen);
		for (var i = 0; i < line.tempos; i++) {
			game.move(line.tempos[i].san);
		}
		return game;
	}
		
	
	ChessWrapper.prototype.isPromotion = function(targetSquare, piece) {
		return (piece=='bP' && targetSquare.indexOf('1')>-1) ||
				(piece=='wP' && targetSquare.indexOf('8')>-1) 
	}
	// do not pick up pieces if the game is over
	// only pick up pieces for the side to move
	ChessWrapper.prototype.onDragStart = function(source, piece, position, orientation) {
			var game = this.game;
			//implementing multiple lines: if not at end of game, you can start a new line by 
			// moving the appropriate color from a specific tempo if the settings allow it
			var atEnd = this.atEndOfMoveList();
			if (!atEnd && this.boardCfg.allowMultipleLines) {
				var gameLine = new Chess(this.selectedTempo.fen);
				if ((gameLine.turn() == 'w' && piece.search(/^b/) !== -1) ||
						(gameLine.turn() == 'b' && piece.search(/^w/) !== -1)) {
					return false;
				}
				this.setNewLine();				
				return true;
			}
			
			var side = game.turn();
			
			if (game.game_over() === true || 
					(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
					(game.turn() === 'b' && piece.search(/^w/) !== -1)||
					(!atEnd) //for now, until I implement multiple lines
					) { 
				return false;
			}
		//})();
	}
	
	ChessWrapper.prototype.setNewLine = function() {
		// set the current state to a new line.  Current line will be the parent
		var line = new Line();
		line.fen = this.selectedTempo.fen;
		line.priorTempos = this.line.tempos.indexOf(this.selectedTempo)+1+this.line.priorTempos;
		line.parentTempo = this.selectedTempo;
		//this.lineStack.push(this.line);
		this.line = line;
		this.selectedTempo = this.TEMPO0;
		this.game = new Chess(line.fen);
		
		if (!this.line.parentTempo.lines) this.line.parentTempo.lines=[];
		this.line.parentTempo.lines.push(line);
	}

	ChessWrapper.prototype.getTempoByNumber = function(num) {
		if (num < 1) return this.TEMPO0;
		if (num > this.game.history().length) return this.selectedTempo;
		return this.line.tempos[num-1];
	}

	ChessWrapper.prototype.atEndOfMoveList = function() {
		if (this.line.tempos.length==0) return true;
		
		if (this.line.tempos[this.line.tempos.length-1]==this.selectedTempo) return true;
		return false;
	}
			
	ChessWrapper.prototype.isValidMove = function(source,target,game) {
		game = game || this.game;
		var vMoves = game.moves({verbose:true});
		for (var i = 0; i < vMoves.length; i++) if (source==vMoves[i].from && target==vMoves[i].to) return true;
		
		return false;
	}

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
		//this.digest();
	}

	ChessWrapper.prototype.toJSON = function() {
		var game = {};
		game.gameInfo = this.gameInfo;
		game.pgn = this.game.pgn();
		game.tempos = [];
		game.tempos = this.temposToJSON(this.rootline.tempos)
	}
	
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

	// multiple lines
	ChessWrapper.prototype.goToStart = function() {
		this.board.start();
		this.selectedTempo = this.TEMPO0;
	}

	ChessWrapper.prototype.goToEnd = function() {
	
		if (this.line.tempos.length==0) return
		this.setPosition(this.line.tempos[this.line.tempos.length-1]);
	}

	ChessWrapper.prototype.goForwardOne = function() {
		var idx = this.line.tempos.indexOf(this.selectedTempo);
		
		// TODO: what line to follow if there are multiple future lines
		if (idx >= this.line.tempos.length-1) return;
		
		// if tempo not found, then is tempo0 and at start, therefore value of -1 for idx is fine	
		this.selectedTempo = this.line.tempos[idx+1];
		
		this.setPosition(this.selectedTempo);
	}

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

	ChessWrapper.prototype.undo = function() {
		if (this.game.undo()) { // if undo succeeded
			this.removeLastTempo()
		}
	}

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

	ChessWrapper.prototype.pgn = function() {
		return this.game.pgn();
	}

	ChessWrapper.prototype.load_pgn = function(fen) {
		this.game.load_pgn(fen);
	}

	ChessWrapper.prototype.flipBoard = function() {
		this.board.flip();
	}
	
//	return ChessWrapper;
//});