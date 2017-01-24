/*

	Author: Erling Tokheim
	Author URI: https://github.com/etokheim

*/


/*--------------------------------------------------------------
>>> TABLE OF CONTENTS:
----------------------------------------------------------------

	# Settings
	# Defaults
	# Bindings
		## On load events
		## On window resize
	# View Model
	# Model
	# Google Maps related
		## Info window
		## Initialize map

--------------------------------------------------------------*/
function testing() {
	console.log("testing was called");
}
/*--------------------------------------------------------------
# Knockout plug-ins
--------------------------------------------------------------*/
ko.bindingHandlers.click = {
    init: function(element, valueAccessor, allBindingsAccessor, viewModel, context) {
        var accessor = valueAccessor();
        var clicks = 0;
        var timeout = 200;

        $(element).click(function(event) {
            if(typeof(accessor) === 'object') {
                var single = accessor.single;
                var double = accessor.double;
                clicks++;
                if (clicks === 1) {
                    setTimeout(function() {
                        if(clicks === 1) {
                        	if(single !== undefined) {
                            	single.call(viewModel, context.$data, event);
                        	}
                        } else {
                            double.call(viewModel, context.$data, event);
                        }
                        clicks = 0;
                    }, timeout);
                }
            } else {
                accessor.call(viewModel, context.$data, event);
            }
        });
    }
};

/*--------------------------------------------------------------
# Settings
--------------------------------------------------------------*/
var settings = {
	// If small screens; this value dictates the delay time
	// until the featured view maximizes itself
	featuredMaximizeDelay: 750,
	// How far to zoom when focusing on a marker.
	zoomInAmount: 14,
	zoomInterval: 500,
	defaultMapType: 'roadmap',

	slick: {
		featured: {
			infinite: true,
			slidesToShow: 1,
			autoplay: true,
			autoplaySpeed: 5000,
			draggable: true,
			arrows: true,
			dots: false,
			slidesToShow: 1,
			centerMode: false,
			variableWidth: false,
		},

		locationSwitcher: {
			speed: 300,
			infinite: true,
			slidesToShow: 1,
			autoplay: false,
			draggable: true,
			dots: false,

			// If arrows are added through Slick, they will also be
			// removed though slick, ie. if there is only one slide.
			arrows: false,
			// nextArrow: $('.location_switcher_arrow')[1],
			// prevArrow: $('.location_switcher_arrow')[0],
		}
	}
};


/*--------------------------------------------------------------
# Defaults
--------------------------------------------------------------*/
var map, locations, focusedMarker, mapSettings;

var markers = ko.observableArray();
var focusedMarker = ko.observable(0);

var screen = {
	size: ko.observable(),

	// Determines screen size. Based on a DOM element.
	// Updates on resize.
	updateSize: function() {
		if($('.featured_minimize').css('display') !== 'none') {
			screen.size("small");
		} else {
			screen.size("large");
		}
	}
};

screen.updateSize();

