/**
* Copyright 2015 IBM Corp. All Rights Reserved.
*
* Licensed under the Apache License, Version 2.0 (the “License”);
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an “AS IS” BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/*
 * CloudantSetup
 * @param {Object} cloudant: node module that is installed via typing "$ npm install cloudant --save-dev" into the terminal
 * @param {String} host: host of the cloudant database
 * @param {String} user: username to the cloudant database
 * @param {String} pass: password to the cloudant database
 * @param {String} url: url that the cloudant database lives on
 * @param {String} dbname: name of the database to use
 */

var cloudant = require('cloudant');

module.exports = function( host, user, pass, url, dbname ){
	"use strict";

	// variable used by the below functions
	var cloudantCredentials = {},
		cloudantInstance = {};

	/*
	 * cloudantInstance.init
	 * Initialize Cloudant service either on Bluemix or locally
	 */
	cloudantInstance.init = function() {
		if (process.env.VCAP_SERVICES) {
			var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
			if (vcapServices.cloudantNoSQLDB) {
				// these variables are dynamically set from Bluemix
				cloudantCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
				cloudantCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
				cloudantCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
				cloudantCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
				cloudantCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
				cloudantCredentials.dbName = dbname;
			} else {
				// @TODO -FRONT END there is no bound cloudant service on bluemix
			}
		} else {
			// these variables are set based on what has been passed into the module
			cloudantCredentials.host = host;
			cloudantCredentials.port = 443;
			cloudantCredentials.user = user;
			cloudantCredentials.password = pass;
			cloudantCredentials.url = url;
			cloudantCredentials.dbName = dbname;
		}

		// chain the return values so that calling "init()" will return the return variable of "create()"
		return this.create();
	};

	/*
	 * cloudantInstance.create
	 * Create Cloudant client and return it
	 */
	cloudantInstance.create = function() {
		// instantiate the Cloudant node module and check if it fails
		var cloudantModule = cloudant(cloudantCredentials, function(er, cloudant, reply) {
			if (er) {
				throw er;
				//@TODO -FRONT END couldn't connect to Cloudant, check the Bluemix dashboard to confirm the credentials are correct in the previous function
			} else {
				if (!reply.userCtx.name) {
					//@TODO -FRONT END there is no username!
				}
				// proceed normally
			}
		});

		var db;
		// list your databases to check if they already exist
		cloudantModule.db.list(function(err, all_dbs) {
			if (err) {
				console.log("no databases");
				throw new Error(err);
				//@TODO -FRONT END there are no databases
			} else {
				// print all the documents in our database
				console.log('All my databases: %s', all_dbs.join(', '));
				db = all_dbs[0];
			}
		});

		// if the database doesn't exist, create it
		if ( !db ){
			//check if DB exists if not create
			cloudantModule.db.create(cloudantCredentials.dbName, function(err, res) {
				if (err) {
					console.error('Cloudant ::', err.reason);
					//@TODO -FRONT END The database name doesn't exist
				} else {
					console.log("Cloudant :: " + cloudantCredentials.dbName + " Database created");
				}
			});
		}
		// use the database based on the name that was passed by argument into the module
		var database = cloudantModule.use(cloudantCredentials.dbName);

		// setup the indices of the database
		var index_destination = {
			name: 'destination',
			type: 'json',
			index: {
				fields: ['destination']
			}
		},
		index_departDate = {
			name: 'departDate',
			type: 'json',
			index: {
				fields: ['departDate']
			}
		},
		index_returnDate = {
			name: 'returnDate',
			type: 'json',
			index: {
				fields: ['returnDate']
			}
		};
		// store the indices into the database
		database.index(index_destination, function(er, response) {
			if (er) {
				throw er;
			} else {
				console.log('Cloudant :: Destination index %s', response.result);
			}
		});
		database.index(index_departDate, function(er, response) {
			if (er) {
				throw er;
			} else {
				console.log('Cloudant :: Depart Date index %s', response.result);
			}
		});
		database.index(index_returnDate, function(er, response) {
			if (er) {
				throw er;
			} else {
				console.log('Cloudant :: Return Date index %s', response.result);
			}
		});

		if ( database ) return database;
	};

	// return the cloudantInstance module
	return cloudantInstance;
};
