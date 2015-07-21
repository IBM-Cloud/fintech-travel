/*
 * MQLightSetup
 * @param {Object} mqlight: node module that is installed via typing "$ npm install mqlight --save-dev" into the terminal
 * @param {Function} callback: callback that mqlight client returns to based on if it receives an event with the topic as its name
 * @param {String} topic: event name that mqlight client listens to
 */
module.exports = function( mqlight, callback, topic ){
	"use strict";

	var mqlightClient, // mqlight client itself
		mqlightSubInitialised = false, // boolean to determine if the mqlight service has already loaded
		mqlightCredentials = {}, // credentials for loading mqlight
		mqlightInstance = {}; // instance that is returned

	/*
	 * mqlightInstance.init
	 * Initialize MQLight service either on Bluemix or locally
	 */
	mqlightInstance.init = function() {

		/*
		 * Create our MQ Light client
		 * If we are not running in Bluemix, then default to a local MQ Light connection
		 */
		if (process.env.VCAP_SERVICES) {
			var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
			if (vcapServices.mqlight) {
				mqlightCredentials.service = vcapServices.mqlight[0].credentials.connectionLookupURI;
				mqlightCredentials.user = vcapServices.mqlight[0].credentials.username;
				mqlightCredentials.password = vcapServices.mqlight[0].credentials.password;
			} else {
				var returnString = 'Connection to ' + mqlightCredentials.service + ' using client-id ' + mqlightClient.id + ' failed: ' + err;
				console.error(returnString);
				// @TODO  -FRONT END there is no bound mqlight service
				return returnString;
			}
		} else {
			mqlightCredentials.service = 'amqp://localhost:5672';
		}

		return this.create();
	};

	/*
	 * mqlightInstance.create
	 * Create MQ Light client and return it
	 */
	mqlightInstance.create = function() {

		var returnString = "Error: MQLight Client not created";
		mqlightSubInitialised = false;
		mqlightClient = mqlight.createClient(mqlightCredentials, function(err) {
			if (err) {
				returnString = 'Error: ' + err;
				console.error('Error: ' + err);
				// @TODO -FRONT END coudln't connect to MQ light with proper credentials
				return returnString;
			} else {
				returnString = 'Connected to ' + mqlightCredentials.service + ' using client-id ' + mqlightClient.id;
				console.log(returnString);
			}

			// listens to when a message is received to process and invokes the callback function
			mqlightClient.on('message', callback);

			// Subscribes to the topic
			mqlightClient.subscribe(topic,
				{
					autoConfirm : false,
					qos : 1
				},
				function(err) {
					if (err) {
						var returnString = 'Failed to subscribe to MQ Light' + err;
						console.error(returnString);
						return returnString;
						// @TODO -FRONT END subscription error
					} else {
						console.log("Subscribed");
						mqlightSubInitialised = true;
						return returnString;
					}
				}
			);
		});

		if ( mqlightClient ) {
			return mqlightClient;
		} else {
			return returnString;
		}

	};

	// return a reference to this module
	return mqlightInstance;

}
