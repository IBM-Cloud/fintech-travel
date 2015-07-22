#MQLight/Cloudant Minimum Viable Service Tutorial

###Navigation:
1. [Getting Started](#getting-started)
2. [Setup Local MQLight Server](#setup-local-mqlight-server)
3. [Create MQLight Helper Node Module](#create-mqlight-helper-node-module)
4. [Create Cloudant Helper Node Module](#create-cloudant-helper-node-module)
5. [Create Backend Node Javascript](#create-backend-node-javascript)
6. [Create Frontend Node Javascript](#create-frontend-node-javascript)
7. [How to insert data and images into Cloudant database](#how-to-insert-data-and-images-into-cloudant-database)
8. [Running the App Locally](#running-the-app-locally)
9. [Appendix](#appendix)

###Requirements:
1. [Node](http://nodejs.org)
2. [NPM](https://npmjs.com)
3. [Homebrew](http://brew.sh)

###Node Modules:
1. mqlight: >=1.0.2014091000
2. hashmap: >=1.1.0
3. moment: >=2.8.3
4. node-uuid: >=1.4.1
5. npmlog: >=0.1.1
6. express: >=4.9.4
7. body-parser: >=1.8.3
8. cloudant": ^1.1.0

---
##Getting Started

###Clone this repo

```$ git clone git@github.com:IBM-Bluemix/fintech-travel.git```

###Create a Bluemix account.
1. Go to: [Bluemix](https://bluemix.net/)
2. Click "sign up" at the top right
3. Fill out form and submit.  Wait a few minutes for the confirmation email.
4. Receive email and validate email address
5. Login to Bluemix at the link above

###Add and Bind Services in Bluemix dashboard:

######MQ Light
1. In the Bluemix Dashboard, click *Use Services or APIs*.
2. Click *MQ Light*
3. Change the service name to *"MQLight-sampleservice"* to match manifest.yml
4. Click Create

######Cloudant NoSQL DB service
1. In the Bluemix Dashboard, click Use Services or APIs.
2. Click Cloudant NoSQL DB
3. Change the service name to *"Cloudant-NoSQL-sampleservice"* to match manifest.yml
4. Click Create

###Setup Manifest.yml

######Unique url for your app on Bluemix domain
1. The host variable is currently set as *"my-fintech-travel-demo"* and **must be changed to something unique**, as this will determine the publicly accessible URL for your application (ex. http://my-fintech-travel-demo.mybluemix.net).

Note: *All other parameters of the manifest.yml have already been setup in the cloned repository.*

Note: *For more details about the Manifest.yml go here: [Details](#manifestyml-details)*

###Install CloudFoundry CLI

######PC VERSION
Binaries:

1. Download the appropriate version depending on your OS installer here [https://github.com/cloudfoundry/cli#downloads](https://github.com/cloudfoundry/cli#downloads)

2. Run the installer

######MAC VERSON
[Homebrew](http://brew.sh)

```$ brew tap pivotal/tap && brew install cloudfoundry-cli```

###Push project into Bluemix with Cloud Foundry:

```
$ cd {my-app-directory}
$ cf api https://api.ng.bluemix.net
   Setting api endpoint to https://api.ng.bluemix.net
   OK
$ cf login
   API endpoint: https://api.ng.bluemix.net
   Email> {my-email}
   Password> {my-password}
   Authenticating...
   OK

$ cf push
```

**Each time you want to update your app on Bluemix, run** ```cf push``` **again.**

---
##Setup local MQLight server

1. Download the latest version of the MQLight Server for your operating system here:
[https://developer.ibm.com/messaging/mq-light/](https://developer.ibm.com/messaging/mq-light/)

2. Extract the compressed package and either double click the *"Start"* executable or in your terminal. Two questions will appear, **select N for both**:

    ```
    $ cd {my-mqlight-installation-directory}
    $ ./mqlight-start
    Enable user name/pass security? (You can change this later) (Y/N):  **N**
    Enable SSL security? (You can change this later) (Y/N): **N**
    ```
    MQLight should now start.

    Note: *If you have multiple installations you may receive an AMQ6109 error, which we fixed by instead running ```sudo ./mqlight-start``` on your original MQLight installation.*

3. Once MQLight has started, a browser window will open to http://localhost:9180

4. Use Node to install MQLight:

    ```$ npm install mqlight@1.0 -g```

    Note: *This will install MQLight globally for your computer so you can use it for both the backend and frontend.*

    Note: *Within the demo of this tutorial, there is an iframe of localhost:9180.  If MQLight has incorrectly started, you will see IBM WebSphere Application Server installation guide.  You do not need to do this, instead try stopping MQLight by running* ```./mqlight-stop```

    Note: *MQLight server runs in the background.*

**To demo the application, skip to [Running the App Locally](#running-the-app-locally).**

##Create MQLight helper node module

Note: *You've created the MQLight service on Bluemix and bound it to your application.  If not, please go back to the "[Getting Started](#getting-started)" section*

1. Since the MQLight client can be modularized for ease of use, we recommend creating a helper file following this structure.  This file can be found at **frontend/mqlight-setup.js** and **backend/mqlight-setup.js**.
    ```
    module.exports = function(){ // content here };
    ```

2. Within this module, create a variable named ```mqlightCredentials``` and assign it to an empty object for use later.
    ```
    mqlightCredentials = {};
    ```
3. Don't forget to require MQLight:
    ```
    require("./mqlight");
    ```
4. The content of this file includes two functions, the first sets up the credentials to access MQLight either locally or on Bluemix
    1. Init() function

        ```
        this.init = function(){ // content here };
        ```
    2. Within this function you will check if VCAP_SERVICES environment variable exists:

        ```
        if (process.env.VCAP_SERVICES)
        ```

    3. If it does, use JSON parse to explode this variable:

        ```
        var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        ```
    4. Then check to make sure the MQLight VCAP Service exists:

        ```
        if (vcapServices.mqlight)
        ```
    5. Then store those credentials into the variable from step b above.

        ```
        mqlightCredentials.service = vcapServices.mqlight[0].credentials.connectionLookupURI;
        mqlightCredentials.user = vcapServices.mqlight[0].credentials.username;
        mqlightCredentials.password = vcapServices.mqlight[0].credentials.password;
        ```
    6. If it does not exist, use the local instance of your MQLight service you setup when you created your local MQLight Server:

        ```
        mqlightCredentials.service = 'amqp://localhost:5672';
        ```
    7. Then return the next function so that we can chain the return requests for use later.

    8. The second function creates the MQLight client and once created, listeners for messages from the service to invoke a callback.

    9. Create() function

        ```
        this.create = function(){ // content here };
        ```
    10. To setup the client, use MQLIight’s createClient function that accepts two arguments the first is the credentials you created from Step C, the second is a function.

        ```
        mqlightClient = mqlight.createClient(mqlightCredentials, function(err){ // content here });
        ```

    11. Setup a listener for when a message is received using the on() function

        ```
        mqlightClient.on('message', callback);
        ```
        1. On() accepts 2 parameters

            ```
            Event name (*String*) > (required) "message" is the name of the event
            Callback (*Function*) > (required) this function allows you to run other processes and where you can do most of the heavy lifting.  This function can be sent to the MQLight node module when it is instantiated.
            ```
    12. Setup a subscribe listener for when a with the TOPIC:
        ```
        mqlightClient.subscribe(SUBSCRIBE_TOPIC, {}, function(err){});
        ```

        1. Subscribe() accepts 3 parameters:

            ```
            Topic (*String*) > (required)
            Delivery Assurance (*Object*) > (optional) Object containing at least two parameters
                qos: "Quality of Service" > usually set to 1
                autoConfirm: true or false, if set to false your application must call a confirmDelivery(..) method to send the confirm transmission for each message it receives.
            Return (*Function*) > (optional) Function used to check if errors occurred
            ```

            Note: *The subscribe function connects the frontend to the backend.  The frontend can only send a "message" event if the backend knows what to listen for, aka the TOPIC.*

    13. We now return the mqlightClient object so that it can be passed back to either the frontend or the backend.


---
##Create Cloudant helper node module

Note: *You've created the Cloudant service on Bluemix and bound it to your application.  If not, please go back to the "[Getting Started](#getting-started)" section*

1. Since the Cloudant client can be modularized for ease of use, we recommend creating a helper file.  This file can be found at **frontend/cloudant-setup.js** and **backend/cloudant-setup.js**.
        ```
        module.exports = function(){ // content here };
        ```

    1. The function will accept 6 arguments
        ```
        cloudant, host, user, pass, url, dbname
        ```

    2. Within this module, create a "cloudantCredentials" variable and assign it to an empty object for use later.
        ```
        cloudantCredentials = {};
        ```

    3. Also require Cloudant and pass it the necessary URL credential:
        ```
        var cloudant = require("./cloudant")( cloudantCredentials.url, function(er, cloudant, reply){ // to check for errors instantiating the client });
        ```

    4. Init() function: initialized with VCAP_SERVICES
        ```
        this.init = function()
        ```

    5. Within this function you will check if VCAP_SERVICES environment variable exists:
        ```
        if (process.env.VCAP_SERVICES)
        ```

    6. If it does, use JSON parse to explode this variable:
        ```
        var vcapServices = JSON.parse(process.env.VCAP_SERVICES);
        ```

    7. Then check to make sure the MQLight VCAP Service exists:
        ```
        if (vcapServices.cloudantNoSQLDB)
        ```

    8. Then store those credentials into the variable from step b above.
        ```
        cloudantCredentials.host = vcapServices.cloudantNoSQLDB[0].credentials.host;
        cloudantCredentials.port = vcapServices.cloudantNoSQLDB[0].credentials.port;
        cloudantCredentials.user = vcapServices.cloudantNoSQLDB[0].credentials.username;
        cloudantCredentials.password = vcapServices.cloudantNoSQLDB[0].credentials.password;
        cloudantCredentials.url = vcapServices.cloudantNoSQLDB[0].credentials.url;
        cloudantCredentials.dbname = dbname; // variable passed in
        ```

    9. If it does not exist, we use predefined variable values that are passed as arguments into the node modules.

    10. Return the next function, so that we can chain the return requests.
        ```
        return this.create();
        ```

    11. Create() function: creates the database

    12. Create the Database (aka "db") using the *cloudantCredentials dbName* variables.
        Invoking this method will not create the database if it already exists and instead will throw an error, but if it doesn’t then it will create it for you.
        ```
        cloudant.db.create( cloudantCredentials.dbName, function(err, res) { // to check for errors if instantiating the db failed });
        ```

    13. The previous step would create the database if it didn’t exist, but regardless by this point you can proceed to use the database that you created or that already exists
        ```
        var database = cloudant.use( cloudantCredentials.dbName );
        ```

    14. We must setup the indices within the database which will contain the data that is being stored within the database.  First we will create a structure that the data will be stored as.
        ```
        var index_destination = {
            name: 'destination',
            type: 'json',
            index: {
                fields: ['destination']
            }
        };
        ```

    15. Then we must implement that data structure on the database itself as such:
        ```
        database.index(index_destination, function(er, response) {
            if (er) {
                throw er
            } else {
                console.log('Cloudant :: Destination index %s', response.result)
            }
        });
        ```

    25. Return the database so that we can manipulate it from either the frontend or the backend node apps.


---
##Create backend node javascript

**This code can be found at "backend/app.js"**

1. Create a function that is used for the callback from the MQLight service.  This function can do a variety of actions, but in our case it will be inserting travel information into the database.  In this tutorial the function is named "processMessage".
    ```
    function processMessage(data, delivery) { };
    ```

2. Initially, you will need to do various checks on the data to make sure it is correct and therefore can be inserted into the database.

3. If the data doesn’t validate, return false.

4. If the data is valid, insert into the database that is created by the Cloudant helper module:
    ```
    database.insert(data, id, function(err, body, header) {
        if (err) return console.log(‘Insert Error:', err);
        });
    ```

    1. Insert() accepts 3 parameters

        ```
        entryData (*Object*) > (required) Data that is posted into the database
        ID (*String*) > (required)
        Return (*Function*) > (required)
        ```

5. Require the MQLight helper module you created:

    ```
    require( "[path-to-mqlight-module-file]" )( mqlight, processMessage, SUBSCRIBE_TOPIC );
    ```

6. Setup placeholder variables that reference your Bluemix Cloudant credentials

    ```
    host, username, password, url, dbname
    ```

7. Require the Cloudant helper module you created and pass the Cloudant credentials:

    ```
    require( "[path-to-cloudant-module-file]" )( host, username, password, url, dbname );
    ```
---
##Create frontend node javascript

1. To setup the frontend we first need to require a few Node Modules so that Express will function properly.
    ```
    var http = require('http'),
    express = require('express'),
    fs = require('fs'),
    bodyParser = require('body-parser'),
    ```

2. Then we must instantiate express:
    ```
    var app = express();
    ```

3. With express, we also need to setup a function that handles the loading of data files of all varieties, such as html, css, images, and more.

    ```
    function staticContentHandler(req,res) {
        var url = req.url.substr(1);

        if (url == '') {
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

        fs.readFile(url,function (err, data) {

            if (err) {
                res.writeHead(404);
                return res.end('Not found');
            }

            res.writeHead(200);
            return res.end(data);
        });
    }
    ```

4. In addition to creating this function that handles file loading, we need to designate which functions the various types of files we will load
    ```
    app.all('/', staticContentHandler);
    app.all('/fonts/*', staticContentHandler);
    app.all('/*.html', staticContentHandler);
    app.all('/css/*.css', staticContentHandler);
    app.all('/images/*', staticContentHandler);
    app.all('/js/*', staticContentHandler);
    ```

5. The only endpoint we will post to is the one that includes the MQLight process, named "/rest/bank_notification"
    ```
    app.post('/rest/bank_notification', function(req,res) { // to be determined });
    ```

6. When posting to this endpoint, we want to first check to we have already instantiated the MQLight service. With an If statement and if we haven’t done so already, we want to our response to include an error status and message
    ```
    if (!mqlightSubInitialised) {
        res.writeHead(500);
        return res.end('Connection to MQ Light not initialised');
    }
    ```

7. If MQLight exists, we want to validate that our data can be submitted to the MQLight process. If it is not valid, then we want to respond with an error message that provides more insight into why the data was incorrect.
    ```
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
    ```

    Although this check will happen before the insertion it is good practice to also perform these validations when the data is received.

8. Once the data has been validated, we will make sure it is constructed into JSON object format.
    ```
    returnData = {
        "destination" : req.body.destination,
        "departDate" : req.body.departDate,
        "returnDate" : req.body.returnDate
    };
    ```

9. MQLight send data to publish topic.
    ```
    mqlightClient.send(PUBLISH_TOPIC, returnData, {
        ttl: 60*60*1000 /* 1 hour */
    });
    ```

10. MQLight send data to publish topic.
    ```
    res.json({"data" : returnData});
    ```

---
##How to insert data and images into Cloudant database

1. Ideally, the data exists in an external JSON file and using the node module “fs” we can read this file.  As a helper, we will also need the node module “path”.

    ```
    fs = require('fs');
    path = require('path');
    ```
2. The file is read into the app with the filename.  Make sure to use path to properly “join” the full directory path.

    ```
    fs.readFile( path.join(__dirname, "data/" + jsonFileName), 'utf8', function (err,data) { // content here });
    ```
3. Once the data has loaded, we must parse it as JSON.

    ```
    data = JSON.parse(data);
    ```
4. Insert it into the database with the Cloudant insert function

    ```
    database.insert(data, id, function(err, body, header) { // content here });
    ```
5. If you also wish to include an attachment, for instance an image, you would load the image again using the “path” node module

    ```
    fs.readFile( path.join(__dirname, "data/" + imageName), function(err, data) { // content here });
    ```
6. Once it has loaded without an error you must attach the image to the insert you just created in step 4.

    ```
    database.attachment.insert( id, imageName, data, 'image/png', { rev: body.rev }, function(err, body) { // content here });
    ```

    1. The ID parameter is the same as the ID of the entry in Step 4.
    2. The “rev” option is the required and is retrieved from the insertion in Step 4.

        ```
        { rev: body.rev }
        ```

---
##Running the App Locally

######In a terminal tab:
```
$ cd {my-mqlight-installation-directory}
$ ./mqlight-start
```

######In a second terminal tab:
Note: *Leave this tab open*

```
$ cd backend
$ npm install
$ node app.js
```

######In a third terminal tab:
Note: *Leave this tab open*

```
$ cd frontend
$ npm install
$ node app.js
```

**In your browser navigate to:** [http://localhost:3000](http://localhost:3000)

---
##Appendix

###Manifest.yml Details

**Below is a description of the format for the manifest.yml file.**

######Set up the frontend app.  (ex. process-banking-notification-frontend)
1. The host variable is currently set as *"my-fintech-travel-demo"* and **must be changed to something unique**, as this will determine the publicly accessible URL for your application (ex. http://my-fintech-travel-demo.mybluemix.net).
2. The name and path variables match what is in Bluemix dashboard.
3. The memory variable is the same as is allocated on the Bluemix dashboard inside of your CF App(s)
4. The services variable has *"MQLight-sampleservice"* associated with it.  The starting ```"-"``` is intentional.
5. The services variable has *"Cloudant-NoSQL-sampleservice"* associated with it.  The starting ```"-"``` is intentional.
6. The path variable is set to the folder name where the frontend code resides.  (ex. frontend)

######Set up the backend app.  (ex. process-banking-notification-backend)
1. The name variables match what is in Bluemix dashboard.
2. The memory variable is the same as is allocated on the Bluemix dashboard inside of your CF App(s)
3. The services variable has *"MQLight-sampleservice"* associated with it.  The starting ```"-"``` is intentional.
4. The services variable has *"Cloudant-NoSQL-sampleservice"* associated with it.  The starting ```"-"``` is intentional.
5. The path variable is set to the folder name where the backend code resides.  (ex. backend)

###Push project into Bluemix with Live Sync:

[Bluemix Live Sync Details](https://www.ng.bluemix.net/docs/#manageapps/bluemixlive.html#bluemixlive)

1. Login to [Bluemix](https://console.ng.bluemix.net/)
2. Open a CF App(s) that you have already created
3. Top right corner, click *"Add GIT"*
4. Once created, open a command prompt
5. Install Bluemix Live Sync CLI here: [bl live sync](http://livesyncdownload.ng.bluemix.net/downloads/BluemixLive.pkg)
6. Login to bluemix

    ```$ bl login -u {my-username} -p {my-password}```
7. Review the project names associated with your Bluemix account.

    ```$ bl projects```
8. Sync local environment with Bluemix project and leave this command prompt running in the background.

    ```$ bl sync {my-project-name} -d {my-local-directory} --verbose```
9. Manually copy your code into the **{my-local-directory}** from step 7 on your computer.
10. Open *another* command prompt to start bluemix live sync

    ```
    $ cd {my-local-directory}
    $ bl start
    ```
11. If you update the manifest.yml you can restart by typing this:
```$ bl start --restart```

###Setup *launchconfiguration*:

```
{
  "ServiceId": "com.ibm.cloudoe.orion.client.deploy",
  "Params": {
    "Target": {
      "Url": "https://api.ng.bluemix.net",
      "Org": "{my Bluemix username}",
      "Space": "{my Bluemix space name}"
    },
    "Name": "{my Bluemix project name}",
    "Instrumentation": {
      "host": "{my Bluemix host name}",
      "domain": "mybluemix.net"
    }
  },
  "Path": "manifest.yml",
  "Type": "Cloud Foundry"
}
```
