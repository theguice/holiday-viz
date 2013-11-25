
$(document).ready(function() {

// Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
//
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    setup();
//  _map = initializeMap();
    //google.maps.event.addDomListener(window, 'load', initializeMap);
});
//var gpx = [];
var userPoints = [];
var userSteps = [];
var users = [];
var userObjects = [];
var infowindow;
var currentUser;

function setup()
{
    /*
     $(users).each(function(k, v) {
     $('#users').append('<option value="' + v.id + '">' + v.name + '</option>');
     });
     */
    $('#files').bind('change', handleFileSelect);
    $('#files').bind('change', showUserSet);
    $('.map-refresh').on('click', processTrkpts);
    $('#play-button').on('click', takeSteps);
    $('#center-button').on('click', manageCenter);
}

function showUserSet() {
//    var name = $("#users option:selected")[0].label;
    var name = $("#users").val();
    name = (name) ? name : 'user' - (users.length + 1);
    var user = new User(name);
    if ($.inArray(name, users) > -1)
    {
        users.push(name);
        userObjects.push(user)
        $('#header').append('<h2>' + name + '</h2>');
    }

//console.log($("#users option:selected")[0].value);
//    var val = $("#users option:selected")[0].value;
//    $('#header').append('<h2 style="color: ' + users[val].color + '">' + name + '</h2>');


}

function processFile(evt) {
    var x2js = new X2JS();
    var xml_string = evt.currentTarget.result;
    var json = x2js.xml_str2json(xml_string);

//    var json = $.xml2json(xml_string, true);
    //    console.log(xml);
    //    var jsonText = xmlToJson(xml);
//    console.log(json);


    // append gps point to users sub-array of gpx
//    var user = $("#users option:selected").val();

//    console.log(user);
    if (typeof (userPoints[currentUser]) === 'undefined')
    {
//        console.log('initializing user point array');
        userPoints[currentUser] = [];
    }
//    console.log(userPoints);
    if ($.isArray(json.gpx.trk.trkseg))
    {
        for (var i = 0; i < json.gpx.trk.trkseg.length; i++)
        {
            for (var j = 0; j < json.gpx.trk.trkseg[i].trkpt.length; j++)
            {
//                console.log(json.gpx.trk.trkseg[i].trkpt[j]);
                var point = new Point(json.gpx.trk.trkseg[i].trkpt[j]);
                userPoints[currentUser].push(point);
            }
        }
    }
    else
    {
        for (var j = 0; j < json.gpx.trk.trkseg.trkpt.length; j++) {
//            console.log(json.gpx.trk.trkseg.trkpt[j]);
            var point = new Point(json.gpx.trk.trkseg.trkpt[j]);
//            console.log(point);
            userPoints[currentUser].push(point);
        }
    }

//    console.log(userPoints);
}

// http://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFileSelect(evt)
{
    var user = $("#users").val();
    currentUser = (user) ? user : 'user-' + (userPoints.length + 1);
    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, j = files.length; i < j; i++)
    {
        var f = files[i];
        // Only process gpx files.
        if (!f.name.match('.gpx')) {
            console.log('file: ', f.name, ' not permitted.  Only processing GPX files')
            continue;
        }
        var reader = new FileReader();
        reader.onloadend = processFile;
        reader.readAsText(f);
    }

//    userPoints[currentUser] = sortPoints(userPoints[currentUser]);
}
/**
 * Refresh Map
 * @returns {undefined}
 */
function processTrkpts() {

    for (var user in userPoints)
    {
        if (typeof (userPoints[user]) !== 'undefined')
        {
            userPoints[user] = sortPoints(userPoints[currentUser]);
            createPath(userPoints[user], user);


            /*
             $(userPoints[i]).each(function(k, v) 
             {
             
             //                createMarker(v, 2, 1, users[i].color);
             });
             */
        }
    }
    //createMarker(userPoints[1][0], 3);
//    getSteps(findEarliest(), findLatest());
//    manageCenter();
    getSteps(timeStats.min, timeStats.max);

//    takeSteps();
}


function moveToStep(m, user, c) {
    window.setTimeout(function() {
        step = users[user].steps[c];
        console.log('step', step);
        point = new google.maps.LatLng(userPoints[user][step]._lat, userPoints[user][step]._lon);
        m.setPosition(point);
        if (c == 25) {
            infowindow.open(_map, m);
        }
        if (c == 50) {
            infowindow.close();
        }

        manageCenter();
        if (typeof (users[user].steps[c + 1]) !== undefined)
        {
            moveToStep(m, user, c + 1);
        }
    }, 50);
}

function takeSteps() {
    for (var i = 0; i < users.length; i++)
    {

        var user = users[i];
        console.log('Steps for user:' + user)
        if (typeof (userPoints[user]) !== undefined)
        {
            users[i].marker = createPointMarker(userPoints[i][0], user, i);
            moveToStep(users[i].marker, i, 0);
        }
    }
}

