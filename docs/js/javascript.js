/*

	Author: Erling Tokheim
	Author URI: https://github.com/etokheim

*/


/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------
# Normalize
# Navigation
	## Links

--------------------------------------------------------------*/


/*--------------------------------------------------------------
# Defaults
--------------------------------------------------------------*/
var map, locations, focusedMarker, mapSettings;

var markers = ko.observableArray();
var focusedMarker = ko.observable(0);

var featured = ko.observable({
		displaying: ko.observable(false),

		container: [
			{
				index: ko.observable(0)
			},

			{
				index: ko.observable(0)
			}
		],
	}
);

var slickCarousel = {
	slick: {
		infinite: true,
		slidesToShow: 1,
		autoplay: true,
		autoplaySpeed: 5000,
		draggable: true,
		arrows: true,
		dots: false,
		slidesToShow: 1,
		centerMode: false,
		variableWidth: false
	},

	slickLocationSwitcher: {
		infinite: true,
		slidesToShow: 1,
		autoplay: false,
		draggable: true,
		arrows: true,
		dots: false,
		nextArrow: $('.location_switcher_arrow')[1],
		prevArrow: $('.location_switcher_arrow')[0],
	}
};

var filter = ko.observable({
	type: {
		hike: ko.observable(false),
		restaurant: ko.observable(false),
		landmark: ko.observable(false),

		toggleHike: function() {
			this.hike(!this.hike());
			sendItemsToSearch($('.location_switcher_search_field').val());
		},

		toggleRestaurant: function() {
			this.restaurant(!this.restaurant());
			sendItemsToSearch($('.location_switcher_search_field').val());
		},

		toggleLandmark: function() {
			this.landmark(!this.landmark());
			sendItemsToSearch($('.location_switcher_search_field').val());
		}
	},

	active: function() {
		if(this.type.hike() || this.type.restaurant() || this.type.landmark()) {
			return true;
		} else {
			return false;
		}
	},
});

var ViewModel = function() {
	this.test = function() {
		scroll(this.index);
		toggleLocationSwitcherList();
	};

	$('#location_switcher_center').click(function() {
		toggleLocationSwitcherList();
	});
};

ko.applyBindings(new ViewModel());

window.onload = function() {
	// Initialize slick on featured views
	console.log('Initialize slick carousels');
	// $(".featured_image_container").slick(slickCarousel.slick);
	console.log($(".featured_image_container").children().attr('class'));

	// Initialize Slick on location switcher and add beforeChange listener
	$(".location_switcher_swipe_list").slick(slickCarousel.slickLocationSwitcher);
	$('.location_switcher_swipe_list').on('beforeChange', function(event, slick, currentSlide, nextSlide) {
		// console.log(nextSlide);
		focusMarker(nextSlide);
	});

	// Hides the list after the user has seen it
	setTimeout(function() {
		// console.log('Hide location list');
		toggleLocationSwitcherList();
	}, 500);

	// displayAvailableFeaturedContainer(0);
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
			icon: 'fa fa-cutlery fa-lg'
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

	{
		title: 'Big Horn Steak House',
		type: getKeywords('restaurant'),

		location: {
			title: 'Haugesund',
			lat: 59.411882825000006,
			lng: 5.26830164
		}
	},

	{
		title: 'Døgnvill Burger',
		type: getKeywords('restaurant'),
		foursquareID: '52d679b111d25266c4e5516a',

		location: {
			title: 'Stavanger',
			lat: 58.97089746248487,
			lng: 5.731971859931946
		}
	},

	{
		title: 'Godt Brød',
		type: getKeywords('restaurant'),
		foursquareID: '5437ab1a498eaaadad1694b3',

		location: {
			title: 'Fløyen',
			lat: 60.392535236019825,
			lng: 5.329849650529285
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
	// setTimeout(function() {
		if($(".featured_image_container").attr('class').includes('slick')) {
			console.log($(".featured_image_container").attr('class') + " includes slick");
			$(".featured_image_container").eq(0).slick('unslick');
		}
		$(".featured_image_container").eq(0).slick(slickCarousel.slick);

	// }, 300);
}

// Reinitialize slick (needed on content change)
// Initialized in window.onload function
function reslickSwipeList() {
	console.log('Reslicking!');
	$(".location_switcher_swipe_list").slick('unslick');
	$(".location_switcher_swipe_list").slick(slickCarousel.slickLocationSwitcher);
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
					// console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});

				} else if(markers()[i].type.keywords[0] == 'Restaurant' && filter().type.restaurant()) {
					markerVisibillity(markers()[i], true);
					// console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});

				} else if(markers()[i].type.keywords[0] == 'Severdighet' && filter().type.landmark()) {
					markerVisibillity(markers()[i], true);
					// console.log("Pushing " + markers()[i].koTitle());
					itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});

				}
			// } else {
			// 	console.log("Ignoring " + markers()[i].koTitle() + ", keyword = " + markers()[i].type.keywords[0]);
			// }
		} else {
			markerVisibillity(markers()[i], true);
			// console.log("filter().active() = " + filter().active() + ", pushing: " + markers()[i].koTitle());
			itemsToSearch.push({title: markers()[i].koTitle().toLowerCase(), index: i});
		}
	}

	console.log(searchString);
	console.log(itemsToSearch);
	search(searchString, itemsToSearch);
}