var displays = {
	locationList: {
		displaying: ko.observable(true),

		// Toggles the visibility of location_switcher_list
		// You can pass in the optional parameter option to
		// either hide or display instead of toggling.
		toggle: function(option) {
			// Hide the tip
			displays.locationSwitcher.displayTip(false);

			if(option === "hide") {
				displays.locationList.displaying(false);
			} else {
				displays.locationList.displaying(!displays.locationList.displaying());
			}
		}
	},

	locationSwitcher: {
		displaying: ko.observable(true),

		displayList: ko.observable(true),

		displayTip: ko.observable(true),

		toggle: function() {
			displays.locationSwitcher.displaying(!displays.locationSwitcher.displaying());
		}
	},

	featured: {
		displaying: ko.observable(false),

		container: [
			{
				displaying: ko.observable(false),
				minimized: ko.observable(false),
				index: ko.observable(0),
			},

			{
				displaying: ko.observable(false),
				minimized: ko.observable(false),
				index: ko.observable(0)
			}
		],

		toggle: function(index) {
			displays.featured.displaying(index);

			// I have no idea why it wont work without a setTimeout...?????
			setTimeout(function() {
				if(displays.featured.displaying() !== false) {
					displays.featured.container[index].displaying(!displays.featured.container[index].displaying());
				}

				displays.featured.container[index].minimized(false);

				if(screen.size() == 'small') {
					displays.featured.container[index].minimized(true);
				}
			}, 1);
		},

		hide: function() {
			// Remove minimized class (if container was minimized)
			displays.featured.container[displays.featured.displaying()].minimized(false);

			displays.locationSwitcher.toggle();

			displays.featured.container[displays.featured.displaying()].displaying(false);
			displays.featured.displaying(false);

			// Collapses the Wikipedia text into the read more state
			displays.featured.wikipedia.displaying(false);

			if(isZooming) {
				stopZooming = true;

				// Wait till the last zoom is finished
				setTimeout(function() {
					resetZoomAndMap();
				}, 250);
			} else {
				resetZoomAndMap();
			}

		},

		toggleMinimize: function() {
			displays.featured.container[displays.featured.displaying()].minimized(!displays.featured.container[displays.featured.displaying()].minimized());
		},

		minimize: function() {
			displays.featured.container[displays.featured.displaying()].minimized(true);
		},

		maximize: function() {
			displays.featured.container[displays.featured.displaying()].minimized(false);
		},

		toggleAvailable: function(locationIndex) {
			// If there is no featured container displaying
			if(displays.featured.displaying() === false) {
				displays.featured.toggle(0);

				displays.locationSwitcher.toggle();
				displays.locationList.toggle("hide");

			// Else if featured container 0 is displaying
			} else if(displays.featured.displaying() === 0) {
				displays.featured.toggle(0);
				displays.featured.toggle(1);

			// Else if featured container 1 is displaying
			} else if(displays.featured.displaying() === 1) {
				displays.featured.toggle(1);
				displays.featured.toggle(0);
			}

			displays.featured.populate(displays.featured.displaying(), locationIndex);

			// (I think) if the Slick carousel is being initiated while it's not on-screen,
			// the slides will have their width set incorrectly. To solve this I just delay
			// the reslicking
			setTimeout(function() {
				slickCarousel.reslick($(".featured_image_container"), settings.slick.featured);
			}, 600);

		},

		// Populates the featured view with appropriate content.
		// Requires index of marker and the index of which featured container to populate.
		populate: function(featuredIndex, markerIndex) {
			displays.featured.container[featuredIndex].index(markerIndex);
		},

		wikipedia: {
			displaying: ko.observable(false),

			toggle: function(index) {
				displays.featured.wikipedia.displaying(!displays.featured.wikipedia.displaying());
			},

			// Fired when double clicking the Wikipedia article.
			toggleAndDeselect: function() {
				displays.featured.wikipedia.toggle();

				// Deselect text (if some was selected by the double click)
				// "event.preventDefault();" or "return false;" didn't work.
				// Credit to Gert Grenander (http://stackoverflow.com/questions/3169786/clear-text-selection-with-javascript)
				if (window.getSelection) {
					if (window.getSelection().empty) {  // Chrome
						window.getSelection().empty();
					} else if (window.getSelection().removeAllRanges) {  // Firefox
						window.getSelection().removeAllRanges();
					}
				}
			},
		},
	}
};

var slickCarousel = {
	// Reinitialize slick (slick breaks on content change)
	// Initialized in window.onload function
	reslick: function(element, settings) {
		// If element has been slicked before, unslick it first.
		if(element.attr('class').indexOf('slick') !== -1) {
			element.eq(0).slick('unslick');
		}

		element.eq(0).slick(settings);
	},

	rebind: function(element) {
		element.on('beforeChange', function(event, slick, currentSlide, nextSlide) {
			focusMarker(slickCarousel.convert.index.carouselToMarker(nextSlide));
		});
	},

	swipeList: {
		next: function() {
			$('.location_switcher_swipe_list').slick('slickNext');
		},

		previous: function() {
			$('.location_switcher_swipe_list').slick('slickPrev');
		}
	},

	convert: {
		index: {
			markerToCarousel: function(markerIndex) {
				var match = false;
				var marker = markers()[markerIndex];

				var filteredMarkersLength = filter.markers().length;

				for (var i = 0; i < filteredMarkersLength; i++) {
					var filteredMarker = filter.markers()[i];

					if(marker.title == filteredMarker.title) {
						match = true;
						return i;
					}
				}

				if(!match) {
					console.error("Can't scroll to " + marker.title + " because it's currently not in the swipe list.");
				}
			},

			carouselToMarker: function(carouselIndex) {
				var match = false;
				var filteredMarker = filter.markers()[carouselIndex];

				var markersLength = markers().length;

				for (var i = 0; i < markersLength; i++) {
					var marker = markers()[i];

					if(filteredMarker !== undefined && marker !== undefined) {
						if(filteredMarker.title == marker.title) {
							match = true;
							return i;
						}
					}
				}

				if(!match) {
					return 0;
				}
			}
		}
	},

	swipeListGoTo: function(index) {
		// Check out the Slick binding (in the rebind function) to see what
		// happens when the slider is moving.
		$(".location_switcher_swipe_list").slick('slickGoTo', index);
	},
};

