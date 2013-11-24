
$(document).ready(function() {

	//global variable _map stores map object
	//_map = initializeMap();
	//loadData();

	// Check for the various File API support.
	if (window.File && window.FileReader && window.FileList && window.Blob) {
    //
	} else {
	  alert('The File APIs are not fully supported in this browser.');
	}

  setup();
  _map = initializeMap();
  //google.maps.event.addDomListener(window, 'load', initializeMap);
});

var gpx = [];
var infowindow;

function setup() {
    $(users).each(function(k, v) {
        $('#users').append('<option value="' + v.id + '">' + v.name + '</option>');
    });

    $('#files').bind('change', handleFileSelect);
    $('#files').bind('change', showUserSet);
    $('.map-refresh').on('click', processTrkpts);

    infowindow = new google.maps.InfoWindow({
      content: "<span>Hello</span>"
    });

}

function initializeMap() {
  //return map object
  var mapOptions = {
          center: new google.maps.LatLng(37.865159, -122.282138),
          zoom: 14,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          styles: [ 
            { "featureType": "landscape.natural.terrain" },{ "elementType": "geometry.fill", 
              "stylers": [
                { "hue": "#11ff00" },
                { "weight": 0.1 },
                { "saturation": -52 },
                { "lightness": 2 },
                { "gamma": 0.66 }] },
            { "featureType": "road.local", 
              "stylers": [ 
                { "visibility": "simplified" } ] } 
            ]
        };

        [
  {
    "elementType": "geometry.fill",
    "stylers": [
      { "hue": "#11ff00" },
      { "weight": 0.1 },
      { "saturation": -52 },
      { "lightness": 2 },
      { "gamma": 0.66 }
    ]
  }
]

    var map = new google.maps.Map(document.getElementById("map-canvas"),
        mapOptions);

    return map;
}

function showUserSet() {
    var name = $("#users option:selected")[0].label;
    //console.log($("#users option:selected")[0].value);
    var val = $("#users option:selected")[0].value;

    $('#header').append('<h2 style="color: ' + users[val].color + '">' + name + '</h2>');
}

function processFile(evt) {
    var x2js = new X2JS();
    var xml_string = evt.currentTarget.result;
    var json = x2js.xml_str2json( xml_string );
    //console.log(json);
    //console.log(evt.currentTarget.result);

    // append gps point to users sub-array of gpx
    var user = $("#users option:selected").val();
    if (gpx[user] == undefined) {
      gpx[user] = [];
    }

    if ($.isArray(json.gpx.trk.trkseg)) {
      for (var i=0; i<json.gpx.trk.trkseg.length; i++) {
        for (var j=0; j<json.gpx.trk.trkseg[i].trkpt.length; j++) {
          //console.log(json.gpx.trk.trkseg[i].trkpt[j]);
          gpx[user].push(json.gpx.trk.trkseg[i].trkpt[j]);
        }
      }
    } else {
      for (var j=0; j<json.gpx.trk.trkseg.trkpt.length; j++) {
        //console.log(json.gpx.trk.trkseg.trkpt[j]);
        gpx[user].push(json.gpx.trk.trkseg.trkpt[j]);
      }
    }
    console.log(gpx);
  }


// http://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, f; f = files[i]; i++) {

      // Only process gpx files.
      if (!f.name.match('.gpx')) {
      	console.log('file: ', f.name, ' not permitted.  Only processing GPX files')
        continue;
      }
      var reader = new FileReader();
      reader.onloadend = processFile;
      reader.readAsText(f);
    }
}

function processTrkpts() {
  for (var i=0; i<gpx.length; i++) {
    if (gpx[i] != undefined) {
      $(gpx[i]).each(function(k,v) {
        createMarker(v, 2, 1, users[i].color);
      });
    }
  }
  //createMarker(gpx[1][0], 3);
  getSteps(findEarliest(), findLatest());
  takeSteps();
}

function createMarker(pt, s, sw, c) {
  var point = new google.maps.LatLng(pt._lat, pt._lon);
  var marker = new google.maps.Marker({ 
   position: point, 
   animation: google.maps.Animation.DROP,
   map: _map, 
   title: ''+pt.time,
   icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: s,
        fillColor: '#000',
        strokeColor: c,
        strokeWeight: sw
      },
  }); 

  google.maps.event.addListener(marker, 'click', function() { 
    _map.setCenter(marker.getPosition());
  }); 

  return marker;
}