function markerVisibillity(object, visibillity) {
	// console.log("HIDIIIIIIIIIIIIIIIIIIIIIIING " + object.koTitle());
	object.koVisible(visibillity);
	object.setVisible(visibillity);
	// reslickSwipeList();
}

sendItemsToSearch($('.location_switcher_search_field').val());

function search(search, strings) {
	search = search.toLowerCase();
	// string = string.toLowerCase();

	// console.log(search + strings.title);


	var matches = strings.filter(function(item) {
		var posOfLastFound = -1; // remembers position of last found character

		// consider each search character one at a time
		for (var i = 0; i < search.length; i++) {
			var searchItem = search[i];
			if (searchItem == ' ') continue;     // ignore spaces

			posOfLastFound = item.title.indexOf(searchItem, posOfLastFound+1);     // search for character & update position
			if (posOfLastFound == -1) {

				// console.log("NOT FOUND: searchItem = " + searchItem + ", posOfLastFound = " + posOfLastFound + ", item = " + item.title);
				markerVisibillity(markers()[item.index], false);
				return false;  // if it's not found, exclude this item
			} else {
				// console.log("FOUND    : searchItem = " + searchItem + ", posOfLastFound = " + posOfLastFound + ", item = " + item.title + " ===== " + markers()[item.index].koTitle());
				markerVisibillity(markers()[item.index], true);
			}
		}
		return true;
	});
	// console.log(matches);
}

var markersLength = markers().length;
var ajaxRunTimes = 0;
var ajax = {
	title: '',

	wikipedia: {
		url: 'https://no.wikipedia.org/w/api.php',
		error: {
			message: 'Wikipedia svarar ikkje, prøv igjen seinare'
		}
	},

	flickr: {
		key: 'e896b44b17e42a28558673f7db2b3504',
		url: 'https://www.flickr.com/services/rest/',
		imgCount: 15,
		error: {
			img: {
				url: 'img/flickr-error.svg',
				credit: 'Kan ikkje nå Flickr'
			}
		}
	},

	nasjonalturbase: {
		key: '9718dda12c871525b0c2d976e02986c68de29abe',
		url: 'http://api.nasjonalturbase.no/v0/turer/'
	},

	foursquare: {
		client_id: '4XOTGB0SVZCNGUSLZU3NKHLFIYDCGDETYBIGDU3MIGU22APY',
		client_secret: 'SYACHZ3AU3X35J0LN40N1JZ3R2SBVZO0SI33BLCY4VVXNAKO',
		url: 'https://api.foursquare.com/v2/',
		error: {
			message: ko.observable('Foursquare svarar ikkje!'),

			img: {
				url: 'img/foursquare-error.svg',
				credit: 'Kan ikkje nå Foursquare'
			}
		}
	},

	openweathermap: {
		appid: '515c3aceb83a67504fa48539d20aff3a',
		url: 'http://api.openweathermap.org/',
	}
};