var filter = {
	markers: ko.observableArray([]),

	type: {

		hike: ko.observable(false),
		restaurant: ko.observable(false),
		landmark: ko.observable(false),

		toggleHike: function() {
			this.hike(!this.hike());
			filter.apply($('.location_switcher_search_field').val());
		},

		toggleRestaurant: function() {
			this.restaurant(!this.restaurant());
			filter.apply($('.location_switcher_search_field').val());
		},

		toggleLandmark: function() {
			this.landmark(!this.landmark());
			filter.apply($('.location_switcher_search_field').val());
		}
	},

	getKeywords: function(type) {
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
	},

	active: function() {
		if(this.type.hike() || this.type.restaurant() || this.type.landmark()) {
			return true;
		} else {
			return false;
		}
	},

	apply: function(searchString) {
		var itemsToSearch = [];
		for (var i = 0; i < markers().length; i++) {
			// If a type filter is applied; only pass along the not filtered instances
			if(filter.active()) {
				// Make item invisible
				filter.markerVisibillity(markers()[i], false);

				// If filtering hikes; make item visible and push it to itemsToSearch
				if(markers()[i].type.keywords[0] == 'Fjelltur' && filter.type.hike()) {
					filter.markerVisibillity(markers()[i], true);
					itemsToSearch.push({title: markers()[i].koTitle(), index: i});

				} else if(markers()[i].type.keywords[0] == 'Restaurant' && filter.type.restaurant()) {
					filter.markerVisibillity(markers()[i], true);
					itemsToSearch.push({title: markers()[i].koTitle(), index: i});

				} else if(markers()[i].type.keywords[0] == 'Severdighet' && filter.type.landmark()) {
					filter.markerVisibillity(markers()[i], true);
					itemsToSearch.push({title: markers()[i].koTitle(), index: i});

				}
			} else {
				filter.markerVisibillity(markers()[i], true);
				itemsToSearch.push({title: markers()[i].koTitle(), index: i});
			}
		}

		// Now that items are filtered; send them to search
		filter.search(searchString, itemsToSearch);
	},

	markerVisibillity: function(object, visibillity) {
		object.koVisible(visibillity);
		object.setVisible(visibillity);
	},

	// Searches for "search" in "strings"
	// Inspired by: http://stackoverflow.com/questions/16907825/how-to-implement-sublime-text-like-fuzzy-search
	search: function(search, strings) {
		filter.markers([]);
		search = search.toLowerCase();

		infoWindow.closeAll();

		var matches = strings.filter(function(item) {
			item.title = item.title.toLowerCase();

			// remembers position of last found character
			var posOfLastFound = -1;

			// consider each search character one at a time
			for (var i = 0; i < search.length; i++) {
				var searchItem = search[i];

				// ignore spaces
				if (searchItem == ' ') continue;

				// search for character & update position
				posOfLastFound = item.title.indexOf(searchItem, posOfLastFound + 1);

				// if it's not found, exclude this item
				if (posOfLastFound == -1) {
					filter.markerVisibillity(markers()[item.index], false);
					return false;
				}
			}

			// Else, include it
			filter.markers.push(markers()[item.index]);
			return true;
		});

		/*

			Bug: There is a bug with the Slick Carousel. When being
			reinitialized it re-orders everything except comments.
			This posed a problem, since I was relying on comments to
			check whether a location should be displayed or not.
			When the comments got out of order, Knockout instead
			created twice as many  elements as it was supposed to.
			To work around this, I used a div with a data-bind
			attribute instead to decide whether it should display or
			not. This worked as far as Knockout was concerned, but
			even though the div didn't have any content, the Slick
			Carousel still created a slide of the empty div. Therefor
			I had to loop through and delete all the slides without
			content.
				This works, but also leads to another problem: the
			slides are are deleted. So when the filter changes, the
			markers that was previously deleted and should now
			display, are not re-created - even though the koVisible
			observable changes value. So to re-create the list, I
			force the foreach loop to run again by wrapping it inside
			another Knockout binding in the View Model.
				Check out this fiddle for an example on how the
			comments are out of sync: The fiddle is not finished
			yet... (https://jsfiddle.net/bfd9vd6p/1/)

		*/

		// To avoid duplicates; force the forEach to run again
		displays.locationSwitcher.displayList(false);
		displays.locationSwitcher.displayList(true);

		slickCarousel.reslick($(".location_switcher_swipe_list"), settings.slick.locationSwitcher);
		slickCarousel.rebind($(".location_switcher_swipe_list"));

		// Delete the empty slides
		var slickSlides = $('.slick-slide');
		var slickSlidesLength = slickSlides.length;

		// Looping backwards because we are deleting items
		for(var i = slickSlidesLength; i > 0; i--) {
			var childrenLength = slickSlides.eq(i).children().length;
			if(childrenLength < 1) {
				var emptyItem = slickSlides.eq(i).attr('data-slick-index');
				$(".location_switcher_swipe_list").slick('slickRemove', emptyItem);
			}
		}
	}
};