function moveToStep(m, user, c) {
    window.setTimeout(function(){
        step = users[user].steps[c];
        console.log('step', step);
        point = new google.maps.LatLng(gpx[user][step]._lat, gpx[user][step]._lon);
        m.setPosition(point);

        if (c == 25) {
          infowindow.open(_map,m);
        }
        if (c == 50) {
          infowindow.close();
        }

        manageCenter();
        if (users[user].steps[c+1] != undefined) {
          moveToStep(m, user, c+1);
        }
    },50);
}

function takeSteps() {
    for (var i=0; i<users.length; i++) {
      if (gpx[i] != undefined) {
          users[i].marker = createMarker(gpx[i][0], 5, 4, users[i].color);
          moveToStep(users[i].marker, i, 0);
      }
  }
}

function getSteps(starttime, endtime) {
  var step = 60;  // 1 real minute

  // set index of last gps point read for each user
  for (var i=0; i<users.length; i++) {
      if (gpx[i] != undefined) {
          users[i].last = 0;
      }
  }
  var count = 0;
  for (var i=0; i<users.length; i++) {
      if (gpx[i] != undefined) {
          //users[i].last-1 < gpx[i].length || c
          //console.log(d2i(gpx[i][users[i].last+1].time) - d2i(gpx[i][users[i].last].time));
          //var t = d2i(gpx[i][users[i].last].time);
          var t = starttime;
          while (users[i].last < gpx[i].length-1) {
              //console.log(gpx[i][users[i].last+1]);
              if (d2i(gpx[i][users[i].last+1].time) - t < step) {
                  users[i]['steps'].push(users[i].last+1);
                  users[i].last += 1;
                  count = 0;
              } else {
                  t += step;
                  count++;
                  if (count > 100) {
                    continue;
                  }
                  users[i]['steps'].push(users[i].last);
              }
          }
      }
  }

  /*  Initial attempt at synchronizing by time
  // build queue of steps for each user to take
  for (var t = starttime; t <= endtime; t += step) {
    for (var i=0; i<users.length; i++) {
      if (gpx[i] != undefined) {

        //console.log(d2i(gpx[i][users[i].last+1].time)-t);
          if ((d2i(gpx[i][users[i].last+1].time) - t) <= step) {
            users[i]['steps'].push(users[i].last+1);
            users[i].last += 1;
          } else {
            users[i]['steps'].push(users[i].last);
          }
      }
    }
  }
  */
  console.log(users);
}

function findEarliest() {
    t = 9999999999999;
    for (var i=0; i<users.length; i++) {
        if (gpx[i] != undefined) {
            for (var j=0; j<gpx[i].length; j++) {

                if (d2i(gpx[i][j].time) < t) {
                    t = d2i(gpx[i][j].time);
                }
            }
        }
    }
    return t;
}
function findLatest() {
    t = 0;
    for (var i=0; i<users.length; i++) {
        if (gpx[i] != undefined) {
            for (var j=0; j<gpx[i].length; j++) {
                if (d2i(gpx[i][j].time) > t) {
                    t = d2i(gpx[i][j].time);
                }
            }
        }
    }
    return t;
}

function d2i(d) {
    date = new Date(d);
    return date.getTime() / 1000;  // converting to seconds
}

function manageCenter() {
  // using the active marker for each user
  // if one of them gets close to an edge, zoom out

  // if all are close to center, zoom in
    var count = 0;
    for (var i=0; i<users.length; i++) {
        if (gpx[i] != undefined) {
            var pos = users[i].marker.getPosition();
            var bounds = _map.getBounds();
            var zoom = _map.getZoom();
            var center = _map.getCenter();
            if (bounds.contains(pos)) {
/*
                var lat = Math.abs(bounds.fa.b - bounds.fa.d) * .1;
                var lon = Math.abs(bounds.ga.b - bounds.ga.d) * .1;
                if        ((Math.abs(bounds.fa.b - pos.ob) > lat) || (Math.abs(pos.ob - bounds.fa.d) > lat)) {
                    _map.setZoom(zoom+1);
                } else if ((Math.abs(bounds.ga.b - pos.pb) > lon) || (Math.abs(pos.pb - bounds.ga.d) > lon)) {
                    _map.setZoom(zoom+1);
                }
*/                

            } else {
                _map.setZoom(_map.getZoom()-1);
            }
        }
        count ++;
    }
}