function getExternalResources() {
	markersLength = markers().length;
	for (var i = 0; i < markersLength; i++) {
		// Sets the title to work with
		ajax.title = markers()[i].koTitle();

		// Flickr Ajax calls
		(function(i) {
			$.ajax({
				url: ajax.wikipedia.url + '?prop=info%7Cextracts',
				dataType: 'jsonp',
				data: {
					titles: ajax.title,
					action: 'query',
					// prop: ['info', 'extracts'], --> moved to url since it does't work
					inprop: "url",
					format: 'json',
				}
			})

			.done(function(response) {
				clearTimeout(wikipediaErrorHandling);
				// Gets the name of the first property name of the object (Since we don't have the
				// page ID - which is the name of the property)
				var firstPropertyName = Object.getOwnPropertyNames(response.query.pages)[0];
				// console.log("firstPropertyName = " + firstPropertyName);

				// Gets the object we want the first property of
				var canDo = response.query.pages;
				var extract = canDo[firstPropertyName].extract;

				// If Wikipedia has an article about it; separate the paragraphs
				if(extract) {
					var articleText = extract.split("</p>");
				}
				var bodyText = '';
				var ingress = '';

				// If Wikipedia had an article about it
				if(articleText) {
					markers()[i].wikipedia.hasContent(true);

					// If first paragraph is empty; use the second one.
					// Else use the first one.
					// Some articles has an empty <p></p> at the beginning.
					if(articleText[0].length <= 3) {
						ingress = articleText[1];

						// Adds the rest of the article to the bodyText variable
						articleTextLength = articleText.length;
						for (var j = 2; j < articleTextLength; j++) {
							bodyText += articleText[j];
						}
					} else {
						ingress = articleText[0];

						// Adds the rest of the article to the bodyText variable
						articleTextLength = articleText.length;
						for (var j = 1; j < articleTextLength; j++) {
							bodyText += articleText[j];
						}
					}
				}

				markers()[i].wikipedia.ingress(ingress);
				markers()[i].wikipedia.bodyText(bodyText);

				markers()[i].wikipedia.url(canDo[firstPropertyName].fullurl);

			})

			.fail(function( xhr, status, errorThrown ) {
				console.log( "Wikipedia not responding!" );
				markers()[i].wikipedia.hasContent(true);
				markers()[i].wikipedia.ingress(ajax.wikipedia.error.message);
			});
		})(i);

		// Flickr Ajax calls
		// Store the current i value
		if(markers()[i].type.keywords[0] != 'Restaurant') {
			(function(i) {
				$.ajax({
					url: ajax.flickr.url,
					type: 'GET',
					dataType: 'text',
					data: {
						method: 'flickr.photos.search',
						sort: 'interestingness-desc',
						extras: 'owner_name',
						text: markers()[i].koTitle(),
						format: "json",
						api_key: ajax.flickr.key,
					}
				})

				.done(function(response) {
					// Removes the function wrapping and creates a JavaScript object
					// from the JSON recieved from Flickr.
					var responseJson = JSON.parse(response.slice(14, response.length - 1));
					// console.log(responseJson);

					for (var j = 0; j < ajax.flickr.imgCount; j++) {
						(function(j, i) {
							// console.log("running!");
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

								// console.log(response2Json);
								markers()[i].flickr.img().push({url: response2Json.sizes.size[5].source, credit: {name: responseJson.photos.photo[j].ownername}});
							})

							.fail(function(jqxhr, textStatus, error) {
							});
						})(j, i);
					}
				})

				.fail(function( xhr, status, errorThrown ) {
					console.log( "Flickr not responding!" );
					markers()[i].flickr.img().push({url: ajax.flickr.error.img.url, credit: {name: ajax.flickr.error.img.credit}});
				});
			})(i);
		}

		// Foursquare Ajax calls
		// Store the current i value
		if(markers()[i].type.keywords[0] == 'Restaurant') {
			// If marker got a foursquareID; get info from that
			if(markers()[i].foursquareID) {
				setMarkerVenue(markers()[i].foursquareID, i);

			// Else, get a foursquareID based on position and name (if possible)
			} else {
				(function(i) {
					$.ajax({
						url: ajax.foursquare.url + 'venues/search',
						type: 'GET',
						dataType: 'json',
						data: {
							v: Date.now(),
							ll: markers()[7].position.lat() + ',' + markers()[7].position.lng(),
							format: "json",
							client_id: ajax.foursquare.client_id,
							client_secret: ajax.foursquare.client_secret,
						}
					})

					.done(function(response) {
						var matches = 0;

						// If the response contains a venue name equal to the markers title; use that
						for (var j = 0; j < response.response.venues.length; j++) {
							if(response.response.venues[j].name == markers()[i].koTitle()) {
								matches++;

								var venue = response.response.venues[j];

								markers()[i].foursquareID = venue.id;

								setMarkerVenue(venue.id, i);
							}
						}

						// If no matches; set an error text.
						if(matches < 1) {

						}
					})

					.fail(function( xhr, status, errorThrown ) {
						markers()[i].foursquare.hasContent(true);
						console.log( 'Foursquare not responding!' );
						markers()[i].foursquare.error.message(ajax.foursquare.error.message);
						var marker = markers()[i];

						marker.foursquare.img().push({
							url: ajax.foursquare.error.img.url,
							credit: { name: ajax.foursquare.error.img.credit }
						});

						marker.foursquare.error.hasError(true);
					});
				})(i);

				function setMarkerVenue(foursquareID, i) {
					$.ajax({
						url: ajax.foursquare.url + 'venues/' + foursquareID,
						dataType: 'json',
						data: {
							v: Date.now(),
							ll: markers()[i].position.lat() + ',' + markers()[i].position.lng(),
							format: 'json',
							sort: 'popular',
							client_id: ajax.foursquare.client_id,
							client_secret: ajax.foursquare.client_secret,
						}
					})

					.done(function(response) {
						console.log(response);
						var marker = markers()[i];
						var venue = response.response.venue;
						var venuePhotos = venue.photos.groups[0].items;
						var imgUrl;
						var imgCredit;

						// Give the current marker the venue
						marker.foursquare.venue(response.response.venue);
						marker.foursquare.hasContent(true);

						// Build the marker's img array (contains an object with url and credit)
						for (var j = 0; j < venuePhotos.length; j++) {

							var photoObject = venuePhotos[j];
							var firstName = photoObject.user.firstName;

							// If there is no last name, set it to an empty string
							var lastName = photoObject.user.lastName || '';

							imgUrl = photoObject.prefix + "483x250" + photoObject.suffix;
							imgCredit = {name: firstName + ' ' + lastName};

							marker.foursquare.img().push({
								url: imgUrl,
								credit: imgCredit
							});
						}

						// And finally calculate price and rating
						marker.foursquare.calculate();
					})

					.fail(function(jqxhr, textStatus, error) {
						// console.log(jqxhr + ", " + textStatus + ", " + error);
						// console.log("fail2");
						// console.log(jqxhr);
						// markers()[i].foursquare.hasContent(true);
						console.log( 'Foursquare not responding!' );
						markers()[i].foursquare.hasContent(true);
						markers()[i].foursquare.error.message(ajax.foursquare.error.message);

						var marker = markers()[i];

						marker.foursquare.img().push({
							url: ajax.foursquare.error.img.url,
							credit: { name: ajax.foursquare.error.img.credit }
						});

						marker.foursquare.error.hasError(true);
					});
				};

				// Get venue photos
				function getVenuePhotos(id, storedI) {
					(function(storedI) {
						console.log("running!" + id + ", " + storedI);
						$.ajax({
							url: ajax.foursquare.url + 'venues/' + id + '/photos',
							dataType: 'json',
							data: {
								v: Date.now(),
								ll: markers()[storedI].position.lat() + ',' + markers()[storedI].position.lng(),
								format: 'json',
								sort: 'popular',
								client_id: ajax.foursquare.client_id,
								client_secret: ajax.foursquare.client_secret,
							}
						})

						.done(function(response2) {
							// console.log("Getting venue photos! " + id + " i = " + storedI);
							// console.log(response2);
							var marker = markers()[storedI];
							var imgUrl;
							var imgCredit;

							for (var i = 0; i < response2.response.photos.items.length; i++) {
								var photoObject = response2.response.photos.items[i];
								imgUrl = photoObject.prefix + "483x250" + photoObject.suffix;
								imgCredit = {name: photoObject.user.firstName + ' ' + photoObject.user.lastName};

								marker.foursquare.img().push({
									url: imgUrl,
									credit: imgCredit
								});
							}
						})

						.fail(function(jqxhr, textStatus, error) {
							// console.log(jqxhr + ", " + textStatus + ", " + error);
							console.log("fail2");
							console.log(jqxhr);


						});
					})(storedI);
				}
			}
		}

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

		// 	.fail(function(xhr, status, errorThrown) {
		// 		console.log( "Error: " + errorThrown );
		// 		console.log( "Status: " + status );
		// 		console.dir( xhr );
		// 	});
		// })(i);

		// Openweathermap ajax calls
		if (markers()[i].type.keywords[0] == 'Fjelltur') {
			(function(i) {
				$.ajax({
					url: ajax.openweathermap.url + 'data/2.5/forecast?',
					type: 'GET',
					dataType: 'json',
					data: {
						lat: markers()[i].position.lat(),
						lon: markers()[i].position.lng(),
						format: "json",
						appid: ajax.openweathermap.appid,
					}
				})

				.done(function(response) {
					markers()[i].openweathermap.data(response);
					markers()[i].openweathermap.hasContent(true);
				})

				.fail(function( xhr, status, errorThrown ) {
					console.log( "Error: " + errorThrown );
					console.log( "Status: " + status );
					console.dir( xhr );

					markers()[i].openweathermap.hasContent(true);
					markers()[i].openweathermap.error.hasError(true);
				});
			})(i);
		}
	}
}

