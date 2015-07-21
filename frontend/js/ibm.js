/**
* @fileOverview Barbarian Group - IBM 2015 TravelDemo
* @version 1.0
*/

// declare IBM in case it has not been declared yet
window.IBM = window.IBM || {};

/**
* @name IBM.TravelDemo
* @namespace The public namespace and api for the IBM TravelDemo functionality.
* @description The public namespace and api for the IBM TravelDemo functionality.
* @requires IBM
*/

IBM.TravelDemo = (function(IBM, window){

	var departureDate = new Date(),
		returningDate = new Date( departureDate.getTime() + 7 * 24 * 60 * 60 * 1000),
		departureDateVisual,
		returningDateVisual,
		destination = null,
		$bookFlight = $("#book-flight"),
		$confirmationFlight = $("#confirmation-flight"),
		iframeContainer = $('.iframe-container'),
		infoTimeout = null,

	init = function(){
		//get dparture and return dates from form
		departureDateVisual = getDate( departureDate, $('#datepicker-depart') );
		returningDateVisual = getDate( returningDate, $('#datepicker-arrive') );

		//initialize the dom events
		bind();

		if (document.location.hostname == "localhost") {
			$('.iframe-local').removeClass( "hidden" );
		}
	},

	checkProgress = function ( path, cb ) {
		console.log ( "Check Progress", path, cb );
		var request = new XMLHttpRequest();
		request.open("GET", path, true);
		request.setRequestHeader('Content-Type','application/json');
		request.send();
		request.onreadystatechange = function(e) {
			if (request.readyState == 4) {
				console.log ( 'request.readyState' , request.readyState, "request.status: " , request.status , "request.responseText ", request.responseText);
				cb( request.responseText );
			}
		};
	},
	checkmqlightCB = function( response ) {
		console.log("Mqlight response: ", response);
		IBM.DemoTutorial.mqLightSuccess(response);
	},

	checkcloudantCB = function(response) {
		console.log("Cloudant response: ", response);
		IBM.DemoTutorial.cloudantSuccess(response);
	},

	checkmqlightmessageCB = function(response) {
		console.log("Mqlight message: ", response);
	},

	//private methods or variables
	bind = function(){

		// initialize MQlight service
		checkProgress( "/rest/checkmqlight" );

		// initialize Cloudant service
		checkProgress( "/rest/checkcloudant" );

		$('form').submit(function(e){
			e.preventDefault();
			submitRequest();
			$('#myModal').removeClass('in');
			setTimeout(function(){
				$('#myModal').modal('hide');
			},600);
		});

		iframeContainer = $('.iframe-container');
		$('.iframe-container .open-iframe').on( 'click', function() {
			iframeContainer.toggleClass("open");
		});

		$('.book-it').on('click', function(e){
			e.preventDefault();

			var $toVal = ($("#to").val());

			if($toVal !== null){
				$('#story').hide();
				//simulate ajax
				setTimeout(showLoader, 1000);
				//simulate ajax
				setTimeout(showModal, 2000);
				//simulate ajax
				setTimeout( loadPageConfirmation, 2500);
			}
		});

		$('.book-another').on('click', loadPageBookFlight );

		$('body').on('click', '.close', function(){
		   $('.notification').hide();
		});

		$('.fork-git').on('click', function(){
			window.location = 'https://github.com/IBM-Bluemix/fintech-travel';
		});

		//bind return key to form submit
		$(document).keypress(function(e) {
			var charCode;
			if (e && e.which) {
				charCode = e.which;
			} else if (window.event) {
				e = window.event;
				charCode = e.keyCode;
			}
			if (charCode == 13) {
				submitRequest();
			}
		});
	},

	loadPageBookFlight = function() {
		$bookFlight.removeClass("hidden");
		$confirmationFlight.addClass("hidden");
		$('body, .banner').removeClass('confirmation');
		$('.to-arrow').hide();
	},

	loadPageConfirmation = function() {
		setupConfirmation();
		$bookFlight.addClass("hidden");
		iframeContainer.removeClass('hidden');
		$confirmationFlight.removeClass("hidden");
		$('body, .banner').addClass('confirmation');

		localStorage.removeItem("step");
	},

	setupConfirmation = function() {

		var $dest = $('.dest-abbr');

		var today = getDepart(),
			returnDate = getReturn();

			console.log ( 'returnDate' , returnDate, today );

		switch ( getDestination() ){
			case "London, United Kingdom":
				$dest.text("LHR");
				break;
			case "Tokyo, Japan":
				$dest.text("NRT");
				break;
			case  "Paris, France":
				$dest.text("CDG");
				break;
			default :
				abbr = "LHR";
		}

		$('.depart-date > strong').text(today[1] + ' ' + today[2] + ' 7:00 AM');
		$('.return-date > strong').text(returnDate[1] + ' ' + returnDate[2] + ' 10:00 AM');

	},

	submitRequest = function() {
		console.log ( "submitRequest" );
		var url = "rest/bank_notification";

		var destination = document.getElementById("to").value,
			departDate = document.getElementById("datepicker-depart").value,
			returnDate = document.getElementById("datepicker-arrive").value;

			console.log ( 'd: ', {
					"destination":destination,
					"departDate":departDate,
					"returnDate":returnDate
				});
		try {
			var request = new XMLHttpRequest();
			request.open("POST", url, true);
			request.setRequestHeader('Content-Type','application/json');
			request.send(JSON.stringify(
				{
					"destination":destination,
					"departDate":departDate,
					"returnDate":returnDate
				}
			));
			console.log ( "request", destination, departDate, returnDate );
			request.onreadystatechange=function() {
				if (request.readyState==4 && request.status==200) {
				  $('.notification-success').show();
				}
			};
			if (infoTimeout === null) infoTimeout = setTimeout(function(){
				console.log("No messages were received within 10 seconds of sending a sentence.<br/>" +
					"- Check your back-end application is running<br/>" +
					"- Use <code>cf logs</code> to check for errors in the back-end application<br/>" +
					"- Check you do not have other browser windows open on this page that received the notifications");
			}, 10000);
		}
		catch (err) {
			console.log("REST/HTTP POST of words failed: " + err.message);
		}
	},

	getDestination = function(){
		console.log ( 'destination' , destination );
		return destination;
	},

	getDepart = function(){
		return departureDateVisual;
	},

	getReturn = function(){
		return returningDateVisual;
	},
	//get and format the date
	getDate = function( date, $field ){

		var dd = date.getDate();
		var mm = date.getMonth()+1;
		var yyyy = date.getFullYear();

		var month;
		if(dd<10) {
			dd='0'+dd;
		}

		if(mm<10) {
			mm='0'+mm;
		}

		switch(mm){
			case 0:
				month = 'January';
				break;
			case 1:
				month = 'February';
				break;
			case 2:
				month = 'March';
				break;
			case 3:
				month = 'April';
				break;
			case 4:
				month = 'May';
				break;
			case 5:
				month = 'June';
				break;
			case 6:
				month = 'July';
				break;
			case 7:
				month = 'August';
				break;
			case 8:
				month = 'September';
				break;
			case 9:
				month = 'October';
				break;
			case 10:
				month = 'November';
				break;
			case 11:
				month = 'December';
				break;
			default:
				month = 'June';
		}

		dateValue = [yyyy+'-'+mm+'-'+dd, month, dd, yyyy];

		$field.val(dateValue[0]);

		return dateValue;
	},

	showModal = function(){
		// FIRES THE BANK NOTIFICATIN WORKER
		var $to = $('#to');
		destination = $to.val();
		$('.loader').removeClass('active');
		$to.val(destination);
		$('#depart').val( departureDate );
		$('#return').val( returningDate );
		$('#myModal').modal('show');
	},
	//show a loader to simulate an ajax request
	showLoader = function(){
		$('.loader').delay(1000).addClass('active');
	};

	// public methods or variables
	return {
		init: init,
		checkProgress: checkProgress,
		checkmqlightCB: checkmqlightCB,
		checkcloudantCB: checkcloudantCB,
		checkmqlightmessageCB: checkmqlightmessageCB
	};

}(IBM, window));


