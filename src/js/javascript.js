window.onload = function() {
	// Hides the list after the user has seen it
	setTimeout(function() {
		toggleLocationSwitcherList();
	}, 500);
}

var map, markers, polygon, locations, focusedMarker, test;
var ViewModel = function() {
	map;

	// Create a new blank array for all the listing markers.
	markers = ko.observableArray();

	// This global polygon variable is to ensure only ONE polygon is rendered.
	polygon = null;

	// These are the real estate listings that will be shown to the user.
	// Normally we'd have these in a database instead.
	locations = ko.observableArray([
		{title: 'Preikestolen', location: {lat: 58.9857634, lng: 6.1575914}},
		{title: 'Trolltunga', location: {lat: 60.124167, lng: 6.7378113}},
		{title: 'Sauanuten', location: {lat: 59.8274041, lng: 6.3854395}},
	]);

	// Gives the location instances an index
	for (var i = 0; i < locations().length; i++) {
		locations()[i].index = i;
	}

	focusedMarker = ko.observable(0);

	console.dir(markers());
	console.dir(locations());

	this.test = function() {
		scroll(this.index);
	}

	$('#location_switcher_center').click(function() {
		toggleLocationSwitcherList();
	});

}

ko.applyBindings(new ViewModel());

function toggleLocationSwitcherList() {
	$('.location_switcher_list_container').toggleClass('location_switcher_list_container_hidden');
}

function scroll(index) {
	focusedMarker(index);
	moveToMarker(markers()[index]);

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
	}

	map.panTo(coordinates);
}

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
			animation: google.maps.Animation.DROP,
			// icon: pin,
			id: i
		});
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
		console.log(bounds);
	}

	displayMarkers();
}