// map.setMapTypeId('terrain');

window.onload = function() {
	// Hides the list after the user has seen it
	setTimeout(function() {
			toggleLocationSwitcherList();
	}, 500);
};

function getKeywords(type) {
	if(type === 'hike') {
		return {
			keywords: ['Fjelltur', 'Tur'],
			icon: 'fa fa-compass fa-lg'
		};
	} else if(type === 'restaurant') {
		return {
			keywords: ['Restaurant'],
			icon: 'fa fa-compass fa-lg'
		};
	} else if(type === 'landmark') {
		return {
			keywords: ['Severdighet'],
			icon: 'fa fa-map-marker fa-lg'
		};
	}
}

function concatType() {
}

var favoriteLocations = [
	{
		title: 'Sverd i fjell',
		type: getKeywords('hike'),

		location: {
			lat: 58.9413738,
			lng: 5.6713647
		}
	},

	{
		title: 'Stavanger domkirke',
		type: getKeywords('landmark'),

		location: {
			lat: 58.9696008,
			lng: 5.7327193
		}
	},

	{
		title: 'Kjeragbolten',
		type: getKeywords('hike'),

		location: {
			lat: 59.0346734,
			lng: 6.5753282
		}
	},

	{
		title: 'Preikestolen',
		type: getKeywords('hike'),

		location: {
			lat: 58.9857634,
			lng: 6.1575914
		}
	},

	{
		title: 'Trolltunga',
		type: getKeywords('hike'),

		location: {
			lat: 60.124167,
			lng: 6.7378113
		}
	},

	{
		title: 'Sauanuten',
		type: getKeywords('hike'),

		location: {
			lat: 59.8274041,
			lng: 6.3854395
		}
	},

	{
		title: 'Ulriken',
		type: getKeywords('hike'),

		location: {
			lat: 60.3774889,
			lng: 5.3847581
		}
	},
];

// Location constructor
// Takes the favorite locations and puts them in the locations array.
// The constructor creates some extra objects.
function Location(title, type, location) {
	this.title = title;
	this.type = type;
	this.location = location;
	this.visible = ko.observable(true);

	// Wikipedia:
	this.wikipedia = {};
	this.wikipedia.url = {};
	this.wikipedia.ingress = {};
	this.wikipedia.bodyText = {};

	// Flickr:
	this.flickr = {};
	this.flickr.img = [];
}

locations = ko.observableArray([]);

$('.location_switcher_search_field').on('input', function() {
	sendItemsToSearch(this.value);
});

function sendItemsToSearch(searchString) {
	var itemsToSearch = [];
	for (var i = 0; i < locations().length; i++) {
		// If a type filter is applied; only pass along the not filtered instances
		if(filter().active()) {
			// Make item invisible
			locations()[i].visible(false);

			// If filtering hikes; make item visible and push it to itemsToSearch
			// if(filter().type.hike()) {
				if(locations()[i].type.keywords[0] == 'Fjelltur' && filter().type.hike()) {
					locations()[i].visible(true);
					console.log("Pushing " + locations()[i].title);
					itemsToSearch.push({title: locations()[i].title.toLowerCase(), index: i});
				
				} else if(locations()[i].type.keywords[0] == 'Restaurant' && filter().type.restaurant()) {
					locations()[i].visible(true);
					console.log("Pushing " + locations()[i].title);
					itemsToSearch.push({title: locations()[i].title.toLowerCase(), index: i});

				} else if(locations()[i].type.keywords[0] == 'Severdighet' && filter().type.landmark()) {
					locations()[i].visible(true);
					console.log("Pushing " + locations()[i].title);
					itemsToSearch.push({title: locations()[i].title.toLowerCase(), index: i});

				}
			// } else {
			// 	console.log("Ignoring " + locations()[i].title + ", keyword = " + locations()[i].type.keywords[0]);
			// }
		} else {
			console.log("filter().active() = " + filter().active() + ", pushing: " + locations()[i].title);
			itemsToSearch.push({title: locations()[i].title.toLowerCase(), index: i});
		}
	}

	console.log(searchString);
	console.log(itemsToSearch);
	search(searchString, itemsToSearch);
}

sendItemsToSearch($('.location_switcher_search_field').val());

// function compare(searchString, searchItems) {

// 	for (var i = 0; i < searchItems.length; i++) {
	
// 		var item = {
// 			name: searchItems[i],
// 			matching: true
// 		};

// 		for (var j = 0; j < item.name.length; j++) {

// 			var notMatching = 0;
// 			for (var k = 0; k < searchString.length; k++) {