function getSteps(starttime, endtime) {
    var step = 60; // 1 real minute

    // set index of last gps point read for each user
    for (var i = 0; i < users.length; i++) {
        if (userPoints[i]) {
            users[i].last = 0;
        }
    }
    var count = 0;
    for (var i = 0; i < users.length; i++) {
        if (userPoints[i]) {
            //users[i].last-1 < userPoints[i].length || c
            //console.log(d2i(userPoints[i][users[i].last+1].time) - d2i(userPoints[i][users[i].last].time));
            //var t = d2i(userPoints[i][users[i].last].time);
            var t = starttime;
            while (users[i].last < userPoints[i].length - 1) {
                //console.log(userPoints[i][users[i].last+1]);
                if (d2i(userPoints[i][users[i].last + 1].time) - t < step) {
                    users[i]['steps'].push(users[i].last + 1);
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
    console.log(users);
}

function manageCenter()
{
    // using the active marker for each user
    // if one of them gets close to an edge, zoom out

    // if all are close to center, zoom in
    console.log('Re-center');
    var count = 0;

    var center = new Point();
    center.lat = coordinateStats.lat.min + (coordinateStats.lat.max - coordinateStats.lat.min) / 2;
    center.lon = coordinateStats.lon.min + (coordinateStats.lon.max - coordinateStats.lon.min) / 2;
    center.refreshLatLng();
    centerMap(center);
    var zoomout = false;
    var zoomin = true;
    while ((zoomout || zoomin) && count < 10)
    {
        var bounds = map.getBounds();
        console.log(bounds);
        console.log(coordinateStats.lat.min + "\t" + bounds.fa.d);

        if (coordinateStats.lat.min < bounds.fa.d)
        {
            console.log('zoom rule 1');
            zoomout = true;
        }
        else if (coordinateStats.lat.max > bounds.fa.b)
        {
            console.log('zoom rule 2');
            zoomout = true;
        }
        else if (Math.abs(coordinateStats.lon.min) < Math.abs(bounds.ga.d))
        {
            console.log('zoom rule 3\t' + coordinateStats.lon.min + "\t" + bounds.ga.d);

            zoomout = true;
        }
        else if (Math.abs(coordinateStats.lon.max) > Math.abs(bounds.ga.b))
        {
            console.log('zoom rule 4');
            zoomout = true;
        }
        else
        {
            console.log('zoom rule 5');
            zoomout = false;
        }
        if (zoomout)
        {
            zoomin = false;
            mapZoomOut();
        }
        else if (zoomin)
        {
            mapZoomIn();

        }
        count++;
    }
    /*  for (var i = 0; i < users.length; i++) {
     if (userPoints[i] != undefined) {
     var pos = users[i].marker.getPosition();
     var bounds = _map.getBounds();
     var zoom = _map.getZoom();
     var center = _map.getCenter();
     if (bounds.contains(pos)) {
     
     var lat = Math.abs(bounds.fa.b - bounds.fa.d) * .1;
     var lon = Math.abs(bounds.ga.b - bounds.ga.d) * .1;
     if        ((Math.abs(bounds.fa.b - pos.ob) > lat) || (Math.abs(pos.ob - bounds.fa.d) > lat)) {
     _map.setZoom(zoom+1);
     } else if ((Math.abs(bounds.ga.b - pos.pb) > lon) || (Math.abs(pos.pb - bounds.ga.d) > lon)) {
     _map.setZoom(zoom+1);
     }
     
     
     } else {
     _map.setZoom(_map.getZoom() - 1);
     }
     }
     count++;
     }
     */
}



/*
 function loadXML()
 {
 
 var request = new XMLHttpRequest();
 request.open("GET", "data.gpx", false);
 request.send();
 var xml = request.responseXML;
 
 request.close;
 var json = $.xml2json(xml, true );
 //    console.log(xml);
 //    var jsonText = xmlToJson(xml);
 console.log(json);
 
 var trkpts = json['trk'][0]['trkseg'][0].trkpt;
 console.log(trkpts.length);
 for (var i = 0, j = trkpts.length; i < j; i++)
 {
 var point = new Point(trkpts[i]);
 //        console.log(point);
 points.push(point);
 //        createMarker(point, point.time);
 
 }
 
 console.log(points);
 
 creatPath(points);
 
 }*/

/*
 function initializeMap() {
 //return map object
 var mapOptions = {
 center: new google.maps.LatLng(37.865159, -122.282138),
 zoom: 14,
 mapTypeId: google.maps.MapTypeId.ROADMAP,
 styles: [
 {"featureType": "landscape.natural.terrain"}, {"elementType": "geometry.fill",
 "stylers": [
 {"hue": "#11ff00"},
 {"weight": 0.1},
 {"saturation": -52},
 {"lightness": 2},
 {"gamma": 0.66}]},
 {"featureType": "road.local",
 "stylers": [
 {"visibility": "simplified"}]}
 ]
 };
 
 [
 {
 "elementType": "geometry.fill",
 "stylers": [
 {"hue": "#11ff00"},
 {"weight": 0.1},
 {"saturation": -52},
 {"lightness": 2},
 {"gamma": 0.66}
 ]
 }
 ]
 
 var map = new google.maps.Map(document.getElementById("map-canvas"),
 mapOptions);
 
 return map;
 }
 */

/*
 function createMarker(pt, s, sw, c) {
 var point = new google.maps.LatLng(pt._lat, pt._lon);
 var marker = new google.maps.Marker({
 position: point,
 animation: google.maps.Animation.DROP,
 map: _map,
 title: '' + pt.time,
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
 */

/*
 function findEarliest()
 {
 
 t = 9999999999999;
 for (var i = 0; i < users.length; i++) {
 if (userPoints[i]) {
 for (var j = 0; j < userPoints[i].length; j++) {
 
 if (d2i(userPoints[i][j].time) < t) {
 t = d2i(userPoints[i][j].time);
 }
 }
 }
 }
 return t;
 }
 function findLatest()
 {
 t = 0;
 for (var i = 0; i < users.length; i++) {
 if (userPoints[i] != undefined) {
 for (var j = 0; j < userPoints[i].length; j++) {
 if (d2i(userPoints[i][j].time) > t) {
 t = d2i(userPoints[i][j].time);
 }
 }
 }
 }
 return t;
 }
 
 function d2i(d)
 {
 date = new Date(d);
 return date.getTime() / 1000; // converting to seconds
 }
 */  