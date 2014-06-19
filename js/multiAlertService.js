var multiAlertApp = angular.module('multiAlertApp', []);

multiAlertApp.service('multiAlertService',function($timeout, $rootScope) {
  var Alert = function(title,text,timeout,alertLevel) {
	  this.title = title || '';
	  this.text = text || '';
	  this.timeout = timeout || 5;
	  this.alertLevel = alertLevel || 'info';
	  this.timestamp = new Date();
  };
  
  Alert.prototype.isLevel = function(level) {
	  return this.alertLevel==level;
  };
  
  var multiAlert = {};
  
  var _alerts = [];
  var _alertsHistory = [];
  
  multiAlert.removeAlert = function(alert) {
	  var i = _alerts.indexOf(alert);
	  _alerts.splice(i,1);
	  $rootScope.masAlerts = _alerts;
	  $rootScope.$digest();
  };
  
  multiAlert.addAlert = function(title, text, timeout, alertLevel) {
	  var alert = new Alert(title,text,timeout,alertLevel);
	  _alertsHistory.push(alert);
	  _alerts.push(alert);
	  if (timeout>0) {
		  $timeout(function() {
			  multiAlert.removeAlert(alert);
		  }, alert.timeout * 1000);
	  }
	  $rootScope.masAlerts=_alerts;
	  //$rootScope.$digest();
  };
  
  multiAlert.getAlertsHistory = function() {
	  return _alertsHistory;
  };
  
  
  return multiAlert;
});

multiAlertApp.directive('multiAlert', function() {
	return {
		restrict: 'EA',
		templateUrl: 'templates/multiAlertService.tpl.html'
	};
});
	