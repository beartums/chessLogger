/**
 * @ngdoc overview
 * @name ChessLoggerApp
 * @module ChessLoggerApp
 * @description overview Log and analyze chess games
 * @author Eric Griffith
 * @version 0.0.1
 * @requires ui.bootstrap
 * @requires mongoRestApp
 */

angular.module('ChessLoggerApp', ['ui.bootstrap','mongoRestApp']);

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
 * @description {@link ChessLoggerApp} controller
 * @requires $modal
 * @requires $log
 * @requires $timeout
 * @requires module:mongoRestFactory
 * 
 */
angular.module('ChessLoggerApp').
	controller('ChessLoggerCtrl', function($scope, $modal, $log, $timeout, mongoRestFactory) {
	
		/**
		 * @ngdoc object
		 * @name defaultSettings
		 * @memberof ChessLoggerCtrl
		 * @description Object Holding default settings for the user interface: Persistence, options, etc
		 * @typedef {object} defaultSettings
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
				url: "http://home.griffithnet.com:3000",
				name: 'chessLogger',
				collection: 'games'
			}
		};
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
		 * @ngdoc function
		 * @name ChessLoggerCtrl#flashMessage
		 * @description Send a message to the user interface which will be displayed for a specified amount of time
		 * @param {text} message The message to display
		 * @param {boolean} isSuccess Whether this should be displayed as a success/informational message or a failure
		 * @param {number} [timeout=5] Seconds to display message before it disappears
		 */
		$scope.flashMessage = function(message, isSuccess, timeout) {
			$scope.message.text = message;
			$scope.message.isSuccess = isSuccess;
			$scope.message.timeout = timeout || 5;
		}

	/**
	 * @ngdoc function
	 * @name ChessLoggerCtrl#clickCog
	 * @description Handles a click on the settings button.  Calls the {@link ChessLoggerCtrl#updateSettings|updateSettings} function 
	 * to display the modal and return a promise, which this function then stores in localStorage
	 */
		$scope.clickCog = function() {
			var promise = $scope.updateSettings();
			promise.then(function(settings) {
				$scope.settings = settings;
				localStorage.setItem('settings',angular.toJson($scope.settings));
			});
		}
	
	/**
	 * @ngdoc function
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
		}
		
	/**
	 * @ngdoc function
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
			}
			$scope.cancel = function() {
				$modalInstance.dismiss('cancel');
			}
		}
	
		/**
		 * @ngdoc function
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
		}
		
		/**
		 * @ngdoc function
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
				$modalInstance.close(name)
			}
		}
					
		/**
		 * @ngdoc function
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
						return $scope.game.gameInfo || new GameInfo();
					}
				}
			});
			
			return gameInfoModalInstance.result;
		}
		
		/**
		 * @ngdoc function
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
			}
			$scope.ok = function() {
				$modalInstance.close($scope.gameInfo);
			}
		}
		
		/**
		 * @ngdoc function
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
		}
		
		/**
		 * @ngdoc function
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
		}

		/**
		 * @description Initialize the board
		 * @name ChessLoggerCtrl.init
		 */
		$scope.init = function() {
			$scope.game = new ChessWrapper(this.boardCfg);
			$scope.settings = angular.fromJson(localStorage.getItem('settings')) || $scope.defaultSettings;
			var db = $scope.defaultSettings.db;
			mongoRestFactory.init(db.url, db.name, db.collection);
			$scope.flashMessage('Initialised',true);
		}
		
		/**
		 * @description Delete the current game
		 * @name ChessLoggerCtrl#deleteGame
		 * @param {string} gameId MongoDb _id for the game to be deleted
		 */
		$scope.deleteGame = function(gameId) {
			var promise = mongoRestFactory.deleteItem({id:gameId});
			promise.then(function(retData) {
				$scope.flashMessage('Deletion Successful.  That game won\'t embarrass you any more.',true);
			}, function(retData) {
				$scope.flashMessage('That didn\'t go so well. I don\'t think you\'ve purged that puppy.' , false)
			});
			
		}
		/**
		 * @description Save the current game.  First allow user to update the game info, 
		 * then handle the promise that is returned
		 * @name ChessLoggerCtrl#saveGame
		 */
		
		$scope.saveGame = function() {
			var promise = $scope.showGameInfoModal();
			promise.then(function(gameInfo) {
				$scope.game.gameInfo = gameInfo;
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
					$scope.gameId = ret.data._id;
					$scope.flashMessage('Successfully saved game ' + ret.data._id, true);
				},
				function(ret) {
					$scope.flashMessage('Keep trying.  Something at the other end isn\'t doing its job',false);
				});
			},
			// if cancelled
			function(cancelReason) {
				$scope.flashMessage('Looks like this was cancelled by the user.  Only you know why you did that.',false)
				return;
			});
		}
		
		/**
		 * @description get the list of saved games from the mongoDb
		 * @name ChessLoggerCtrl#getGames
		 */
		$scope.getGames = function() {
			var promise = mongoRestFactory.getList();
			promise.then(function (ret) {
				$scope.savedGames = ret.data;
			});
		}
		/**
		 * @description Click the trash icon to start a new game because is also clears the current game and
		 * discards any unsaved moves.  First prompt for approval with {@link ChessLoggerCtrl#showDialog|showDialog}
		 * @name ChessLoggerCtrl#trashClick
		 */
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
					$scope.deleteGame($scope.game.gameId);
				} 
				
				if (ret!='Cancel') {
					$scope.newGame();
				}
			});
		}

		/**
		 * @description Load the saved game from MongoDb onto the current board (rehydrate through {@link ChessWrapper})
		 * @name ChessLoggerCtrl#loadGame
		 * @param {object} savedGame Game object from MongoDb Get
		 */
		$scope.loadGame = function(savedGame) {
			$scope.game = new ChessWrapper($scope.boardCfg,savedGame);
		}
		
		/**
		 * @description Set board position and move list prior to the first move
		 * @name ChessLoggerCtrl#goToStart
		 */
		$scope.goToStart = function() {$scope.game.goToStart();}
		
		/**
		 * @description Set board position and move list to the last move
		 * @name ChessLoggerCtrl#goToEnd
		 */
		$scope.goToEnd = function() {$scope.game.goToEnd();}
		
		/**
		 * @description Go to next move in this line
		 * @name ChessLoggerCtrl#goForwardOne
		 */
		$scope.goForwardOne = function() {$scope.game.goForwardOne();}
		
		$scope.goBackOne = function() {	$scope.game.goBackOne();}
		
		$scope.newGame = function(isInit) {	$scope.game.initGame();}
		
		$scope.undo = function() {$scope.game.undo();}
		
		$scope.flipBoard = function() {$scope.game.board.flip();}
		
		$scope.setPosition = function(tempo) {$scope.game.setPosition(tempo);}
		
		$scope.peekPosition = function(tempo) {$scope.game.peekPosition(tempo);}
		
		$scope.onDrop = function(source, target, piece, newPos, oldPos, orientation) {
			var ret = $scope.game.onDrop(source, target, piece, newPos, oldPos, orientation);
			$scope.$digest();
			return ret;
		}
		
		$scope.requireWhitePlaceholder = function(tempo,index) {
			if (tempo.color=='b') {
				if (index==0) return true;
				if (tempo.parentLine.priorTempos>0 && index == 0) return true;
				if (tempo.parentLine.tempos[index-1].lines && tempo.parentLine.tempos[index-1].lines.length>0) return true;
				return false;
			}
		}

		$scope.lines = []; // for recursive alternate lines, use this with a single line object as base

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
	//	$(document).ready(init);