function jsonFlickrApi(data) {
}

var wikipediaErrorHandling = setTimeout(function() {
	console.log("Wikipedia Ajax calls timed out!");
}, 5000);

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
	// I have no idea why it wont work without a setTimeout...?????
	setTimeout(function() {
		$('.featured_container').eq(index).toggleClass('featured_container_hidden');
		$('.featured_container').eq(index).removeClass('featured_container_minimized');

		if($('.featured_minimize').css('display') !== 'none') {
			$('.featured_container').eq(index).toggleClass('featured_container_minimized');

			setTimeout(function() {
				$('.featured_container').eq(index).removeClass('featured_container_minimized');
			}, 3000);
		}
	}, 1);
}

function displayAvailableFeaturedContainer(locationIndex) {
	// If there is no featured container displaying
	if(featured().displaying() === false) {
		toggleFeatured(0);
		featured().displaying(0);

		toggleLocationSwitcher();
		toggleLocationSwitcherList("hide");

	// Else if featured container 0 is displaying
	} else if(featured().displaying() === 0) {
		toggleFeatured(0);
		toggleFeatured(1);
		featured().displaying(1);

	// Else if featured container 1 is displaying
	} else if(featured().displaying() === 1) {
		toggleFeatured(1);
		toggleFeatured(0);
		featured().displaying(0);
	}

	populateFeatured(featured().displaying(), locationIndex);

	// (I think) if the Slick carousel is being initiated while it's not on-screen,
	// the slides to have their width set incorrectly. To solve this I just delay
	// the reslicking
	setTimeout(function() {
		reslickFeatured();
	}, 300);

}

