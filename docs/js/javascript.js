var map, markers, polygon, locations, focusedMarker, test;

var featuredContent = ko.observable({
	first: {
		title: ko.observable(),
		wikipedia: ko.observable({
			ingress: ko.observable(),
			bodyText: ko.observable(),
			url: ko.observable(),
		}),

		flickr: ko.observable({
			img: ko.observableArray([]),
		}),
	},

	slick: {
		infinite: true,
		slidesToShow: 1,
		autoplay: true,
		autoplaySpeed: 5000,
		draggable: true,
		arrows: true,
		// appendArrows: $(".featured_image_container"),
	},

	slickLocationSwitcher: {
		infinite: false,
		slidesToShow: 1,
		autoplay: false,
		draggable: true,
		arrows: true,
		nextArrow: $('.location_switcher_arrow_right'),
		prevArrow: $('.location_switcher_arrow_left'),
		// appendArrows: $(".featured_image_container"),
	}
});

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

var ViewModel = function() {
		// Create a new blank array for all the listing markers.
		markers = ko.observableArray();

		// After the page is loaded, listen for changes in the markers() array
		window.onload = function() {
			markers.subscribe(function(newValue) {
				console.log("Markers() got a new value! = " + markers());
				reslickFeatured();
			});
		};

		// This global polygon variable is to ensure only ONE polygon is rendered.
		polygon = null;

		focusedMarker = ko.observable(0);

		// console.dir(markers());
		// console.dir(locations());

		this.test = function() {
			scroll(this.index);
			toggleLocationSwitcherList();
		};

		$('#location_switcher_center').click(function() {
			toggleLocationSwitcherList();
		});
};

ko.applyBindings(new ViewModel());

// map.setMapTypeId('terrain');

window.onload = function() {
	// Initialize slick on featured views
	console.log('Initialize slick carousels');
	$(".featured_image_container").slick(featuredContent().slick);

	// Initialize Slick on location switcher and add beforeChange listener
	$(".location_switcher_swipe_list").slick(featuredContent().slickLocationSwitcher);
	$('.location_switcher_swipe_list').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
		console.log(nextSlide);
		focusMarker(nextSlide);
	});

	// Hides the list after the user has seen it
	setTimeout(function() {
		console.log('Hide location list');
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

var favoriteLocations = [
	{
		title: 'Sverd i fjell',
		type: getKeywords('landmark'),

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


$('.location_switcher_search_field').on('input', function() {
	sendItemsToSearch(this.value);
});

// Reinitialize slick (needed on content change)
// Initialized in window.onload function
function reslickFeatured() {
	console.log('Reslicking!');
	$(".featured_image_container").slick('unslick');
	$(".featured_image_container").slick(featuredContent().slick);
}

// Reinitialize slick (needed on content change)
// Initialized in window.onload function
function reslickSwipeList() {
	console.log('Reslicking!');
	$(".location_switcher_swipe_list").slick('unslick');
	$(".location_switcher_swipe_list").slick(featuredContent().slickLocationSwitcher);
}

function sendItemsToSearch(searchString) {
	var itemsToSearch = [];
	for (var i = 0; i < markers().length; i++) {
		// If a type filter is applied; only pass along the not filtered instances
		if(filter().active()) {
			// Make item invisible
			// console.log("HIDIIIIIIIIIIIIIIIIIIIIIIING");
			markerVisibillity(markers()[i], false);

			// If filtering hikes; make item visible and push it to itemsToSearch
			// if(filter().type.hike()) {
				if(markers()[i].type.keywords[0] == 'Fjelltur' && filter().type.hike()) {
					markerVisibillity(markers()[i], true);
					console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});
				
				} else if(markers()[i].type.keywords[0] == 'Restaurant' && filter().type.restaurant()) {
					markerVisibillity(markers()[i], true);
					console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});

				} else if(markers()[i].type.keywords[0] == 'Severdighet' && filter().type.landmark()) {
					markerVisibillity(markers()[i], true);
					console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});

				}
			// } else {
			// 	console.log("Ignoring " + markers()[i].koTitle() + ", keyword = " + markers()[i].type.keywords[0]);
			// }
		} else {
			markerVisibillity(markers()[i], true);
			console.log("filter().active() = " + filter().active() + ", pushing: " + markers()[i].koTitle());
			itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});
		}
	}

	console.log(searchString);
	console.log(itemsToSearch);
	search(searchString, itemsToSearch);
}

