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

// node module
var http = require('http'),
	express = require('express'),
	fs = require('fs'),
	bodyParser = require('body-parser'),

// TOPIC for mqlight
	PUBLISH_TOPIC = "mqlight/sample/bank_notification",

// MQLIGHT setup
	mqlight = require('mqlight'),
	mqlightSetup = require('./mqlight-setup')(mqlight, processMessage, PUBLISH_TOPIC),
	mqlightSubInitialised = false,

// CLOUDANT credentials
	// since this is the frontend portion of the app, Cloudant is only used to check if it is working correctly, otherwise all references of Cloudant can be deleted along with their functions.
	cloudantHost = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix.cloudant.com",
	cloudantUser = "7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix",
	cloudantPassword = "1a779f3d72807b60da279c24e9326d041154fff3fa472425fddae1392f6d7d3f",
	cloudantUrl = "https://7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix:1a779f3d72807b60da279c24e9326d041154fff3fa472425fddae1392f6d7d3f@7885c1de-e04e-4a53-a8b7-f8d5c67f1b17-bluemix.cloudant.com",
	cloudantDbName = "fintech-travel",

// CLOUDANT setup
	cloudant = require('cloudant'),
 	cloudantSetup = require('./cloudant-setup')(cloudant, cloudantHost, cloudantUser, cloudantPassword, cloudantUrl, cloudantDbName);


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
app.all('/fonts/*', staticContentHandler);
app.all('/*.html', staticContentHandler);
app.all('/css/*.css', staticContentHandler);
app.all('/images/*', staticContentHandler);
app.all('/js/*', staticContentHandler);
// Use JSON for our REST payloads
app.use(bodyParser.json());

/*
 * checkmqlight
 * @param {Object} req :
 * @param {Object} res :
 * GET handler to check if MQLight is working.  This is an optional function and is only for learning purposes.  Can be removed from production development.  *BUT* if it is removed, then you must initiate the MQlight (lines 128 and 129) somewhere else in this module.
 */
app.get('/rest/checkmqlight', function(req,res) {
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
app.get('/rest/checkcloudant', function(req,res) {
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
app.get('/rest/checkmqlightmessage', function(req,res) {
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
app.post('/rest/bank_notification', function(req,res) {
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
httpOpts.port = (process.env.VCAP_APP_PORT || 3001);

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
