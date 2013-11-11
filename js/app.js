/*
 * Copyright 2012 Research In Motion Limited.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/* alvins@fb.com
 *  called by the webworksready event when the environment is ready
 */
function initApp() {
	authCode = null;
	childWindow = null;

	// setup our Facebook credentials, and callback URL to monitor
	facebookOptions = {
		clientId: '*',
		clientSecret: '*',
		redirectUri: '*'
	};

	// (bbUI) push the start.html page
	bb.pushScreen('start.html', 'start');
}


/**
 *  Set click handlers for the OAuth Start button
 *  Note: window.open can only be triggered in this way, you must set a click handler for this.
 */
function setClickHandlers() {
	console.log('set click handlers');

	var link = document.getElementById('btnStart');
	link.addEventListener('click', function(e) {

		// if the childWindow is already open, don't allow user to click the button
		if(childWindow !== null) {
			return false;
		}

		e.preventDefault();
		toast('Contacting Facebook...');
		setTimeout(function() {
			startOAuth();
		}, 500);
	});
}


/**
 *  Start the OAuth process by opening a childWindow, and directing the user to authorize the app
 */
function startOAuth() {
	// open the authorzation url	
	var url = 'https://www.facebook.com/dialog/oauth?client_id=' + facebookOptions.clientId + '&redirect_uri=' + facebookOptions.redirectUri + '&scope=publish_stream,read_stream';
	console.log('startingOauth with url ' + url);
	childWindow = window.open(url);
	console.log('childWindow is ' + childWindow.window.location);

	// evaluate the url every second, when facebook redirects to our callback url, the following if statements gets fired
	window.int = self.setInterval(function() {
		var currentURL = childWindow.location.href;
		console.log('currentURL is ' + currentURL);
		var callbackURL = facebookOptions.redirectUri;
		var inCallback = currentURL.indexOf(callbackURL);
		
		//bb.pushScreen('connected.html', 'connected');		
		
		setTimeout(function() {
			// location has changed to our callback url, parse the oauth code
			//if(currentURL == 'http://innovateordieonline.com/*') {
				//console.log('trying to parse oauth code')
				// stop the interval from checking for url changes	
				window.clearInterval(int)

				// parse the oauth code
				var code = childWindow.window.location.search;
				//console.log('code is first ' + code);
				code = code.split('code=');
				code = code[1];
				window.authCode = code;
				//console.log('code is '+code);
				//console.log('window.authCode is ' + window.authCode)
				
				// close the childWindow
				childWindow.close();

				setTimeout(function() {
					bb.pushScreen('connected.html', 'connected');
					getAccessToken();
				}, 1000);
		    }, 7000);
		

			
		//}
	}, 1000);
}


/**
 *  echange the oauth code, from an access token
 */
function getAccessToken() {
	toast('Fetching access token...');
	var url = 'https://graph.facebook.com/oauth/access_token?client_id=' + facebookOptions.clientId + '&redirect_uri=' + facebookOptions.redirectUri + '&client_secret=' + facebookOptions.clientSecret + '&code=' + window.authCode;

	$.ajax({
		type: 'GET',
		url: url,
		success: function(data) {
			var response = data;

			// parse 'access_token' from the response
			var response = response.split('&');
			var theAccessToken = response[0].split('=');
			window.accessToken = theAccessToken[1];

			// get authenticated users' info/name
			//getUserInfo();
			getGroupInfo();
		},

		error: function(data) {
			alert('Error getting access_token: ' + data.responseText);
			return false;
		}
	});
	
	
}


/**
 *  get users info (we're grabbing their full name for this sample)
 */
function getBadges() {
	var url = 'https://graph.facebook.com/me?fields=groups&access_token=' + accessToken;

	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'json',
		success: function(data) {
			//bb.pushScreen('connected.html', 'connected');
			window.userName = data.name;
			window.groupName = data.groups.data[0].name;
			window.groupID = data.groups.data[0].id;
			console.log(window.groupName);
			
		},

		error: function(data) {
			alert('Error getting users info: ' + data.responseText);
			return false;
		}
	});
		
	if(window.groupName = "Creativity, Innovation, and Change (PennState - Coursera Course)"){
		console.log('the if statement worked');
	//	$('#badges').html('<div data-bb-type="item" data-bb-img="images/badge.png" data-bb-title="Badge">Congradulations</div>');
		 var items = [];
		
		 var item = document.createElement('div');
	     item.setAttribute('data-bb-type','item');
	     item.setAttribute('data-bb-title','First Facebook Post');
	     item.innerHTML = 'Congratulations on joining the FB Group';
	     item.setAttribute('data-bb-img','images/badge1.png');	     
	     items.push(item);
	     
	     document.getElementById('badges').refresh(items);
	     i++
	}
	
	$('#progressBar').css('visibility','visible').hide().fadeIn().removeClass('hidden');
		
}


/**
 *  get authenticated user's feed
 */
function getFeed() {

	toast('Refreshing feed...');

	$('#content p').remove();
	var url = 'https://graph.facebook.com/'+window.groupID+'/feed?access_token=' + accessToken;
	
	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'json',
		success: function(data) {
			//console.log(data.data);
			var feed = data.data;
			

			// show the last 10 items from the users news feed
			// note: there are several objects that could be posted in a news feed. for simplicity
			// we're only showing objects with a 'story' attribute
			for(var i = 0; $('#content p').size() < 10; i++) {
				if(typeof feed[i].message !== 'undefined') {
					$('#content').append('<li class="list-group-item">' + feed[i].message + '</li><br>');
				}
			}
		},

		error: function(data) {
			alert('Error loading news feed: ' + data.responseText);
			return false;
		}
	});
}


/**
 *  post to authenticated user's feed
 */
function postToFeed() {
	var randomNum = Math.round(Math.random() * 999 + 1);
	var status = 'Test (' + randomNum + ') of the Facebook Badges for Jobs App';
	var url = 'https://graph.facebook.com/me/feed?message=' + status + '&access_token=' + accessToken;

	$.ajax({
		type: 'POST',
		url: url,
		dataType: 'json',
		success: function(data) {
			getFeed();
		},

		error: function(data) {
			alert('Error updating status: ' + data.responseText);
			return false;
		}
	});
}


/**
 *  helper function to display a toast message to the user
 */
function toast(msg) {
	blackberry.ui.toast.show(msg);
}

function getGroupInfo() {
	var url = 'https://graph.facebook.com/me?fields=groups&access_token=' + accessToken;

	$.ajax({
		type: 'GET',
		url: url,
		dataType: 'json',
		success: function(data) {
			//bb.pushScreen('connected.html', 'connected');
			window.userName = data.name;
			window.groupName = data.groups.data[0].name;
			window.groupID = data.groups.data[0].id;
			console.log(window.groupName);
			
		},

		error: function(data) {
			alert('Error getting users info: ' + data.responseText);
			return false;
		}
	});
}