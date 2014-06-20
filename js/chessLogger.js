/**
 * @ngdoc overview
 * @name ChessLoggerApp
 * @module ChessLoggerApp
 * @description Log and analyze chess games Angular application.  Controller is {@link ChessLoggerCtrl}
 * @author Eric Griffith
 * @version 0.0.1
 * @requires ui.bootstrap
 * @requires mongoRestApp
 * @requires ngAnimate
 */

var chessLogger = angular.module('ChessLoggerApp', ['ui.bootstrap','ngAnimate','mongoRestApp', 'yaaas']);

chessLogger.constant('strings',{
		'SETTINGS': 'settings',
		'LOCAL_GAME': 'currentGame',
		'LOCAL_GAMES': 'storedGames',
		'DB_URL': 'http://home.griffithnet.com:3000',
		'DB_NAME': 'chessLogger',
		'DB_COLLECTION': 'games'
	});
	
chessLogger.service('localGamesService', function(strings,$rootScope) {
	
	this.clearGame = function() {
		localStorage.removeItem(strings.LOCAL_GAME);
	};
	
	this.loadGame = function(index) {
		index = index || -1;
		if (index>-1) { // get game from games array and remove it
			var games = this.getGameList();
			var game = games.slice(index,index)[0];
			delete game.index; // get rid of the index property; it is only used by this service
			this.saveGameList(games);
			this.saveGame(game);
			return game;
		} else {		
			var game = angular.fromJson(localStorage.getItem(strings.LOCAL_GAME));
			if (game) {
				return game;
			} else {
				return false;
			}
		}
	};
	
	this.saveGame = function(saveableGame) {
		saveableGame = saveableGame || $rootScope.game.getSaveableGame();
		localStorage.setItem(strings.LOCAL_GAME,angular.toJson(saveableGame));
	};
	
	this.getGameList = function(addIndexProp) {
		if (addIndexProp!==false) addIndexProp=true;
		
		var list = angular.fromJson(localStorage.getItem(strings.LOCAL_GAMES));
		var games = [];
		
		if (addIndexProp) {
			for (var i=0; i>list.length-1;i++) {
				var game = list[i];
				game.index = i;
				games.push(game);
			}
		} else {
			games = list;
		}
		return games;
	};
	
	this.saveGameToGameList = function(saveableGame,addIndexProp) {
		saveableGame = !saveableGame ? this.loadGame() : saveableGame;
		if (!saveableGame) return false;
		var games = this.getGameList();
		if (addIndexProp!==false) saveableGame.index = games.length;
		games[games.length]=saveableGame;
		this.saveGameList(games);
		return games;
	};
	
	this.saveGameList = function(games) {
		localStorage.setItem(angular.toJson(games));
	};
	
	this.setLocalGame = function(saveableGame,isSaveRequested) {
		// Save the current game to the list of local games
		if ((isSaveRequested) && $rootScope.game.rootLine.tempos.length>0)  {
			this.saveGameToGameList(saveableGame);
		}
		this.saveGame(saveableGame);
		
	};
		
});

/*angular.module('ChessLoggerApp')
	// Initialize the mongo api for the chesslogger app
	.run(function(mongoRestFactory) { 
		mongoRestFactory.init("http://home.griffithnet.com:3000","chesslogger","games");
	});
*/
/**
 * @ngdoc object
 * @class
 * @name ChessLoggerCtrl
 * @description {@link module:ChessLoggerApp|ChessLoggerApp} controller
 * @requires $modal
 * @requires $log
 * @requires $timeout
 * @requires module:mongoRestFactory
 * 
 */