// 				console.log(searchString[0].search(item.name));

// 			}

// 		}

// 	}

// }

function search(search, strings) {
	search = search.toLowerCase();
	// string = string.toLowerCase();

	console.log(search + strings.title);

	
	var matches = strings.filter(function(item) {
		var posOfLastFound = -1; // remembers position of last found character
		
		// consider each search character one at a time
		for (var i = 0; i < search.length; i++) {
			var searchItem = search[i];
			if (searchItem == ' ') continue;     // ignore spaces
			
			posOfLastFound = item.title.indexOf(searchItem, posOfLastFound+1);     // search for character & update position
			if (posOfLastFound == -1) {

				console.log("NOT FOUND: searchItem = " + searchItem + ", posOfLastFound = " + posOfLastFound + ", item = " + item.title);
				locations()[item.index].visible(false);
				return false;  // if it's not found, exclude this item
			} else {
				console.log("FOUND    : searchItem = " + searchItem + ", posOfLastFound = " + posOfLastFound + ", item = " + item.title + " ===== " + locations()[item.index].title);
				locations()[item.index].visible(true);
			}
		}
		return true;
	});
	console.log(matches);
}


	// var search = $(this).val();
	
	// /* Matching logic */
	// /* End matching logic */
	
	// $('#results').empty();
	// matches.forEach(function(match) {
	// 	$('#results').append($('<li>').text(match));
	// });







var favoriteLocationsLength = favoriteLocations.length;
console.log(favoriteLocations);
for (var i = 0; i < favoriteLocationsLength; i++) {
// for (var i = 0; i < 1; i++) {
	locations().push(new Location(favoriteLocations[i].title, favoriteLocations[i].type, favoriteLocations[i].location));
}

var filter = ko.observable({
	type: {
		hike: ko.observable(false),
		restaurant: ko.observable(false),
		landmark: ko.observable(false),

		toggleHike: function() {
			this.hike(!this.hike());
			console.log("toggling hike() " + this.hike());
			sendItemsToSearch($('.location_switcher_search_field').val());
		},
		
		toggleRestaurant: function() {
			this.restaurant(!this.restaurant());
			console.log("toggling restaurant() " + this.restaurant());
			sendItemsToSearch($('.location_switcher_search_field').val());
		},

		toggleLandmark: function() {
			this.landmark(!this.landmark());
			console.log("toggling landmark() " + this.landmark());
			sendItemsToSearch($('.location_switcher_search_field').val());
		}
	},

	active: function() {
		if(this.type.hike() || this.type.restaurant() || this.type.landmark()) {
			console.log("Checked filters and some are active!!!");
			return true;
		} else {
			console.log("Checked filters and none are active");
			return false;
		}
	},
});

var map, markers, polygon, locations, focusedMarker, test;
var ViewModel = function() {
		// Create a new blank array for all the listing markers.
		markers = ko.observableArray();

		// This global polygon variable is to ensure only ONE polygon is rendered.
		polygon = null;

		// Gives the location instances an index
		for (var i = 0; i < locations().length; i++) {
			locations()[i].index = i;
		}

		focusedMarker = ko.observable(0);

		// console.dir(markers());
		// console.dir(locations());

		this.test = function() {
				scroll(this.index);
				toggleLocationSwitcherList();
		}

		$('#location_switcher_center').click(function() {
				toggleLocationSwitcherList();
		});
}

ko.applyBindings(new ViewModel());