/*--------------------------------------------------------------
# Bindings
--------------------------------------------------------------*/
$('.location_switcher_search_field').on('input', function() {
	filter.apply(this.value);
});


/*--------------------------------------------------------------
## On load events
--------------------------------------------------------------*/
window.onload = function() {
	// Initialize Slick on location switcher and add beforeChange listener
	slickCarousel.reslick($(".location_switcher_swipe_list"), settings.slick.locationSwitcher);

	// Hides the list after the user has seen it
	setTimeout(function() {
		displays.locationList.toggle();
		displays.locationSwitcher.displayTip(true);
	}, 500);

	filter.apply($('.location_switcher_search_field').val());
};


/*--------------------------------------------------------------
## On window resize
--------------------------------------------------------------*/
window.onresize = function(event) {
	screen.updateSize();
};


/*--------------------------------------------------------------
# View Model
--------------------------------------------------------------*/
var ViewModel = function() {
	this.closeAndGoToMarker = function() {
		// If there is more than one slide in the slider; tell
		// Slick to go to clicked marker
		if(filter.markers().length > 1) {
			slickCarousel.swipeListGoTo(slickCarousel.convert.index.markerToCarousel(this.index));

		// Else call the "focusMarker()" function at once
		// (usually called when the slider moves). This is
		// because if there is only one slide in the slick
		// carousel, the carousel doesn't move, which is what
		// the binding (which usually fires focusMarker()) is
		// listening for.
		} else {
			focusMarker(slickCarousel.convert.index.markerToCarousel(this.index));
		}

		displays.locationList.toggle();
	};

	$('#location_switcher_center').click(function() {
		displays.locationList.toggle();
	});
};

ko.applyBindings(new ViewModel());


