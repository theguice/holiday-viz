$(document).ready(function() {

	//global variable _map stores map object
//	_map = initializeMap();
//	loadData();

});


function initializeMapOld() {
	//return map object
	var mapOptions = {
          center: new google.maps.LatLng(37.865159, -122.282138),
          zoom: 10,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [ { "featureType": "landscape.natural.terrain" },{ "elementType": "geometry.fill", "stylers": [ { "saturation": 6 }, { "gamma": 0.28 }, { "lightness": 24 }, { "hue": "#ff0077" }, { "weight": 0.8 } ] },{ "featureType": "road.local", "stylers": [ { "visibility": "simplified" } ] } ]
        };

    var map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);
    return map;
}


function importGPXtoJSON() {
	console.log('importGPXtoJSON');
}



/*

function processEarthquakes(data) {
	console.log(data);
	//for each earthquake in the list
	//call createMaker and send in the data about the quake
	data.features.forEach(createMarker);
}

function createMarker(quake) {
	console.log(quake);

	var point = new google.maps.LatLng(quake.geometry.coordinates[1], quake.geometry.coordinates[0]);
	console.log(point);

	var marker = new google.maps.Marker({ 
	 position: point, 
	 animation: google.maps.Animation.BOUNCE,
	 map: _map, 
	 title: ''+quake.properties.mag,
	 icon: {
	      path: google.maps.SymbolPath.CIRCLE,
	      scale: quake.properties.mag
	    },
	}); 




	google.maps.event.addListener(marker, 
	'click', function() { 
	 _map.setCenter(marker.getPosition());
	}); 

}
*/