var locationsLength = locations().length;
var ajaxRunTimes = 0;
for (var i = 0; i < locationsLength; i++) {
	// console.log("Running for the " + i + ". time.");
	var response;

	var ajax = {
		title: locations()[i].title,

		flickr: {
			key: 'e896b44b17e42a28558673f7db2b3504'
		}
	};

	ajax.flickr.url = 'https://www.flickr.com/services/rest/';


	$.ajax({
		url: 'https://no.wikipedia.org/w/api.php?prop=info%7Cextracts',
		dataType: 'jsonp',
		data: {
			titles: ajax.title,
			action: 'query',
			// prop: ['info', 'extracts'], --> moved to url since it does't work
			inprop: "url",
			format: 'json',
			requestid: i,
		},
		success: function(response) {
			// console.log(response);
			clearTimeout(wikipediaErrorHandling);
			// for (var j = 0; j < locationsLength; j++) {
				// console.dir(i);

				// Gets the name of the first property name of the object (Since we don't have the
				// page ID - which is the name of the property)
				var firstPropertyName = Object.getOwnPropertyNames(response.query.pages)[0];
				// console.log("firstPropertyName = " + firstPropertyName);

				// Gets the object we want the first property of
				var canDo = locations()[response.requestid].wikipedia.ingress = response.query.pages;
				var extract = canDo[firstPropertyName].extract;
				var articleText = extract.split("</p>");
				var bodyText = '';

				// If first paragraph is empty; use the second one.
				// Else use the first one.
				// Some articles has an empty <p></p> at the beginning.
				if(articleText[0].length <= 3) {
					var ingress = articleText[1];

					// Adds the rest of the article to the bodyText variable
					var articleTextLength = articleText.length;
					for (var i = 2; i < articleTextLength; i++) {
						bodyText += articleText[i];
					}
				} else {
					var ingress = articleText[0];

					// Adds the rest of the article to the bodyText variable
					var articleTextLength = articleText.length;
					for (var i = 1; i < articleTextLength; i++) {
						bodyText += articleText[i];
					}
				}

				locations()[response.requestid].wikipedia.ingress = ingress;
				locations()[response.requestid].wikipedia.bodyText = bodyText;

				locations()[response.requestid].wikipedia.url = canDo[firstPropertyName].fullurl;
				response.requestid++;
				// response[1][i];
				// $wikiElem.append('<li><a href="' + response[3][i] + '">' + response[1][i] + '</a></li>');
			// }
		}
	});

	// Store the current i value
	(function(i) {
		$.ajax({
			url: ajax.flickr.url,
			type: 'GET',
			dataType: 'text',
			data: {
				method: 'flickr.photos.search',
				text: locations()[i].title,
				format: "json",
				api_key: ajax.flickr.key,
			}
		})

		.done(function(response) {
			console.log("success");
			// Removes the function wrapping and creates a JavaScript object
			// from the JSON recieved from Flickr.
			var responseJson = JSON.parse(response.slice(14, response.length - 1));
			console.log(responseJson);

			var newUrl = 'https://www.flickr.com/services/rest/?' + '&?callback=?';
			$.ajax({
				url: newUrl,
				dataType: 'text',
				data: {
					method: 'flickr.photos.getSizes',
					photo_id: responseJson.photos.photo[0].id,
					format: 'json',
					api_key: ajax.flickr.key,
				}
			})

			.done(function(response2) {
				console.log("success2");

				// Removes the function wrapping and creates a JavaScript object
				// from the JSON recieved from Flickr.
				var response2Json = JSON.parse(response2.slice(14, response2.length - 1));
				
				// console.log(response2Json.sizes.size[5].source + " === " + locations()[i].title);
				
				locations()[i].flickr.img[0] = response2Json.sizes.size[5].source;
			})

			.fail(function(jqxhr, textStatus, error) {
				// console.log(jqxhr + ", " + textStatus + ", " + error);
				console.log("fail2");
				console.log(jqxhr);
			});
		})

		.fail(function( xhr, status, errorThrown ) {
			console.log( "Error: " + errorThrown );
			console.log( "Status: " + status );
			console.dir( xhr );
		});
	})(i);
}
var imgCount = 0;
function jsonFlickrApi(data) {
	// // If photo the photo ID object is returned; fire a new ajax request
	// // asking for image url's for that photo ID.
	// // console.log(data);
	// if(data.photos) {
	//  // console.log(data.photos.photo[0].id);
	//  var newUrl = 'https://www.flickr.com/services/rest/?method=flickr.photos.getSizes' + '&?callback=?';

	//  $.ajax({
	//      url: newUrl,
	//      dataType: 'jsonp',
	//      data: {
	//          photo_id: data.photos.photo[0].id,
	//          format: 'json',
	//          api_key: 'e896b44b17e42a28558673f7db2b3504',
	//          request_id: 0
	//      }
	//  }).done(function(response) {
	//      // console.log(response);
	//  }).fail(function(jqxhr, textStatus, error) {
	//      // console.log(jqxhr + ", " + textStatus + ", " + error);
	//      // console.log(jqxhr);
	//  });

	// // Else if images is returned; add them to locations()
	// } else if(data.sizes) {
	//  // console.log(data.sizes.size[5].source);
	//  locations()[imgCount].flickr.img[0] = data.sizes.size[5].source;
	//  imgCount++;
	// }
}

var wikipediaErrorHandling = setTimeout(function() {
	console.log("timeout");
	// $("#wikipedia-header").text('Unable to connect to Wikipedia.');
	// $("#wikipedia-links").append('<li>Please try again later.</li>');
}, 5000);