function markerVisibillity(object, visibillity) {
	console.log("HIDIIIIIIIIIIIIIIIIIIIIIIING " + object.koTitle());
	object.visible2(visibillity);
	object.setVisible(visibillity);
	reslickSwipeList();
}

sendItemsToSearch($('.location_switcher_search_field').val());

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
				markerVisibillity(markers()[item.index], false);
				return false;  // if it's not found, exclude this item
			} else {
				console.log("FOUND    : searchItem = " + searchItem + ", posOfLastFound = " + posOfLastFound + ", item = " + item.title + " ===== " + markers()[item.index].koTitle());
				markerVisibillity(markers()[item.index], true);
			}
		}
		return true;
	});
	console.log(matches);
}

var markersLength = markers().length;
var ajaxRunTimes = 0;
var ajax = {
	title: '',

	flickr: {
		key: 'e896b44b17e42a28558673f7db2b3504',
		url: 'https://www.flickr.com/services/rest/',
		imgCount: 3
	},

	nasjonalturbase: {
		key: '9718dda12c871525b0c2d976e02986c68de29abe',
		url: 'http://api.nasjonalturbase.no/v0/turer/'
	}
};

function getExternalResources() {
	markersLength = markers().length;
	for (var i = 0; i < markersLength; i++) {
		// Sets the title to work with
		ajax.title = markers()[i].koTitle();

		// Flickr Ajax calls
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
				clearTimeout(wikipediaErrorHandling);
				// Gets the name of the first property name of the object (Since we don't have the
				// page ID - which is the name of the property)
				var firstPropertyName = Object.getOwnPropertyNames(response.query.pages)[0];
				// console.log("firstPropertyName = " + firstPropertyName);

				// Gets the object we want the first property of
				var canDo = response.query.pages;
				var extract = canDo[firstPropertyName].extract;
				var articleText = extract.split("</p>");
				var bodyText = '';
				var ingress = '';

				// If first paragraph is empty; use the second one.
				// Else use the first one.
				// Some articles has an empty <p></p> at the beginning.
				if(articleText[0].length <= 3) {
					ingress = articleText[1];

					// Adds the rest of the article to the bodyText variable
					articleTextLength = articleText.length;
					for (var i = 2; i < articleTextLength; i++) {
						bodyText += articleText[i];
					}
				} else {
					ingress = articleText[0];

					// Adds the rest of the article to the bodyText variable
					articleTextLength = articleText.length;
					for (var i = 1; i < articleTextLength; i++) {
						bodyText += articleText[i];
					}
				}

				markers()[response.requestid].wikipedia.ingress(ingress);
				markers()[response.requestid].wikipedia.bodyText(bodyText);

				markers()[response.requestid].wikipedia.url(canDo[firstPropertyName].fullurl);
				response.requestid++;
			}
		});

		// Flickr Ajax calls
		// Store the current i value
		(function(i) {
			$.ajax({
				url: ajax.flickr.url,
				type: 'GET',
				dataType: 'text',
				data: {
					method: 'flickr.photos.search',
					text: markers()[i].koTitle(),
					format: "json",
					api_key: ajax.flickr.key,
				}
			})

			.done(function(response) {
				// Removes the function wrapping and creates a JavaScript object
				// from the JSON recieved from Flickr.
				var responseJson = JSON.parse(response.slice(14, response.length - 1));
				console.log(responseJson);

				for (var j = 0; j < ajax.flickr.imgCount; j++) {
					(function(j) {
						console.log("running!");
						$.ajax({
							url: ajax.flickr.url + '?&?callback=?',
							dataType: 'text',
							data: {
								method: 'flickr.photos.getSizes',
								photo_id: responseJson.photos.photo[j].id,
								format: 'json',
								api_key: ajax.flickr.key,
							}
						})

						.done(function(response2) {
							// Removes the function wrapping and creates a JavaScript object
							// from the JSON recieved from Flickr.
							var response2Json = JSON.parse(response2.slice(14, response2.length - 1));

							console.log(j);
							console.log(response2Json);
							markers()[i].flickr.img().push(response2Json.sizes.size[5].source);
						})

						.fail(function(jqxhr, textStatus, error) {
							// console.log(jqxhr + ", " + textStatus + ", " + error);
							console.log("fail2");
							console.log(jqxhr);
						});
					})(j);
				}
			})

			.fail(function( xhr, status, errorThrown ) {
				console.log( "Error: " + errorThrown );
				console.log( "Status: " + status );
				console.dir( xhr );
			});
		})(i);

		// Nasjonal turbase ajax calls
		// Store the current i value
		// (function(i) {
		// 	$.ajax({
		// 		url: ajax.nasjonalturbase.url,
		// 		type: 'GET',
		// 		dataType: 'text',
		// 		data: {
		// 			// method: 'flickr.photos.search',
		// 			// text: markers()[i].koTitle(),
		// 			format: "json",
		// 			api_key: ajax.nasjonalturbase.key,
		// 		}
		// 	})

		// 	.done(function(response) {

		// 	})

		// 	.fail(function( xhr, status, errorThrown ) {
		// 		console.log( "Error: " + errorThrown );
		// 		console.log( "Status: " + status );
		// 		console.dir( xhr );
		// 	});
		// })(i);
	}
}