function hideFeaturedContainer() {
	$('.featured_container').eq(featured().displaying()).toggleClass('featured_container_hidden');
	toggleLocationSwitcher();

	featured().displaying(false);

	resetZoomAndMap();
}

function minimizeFeaturedContainer() {
	$('.featured_container').eq(featured().displaying()).toggleClass('featured_container_minimized');
	// toggleLocationSwitcher();

	// featured().displaying(false);

	// resetZoomAndMap();
}

function displayBodyText(index) {
	$('.article_body').eq(index).toggleClass('article_body_hidden');
	$('.article_body_read_more').eq(index).toggleClass('article_body_read_more_hidden');
	$('.article_body_read_more_button').eq(index).toggleClass('article_body_read_more_button_hidden');
}

// Populates the featured view with appropriate content.
// Requires index of marker and the index of which featured container to populate.
function populateFeatured(featuredIndex, markerIndex) {
	featured().container[featuredIndex].index(markerIndex);
}

function readMore(locationIndex) {
	// console.log(locationIndex);
	displayAvailableFeaturedContainer(locationIndex);
	infoWindow.closeAll();

	zoomToMarker(locationIndex);
}

function zmoothZoom(newZoom, latlng, offsetX, offsetY, locationIndex) {
	var oldZoom = map.zoom;
	var zoomDifference = Math.abs(oldZoom) - Math.abs(newZoom);
	var zoomDirection;

	if(oldZoom < newZoom) {
		zoomDirection = 1;
	} else {
		zoomDirection = -1;
	}

	if(Math.abs(zoomDifference) > 1) {
		map.panTo(getOffsetCenter(latlng, offsetX, offsetY));
		setTimeout(function() {
			zmoothZoom(newZoom, latlng, offsetX, offsetY, locationIndex);
			map.setZoom(oldZoom + 1 * zoomDirection);

			map.setCenter(getOffsetCenter(latlng, offsetX, offsetY));
		}, 250);
	} else {
		map.setZoom(newZoom);
		map.setCenter(getOffsetCenter(latlng, offsetX, offsetY));

		setTimeout(function() {
			if(markers()[locationIndex].type.keywords[0] == 'Fjelltur') {
				map.setMapTypeId('satellite');
			} else {
				map.setMapTypeId('roadmap');
			}
		}, 250);
	}
}

