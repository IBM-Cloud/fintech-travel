/*******************************************************************************
//
// Program name: app.js
//
// Description:
//
// A Node.js app that demonstrates use of the IBM Bluemix MQ Light Service.
//
// <copyright
// notice="lm-source-program"
// pids=""
// years="2014, 2015"
// crc="659007836" >
// Licensed Materials - Property of IBM
//
// (C) Copyright IBM Corp. 2014, 2015 All Rights Reserved.
//
// US Government Users Restricted Rights - Use, duplication or
// disclosure restricted by GSA ADP Schedule Contract with
// IBM Corp.
// </copyright>
//
// Contributors:
// IBM - Initial Contribution
 *******************************************************************************/


var SUBSCRIBE_TOPIC = "mqlight/sample/bank_notification",
	fs = require('fs'),
	path = require('path'),

// MQLIGHT setup
	mqlight = require('mqlight'),
	mqlightSetup = require('./mqlight-setup')(mqlight, processMessage, SUBSCRIBE_TOPIC ),
	mqlightClient = mqlightSetup.init(),

// CLOUDANT credentials
	// since this is the backend app, Cloudant is necessary
	cloudantHost = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix.cloudant.com",
	cloudantUser = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix",
	cloudantPassword = "1a779f3d72807b60da279c24e9326d041154fff3fa472425fddae1392f6d7d3f",
	cloudantUrl = "https://7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix:1a779f3d72807b60da279c24e9326d041154fff3fa472425fddae1392f6d7d3f@7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix.cloudant.com",
	cloudantDbName = "fintech-travel",

// CLOUDANT setup
	cloudant = require('cloudant'),
	cloudantSetup = require('./cloudant-setup')(cloudant, cloudantHost, cloudantUser, cloudantPassword, cloudantUrl, cloudantDbName),
	database = cloudantSetup.init();


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
