


/**
 * Generalized REST Factory.  CRUD objects.  Models need not apply. All methods return a promise
 * @module mongoRestFactory
 *
 */
'use strict';
angular.module('mongoRestApp',[])
  .factory('mongoRestFactory', function ($http) {
	/**
	 * @property Base Uri to be used for http requests
	 * @private
	 */
    var baseUri = '',
				db = '',
				collection = '';
	/**
	 * Create the http uri for the request
	 * @param {reqObj} reqObj request object 
	 * @param {string} reqObj.baseUri The base Uri for connecting with the Mongo Database
	 * @param {string} reqObj.db Name of the database
	 * @param {string} reqObj.collection Name of the collection
	 * @param {string} reqObj.id _Id defining the object in the specifiedDB and Collection
	 * @param {object} reqObj.data object to be persisted in DB
	 * @returns {string} fully qualified uri for the REST call
	 */
	function getUri(reqObj) {
             reqObj = !reqObj ? {} : reqObj;
            // reqObj can have 4 members for a GET call: baseUri, db, collection, id (document id)
            // no id passed will default to list all items in the collection
            
            // concatenate the request string
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
    	/**
    	 * Save default connection information
    	 * @param {string} [newBase=(storedValue)] Uri for the mongo server
    	 * @param {string} [newDb=(storedValue)] Db Name
    	 * @param {string} [newCollection=(storedValue)] Collection name
    	 */
			init: function(newBase,newDb,newCollection) {
				db = newDb || db;
				collection = newCollection || collection;
				baseUri = newBase || baseUri;
			},
		
		/**
		 * Get an item from the REST endpoint
		 * @param {object} reqObj Request Object 
		 * @param {string} [reqObj.baseUri=(storedValue)] The base Uri for connecting with the Mongo Database
		 * @param {string} [reqObj.db=(storedValue)] Name of the database
		 * @param {string} [reqObj.collection=(storedValue)] Name of the collection
		 * @param {string} reqObj.id _Id defining the object in the specifiedDB and Collection
		 * @returns {promise}
		 */
			getItem: function (reqObj) {
				var promise;
				promise = $http({method: 'GET', 
								url: getUri(reqObj),
							}); 
				return promise;		
			},
		/**
		 * Get an array of objects from the REST endpoint, if no id is passed.
		 * @todo Query options handled on backend, but not tested on frontend
		 * @param {object} reqObj Request Object
		 * @param {string} [reqObj.baseUri=(storedValue)] The base Uri for connecting with the Mongo Database
		 * @param {string} [reqObj.db=(storedValue)] Name of the database
		 * @param {string} [reqObj.collection=(storedValue)] Name of the collection
		 * @returns {promise}
		 */
			getList: function (reqObj) {
				if (reqObj) reqObj.id = null; // if there is no id, a list will be returned
				return this.getItem(reqObj); // still a promise
			},
		/**
		 * Save a new object to the REST endpoint
		 * @param {object} reqObj Request Object
		 * @param {string} [reqObj.baseUri=(storedValue)] The base Uri for connecting with the Mongo Database
		 * @param {string} [reqObj.db=(storedValue)] Name of the database
		 * @param {string} [reqObj.collection=(storedValue)] Name of the collection
		 * @param {string} reqObj.id _Id defining the object in the specifiedDB and Collection
		 * @param {object} reqObj.data Objec to be persisted in DB
		 * @returns {promise}
		 */
			saveItem: function (reqObj) {
				var promise = $http({method: 'POST',
										url: getUri(reqObj),
										data: reqObj.data,
									});
				return promise;
			},
			
		/**
		 * Update an object at the REST endpoint
		 * @param {object} reqObj Request Object
		 * @param {string} [reqObj.baseUri=(storedValue)] The base Uri for connecting with the Mongo Database
		 * @param {string} [reqObj.db=(storedValue)] Name of the database
		 * @param {string} [reqObj.collection=(storedValue)] Name of the collection
		 * @param {string} reqObj.id _Id defining the object in the specifiedDB and Collection
		 * @param {object} reqObj.data Objec to be persisted in DB
		 * @returns {promise}
		 */
			updateItem: function (reqObj) {
				var promise = $http({method: 'PUT',
										url: getUri(reqObj),
										data: reqObj.data,
									});
				return promise;
			},
		/**
		 * Delete an object to the REST endpoint
		 * @param {object} reqObj Request Object
		 * @param {string} [reqObj.baseUri=(storedValue)] The base Uri for connecting with the Mongo Database
		 * @param {string} [reqObj.db=(storedValue)] Name of the database
		 * @param {string} [reqObj.collection=(storedValue)] Name of the collection
		 * @param {string} reqObj.id _Id defining the object in the specifiedDB and Collection
		 * @returns {promise}
		 */
			deleteItem: function (reqObj) {
				var promise = $http({method: 'DELETE',
										url: getUri(reqObj)
									});
				return promise;
				
			}
    };
	
  });