function zoomToMarker(locationIndex) {
	// map.setZoom(12);


	// Where the center is when a featured container is displayed
	// 80 = $(".featured_container").offset().left (When it is displayed)
	var relativeCenter = ($(".featured_container").outerWidth() + 80) / 2;
	// getOffsetCenter(markers()[locationIndex].position, relativeCenter, 0);


	zmoothZoom(12, markers()[locationIndex].position, relativeCenter, 0, locationIndex);
}

var newCenter;

// Inspired by:
// http://stackoverflow.com/questions/10656743/how-to-offset-the-center-point-in-google-maps-api-v3
function getOffsetCenter(latlng, offsetX, offsetY) {

	// If screen is small, use the true center
	if($('.featured_minimize').css('display') !== 'none') {

		return latlng;

	// Else calculate a relative center when the featured container is displayed
	} else {

		// latlng is the apparent centre-point
		// offsetX is the distance you want that point to move to the right, in pixels
		// offsetY is the distance you want that point to move upwards, in pixels
		// offset can be negative
		// offsetX and offsetY are both optional

		var scale = Math.pow(2, map.getZoom());

		var worldCoordinateCenter = map.getProjection().fromLatLngToPoint(latlng);
		var pixelOffset = new google.maps.Point((offsetX/scale) || 0,(offsetY/scale) ||0);

		var worldCoordinateNewCenter = new google.maps.Point(
			worldCoordinateCenter.x - pixelOffset.x,
			worldCoordinateCenter.y + pixelOffset.y
		);

		newCenter = map.getProjection().fromPointToLatLng(worldCoordinateNewCenter);
		return newCenter;

	}
}

function resetZoomAndMap() {
	var bounds = new google.maps.LatLngBounds();
	// Extend the boundaries of the map for each marker
	for (var i = 0; i < markers().length; i++) {
		bounds.extend(markers()[i].position);
	}

	map.fitBounds(bounds);

	map.setMapTypeId('roadmap');
}

function scroll(index) {
	var marker = markers()[index];

	focusedMarker(index);
	moveToMarker(markers()[index]);

	infoWindow.closeAll(marker);
	infoWindow.populate(marker, new google.maps.InfoWindow());
}

