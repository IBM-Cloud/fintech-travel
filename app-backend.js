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

require("cf-deployment-tracker-client").track();

var SUBSCRIBE_TOPIC = "mqlight/sample/bank_notification";
var fs = require('fs');
var path = require('path');

// MQLIGHT setup
var mqlightSetup = require('./setup-mqlight')( processMessage, SUBSCRIBE_TOPIC );
var mqlightClient = mqlightSetup.init();

// CLOUDANT credentials
	// since this is the backend app, Cloudant is necessary
	// TODO input your Cloudant credentials below
var cloudantHost = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix.cloudant.com";
var cloudantUser = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix";
var cloudantPassword = "1a779f3d72807b60da279c24e9326d041154fff3fa472425fddae1392f6d7d3f";
var cloudantDbName = "fintech-travel";
var cloudantUrl = "https://" + cloudantUser + ":" + cloudantPassword + "@" + cloudantHost;

// CLOUDANT setup
var cloudantSetup = require('./setup-cloudant')(cloudantHost, cloudantUser, cloudantPassword, cloudantUrl, cloudantDbName);
var database = cloudantSetup.init();

/*
 * processMessage
 * @param {Object} data : departDate, returnDate, destination data
 * @param {Object} delivery:
 * Handle each message as it arrives.  Check data is correct and insert into database
 */
function processMessage(data, delivery) {
	var destination = data.destination,
		departDate = data.departDate,
		returnDate = data.returnDate,
		jsonData;
	try {
		// Convert JSON into an Object we can work with
		data = JSON.parse(data);
		destination = data.destination;
		departDate = data.departDate;
		returnDate = data.returnDate;
	} catch (e) {
		// Expected if we already have a Javascript object
	}
	if (!destination) {
		console.error("No destination: " + data.destination);
	} else {

		// Data object that is inserted into the database
		var entryData = {
			"destination": destination,
			"departDate": departDate,
			"returnDate": returnDate
		},
		id = "travel-details-" + destination.split( ', ' )[0] + '-' + Math.random();
		console.log ( 'destination: ', id );

		// Store data into the Cloudant database
		database.insert(entryData, id, function(err, body, header) {
			if (err)
				return console.log('Insert error:', err.reason);
			console.log( "success:", body);
		});
	}
}

/*
 * insertJSONData
 * @param jsonFileName {String} : name of the file
 * @param id {String} : ID of the database entry
 * @param imageName {String} (optional): name of image
 */
function insertJSONData( jsonFileName, id, imageName ) {
	// load json file
	fs.readFile( path.join(__dirname, "data/" + jsonFileName), 'utf8', function (err,data) {
		if (err) {
			return console.log(err);
		}
		data = JSON.parse(data);

		// insert data into the db
		database.insert(data, id, function(err, body, header) {
			if (err)
				return console.log('Insert error:', err);

			if ( imageName ){
				fs.readFile( path.join(__dirname, "data/" + imageName), function(err, data) {

					if (!err) {
						// ID: (required) is the same as the entry ID
						// rev: (required) is the same as the entry rev
						database.attachment.insert( id, imageName, data, 'image/png',
						{ rev: body.rev },
						function(err, body) {
							if (!err) {
								console.log(body);
							} else {
								console.log("image insert error: ", err );
							}
						});
					}
				});
			}
		});
	});
}

// loading external data into the database
insertJSONData( 'brasserie-lipp.json', 'note: Brasserie Lipp', 'NotificationsTemp2.png');
insertJSONData( 'chez-pau.json', 'note: Chez Pau', 'NotificationsTemp4.png' );
insertJSONData( 'guy-savoy.json', 'note: Guy Savoy', 'NotificationsTemp6.png' );
insertJSONData( 'les-deux-abeilles.json', 'note: Les Deux Abeilles', 'NotificationsTemp3.png' );
insertJSONData( 'restaurant-bon.json', 'note: Restaurant BON', 'NotificationsTemp5.png' );
insertJSONData( 'restaurant-le-meurice.json', 'note: Restaurant Le Meurice', 'NotificationsTemp1.png' );
insertJSONData( 'reward-status.json', 'rewardstatus' );
insertJSONData( 'transaction-days.json', 'transaction-days' );
insertJSONData( 'week-budget-detail.json', 'weekbudgetdetail' );
insertJSONData( 'week-budget.json', 'weekbudget' );