function jsonFlickrApi(data) {
}

var wikipediaErrorHandling = setTimeout(function() {
	console.log("Wikipedia Ajax calls timed out!");
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
	reslickFeatured();
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
function populateFeatured(featuredIndex, markerIndex) {
	featuredContent().first.title(markers()[markerIndex].koTitle());
	
	// Wikipedia:
	var ingress = markers()[markerIndex].wikipedia.ingress();
	var url = markers()[markerIndex].wikipedia.url();
	var img = markers()[markerIndex].flickr.img();
	featuredContent().first.wikipedia().ingress(ingress);
	featuredContent().first.wikipedia().bodyText(markers()[markerIndex].wikipedia.bodyText());
	featuredContent().first.wikipedia().url(url);
	
	// Flickr:
	featuredContent().first.flickr().img(img);

	// var location = markers()[locationIndex];
	// clearFeatured(featuredIndex);
	// $('.featured_container').eq(featuredIndex).find('.featured_image_container').append('<img class="" alt="' + location.title + '" src="' + location.flickr.img + '">');
	// $('.featured_container').eq(featuredIndex).find('.article_heading').text(location.title);
	// $('.featured_container').eq(featuredIndex).find('.ingress').html(location.wikipedia.ingress());
	// $('.featured_container').eq(featuredIndex).find('.body_text').html(location.wikipedia.bodyText());
	// $('.featured_container').eq(featuredIndex).find('cite>a').attr('href', location.wikipedia.url());
}

// Clears the content of the featured view.
// Requires the index of which featured to clear.
function clearFeatured(featuredIndex) {
	// $('.featured_container').eq(featuredIndex).find('.featured_image_container').html("");
	// $('.featured_container').eq(featuredIndex).find('.article_heading').html("");
	// $('.featured_container').eq(featuredIndex).find('.ingress').html("");
	// $('.featured_container').eq(featuredIndex).find('.body_text').html("");

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

function focusMarker(index) {
	var marker = markers()[index];

	focusedMarker(index);
	moveToMarker(markers()[index]);

	infoWindow.closeAll(marker);
	infoWindow.populate(marker, new google.maps.InfoWindow());
}

function swipeLeft() {
	// If there is more to scroll to; scroll
	if(focusedMarker() - 1 >= 0 && focusedMarker() - 1 < markers().length) {
			scroll(focusedMarker() - 1);
	}
}

function swipeRight() {
	// If there is more to scroll to; scroll
	if(focusedMarker() + 1 >= 0 && focusedMarker() + 1 < markers().length) {
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
		marker.infoWindow.setContent('<div style="width: 200px;"><h5>' + marker.title + '</h5><p>' + markers()[marker.index].wikipedia.ingress() + '</p><p><a onclick="readMore(' + marker.index + ')">Les meir</a></p></div>');

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
				if(markers()[i].koTitle() !== exception.koTitle() && markers()[i].infoWindow) {
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

	// Styles which will be applied to the map.
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

	for (var i = 0; i < favoriteLocations.length; i++) {
		// Create a marker per location, and put into markers array.
		var marker = new google.maps.Marker({
			position: favoriteLocations[i].location,
			title: favoriteLocations[i].title,
			koTitle: ko.observable(favoriteLocations[i].title),
			// animation: google.maps.Animation.DROP,
			// icon: pin,
			index: i,
			type: favoriteLocations[i].type,
			visible2: ko.observable(true),

			// Wikipedia
			wikipedia: {
				url: ko.observable(''),
				ingress: ko.observable(''),
				bodyText: ko.observable('')
			},

			// Flickr
			flickr: {
				img: ko.observableArray([])
			},
		});

		marker.addListener('click', function() {
			// console.log("clicked " + marker);
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
		markers.push(marker);
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
	getExternalResources();
}