/*--------------------------------------------------------------
# Model
--------------------------------------------------------------*/
var favoriteLocations = [
	{
		title: 'Sverd i fjell',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 58.9413738,
			lng: 5.6713647
		}
	},

	{
		title: 'Stavanger domkirke',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 58.9696008,
			lng: 5.7327193
		}
	},

	{
		title: 'Langfossen',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.8454932,
			lng: 6.339577
		}
	},

	{
		title: 'Låtefossen',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.9475823,
			lng: 6.5847937
		}
	},

	{
		title: 'Baroniet Rosendal',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.9896187,
			lng: 6.0289293
		}
	},

	{
		title: 'Kongeparken',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 58.778757,
			lng: 5.84055
		}
	},

	{
		title: 'Utsira',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.308129,
			lng: 4.8798742
		}
	},

	{
		title: 'Tungenes fyr',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.0355653,
			lng: 5.5795811
		}
	},

	{
		title: 'Lundeneset VGS',
		type: filter.getKeywords('landmark'),

		location: {
			lat: 59.6082346,
			lng: 5.7730419
		}
	},

	{
		title: 'Kjeragbolten',
		type: filter.getKeywords('hike'),

		location: {
			lat: 59.0346734,
			lng: 6.5753282
		}
	},

	{
		title: 'Preikestolen',
		type: filter.getKeywords('hike'),

		location: {
			lat: 58.9857634,
			lng: 6.1575914
		}
	},

	{
		title: 'Eikedalen Skisenter',
		type: filter.getKeywords('hike'),

		location: {
			lat: 60.4067785,
			lng: 5.9173345
		}
	},

	{
		title: 'Trolltunga',
		type: filter.getKeywords('hike'),

		location: {
			lat: 60.124167,
			lng: 6.7378113
		}
	},

	{
		title: 'Ulriken',
		type: filter.getKeywords('hike'),

		location: {
			lat: 60.3774889,
			lng: 5.3847581
		}
	},

	{
		title: 'Flor & fjære',
		type: filter.getKeywords('restaurant'),

		location: {
			lat: 59.0525365,
			lng: 5.8230277
		}
	},

	{
		title: 'Big Horn Steak House',
		type: filter.getKeywords('restaurant'),

		location: {
			lat: 59.411882825000006,
			lng: 5.26830164
		}
	},

	{
		title: 'Døgnvill Burger',
		type: filter.getKeywords('restaurant'),
		foursquareID: '52d679b111d25266c4e5516a',

		location: {
			title: 'Stavanger',
			lat: 58.97089746248487,
			lng: 5.731971859931946
		}
	},

	{
		title: 'Godt Brød',
		type: filter.getKeywords('restaurant'),
		foursquareID: '5437ab1a498eaaadad1694b3',

		location: {
			title: 'Fløyen',
			lat: 60.392535236019825,
			lng: 5.329849650529285
		}
	},
];