var featured = {
	displaying: false
};

var locationList = {
	displaying: true,
};

var locationSwitcher = {
	displaying: true,
};

function toggleLocationSwitcher() {
	locationSwitcher.displaying = !locationSwitcher.displaying;
	$('.location_switcher_container').toggleClass('location_switcher_container_hidden');
}

// Toggles the visibility of location_switcher_list
// You can pass in the optional parameter option to either hide or display instead of toggling
function toggleLocationSwitcherList(option) {
	if(option === "hide" && locationList.displaying) {
		locationList.displaying = !locationList.displaying;
		$('.location_switcher_list_container').toggleClass('location_switcher_list_container_hidden');
	} else if(option !== "hide") {
		locationList.displaying = !locationList.displaying;
		$('.location_switcher_list_container').toggleClass('location_switcher_list_container_hidden');
	} else {
		return "Already hidden";
	}
}

function toggleFeatured(index) {
	$('.featured_container').eq(index).toggleClass('featured_container_hidden');
}

function displayAvailableFeaturedContainer(locationIndex) {
	if(featured.displaying === false) {
		toggleFeatured(0);
		featured.displaying = 0;

		toggleLocationSwitcher();
		toggleLocationSwitcherList("hide");
	} else if(featured.displaying === 0) {
		toggleFeatured(0);
		toggleFeatured(1);
		featured.displaying = 1;
	} else if(featured.displaying === 1) {
		toggleFeatured(1);
		toggleFeatured(0);
		featured.displaying = 0;
	}

	populateFeatured(featured.displaying, locationIndex);
}

function hideFeaturedContainer() {
	$('.featured_container').eq(featured.displaying).toggleClass('featured_container_hidden');
	toggleLocationSwitcher();

	featured.displaying = false;
}

function displayBodyText(index) {
	$('.article_body').eq(index).toggleClass('article_body_hidden');
	$('.article_body_read_more').eq(index).toggleClass('article_body_read_more_hidden');
	$('.article_body_read_more_button').eq(index).toggleClass('article_body_read_more_button_hidden');
}

// Populates the featured view with appropriate content.
// Requires index of marker and the index of which featured container to populate.
function populateFeatured(featuredIndex, locationIndex) {
	var location = locations()[locationIndex];
	clearFeatured(featuredIndex);
	$('.featured_container').eq(featuredIndex).find('.featured_image_container').append('<img class="" alt="' + location.title + '" src="' + location.flickr.img + '">');
	$('.featured_container').eq(featuredIndex).find('.article_heading').text(location.title);
	$('.featured_container').eq(featuredIndex).find('.ingress').html(location.wikipedia.ingress);
	$('.featured_container').eq(featuredIndex).find('.body_text').html(location.wikipedia.bodyText);
	$('.featured_container').eq(featuredIndex).find('cite>a').attr('href', location.wikipedia.url);
}

// Clears the content of the featured view.
// Requires the index of which featured to clear.
function clearFeatured(featuredIndex) {
	$('.featured_container').eq(featuredIndex).find('.featured_image_container').html("");
	$('.featured_container').eq(featuredIndex).find('.article_heading').html("");
	$('.featured_container').eq(featuredIndex).find('.ingress').html("");
	$('.featured_container').eq(featuredIndex).find('.body_text').html("");

}

function readMore(locationIndex) {
	console.log(locationIndex);
	displayAvailableFeaturedContainer(locationIndex);
	infoWindow.closeAll();
}

function scroll(index) {
	var marker = markers()[index];

	focusedMarker(index);
	moveToMarker(markers()[index]);

	infoWindow.closeAll(marker);
	infoWindow.populate(marker, new google.maps.InfoWindow());

	$('#swipe_list').animate({
		scrollLeft: $(".location_switcher_swipe_list_item")[index].offsetLeft - $(".location_switcher_swipe_list_item").eq(index).width() / 2
	}, 200);
}

function swipeLeft() {
		// If there is more to scroll to; scroll
		if(focusedMarker() - 1 >= 0 && focusedMarker() - 1 < locations().length) {
				scroll(focusedMarker() - 1);
		}
}

function swipeRight() {
		// If there is more to scroll to; scroll
		if(focusedMarker() + 1 >= 0 && focusedMarker() + 1 < locations().length) {
				scroll(focusedMarker() + 1);
		}
}

function moveToMarker(marker) {
		var coordinates = {
				lat: marker.position.lat(),
				lng: marker.position.lng()
		};

		map.panTo(coordinates);
}

