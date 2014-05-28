
// TODO: Multiple lines of play
/**
 * Log and analyze chess games
 *
 * @author Eric Griffith
 * @version 0.0.1
 */
angular.module('ChessLoggerApp', ['ui.bootstrap','mongoRestApp']);

angular.module('ChessLoggerApp')
	// Initialize the mongo api for the chesslogger app
	.run(function(mongoRestFactory) { 
		mongoRestFactory.init("http://home.griffithnet.com:3000","chesslogger","games");
	});
	
angular.module('ChessLoggerApp').
	controller('ChessLoggerCtrl', function($scope, $modal, $log, mongoRestFactory) {
	
	/**
	 * Handles a click on the settings button
	 */
		$scope.clickCog = function() {
			var promise = $scope.updateSettings();
			promise.then(function(settings) {
				$scope.settings = settings;
				localStorage.setItem('settings',angular.toJson($scope.settings));
			});
		}
	
	/**
	 * Calls dialog to update settings
	 *
	 * @return (promise) Function returning the settings object after changes have been made
	 */
		$scope.updateSettings = function() {
			var settingsModalInstance = $modal.open({
				templateUrl: 'settings.html',
				controller: $scope.settingsModalCtrl,
				windowClass: 'settings-dialog',
				resolve: {
					settings: function() {
						return $scope.settings || {};
					}
				}
			});
			return settingsModalInstance.result;
		}
		
	/**
	 * Controller for the Settings Modal Dialog
	 *
	 * @param (obj) Scope local to this dialog
	 * @param (obj) Instance of the dialog (created in updateSettings)
	 * @param (obj) Settings object, from the resolve object in the dialog instance
	 * @returns (obj/string) Settings object if success else 'cancel'
	 */
		$scope.settingsModalCtrl = function($scope, $modalInstance, settings) {
			$scope.settings = settings;
			$scope.ok = function() {
				$modalInstance.close($scope.settings);
			}
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			}
		}
	
		$scope.showDialog = function(config) {
			var dialogInstance = $modal.open({
				templateUrl: 'dialog.html',
				controller: $scope.dialogCtrl,
				windowClass: 'dialog',
				resolve: {
					config: function() {
						return config;
					}
				}
			});
			return dialogInstance.result;
		}
		
		$scope.dialogCtrl = function($scope, $modalInstance, config) {
			$scope.config = config;
			$scope.buttonClicked = function(name) {
				$modalInstance.close(name)
			}
		}
					
		$scope.showGameInfoModal = function() {
			var gameInfoModalInstance = $modal.open({
				templateUrl: 'gameInfoModal.html',
				controller: $scope.gameInfoModalCtrl,
				windowClass: 'game-info-modal',
				resolve: {
					gameInfo: function() {
						return $scope.gameInfo || {};
					}
				}
			});
			
			return gameInfoModalInstance.result;
		}
		
		$scope.gameInfoModalCtrl = function($scope, $modalInstance, gameInfo) {
		
			$scope.gameInfo = gameInfo;
			
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			}
			$scope.ok = function() {
				$modalInstance.close($scope.gameInfo);
			}
		}
		
		$scope.promoModalCtrl = function($scope, $modalInstance) {
			$scope.choose = function (selectedPiece) {
				$modalInstance.close(selectedPiece);
			};
		}
		
		$scope.showPromoModal = function() {
			var promoModalInstance = $modal.open({
				templateUrl: 'promoModal.html',
				controller: $scope.promoModalCtrl,
				windowClass: 'promo-modal',
				resolve: {
					pieces: function() {
						return ['q','r','b','n'];
					}
				}
			});

			return promoModalInstance.result;
		}

		$scope.init = function() {
			$scope.newGame(true);
			$scope.settings = angular.fromJson(localStorage.getItem('settings'));
		}
		
		$scope.deleteGame = function(gameId) {
			var promise = mongoRestFactory.deleteItem({id:gameId});
		}
		
		$scope.saveGame = function() {
			var promise = $scope.showGameInfoModal();
			promise.then(function(gameInfo) {
				$scope.gameInfo = gameInfo;
					
				if ($scope.gameId && $scope.gameId!="") {
					promise = mongoRestFactory.updateItem({
						id:$scope.gameId,
						data:{
							tempos:$scope.tempos,
							pgn:$scope.game.pgn(),
							gameInfo: $scope.gameInfo
						}
					});
				} else {
					promise = mongoRestFactory.saveItem({
						data:{
							tempos:$scope.tempos,
							pgn:$scope.game.pgn(),
							gameInfo:$scope.gameInfo
						}
					});
				}
				promise.then(function(ret) {
					$scope.gameId = ret.data._id;
				},
				function(ret) {
				// TODO: what to do when an update fails as opposed to a save?
					$scope.gameId = 'Failed to save'
				});
			},
			// if cancelled
			function(cancelReason) {
				return;
			});
		}
		
		$scope.onDrop = function(source, target, piece, newPos, oldPos, orientation) {
			var promo = '';
			var move = {from:source, to:target}
			
			if (!$scope.isValidMove(source,target)) return "snapback";
			
			var validMove = {};
			
			if ($scope.isPromotion(target,piece)) {
				$scope.showPromoModal().then(function(selectedPiece) {
					//move.promotion=selectedPiece;
					validMove = $scope.game.move({from:source, to:target, promotion: selectedPiece});
					$scope.addMove(validMove);
				});
			} else {
				validMove = $scope.game.move({from:source, to:target});
				$scope.addMove(validMove);
			}
		}
		
		$scope.isPromotion = function(targetSquare, piece) {
			return (piece=='bP' && targetSquare.indexOf('1')>-1) ||
					(piece=='wP' && targetSquare.indexOf('8')>-1) 
		}
		
		$scope.getGames = function() {
			var promise = mongoRestFactory.getList();
			promise.then(function (ret) {
				$scope.games = ret.data;
			});
		}
		
		$scope.loadGame = function(game) {
			$scope.newGame();
			$scope.gameId = game.id;
			$scope.tempos = game.tempos;
			if (game.pgn) $scope.game.load_pgn(game.pgn);
			$scope.gameInfo = game.gameInfo || {};
			$scope.selectedTempo = $scope.tempo0;
		}
		
		$scope.isValidMove = function(source, target, game) {
			game = game || $scope.game;
			var vMoves = game.moves({verbose:true});
			for (var i = 0; i < vMoves.length; i++) if (source==vMoves[i].from && target==vMoves[i].to) return true;
			
			return false;
		}
		
		// do not pick up pieces if the game is over
		// only pick up pieces for the side to move
		$scope.onDragStart = function(source, piece, position, orientation) {
			var game = $scope.game;
			//implementing multiple lines: if not at end of game, you can start a new line by 
			// moving the appropriate color from a specific tempo if the settings allow it
			var atEnd = $scope.atEndOfMoveList();
			if (!atEnd && $scope.settings.allowMultipleLines) {
				var gameLine = new Chess($scope.selectedTempo.fen);
				if ((gameLine.turn() == 'w' && piece.search(/^b/) !== -1) ||
						(gameLine.turn() == 'b' && piece.search(/^w/) !== -1)) {
					return false;
				}
				$scope.newLine = true;
				return true;
			}
						
			if (game.game_over() === true || 
					(game.turn() === 'w' && piece.search(/^b/) !== -1) ||
					(game.turn() === 'b' && piece.search(/^w/) !== -1) ||
					(!$scope.atEndOfMoveList())) { // for now, until I implement multiple lines
				return false;
			}
		}
		
		$scope.getTempoByNumber = function(num) {
			if (num < 1 || num > $scope.game.history().length) return $scope.selectedTempo;
			return $scope.tempos[num];
		}
		
		$scope.atEndOfMoveList = function() {
	
			if ($scope.tempos.length==0) return true;
			
			if ($scope.tempos[$scope.tempos.length-1]==$scope.selectedTempo) return true;
			return false;
		}
		
		$scope.addMove = function(move) {
			
			var tempo = {};
			tempo.san = move.san;
			tempo.fen = $scope.game.fen();
			tempo.color = move.color;
			tempo.tempoNumber = $scope.game.history().length;
			
			$scope.selectedTempo = tempo;
			$scope.tempos.push(tempo);
			if (move.flags.search(/[epkq]/i) > -1)	$scope.board.position(tempo.fen, false); // update for weird moves
			$scope.$digest();
		}
		
		$scope.setPosition = function(tempo) {
			if (tempo==$scope.tempo0) {
				$scope.board.start();
			} else {
				$scope.board.position(tempo.fen);
				$scope.selectedTempo = tempo;
			}
		}
		
		$scope.gameHistoryToTempoNum = function(tempoNum) {
			var history = $scope.game.history().slice(0,tempoNum-1);
			return history;
		}
		
		$scope.goToStart = function() {
			$scope.board.start();
			$scope.selectedTempo = $scope.tempo0;
		}
		
		$scope.goToEnd = function() {
			var tempoCount = $scope.game.history().length;
			
			if (tempoCount == 0) return;
			
			$scope.setPosition($scope.tempos[$scope.tempos.length-1]);
		}
		
		$scope.goForwardOne = function() {
			if (!$scope.selectedTempo) return;
			var tempoNum = $scope.selectedTempo.tempoNumber;
			if (tempoNum >= $scope.tempos.length) return;
			$scope.setPosition($scope.tempos[tempoNum]);
		}
		
		$scope.goBackOne = function() {
			if ($scope.selectedTempo.tempoNumber<1) return;
			if ($scope.selectedTempo.tempoNumber == 1) $scope.goToStart();
			$scope.setPosition($scope.tempos[$scope.selectedTempo.tempoNumber-2]);
		}
		
		$scope.newGame = function(isInit) {
			$scope.game = new Chess();
			$scope.board = new ChessBoard('board1',$scope.boardCfg);
			$scope.tempos=[];
			$scope.gameId = '';
			$scope.gameInfo = {};
		}
		
		$scope.trashClick = function() {
			var dlgConfig = {
				title: "New Game",
				message: "You have requested a new game.  Do you wish to delete the current game from the database or just discard any changes since the last save?",
				buttons: [{name:'Delete',title:'Get rid of this crap'},
									{name:'Discard',title:'Save whats in the database, but ignore the crap since then'},
									{name:'Cancel',title:"Whoopsie!  I didn't mean to hit that button"}
									]
			}
			var promise = $scope.showDialog(dlgConfig);
			promise.then(function(ret) {
				if (ret=="Delete") {
					$scope.deleteGame($scope.gameId);
				} 
				
				if (ret!='Cancel') {
					$scope.newGame();
				}
			});
		}
		
		$scope.undo = function() {
			if ($scope.game.undo()) {
				$scope.removeLastTempo()
			}
		}
		
		$scope.flipBoard = function() {
			$scope.board.flip();
		}
		
		$scope.removeLastTempo = function() {
			var lastTempo = $scope.tempos.pop();
			var newSelectedTempo = null;
			if (lastTempo==$scope.selectedTempo) {
				newSelectedTempo = $scope.tempos.length ? $scope.tempos[$scope.tempos.length-1] : $scope.tempo0;
			}
			
			if (newSelectedTempo) {
				$scope.setPosition(newSelectedTempo);
			}
		}
		
		$scope.movesFromTempos = function(tempos) {
			tempos = tempos ? tempos : $scope.tempos;
			var moves = [];
			var move
			for (i=0; i < tempos.length-1; i=i+2) {
				move = {num: i/2+1};
				move.white = tempos[i];
				move.black = (tempos.length >= i + 2) ? tempos[i+1] : {};
				moves.push(move);
			}
			return moves;
		}

		$scope.lines = []; // for recursive alternate lines, use this with a single line object as base
		$scope.line = {
								fen:'',  //FEN at beginning of line
								priorTempos: 0, //tempos in previous line up to this one
								parentTempo: null, //tempo from which this line deviates
								startPgn: '', //PGN at the point where this line starts
								tempos: [] //moves in this line
							};
		$scope.tempo = {
								fen: '', //Fen after this tempo
								san: '', // Algebraic notation of this move
								color: '', //w/b color making this move
								tempoNum: 0, //tempo nomber in this line
								parentLine: null, //parent line object
								lines: [] //alternate lines branching from this tempo
							}
			
		$scope.tempos=[];
		$scope.game = {};
		$scope.gameInfo = {};
		$scope.board = {};
		$scope.tempo0 = {tempoNumber:0};
		$scope.selectedTempo = $scope.tempo0;
		$scope.boardCfg = {
			pieceTheme: 'vendors/chessboardjs/img/chesspieces/wikipedia/{piece}.png',
			position: 'start',
			draggable: true,
			onDragStart: $scope.onDragStart,
			onDrop: $scope.onDrop,
			dropOffBoard: 'snapback'
		};

		$scope.init();

});		
	//	$(document).ready(init);