var ajax = {
	title: '',

	wikipedia: {
		url: 'https://no.wikipedia.org/w/api.php',
	},

	flickr: {
		key: 'e896b44b17e42a28558673f7db2b3504',
		url: 'https://www.flickr.com/services/rest/',
		imgCount: 15,
	},

	nasjonalturbase: {
		key: '9718dda12c871525b0c2d976e02986c68de29abe',
		url: 'http://api.nasjonalturbase.no/v0/turer/'
	},

	foursquare: {
		client_id: '4XOTGB0SVZCNGUSLZU3NKHLFIYDCGDETYBIGDU3MIGU22APY',
		client_secret: 'SYACHZ3AU3X35J0LN40N1JZ3R2SBVZO0SI33BLCY4VVXNAKO',
		url: 'https://api.foursquare.com/v2/'
	},

	openweathermap: {
		appid: '515c3aceb83a67504fa48539d20aff3a',
		url: 'http://api.openweathermap.org/',
	},

	// Triggers the Ajax calls for information related to the markers
	// Must run after markers has been created.
	getExternalResources: function() {
		console.log("Getting external resources!");
		var markersLength = markers().length;
		for(var i = 0; i < markersLength; i++) {
			// Sets the current title
			ajax.title = markers()[i].koTitle();

			// Flickr Ajax calls
			(function(i) {
				$.ajax({
					url: ajax.wikipedia.url + '?prop=info%7Cextracts',
					dataType: 'jsonp',
					data: {
						titles: ajax.title,
						action: 'query',
						prop: 'info|extracts', // --> moved to url since this does't work
						inprop: "url",
						format: 'json',
					}
				})

				.done(function(response) {
					var marker = markers()[i];

					// Gets the name of the first property name of the object (Since we don't have the
					// page ID - which is the name of the property)
					var firstPropertyName = Object.getOwnPropertyNames(response.query.pages)[0];

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
						marker.wikipedia.hasContent(true);

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

					marker.wikipedia.ingress(ingress);
					marker.wikipedia.bodyText(bodyText);

					marker.wikipedia.url(canDo[firstPropertyName].fullurl);

				})

				.fail(function( xhr, status, errorThrown ) {
					var marker = markers()[i];

					console.error( "Wikipedia is not responding! (Error code: " + xhr.status + ")" );
					marker.wikipedia.hasContent(true);
					marker.wikipedia.error.hasError(true);
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

						// Check if there is enough pictures; if not, give out a warning.
						var loopCount = ajax.flickr.imgCount;
						if(responseJson.photos.photo.length < ajax.flickr.imgCount) {
							loopCount = responseJson.photos.photo.length;
							console.warn(markers()[i].koTitle() + " doesn't have the desired amout of pictures. (" + responseJson.photos.photo.length + " of the desired " + ajax.flickr.imgCount + ")");
						}

						for (var j = 0; j < loopCount; j++) {
							(function(j, i) {
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
									if(responseJson.photos.photo[j]) {
										var marker = markers()[i];

										// Removes the function wrapping and creates a JavaScript object
										// from the JSON recieved from Flickr.
										var response2Json = JSON.parse(response2.slice(14, response2.length - 1));

										marker.flickr.img.push({
											url: response2Json.sizes.size[5].source,
											credit: {
												name: responseJson.photos.photo[j].ownername
											}
										});

										marker.flickr.hasContent(true);
									}
								})

								.fail(function(xhr, textStatus, error) {
								});
							})(j, i);
						}
					})

					.fail(function( xhr, status, errorThrown ) {
						console.error("Flickr is not responding! (Error code: " + xhr.status + ")");
						var marker = markers()[i];

						marker.flickr.error.hasError(true);
						marker.flickr.hasContent(true);
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
								ll: markers()[i].position.lat() + ',' + markers()[i].position.lng(),
								format: "json",
								client_id: ajax.foursquare.client_id,
								client_secret: ajax.foursquare.client_secret,
							}
						})

						.done(function(response) {
							var marker = markers()[i];

							var matches = 0;

							// If the response contains a venue name equal to the markers title; use that
							for (var j = 0; j < response.response.venues.length; j++) {
								if(response.response.venues[j].name.toLowerCase().indexOf(marker.koTitle().toLowerCase()) !== -1) {
									matches++;

									var venue = response.response.venues[j];

									marker.foursquareID = venue.id;

									setMarkerVenue(venue.id, i);
								}
							}

							// If no matches; set an error text.
							if(matches < 1) {
								console.error("No venues found matching: " + markers()[i].koTitle() + ", please add a Foursquare venue id!");
							}
						})

						.fail(function( xhr, status, errorThrown ) {
							console.error( "Foursquare is not responding! (Error code: " + xhr.status + ")" );
							var marker = markers()[i];

							marker.foursquare.hasContent(true);
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

								imgUrl = photoObject.prefix + "579x400" + photoObject.suffix;
								imgCredit = { name: firstName + ' ' + lastName };

								marker.foursquare.img.push({
									url: imgUrl,
									credit: imgCredit
								});
							}

							// And finally calculate price and rating
							marker.foursquare.calculate();
						})

						.fail(function(xhr, textStatus, error) {
							var marker = markers()[i];

							console.error( "Foursquare is not responding! (Error code: " + xhr.status + ")" );

							marker.foursquare.hasContent(true);
							marker.foursquare.error.hasError(true);
						});
					};
				}
			}

			// Nasjonal turbase ajax calls

			// This API can be used to get hiking information.
			// They have everything from routes to difficulty level,
			// time, distance, height, comments, photos etc.

			// Store the current i value
			// (function(i) {
			// 	$.ajax({
			// 		url: ajax.nasjonalturbase.url,
			// 		type: 'GET',
			// 		dataType: 'text',
			// 		data: {
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
			if(markers()[i].type.keywords[0] == 'Fjelltur') {
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
						var marker = markers()[i];

						marker.openweathermap.data(response);
						marker.openweathermap.hasContent(true);
					})

					.fail(function( xhr, status, errorThrown ) {
						var marker = markers()[i];

						console.error( "OpenWeatherMaps are not responding! (Error code: " + xhr.status + ")" );

						marker.openweathermap.hasContent(true);
						marker.openweathermap.error.hasError(true);
					});
				})(i);
			}
		}
	}
};


/*--------------------------------------------------------------
# Google Maps related
--------------------------------------------------------------*/
function readMore(locationIndex) {
	displays.featured.toggleAvailable(locationIndex);
	infoWindow.closeAll();

	zmoothZoom(locationIndex, 200);
}


