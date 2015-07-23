## Overview

####What is a “Minimum Viable Service”?
In the monolithic approach to services, developers would tie all the business logic for an application into a single REST service responsible for all internal activity. These solutions can become complicated and byzantine. In addition, any single change to business logic requires a code rewrite.

In this Bluemix demo, we’ll show how MQ Light’s Worker Offloader Pattern separates application features into their own micro services or, Minimum Viable Services.

What will you do here?
Your mission here is to make an open API available to partners to create something that can be both useful and valuable to customers. Bluemix lets us publish this API in a catalog for easy access and integration.

Let’s go.

[![Deploy to Bluemix](https://bluemix.net/deploy/button.png)](https://bluemix.net/deploy?repository=https://github.com/IBM-Bluemix/fintech-travel.git)


### Requirements:
1. [Node](http://nodejs.org)
2. [NPM](https://npmjs.com)

### Navigation:
1. [How it Works](#how-it-works)
2. [Running the app on Bluemix](#running-the-app-locally)
3. [Running the app locally](#running-the-app-locally)
4. [Privacy Notice](#privacy-notice)
5. [Disabling Deployment Tracking](#disabling-deployment-tracking)

## How it Works

1. Navigate to the app home page.
2. Walk through the modal windows.
3. Select a destination in the dropdown menu.
4. Click 'Book Flight'.
5. In the modal window, click 'Ok'.  This will trigger the MQLight messages and insertions into the Cloudant DB.
6. If you are building the app locally, you can open the panel on the right side of the screen to view the MQLight messages being sent.
7. You can login to your Cloudant launcher and view the data stored in the database via the Bluemix Dashboard.
8. Click 'Book Another Trip' to start over.

### Architecture Diagram

![Architecture Diagram](https://github.com/IBM-Bluemix/fintech-travel/raw/master/IBM_demo_app_architecture_v1-01.jpg)

## Running the app on Bluemix

1. Create a Bluemix Account

  [Sign up](http://console.ng.bluemix.net) for Bluemix, or use an existing account.

2. Download and install the [Cloud-foundry CLI](https://github.com/cloudfoundry/cli) tool

3. Clone the app to your local environment from your terminal using the following command

  ```
  $ git clone https://github.com/IBM-Bluemix/fintech-travel.git
  ```

4. ```$ cd``` into this newly created directory

5. Edit the `manifest.yml` file and change the `<application-name>` and `<application-host>` to something unique.

  ```
  ---
  declared-services:
    MQLight-sampleservice:
      label: mqlight
      plan: standard
    Cloudant-NoSQL-sampleservice:
      label: cloudantNoSQLDB
      plan: Shared
  applications:
  - name:  fintech-travel-backend
    disk: 1024M
    command: node app-backend.js
    memory: 1GB
    instances: 1
    no-route: true
    services:
    - MQLight-sampleservice
    - Cloudant-NoSQL-sampleservice
  - name:  fintech-travel-frontend
    disk: 1024M
    command: node app-frontend.js
    memory: 1GB
    host: my-fintech-travel-demo
    services:
    - MQLight-sampleservice
    - Cloudant-NoSQL-sampleservice
  ```
  The host you use will determinate your application url initially, e.g. `<application-host>.mybluemix.net`.

6. Connect to Bluemix in the command line tool and follow the prompts to log in.

  ```
  $ cf api https://api.ng.bluemix.net
  $ cf login
  ```

7. Create the MQLight service in Bluemix.

  ```
  $ cf create-service mqlight standard MQLight-sampleservice
  ```

8. Create the Cloudant service in Bluemix.

  ```
  $ cf create-service cloudantNoSQLDB Shared Cloudant-NoSQL-sampleservice
  ```

9. Push it to Bluemix.

  ```
  $ cf push
  ```

##Running the app locally

1. Download the latest version of the MQLight Server for your operating system here:
[https://developer.ibm.com/messaging/mq-light/](https://developer.ibm.com/messaging/mq-light/)

2. Extract the compressed package and either double click the *"Start"* executable or in your terminal. Two questions will appear, **select N for both**:

    ```
    $ cd {my-mqlight-installation-directory}
    $ ./mqlight-start
    Enable user name/pass security? (You can change this later) (Y/N):  N
    Enable SSL security? (You can change this later) (Y/N): N
    ```
    MQLight should now start.

    Note: *If you have multiple installations you may receive an AMQ6109 error, which we fixed by instead running ```$ sudo ./mqlight-start``` on your original MQLight installation.*

3. Once MQLight has started, a browser window will open to http://localhost:9180.  MQLight process will run in the background.

4. ```$ cd``` into the project directory

5. Install node Modules
  ```
  $ npm install
  ```

6. start backend app
  ```
  $ node app-backend.js
  ```

7. start frontend app
  ```
  $ node app-frontend.js
  ```

## Privacy Notice

Sample web applications that include this package may be configured to track deployments to [IBM Bluemix](https://www.bluemix.net/) and other Cloud Foundry platforms. The following information is sent to a [Deployment Tracker](https://github.com/IBM-Bluemix/cf-deployment-tracker-service) service on each deployment:

* Node.js package version
* Node.js repository URL
* Application Name (`application_name`)
* Space ID (`space_id`)
* Application Version (`application_version`)
* Application URIs (`application_uris`)

This data is collected from the `package.json` file in the sample application and the `VCAP_APPLICATION` environment variable in IBM Bluemix and other Cloud Foundry platforms. This data is used by IBM to track metrics around deployments of sample applications to IBM Bluemix to measure the usefulness of our examples, so that we can continuously improve the content we offer to you. Only deployments of sample applications that include code to ping the Deployment Tracker service will be tracked.

## Disabling Deployment Tracking

Please see the README for the sample application that includes this package for instructions on disabling deployment tracking, as the instructions may vary based on the sample application in which this package is included.
