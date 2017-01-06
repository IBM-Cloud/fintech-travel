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

// node module
var http = require('http');
var express = require('express');
var fs = require('fs');
var bodyParser = require('body-parser');

// TOPIC for mqlight
var PUBLISH_TOPIC = "mqlight/sample/bank_notification";

// MQLIGHT setup
var mqlightSetup = require('./setup-mqlight')(processMessage, PUBLISH_TOPIC);
var mqlightSubInitialised = false;

// CLOUDANT credentials
	// since this is the frontend portion of the app, Cloudant is only used to check if it is working correctly, otherwise all references of Cloudant can be deleted along with their functions.
	// TODO input your Cloudant credentials below
var cloudantHost = "";
var cloudantUser = "";
var cloudantPassword = "";
var cloudantDbName = "";
var cloudantUrl = "https://" + cloudantUser + ":" + cloudantPassword + "@" + cloudantHost;

// CLOUDANT setup
var cloudantSetup = require('./setup-cloudant')(cloudantHost, cloudantUser, cloudantPassword, cloudantUrl, cloudantDbName);


/*
 * staticContentHandler
 * @param req
 * @param res
 * Makes HTTP content accessible from within the NodeJS app
 */
function staticContentHandler(req,res) {
	var url = req.url.substr(1);
	if (url === '') {
		// automatically redirects to the index if no file is referenced
		url = __dirname + '/index.html';
	} else {
		// makes sure that all sub folders are referencing the correct parent folder
		url = __dirname + '/' + url;
	}
	if ( url.indexOf('.css') != -1 ) {
		res.contentType('text/css');
	}
	if ( url.indexOf('.svg') != -1 ) {
		res.contentType('image/svg+xml');
	}

	fs.readFile(url,
	function (err, data) {
		if (err) {
			res.writeHead(404);
			return res.end('Not found');
		}
		// res.writeHead(200);
		res.writeHead(200);
		return res.end(data);
	});
}

var processedMessage = "Error";
/*
 * processMessage
 * @param data
 * @param delivery
 * processes the message from MQLight.  can be used to confirm on the frontend that a message has been sent and processed.
 */
function processMessage(data, delivery) {
	console.log( " " );
	console.log("processMessage: ", data, delivery);
	try {
		data = JSON.parse(data);
		console.log(" ");
		console.log("Received response: " + JSON.stringify(data));
	} catch (e) {
		// Expected if we're receiving a Javascript object
	}
	// Manipulate the data as desired
	processedMessage = "Data Received";
}

// Create the Express app
var app = express();

// Setup the static file handlers
app.all('/', staticContentHandler);
app.all('/assets/**/*', staticContentHandler);
app.all('/*.html', staticContentHandler);
// Use JSON for our REST payloads
app.use(bodyParser.json());

/*
 * checkmqlight
 * @param {Object} req :
 * @param {Object} res :
 * GET handler to check if MQLight is working.  This is an optional function and is only for learning purposes.  Can be removed from production development.  *BUT* if it is removed, then you must initiate the MQlight (lines 128 and 129) somewhere else in this module.
 */
app.get('/api/checkmqlight', function(req,res) {
	mqlightClient = mqlightSetup.init();
	mqlightSubInitialised = true;
	if ( typeof mqlightClient != 'object' ) {
		console.error( mqlightClient );
		res.status( 400 ).send( mqlightClient );
	} else {
		console.log ( 'NO ERROR ON MQLIGHT' );
		res.status( 200 ).send( "mqlight success" );
	}
});

/*
 * checkcloudant
 * @param {Object} req :
 * @param {Object} res :
 * GET handler to check if Cloudant is working.  This is an optional function and is only for learning purposes.  Can be removed from production development
 */
app.get('/api/checkcloudant', function(req,res) {
	var database = cloudantSetup.init();
	if ( typeof database != 'object' ) {
		console.error( database );
		res.status( 400 ).send( database );
	} else {
		console.log ( 'NO ERROR ON CLOUDANT' );
		res.status( 200 ).send( "cloudant success" );
	}
});

/*
 * checkmqlightmessage
 * @param {Object} req :
 * @param {Object} res :
 * GET handler that checks if the message was sent through the MQLight service
 */
app.get('/api/checkmqlightmessage', function(req,res) {
	if ( processedMessage == "Error" ) {
		console.error( processedMessage );
		res.status( 400 ).send( processedMessage );
	} else {
		console.log ( 'NO ERROR ON MQLIGHT MESSAGE' );
		res.status( 200 ).send( "MQlight message success" );
	}
});

/*
 * POST handler to publish notification to bank
 * @param {Object} req : Request includes dates and destination
 * @param {Object} res : Response is used for confirmation of success
 * Prepares the departDate, returnDate, and destination data to be sent to the backend
 */
app.post('/api/bank_notification', function(req,res) {
	// Check we've initialised our subscription
	if (!mqlightSubInitialised) {
		res.writeHead(500);
		return res.end('Connection to MQ Light not initialised');
	}
	var returnData;
	// if there is no destination, return an error
	if (!req.body.destination) {
		res.writeHead(500);
		returnData = {
			"error" : "No destination"
		};
		mqlightClient.send(PUBLISH_TOPIC, returnData, {
			ttl: 60*60*1000 /* 1 hour */
		});
		return res.end();
	}
	// data sent to the MQLight service
	returnData = {
		"destination" : req.body.destination,
		"departDate" : req.body.departDate,
		"returnDate" : req.body.returnDate
	};
	// MQLight message is sent
	mqlightClient.send(PUBLISH_TOPIC, returnData, {
		ttl: 60*60*1000 /* 1 hour */
	});
	// Send back a count of messages sent
	res.json({"data" : returnData});
});

/*
 * Establish HTTP credentials, then configure Express
 */
var httpOpts = {};
httpOpts.port = (process.PORT || 3001);

/*
 * Start our REST server
 */
if (httpOpts.host) {
	http.createServer(app).listen(httpOpts.host, httpOpts.port, function () {
		console.log('App listening on ' + httpOpts.host + ':' + httpOpts.port);
	});
} else {
	http.createServer(app).listen(httpOpts.port, function () {
		console.log('App listening on *:' + httpOpts.port);
	});
}