chessLogger.controller('ChessLoggerCtrl', function($scope, $modal, $log, $timeout, $filter, mongoRestFactory, 
		strings, localGamesService, yaaaService) {
	
		//yaaaService.addAlert('TITLE','this is the text',5,'info');
		/**
		 * @ngdoc object
		 * @description Object Holding default settings for the user interface: Persistence, options, etc
		 * @name ChessLoggerCtrl#defaultSettings
		 * @typedef {object}
		 * @property {boolean} allowMultipleLines If the interface will allow multiple lines of play for analysis
		 * @property {boolean} enableLocalStorage Can games be persisted to local storage?
		 * @property {object} db MongoDb definition
		 * @property {string} db.url Url to the MongoDb instance
		 * @property {string} db.name Name of the MongoDb Database to use
		 * @property {string} db.collection Name of the MongoDb Collection to use
		 */
		$scope.defaultSettings = {
			allowMultipleLines: true,
			enableLocalStorage: true,
			emailAddress: '',
			db : {
				url: strings.DB_URL,
				name: strings.DB_NAME,
				collection: strings.DB_COLLECTION
			}
		};
		
		$scope.lines = []; // for recursive alternate lines, use this with a single line object as base

		
		/**
		 * @ngdoc object
		 * @description UI Informational message object watched by {@link $watch} and removed from UI after timeout
		 * @typedef {object}
		 * @name ChessLoggerCtrl#message
		 * @property {string} text Message to display
		 * @property {boolean} isSuccess Indicate whether this is a success or failure message
		 * @property {number} timeout Specify how long (in seconds) before this message will timeout and disappear from the UI
		 */
		$scope.message={
			text: '',
			isSuccess: true,
			timeout: 5
		};
		
		/**
		 * @name $watch#message.text
		 * @function
		 * @description register an observer on {@link ChessLoggerCtrl#message|message} object. 
		 *  Delete the message.text after timeout has expired
		 * so that it is not disctracting to the user
		 */
		$scope.$watch('message.text', function() {
			$timeout(function() {
				if ($scope.message.text) $scope.message={};
			},1000 * ($scope.message.timeout || 5));
			
		});

		/**
		 * @name $watch#game
		 * @function
		 * @description register an observer on {@link ChessLoggerCtrl#message|message} object. 
		 *  Delete the message.text after timeout has expired
		 * so that it is not disctracting to the user
		 */
		$scope.$watchCollection('game', function() {
			localGamesService.saveGame($scope.game.getSaveableGame());
		});
		
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#flashMessage
		 * @description Send a message to the user interface which will be displayed for a specified amount of time
		 * @param {text} message The message to display
		 * @param {boolean} isSuccess Whether this should be displayed as a success/informational message or a failure
		 * @param {number} [timeout=5] Seconds to display message before it disappears
		 */
		$scope.flashMessage = function(message, isSuccess, timeout) {
			//$scope.message.text = message;
			//$scope.message.isSuccess = isSuccess;
			//$scope.message.timeout = timeout || 5;
			yaaaService.addAlert('',message,timeout||5,isSuccess?'success':'danger');
		};

	/**
	 * @ngdoc function
	 * @function
	 * @name ChessLoggerCtrl#clickCog
	 * @description Handles a click on the settings button.  Calls the {@link ChessLoggerCtrl#updateSettings|updateSettings} function 
	 * to display the modal and return a promise, which this function then stores in localStorage
	 */
		$scope.clickCog = function() {
			var promise = $scope.updateSettings();
			promise.then(function(settings) {
				$scope.settings = settings;
				localStorage.setItem(strings.SETTINGS,angular.toJson($scope.settings));
			});
		};
	
	/**
	 * @ngdoc function
	 * @function
	 * @name ChessLoggerCtrl#updateSettings
	 * @description Calls dialog to update settings
	 * @returns {promise} promise object that resolve to the updated settings object or 'cancel' if canceled
	 */
		$scope.updateSettings = function() {
			var settingsModalInstance = $modal.open({
				templateUrl: 'templates/settingsModal.html',
				controller: $scope.settingsModalCtrl,
				windowClass: 'settings-dialog',
				resolve: {
					settings: function() {
						return $scope.settings || {};
					}
				}
			});
			return settingsModalInstance.result;
		};
		
	/**
	 * @ngdoc function
	 * @function
	 * @description Controller for the Settings Modal Dialog
	 * @name ChessLoggerCtrl#settingModalCtrl
	 * @param {object} Scope local to this dialog
	 * @param {object} Instance of the dialog (created in updateSettings)
	 * @param {object} Settings object, from the resolve object in the dialog instance
	 * @returns {void} void
	 */
		$scope.settingsModalCtrl = function($scope, $modalInstance, settings) {
			$scope.settings = settings;
			$scope.ok = function() {
				$modalInstance.close($scope.settings);
			};
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
		};
	
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#showDialog
		 * @description Calls a generic modal dialog based on the configuration object
		 * @param {object} config Modal DIalog configuration object
		 * @param {string} config.title Dialog Box Title
		 * @param {string} config.message Dialog Box filler text
		 * @param {button[]} config.buttons Array of buttons to be shown as options. 
		 * @param {string} config.button.name Name to show as button label and to return when button is clicked
		 * @returns {promise} Promise object that resolves to the name of the button clicked
		 */
		$scope.showDialog = function(config) {
			var dialogInstance = $modal.open({
				templateUrl: 'templates/dialogModal.html',
				controller: $scope.dialogCtrl,
				windowClass: 'dialog',
				resolve: {
					config: function() {
						return config;
					}
				}
			});
			return dialogInstance.result;
		};
		
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#dialogCtrl
		 * @description Controller for the generic Modal Dialog {@link ChessLoggerCtrl#showDialog|showDialog}
		 *
		 * @param {object} Scope local to this dialog
		 * @param {object} Instance of the dialog (created in {@link ChessLoggerCtrl#showDialog|showDialog})
		 * @param {object} Config object for the modal, from the resolve object in {@link ChessLoggerCtrl#showDialog|showDialog}
		 * @returns {void} void
		 */
		$scope.dialogCtrl = function($scope, $modalInstance, config) {
			$scope.config = config;
			$scope.buttonClicked = function(name) {
				$modalInstance.close(name);
			};
		};
					
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#showGameInfoModal
		 * @description Shows a modal dialog for updating general info for this game.  Usually prior to saving
		 * @returns {promise} Promise object that resolves to a {@link GameInfo} object
		 */
		$scope.showGameInfoModal = function() {
			var gameInfoModalInstance = $modal.open({
				templateUrl: 'templates/gameInfoModal.html',
				controller: $scope.gameInfoModalCtrl,
				windowClass: 'game-info-modal',
				resolve: {
					gameInfo: function() {
						$scope.game.gameInfo = $scope.game.gameInfo || new GameInfo();
						// Must be in this format or chrome will not see it, apparently
						$scope.game.gameInfo.date = $filter("date")($scope.game.gameInfo.date,'yyyy-MM-dd');
						//$scope.game.gameInfo.storage = $scope.game.gameInfo.storage || {location: 'local',
						//														db: $scope.defaultSettings.db};
						return $scope.game.gameInfo;
					}
				}
			});
			
			return gameInfoModalInstance.result;
		};
		
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#gameInfoModalCtrl
		 * @description Controller for the generic Modal Dialog {@link ChessLoggerCtrl#showGameInfoModal|showGameInfoModal}
		 *
		 * @param {object} Scope local to this dialog
		 * @param {object} Instance of the dialog (created in {@link ChessLoggerCtrl#showGameInfoModal|showGameInfoModal})
		 * @param {object} {@link GameInfo} object for the modal to update, from the resolve object in {@link ChessLoggerCtrl#showGameInfoModal|showGameInfoModal}
		 * @returns {void} void
		 */
		$scope.gameInfoModalCtrl = function($scope, $modalInstance, gameInfo) {
		
			$scope.gameInfo = gameInfo;
			
			
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			};
			$scope.ok = function() {
				$modalInstance.close($scope.gameInfo); // Deleting loaded game, true indicates it should also be cleared from cache
			};
		};
		
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#promoModalCtrl
		 * @description Controller for the piece Promotion Dialog {@link ChessLoggerCtrl#showPromoModal|showPromoModal}
		 *
		 * @param {object} Scope local to this dialog
		 * @param {object} Instance of the dialog (created in {@link ChessLoggerCtrl#showPromoModal|showPromoModal})
		 * @returns {void} void
		 */
		$scope.promoModalCtrl = function($scope, $modalInstance) {
			$scope.choose = function (selectedPiece) {
				$modalInstance.close(selectedPiece);
			};
		};
		
		/**
		 * @ngdoc function
		 * @function
		 * @name ChessLoggerCtrl#showPromoModal
		 * @description Shows a modal dialog for selecting a piece to promote to when pawn gets to last rank
		 * @returns {promise} Promise object that resolves to a string with the piece abbreviation
		 */
		$scope.showPromoModal = function() {
			var promoModalInstance = $modal.open({
				templateUrl: 'templates/promoModal.html',
				controller: $scope.promoModalCtrl,
				windowClass: 'promo-modal',
				resolve: {
					pieces: function() {
						return ['q','r','b','n'];
					}
				}
			});

			return promoModalInstance.result;
		};

		/**
		 * @description Initialize the board
		 * @function
		 * @name ChessLoggerCtrl.init
		 */
		$scope.init = function() {
			var game = localGamesService.loadGame();
			
			$scope.gameInit(game);
			
			$scope.settings = angular.fromJson(localStorage.getItem(strings.SETTINGS)) || $scope.defaultSettings;
			var db = $scope.defaultSettings.db ;
			mongoRestFactory.init(db.url, db.name, db.collection);
			$scope.flashMessage('Initialised',true);
		};
		
		$scope.gameInit = function(game) {
			$scope.game = new ChessWrapper($scope.boardCfg,game);
			$scope.loadedGame = angular.copy($scope.game.getSaveableGame());
			localGamesService.saveGame($scope.loadedGame);
		};
		
		/**
		 * @description Delete the current game
		 * @function
		 * @name ChessLoggerCtrl#deleteGame
		 * @param {string} gameId MongoDb _id for the game to be deleted
		 * @param {boolean} clearCache True if you want to delete the game from the automatic interruptedGame cache
		 */
		$scope.deleteGame = function(gameId) {
			if (gameId) {
				var promise = mongoRestFactory.deleteItem({id:gameId});
				
				promise.then(function(retData) {
					$scope.flashMessage('Deletion Successful.  That game won\'t embarrass you any more.',true);
				}, function(retData) {
					$scope.flashMessage('That didn\'t go so well. I don\'t think you\'ve purged that puppy.' , false);
				});
			}
		};
		/**
		 * @description Save the current game.  First allow user to update the game info, 
		 * then handle the promise that is returned
		 * @function
		 * @name ChessLoggerCtrl#saveGame
		 * @param {boolean} [andClear=false] True if you are saving before clearing out and starting a new game
		 */
		
		$scope.saveGame = function(andClear) {

			var data = $scope.game.getSaveableGame();
			
			if ($scope.game.gameId && $scope.game.gameId!="") {
				promise = mongoRestFactory.updateItem({
					id:$scope.game.gameId,
					data: data
				});
			} else {
				promise = mongoRestFactory.saveItem({
					data: data
				});
			}
			promise.then(function(ret) {
				$scope.game.gameId = ret.data._id;
				$scope.flashMessage('Successfully saved game ' + ret.data._id, true);
			},
			function(ret) {
				if (andClear) {
					localGamesService.saveGameToGameList();
				}
				$scope.flashMessage('I can\'t seem to reach the database, but the game is saved locally',false);
			});
			$scope.loadedGame = data;

		};
		
		/**
		 * @description get the list of saved games from the mongoDb
		 * @function
		 * @name ChessLoggerCtrl#getGames
		 */
		$scope.getGames = function() {
			var promise = mongoRestFactory.getList();
			promise.then(function (ret) {
				$scope.savedGames = ret.data;
			},function(ret) {
				$scope.flashMessage('Could not reach the database.  Call someone who might know how to do something about this '  +
						'and tell him or her that your helpful status code is: ' + ret.status,false,9999);
			});
		};
		/**
		 * @description Click the trash icon to start a new game because is also clears the current game and
		 * discards any unsaved moves.  First prompt for approval with {@link ChessLoggerCtrl#showDialog|showDialog}
		 * @function
		 * @name ChessLoggerCtrl#trashClick
		 */
		$scope.trashClick = function() {
			var btnDel = {name:'Delete',title:'Get rid of this crap'};
			var btnDis = {name:'Discard',title:'Save whats in the database, but ignore the crap since then'};
			var btnCan = {name:'Cancel',title:"Whoopsie!  I didn't mean to hit that button"};
			
			if ($scope.isGameDirty()) {
				var msg = "Do you wish to delete the current game from the database or just discard any changes since the last save?";
				var btns = [btnDel, btnDis, btnCan];
			} else {
				var msg = "No changes have been made to this game.  Would you like to delete it from the database or just discard it?";
				var btns = [btnDel,btnDis,btnCan];
			}
			var dlgConfig = {
				title: "Clear Game",
				message: msg,
				buttons: btns
			};
			var promise = $scope.showDialog(dlgConfig);
			promise.then(function(ret) {
				if (ret=="Delete") {
					$scope.deleteGame($scope.game.gameId);
					$scope.gameInit();
				} else if (ret=='Discard') {
					localGamesService.loadGame($scope.loadedGame);
					$scope.loadGame($scope.loadedGame);
				}
			});
		};
		/**
		 * @description Click the new game button -- give option to save unsaved changes
		 * @function
		 * @name ChessLoggerCtrl#newGame
		 */
		$scope.newClick = function() {
			
			// Ask player for guidance if there are unsaved changes
			if ($scope.isGameDirty()) {
				var btnSave = {name:'Save',title:'Save the changes to the default location for this game before starting a new one'};
				var btnDis = {name:'Discard',title:'Forget all the changes and start a new game'};
				var btnCan = {name:'Cancel',title:"Whoopsie!  I didn't mean to hit that button"};
				
				var msg = "What do you want to do about the changes that have been made to this game?";
				var btns = [btnSave,btnDis,btnCan];
				var dlgConfig = {
					title: "New Game",
					message: msg,
					buttons: btns
				};
				var promise = $scope.showDialog(dlgConfig);
				promise.then(function(ret) {
					if (ret=='Cancel') {
						$scope.flashMessage('New Game Creation Cancelled by user', false);
						return;
					}
					
					if  (ret=='Save') {
						$scope.saveGame(true);
					}
					$scope.gameInit();
					
					// now get the gameinfo for the new game
					var promise = $scope.showGameInfoModal();
					promise.then(function(gameInfo) {
						$scope.game.gameInfo = gameInfo;
						$scope.flashMessage('New game created', true);
					},
					// if cancelled
					function(cancelReason) {
						$scope.flashMessage('New Game created with default gameinfo', true);
					});
				});
			} else {
				$scope.gameInit();
			}
		};

		
		/**
		 * @description Load the saved game from MongoDb onto the current board (rehydrate through {@link ChessWrapper})
		 * @name ChessLoggerCtrl#loadGame
		 * @function
		 * @param {object} savedGame Game object from MongoDb Get
		 */
		$scope.loadGame = function(savedGame) {
			$scope.gameInit(savedGame);			
		};
		
		/**
		 * @description Set board position and move list prior to the first move
		 * @name ChessLoggerCtrl#goToStart
		 * @function
		 */
		$scope.goToStart = function() {$scope.game.goToStart();};
		
		/**
		 * @description Set board position and move list to the last move
		 * @name ChessLoggerCtrl#goToEnd
		 * @function
		 */
		$scope.goToEnd = function() {$scope.game.goToEnd();};
		
		/**
		 * @description Go to next move in this line
		 * @name ChessLoggerCtrl#goForwardOne
		 * @function
		 */
		$scope.goForwardOne = function() {$scope.game.goForwardOne();};
		
		/**
		 * @description Go to previous move in this line
		 * @name ChessLoggerCtrl#goBackOne
		 * @function
		 */
		$scope.goBackOne = function() {	$scope.game.goBackOne();};
		
		/**
		 * @description Setup a new game
		 * @name ChessLoggerCtrl#newGame
		 * @function
		 */
		$scope.newGame = function() {	
			$scope.game.initGame();
			$scope.loadedGame = angular.copy($scope.game.getSaveableGame());
		};
		
		/**
		 * @description Undo and erase last move
		 * @name ChessLoggerCtrl#undo
		 * @function
		 */
		$scope.undo = function() {$scope.game.undo();};
		
		/**
		 * @description Flip the board top for bottom
		 * @name ChessLoggerCtrl#flipBoard
		 * @function
		 */
		$scope.flipBoard = function() {$scope.game.board.flip();};
		
		/**
		 * @description Reset the board position to the selected tempo
		 * @name ChessLoggerCtrl#setPosition
		 * @function
		 * @param {object} tempo The {@link Tempo} object at which position you want the board to be set
		 */
		$scope.setPosition = function(tempo) {$scope.game.setPosition(tempo);};
		
		/**
		 * @description (unimplemented in {@link ChessWrapper}) Peek at the position when mousing over a move
		 * @name ChessLoggerCtrl#peekPosition
		 * @function
		 * @param {object} tempo The {@link Tempo} object at which position you want to show the board
		 */
		$scope.peekPosition = function(tempo) {$scope.game.peekPosition(tempo);};
		
		/**
		 * @description Function to be executed by {@link ChessWrapper} after a piece is dropped on the board.
		 * This allows ChessLoggerCtrl to manage the additional $digest required.  Chessboardjs watches for the drop, 
		 * calls this function.  This function calls the onDrop function in {@link ChessWrapper} (to test for validity etc),
		 * then calls a $digest and returns the proper return code to the onDrop event
		 * @name ChessLoggerCtrl#onDrop
		 * @function
		 * @param {string} source Algebraic notation for the source squsre
		 * @param {string} target Algebraic notation for the target squsre
		 * @param {string} piece Abbreviation of the piece being moved
		 * @param {string} newPos New Position (FEN)
		 * @param {string} oldPos Previous Position (FEN)
		 * @param {string} orientation direction board is facing
		 * @returns {string} return code from {@link ChessWrapper}
		 */
		$scope.onDrop = function(source, target, piece, newPos, oldPos, orientation) {
			var ret = $scope.game.onDrop(source, target, piece, newPos, oldPos, orientation);
			$scope.$digest();
			//$scope.saveLocal($scope.game); // save current progress
			return ret;
		};
		
		/**
		 * @description Determine whether user has made any changes to this game
		 * @name ChessLoggerCtrl#isGameDirty
		 * @function
		 * @param {object} [game=currentGame] Game object to compare to the original game to see if changes have been made
		 * @returns {boolean} true if changes have been made
		 */
		$scope.isGameDirty = function(game) {
			game = game || $scope.game;
			if (angular.equals($scope.loadedGame,angular.copy(game.getSaveableGame()))) {
				return false;
			} else {
				return true;
			}
		};
		
		/**
		 * @description Keep track of a game locally incase of interruption
		 * @name ChessLoggerCtrl#saveLocal
		 * @function
		 * @param {object} [game=$scope.game] The game to save locally
		 * @returns void
		 */
		/*$scope.saveLocal = function(game) {
			game = game || $scope.game;
			gameObj = game.getSaveableGame();
			gameStr = angular.toJson(gameObj);
			localStorage.setItem(strings.LOCAL_GAME, gameStr);
		}
		*/
		/**
		 * @description Determine whether this move requires a 'white move' placeholder ('...').  This will happen
		 * when a black move doesn't have a previous white move in the same line
		 * @name ChessLoggerCtrl#requireWhitePlaceholder
		 * @function
		 * @param {object} tempo {@link Tempo} object describing this move
		 * @param {number} index Position of this tempo in the current scope (from the recursive template in index.html)
		 * @returns {boolean} True if a placeholder is needed before this move
		 */
		$scope.requireWhitePlaceholder = function(tempo,index) {
			if (tempo.color=='b') {
				if (index==0) return true;
				if (tempo.parentLine.priorTempos>0 && index == 0) return true;
				if (tempo.parentLine.tempos[index-1].lines && tempo.parentLine.tempos[index-1].lines.length>0) return true;
				return false;
			}
		};

		$scope.boardCfg = {
				pieceTheme: 'assets/pieces/{piece}.png',
				//pieceTheme: 'vendors/chessboardjs/img/chesspieces/wikipedia/{piece}.png',
				position: 'start',
				boardDiv: 'board1',
				onDrop: $scope.onDrop,
				digest: $scope.$digest,
				promotionSelector: $scope.showPromoModal,
				draggable: true,
				dropOffBoard: 'snapback',
				allowMultipleLines: true
			};

		$scope.init();

});		