/*

	If Google map's setZoom is greater than 2 zoom levels it
	will zoom without animating (possibly because of the greater
	performance and network demands). But without the animation,
	users tend to get disoriented and zooming out again to re-
	orient, which may lead to irritation and a bad user
	experience.
		This function makes sure the zoom animates by only
	zooming one level at a time.

*/
var stopZooming = false;
var isZooming = false;

function zmoothZoom(locationIndex, delay, callback) {
	// Delays the animation a bit to give the computer less to do at once and
	// for smoother animation. (When the featured container is appearing)
	delay = delay || 0;

	isZooming = true;

	setTimeout(function() {
		callback = displays.featured.maximize || function() {};

		// Where the center is when a featured container is displayed
		// 80 = $(".featured_container").offset().left (When it is displayed)
		var offsetX = ($(".featured_container").outerWidth() + 80) / 2;
		var offsetY = 0;

		var latlng = markers()[locationIndex].position;
		var oldZoom = map.zoom;
		var newZoom = settings.zoomInAmount;
		var zoomDifference = Math.abs(oldZoom) - Math.abs(newZoom);
		var zoomDirection;

		// Determine zoom direction.
		if(oldZoom < newZoom) {
			zoomDirection = 1;
		} else {
			zoomDirection = -1;
		}

		if(!stopZooming && isZooming) {
			// If remaining zoom >= 1; call this function again.
			if(Math.abs(zoomDifference) >= 1) {
				map.panTo(getOffsetCenter(latlng, offsetX, offsetY));
				setTimeout(function() {
					zmoothZoom(locationIndex);
					map.setZoom(oldZoom + 1 * zoomDirection);

					map.setCenter(getOffsetCenter(latlng, offsetX, offsetY));
				}, settings.zoomInterval);

			// Else stop zooming and fire callback function
			} else {
				isZooming = false;
				map.setZoom(newZoom);
				map.setCenter(getOffsetCenter(latlng, offsetX, offsetY));

				setTimeout(function() {
					if(markers()[locationIndex].type.keywords[0] == 'Fjelltur') {
						map.setMapTypeId('satellite');
					} else {
						map.setMapTypeId(settings.defaultMapType);
					}
				}, 150);

				// Give the users some time to orient themselves
				setTimeout(function() {
					callback();
				}, settings.featuredMaximizeDelay);
			}
		} else {
			stopZooming = false;
			isZooming = false;
		}
	}, delay);
}

