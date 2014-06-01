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
 * @module ChessLoggerCtrl
 * @name ChessLoggerCtrl
 * @memberOf ChessLoggerApp
 * @description ChessLoggerApp controller
 * @requires $modal
 * @requires $log
 * @requires module:mongoRestFactory
 * 
 */
angular.module('ChessLoggerApp').
	controller('ChessLoggerCtrl', function($scope, $modal, $log, $timeout, mongoRestFactory) {
	

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
		$scope.message={};
		
		$scope.$watch('message.text', function() {
			$timeout(function() {
				if ($scope.message.text) $scope.message={};
			},$scope.message.timeout*1000);
			
		});

	/**
	 * @ngdoc function
	 * @methodOf ChessLoggerCtrl 
	 * @name clickCog
	 * @description Handles a click on the settings button
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
	 * @method
	 * @return (promise) Function returning the settings object after changes have been made
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
		
		$scope.dialogCtrl = function($scope, $modalInstance, config) {
			$scope.config = config;
			$scope.buttonClicked = function(name) {
				$modalInstance.close(name)
			}
		}
					
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
		 * Initialize the board
		 * @method ChessLoggerCtrl.init
		 * @memberof! ChessLoggerCtrl
		 */
		$scope.init = function() {
			$scope.game = new ChessWrapper(this.boardCfg);
			$scope.settings = angular.fromJson(localStorage.getItem('settings')) || $scope.defaultSettings;
			var db = $scope.defaultSettings.db;
			mongoRestFactory.init(db.url, db.name, db.collection);
			$scope.flashMessage('Initialised',true);
		}
		
		$scope.deleteGame = function(gameId) {
			var promise = mongoRestFactory.deleteItem({id:gameId});
			promise.then(function(retData) {
				$scope.flashMessage('Deletion Successful.  That game won\'t embarrass you any more.',true);
			}, function(retData) {
				$scope.flashMessage('That didn\'t go so well. I don\'t think you\'ve purged that puppy.' , false)
			});
			
		}
		
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
					$scope.flashMessage('Keep trying.  Something at the other end isn\'t doing its job',false)
				});
			},
			// if cancelled
			function(cancelReason) {
				return;
			});
		}
		
		$scope.getGames = function() {
			var promise = mongoRestFactory.getList();
			promise.then(function (ret) {
				$scope.savedGames = ret.data;
			});
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
					$scope.deleteGame($scope.game.gameId);
				} 
				
				if (ret!='Cancel') {
					$scope.newGame();
				}
			});
		}
		
		$scope.flashMessage = function(message, isSuccess, timeout) {
			$scope.message.text = message;
			$scope.message.success = isSuccess;
			$scope.message.timeout = timeout || 5;
		}
		
		$scope.loadGame = function(savedGame) {
			$scope.game = new ChessWrapper($scope.boardCfg,savedGame);
		}
		
		$scope.goToStart = function() {$scope.game.goToStart();}
		
		$scope.goToEnd = function() {$scope.game.goToEnd();}
		
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
