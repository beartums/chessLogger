/**
 * Generalized REST Factory.  CRUD objects.  Models need not apply. All methods return a promise
 */
'use strict';
angular.module('mongoRestApp',[])
  .factory('mongoRestFactory', function ($http) {
    var baseUri = '',
				db = '',
				collection = '';
	
	function getUri(reqObj) {
             reqObj = !reqObj ? {} : reqObj;
            // reqObj can have 4 members for a GET call: baseUri, db, collection, id (document id)
            // no id passed will default to list all items in the collection
            var uri = reqObj.baseUri ? reqObj.baseUri : baseUri;
            uri = uri + (uri[uri.length-1] == "\/" ? "" : "\/");
            uri = uri + (reqObj.db ? reqObj.db : db);
            uri = uri + (uri[uri.length-1] == "\/" ? "" : "\/");
            uri = uri + (reqObj.collection ? reqObj.collection : collection);
            uri = uri + (uri[uri.length-1] == "\/" ? "" : "\/");
            var id = reqObj.id;
            

            uri += id ? id : '';
            
            return uri;
		}	

    // Public API here
    return {
	
			init: function(newBase,newDb,newCollection) {
				db = newDb || db;
				collection = newCollection || collection;
				baseUri = newBase || baseUri;
			},
			
			getItem: function (reqObj) {
				var promise;
				promise = $http({method: 'GET', 
								url: getUri(reqObj),
							}); 
				return promise;
				
			},
			
			getList: function (reqObj) {
				if (reqObj) reqObj.id = null; // if there is no id, a list will be returned
				return this.getItem(reqObj); // still a promise
			},
			
			saveItem: function (reqObj) {
				var promise = $http({method: 'POST',
										url: getUri(reqObj),
										data: reqObj.data,
									});
				return promise;
			},
			
			updateItem: function (reqObj) {
				var promise = $http({method: 'PUT',
										url: getUri(reqObj),
										data: reqObj.data,
									});
				return promise;
			},
			
			deleteItem: function (reqObj) {
				var promise = $http({method: 'DELETE',
										url: getUri(reqObj)
									});
				return promise;
				
			}
    };
	
  });