// Inspired by:
// http://stackoverflow.com/questions/10656743/how-to-offset-the-center-point-in-google-maps-api-v3
//
// Gets the coordinates of the map's center point when it's
// being offset by x and y pixels.
//
// latlng is the true center
// offsetX is the offset on the x-axis in pixels
// offsetY is the offset on the y-axis in pixels
// offset can be negative
// offsetX and offsetY are both optional
function getOffsetCenter(latlng, offsetX, offsetY) {
	var newCenter;

	// If screen is small, use the true center
	if($('.featured_minimize').css('display') !== 'none') {
		return latlng;

	// Else calculate a relative center when the featured container is displayed
	} else {
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

	map.setMapTypeId(settings.defaultMapType);
}

function focusMarker(index) {
	var marker = markers()[index];

	// Hide the tip
	displays.locationSwitcher.displayTip(false);

	focusedMarker(index);

	moveToMarker(markers()[index]);

	infoWindow.closeAll(marker);
	infoWindow.populate(marker, new google.maps.InfoWindow());

	toggleBounce(marker);
}

function moveToMarker(marker) {
	var coordinates = {
		lat: marker.position.lat(),
		lng: marker.position.lng()
	};

	map.panTo(coordinates);
}

/*--------------------------------------------------------------
## Info window
--------------------------------------------------------------*/
var infoWindow = {
	populate: function(marker, infowindow) {
		// If marker does not have an infoWindow; make one
		if(!marker.infoWindow) {
			marker.infoWindow = new google.maps.InfoWindow();
		}

		// Set infoWindow content
		marker.infoWindow.setContent('<div class="info_window"><h5>' + marker.title + '</h5><p>' + markers()[marker.index].wikipedia.ingress() + '</p><button class="full_width_button" onclick="readMore(' + marker.index + ')">Les meir</button></div>');

		// Close the infoWindow on "x" click
		marker.infoWindow.addListener('closeclick', function() {
			marker.infoWindow.close();
			toggleBounce(marker);
		});

		// Open the infoWindow
		marker.infoWindow.open(map, marker);
	},

	// Can take in an exception (an object with an infoWindow
	// which shouldn't close.)
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

function toggleBounce(marker) {
	if(marker.getAnimation() !== null) {
		marker.setAnimation(null);
	} else {
		marker.setAnimation(google.maps.Animation.BOUNCE);
	}
}


/*--------------------------------------------------------------
## Initialize map
--------------------------------------------------------------*/
function googleMapsError(error) {
	console.log("error" + error);
	$('#map').html('\
		<div class="maps_error_container">\
			<div class="maps_error">\
				<i class="fa fa-google" aria-hidden="true"></i>\
				<h1>Google Maps svarar ikkje!</h1>\
				<p>\
					<em>Vent litt og prøv på nytt.</em><br><br>\
					Dersom du trur det er ein feil i programmet; vennligst ta kontakt og vis til feilmeldingane i konsollen. (f12).\
				</p>\
			</div>\
		</div>\
	');
}

function initMap() {
	console.log("Creating the map");

	// Map styling
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

	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 40.7413549, lng: -73.9980244},
		styles: styles,
		mapTypeControl: false
	});

	// Create a marker per location, and put them into the markers array.
	for (var i = 0; i < favoriteLocations.length; i++) {
		var marker = new google.maps.Marker({
			position: favoriteLocations[i].location,
			title: favoriteLocations[i].title,
			koTitle: ko.observable(favoriteLocations[i].title),
			animation: null, //google.maps.Animation.DROP,
			// icon: '',
			index: i,
			type: favoriteLocations[i].type,
			koVisible: ko.observable(true),
			foursquareID: favoriteLocations[i].foursquareID,

			// Wikipedia
			wikipedia: {
				hasContent: ko.observable(false),
				url: ko.observable(''),
				ingress: ko.observable(''),
				bodyText: ko.observable(''),

				error: {
					hasError: ko.observable(false),
					message: ko.observable('Kunne ikkje nå Wikipedia. Dersom du trur det er ein feil i programmet; vennligst ta kontakt og vis til feilmeldingane i konsollen. (f12).')
				}
			},

			// Flickr
			flickr: {
				img: ko.observableArray([]),
				hasContent: ko.observable(false),
				error: {
					hasError: ko.observable(false),

					img: ko.observableArray([{
						url: 'img/flickr-error.svg',
						credit: { name: 'Kan ikkje nå Flickr' }
					}])
				}
			},

			foursquare: {
				error: {
					hasError: ko.observable(false),
					message: ko.observable('Kunne ikkje nå Foursquare. Dersom du trur det er ein feil i programmet; vennligst ta kontakt og vis til feilmeldingane i konsollen. (f12).'),
					img: ko.observableArray([{
						url: 'img/foursquare-error.svg',
						credit: { name: 'Kan ikkje nå Foursquare' }
					}])
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

					for (var i = 0; i < 5; i++) {
						if(fiveRating > i) {
							this.rating(this.rating() + '<i class="fa fa-star" data-bind=""></i>');
						} else {
							this.rating(this.rating() + '<i class="fa fa-star-o" data-bind=""></i>');
						}
					}
				},

				// Gets the price class and translate it to Norwegian.
				getPrice: function() {
					var priceTier = this.venue().price !== undefined ? this.venue().price.tier : '';

					if(priceTier == 1) {
						this.price('Billig');
					} else if(priceTier == 2) {
						this.price('Ganske billig');
					} else if(priceTier == 3) {
						this.price('Dyrt');
					} else if(priceTier == 4) {
						this.price('Veldig dyrt');
					} else {
						this.price('Ukjent prisklasse');
					}
				},

				// Populates marker data.
				// Called when Ajax request is finished.
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
					message: ko.observable('Kunne ikkje nå OpenWeatherMaps. Dersom du trur det er ein feil i programmet; vennligst ta kontakt og vis til feilmeldingane i konsollen. (f12).'),
				}
			},

			getImages: function() {
				if(this.foursquare.error.hasError()) {
					return this.foursquare.error.img();
				} else if(this.foursquare.hasContent()) {
					return this.foursquare.img();
				} else if(this.flickr.error.hasError()) {
					return this.flickr.error.img();
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
			focusMarker(this.index);

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
	ajax.getExternalResources();
}