var infoWindow = {
	populate: function(marker, infowindow) {
		// If marker does not have an infoWindow; make one
		if(!marker.infoWindow) {
			marker.infoWindow = new google.maps.InfoWindow();
			console.log("Created new infoWindow (for marker " + marker.index + ") = " + marker.infoWindow);
		}

		// Set infoWindow content
		marker.infoWindow.setContent('<div style="width: 200px;"><h5>' + marker.title + '</h5><p>' + locations()[marker.index].wikipedia.ingress + '</p><p><a onclick="readMore(' + marker.index + ')">Les meir</a></p></div>');

		// Close the infoWindow on "x" click
		marker.infoWindow.addListener('closeclick', function() {
			marker.infoWindow.close();
		});

		// Open the infoWindow
		marker.infoWindow.open(map, marker);
	},

	closeAll: function(exception) {
		var markerLength = markers().length;
		for (var i = 0; i < markerLength; i++) {
			// If there is an exception and it has an infoWindow; don't close that one
			if(exception) {
				if(markers()[i].title !== exception.title && markers()[i].infoWindow) {
					if(markers()[i].infoWindow.anchor !== null) {
						markers()[i].infoWindow.close();
					}
				}
			} else if(markers()[i].infoWindow) {
				markers()[i].infoWindow.close();
			}
		}
	}
};

function initMap() {
		console.log("creating map");

		// Create a styles array to use with the map.
		var styles = [
				{
						featureType: 'water',
						stylers: [
								{ color: '#19a0d8' }
						]
				},{
						featureType: 'administrative',
						elementType: 'labels.text.stroke',
						stylers: [
								{ color: '#ffffff' },
								{ weight: 6 }
						]
				},{
						featureType: 'administrative',
						elementType: 'labels.text.fill',
						stylers: [
								{ color: '#e85113' }
						]
				},{
						featureType: 'road.highway',
						elementType: 'geometry.stroke',
						stylers: [
								{ color: '#efe9e4' },
								{ lightness: -40 }
						]
				},{
						featureType: 'transit.station',
						stylers: [
								{ weight: 9 },
								{ hue: '#e85113' }
						]
				},{
						featureType: 'road.highway',
						elementType: 'labels.icon',
						stylers: [
								{ visibility: 'off' }
						]
				},{
						featureType: 'water',
						elementType: 'labels.text.stroke',
						stylers: [
								{ lightness: 100 }
						]
				},{
						featureType: 'water',
						elementType: 'labels.text.fill',
						stylers: [
								{ lightness: -100 }
						]
				},{
						featureType: 'poi',
						elementType: 'geometry',
						stylers: [
								{ visibility: 'on' },
								{ color: '#f0e4d3' }
						]
				},{
						featureType: 'road.highway',
						elementType: 'geometry.fill',
						stylers: [
								{ color: '#efe9e4' },
								{ lightness: -25 }
						]
				}
		];

		// Constructor creates a new map - only center and zoom are required.
		map = new google.maps.Map(document.getElementById('map'), {
				center: {lat: 40.7413549, lng: -73.9980244},
				zoom: 13,
				styles: styles,
				mapTypeControl: false
		});

		for (var i = 0; i < locations().length; i++) {
				// Get the position from the location array.
				var position = locations()[i].location;
				var title = locations()[i].title;
				// Create a marker per location, and put into markers array.
				var marker = new google.maps.Marker({
						position: position,
						title: title,
						// animation: google.maps.Animation.DROP,
						// icon: pin,
						index: i
				});

				marker.addListener('click', function() {
					console.log("clicked " + marker);
					infoWindow.closeAll(this);
					infoWindow.populate(this, new google.maps.InfoWindow());

					// console.log(markers()[i-1]); Is always the last marker?!
					toggleBounce(markers()[i-1]);
				});

				// marker.toggleBounce = toggleBounce(markers()[i]);

				function toggleBounce(obj) {
					console.log(obj);
					if(obj.getAnimation() !== null) {
						obj.setAnimation(null);
					} else {
						obj.setAnimation(google.maps.Animation.BOUNCE);
					}
				}

				// Push the marker to our array of markers.
				markers().push(marker);
		}

		// Add markers to the map
		function displayMarkers() {
				var bounds = new google.maps.LatLngBounds();
				// Extend the boundaries of the map for each marker and display the marker
				for (var i = 0; i < markers().length; i++) {
						markers()[i].setMap(map);
						bounds.extend(markers()[i].position);
				}
				map.fitBounds(bounds);
		}

		displayMarkers();
}