function focusMarker(index) {
	var marker = markers()[index];

	focusedMarker(index);
	moveToMarker(markers()[index]);

	infoWindow.closeAll(marker);
	infoWindow.populate(marker, new google.maps.InfoWindow());

	toggleBounce(marker);
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
			// console.log("Created new infoWindow (for marker " + marker.index + ") = " + marker.infoWindow);
		}

		// Set infoWindow content
		marker.infoWindow.setContent('<div style="width: 200px;"><h5>' + marker.title + '</h5><p>' + markers()[marker.index].wikipedia.ingress() + '</p><button class="full_width_button" onclick="readMore(' + marker.index + ')">Les meir</button></div>');

		// Close the infoWindow on "x" click
		marker.infoWindow.addListener('closeclick', function() {
			marker.infoWindow.close();
			toggleBounce(marker);
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

				// Stop the animation
				markers()[i].setAnimation(null);

			} else if(markers()[i].infoWindow) {
				markers()[i].infoWindow.close();
				// Stop the animation
				markers()[i].setAnimation(null);
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

	mapSettings = {
		center: {lat: 40.7413549, lng: -73.9980244},
		// zoom: 13,
		styles: styles,
		mapTypeControl: false
	};

	// Constructor creates a new map - only center and zoom are required.
	map = new google.maps.Map(document.getElementById('map'), mapSettings);

	for (var i = 0; i < favoriteLocations.length; i++) {
		// Create a marker per location, and put into markers array.
		var marker = new google.maps.Marker({
			position: favoriteLocations[i].location,
			title: favoriteLocations[i].title,
			koTitle: ko.observable(favoriteLocations[i].title),
			animation: null, //google.maps.Animation.DROP,
			// icon: pin,
			index: i,
			type: favoriteLocations[i].type,
			koVisible: ko.observable(true),
			foursquareID: favoriteLocations[i].foursquareID,

			// Wikipedia
			wikipedia: {
				hasContent: ko.observable(false),
				url: ko.observable(''),
				ingress: ko.observable(''),
				bodyText: ko.observable('')
			},

			// Flickr
			flickr: {
				img: ko.observableArray([]),
			},

			foursquare: {

				error: {
					hasError: ko.observable(false),
					message: ko.observable()
				},

				hasContent: ko.observable(false),
				venue: ko.observable(),
				img: ko.observableArray([]),
				rating: ko.observable(),
				starCount: 5,
				price: ko.observable(''),

				getRating: function() {
					// Reset the array first (in case the needs to re-evaluate)
					this.rating('');

					// Get the foursquare rating (10 stars)
					var tenRating = this.venue().rating;

					// Converts the ten star rating to five stars
					var fiveRating = Math.round(tenRating / 2);
					console.log(tenRating + ", " + fiveRating);

					for (var i = 0; i < 5; i++) {
						if(fiveRating > i) {
							this.rating(this.rating() + '<i class="fa fa-star" data-bind=""></i>');
						} else {
							this.rating(this.rating() + '<i class="fa fa-star-o" data-bind=""></i>');
						}
					}
				},

				getPrice: function() {
					var priceTier = this.venue().price.tier;
					console.log(priceTier);

					if(priceTier == 1) {
						this.price('Billig');
					} else if(priceTier == 2) {
						this.price('Ganske billig');
					} else if(priceTier == 3) {
						this.price('Dyrt');
					} else if(priceTier == 4) {
						this.price('Veldig dyrt');
					}
				},

				calculate: function() {
					this.getRating();
					this.getPrice();
				}
			},

			openweathermap: {
				hasContent: ko.observable(false),
				data: ko.observable(),

				error: {
					hasError: ko.observable(false),
					message: ko.observable('Kunne ikkje nå OpenWeatherMaps. Dersom du trur det er ein feil i programmet; ta kontakt og vis til feilmeldingane i konsollen (f12).'),
				}
			},

			getImages: function() {
				if(this.foursquare.hasContent()) {
					return this.foursquare.img();
				} else {
					return this.flickr.img();
				}
			},

			tipIsPositive: function() {
				if(this.authorInteractionType == 'disliked') {
					return false;
				} else {
					return true;
				}
			}
		});

		marker.addListener('click', function() {
			// If this has an infoWindow and ...
			if(this.infoWindow) {
				// If infoWindow is open, close it
				if(this.infoWindow.anchor !== null) {
					this.infoWindow.close();

				// Else close other open infoWindows and display the current
				// marker's infoWindow
				} else {
					infoWindow.closeAll(this);
					infoWindow.populate(this, new google.maps.InfoWindow());
				}

			// Else close all other infoWindow and create a new one for this marker.
			} else {
				infoWindow.closeAll(this);
				infoWindow.populate(this, new google.maps.InfoWindow());
			}

			toggleBounce(this);

		});

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

function toggleBounce(obj) {
	if(obj.getAnimation() !== null) {
		obj.setAnimation(null);
	} else {
		obj.setAnimation(google.maps.Animation.BOUNCE);
	}
}