IBM.DemoTutorial = (function(IBM){

	var $content = $('.content'),
		currentIndex = 0,
		length = $content.length,
		iframeContainer = $('.iframe-container'),
		init = function(){
			//get the locally stored step and update currentIndex
			getstate();
			//bind events to dom objects
			bind();
		},
		bind = function(){
			//close the story background on click
			$("#story-bg").on( "click", function() {
				closeOverlay();
			});

			//make story active or inactive
			$('.icons').on('click', function(){
				$(this).parent().toggleClass('active');
				if( $(this).parent().hasClass('active') ){
					showOverlay();
				} else {
					closeOverlay();
				}
			});

			//go to the next slide
			$('.controls').on('click', function(e){
				e.preventDefault();
				nextSlide();
			});

		},
		nextSlide = function(){

			//if we are at the end empty the localStorage
			if(currentIndex == (length -1) ){
				localStorage.removeItem("step");
			}

			if(currentIndex == (length -2) ){
				$('.controls').hide();
			}

			if(currentIndex === 0){
				$('.controls > a').addClass('next');
			}

			if(currentIndex == 1){
				$('.to-arrow').show();
				$("#story-bg").removeClass( "active" );
			}

			if(currentIndex == 2){
				$('.to-arrow').hide();
			}

			showNextStep();

		},
		showNextStep = function(){
			//hide current step
			$content.eq(currentIndex).hide();
			//increment the index
			currentIndex++;
			//save the next step to localstorage
			saveState(currentIndex);
			//show the next step
			$content.eq(currentIndex).show();
		},
		cloudantSuccess = function(response){
			//if cloudant does not return an error show the next step
			if(response === "cloudant success"){
				$('.to-arrow').show();
				$("#story-bg").removeClass( "active" );
				$('.icons').parent().removeClass('error');
				$content.eq(currentIndex).find('p').removeClass('error');
				showNextStep();
			}else{
				//show error if cloudant returns an error
				$('.icons').parent().addClass('error');
				errorMessage('four', 'you did something wrong, try again.');
			}
		},
		mqLightSuccess = function(response){
			console.log(response);
			//if mqLight does not return an error show the next step
			if(response === "mqlight success"){
				//iframeContainer.removeClass('hidden');
				$('.icons').parent().removeClass('error');
				$content.eq(currentIndex).find('p').removeClass('error');
				showNextStep();
			}else{
				//show errror if mqLight returns an error
				$('.icons').parent().addClass('error');
				errorMessage('three', 'you did something wrong, try again.');
			}
		},

		errorMessage = function(target, error){
			//display error message and add class to make the text red
			$('.content.' + target).find('p').text(error).addClass('error');
		},
		closeOverlay = function() {

			if(currentIndex === (length -1)){
				$('.steps, #diagram').hide();
			}

			$(".animated-circle").addClass( "animation" );
			$("#story, #story-bg").removeClass( "active" );
		},
		showOverlay = function(){
			$('.steps').show();
			$("#story-bg").addClass( "active" );
			$(".animated-circle").removeClass( "animation" );

			if(currentIndex === 4){
				$('#diagram').show();
			}
		},
		//save the tutorial state saved in localStorage
		saveState = function(step){
			// check if the browser supports localStorage
			if (!window.localStorage){
				return;
			}
			//save the current step to a key named step
			localStorage.setItem("step" , step);

		},
		//get the tutorial state saved in localStorage and present the view based on the current index
		getstate = function(){
			//check if there is something stored first, if not then return
			if(!localStorage.getItem("step")){
				currentIndex = 0;
				return false;
			}
			//update current index to the stored step
			currentIndex = localStorage.getItem("step");
			//hide the steps that are not the current step
			$content.not(':eq(currentIndex)').hide();
			//show the step at the current index
			$content.eq(currentIndex).show();
		};
	// public methods or variables
	return {
		init: init,
		cloudantSuccess: cloudantSuccess,
		mqLightSuccess: mqLightSuccess,
		getstate: getstate
	};

}(IBM, window));

IBM.TravelDemo.init();
IBM.DemoTutorial.init();
