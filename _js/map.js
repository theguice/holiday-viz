/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var draw_elevation = false;
$(document).ready(function() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    initMap();
    //  _map = initializeMap();
    //google.maps.event.addDomListener(window, 'load', initializeMap);
});
var map;
var drawnUserIds = [];
var currentLevel = 0;
var points = [];
var markers = [];
var paths = [];
var mapCenter;
var mapZoom = 14;
var mapStyle = [{
        "featureType": "landscape.natural.terrain"
    }, {
        "elementType": "geometry.fill",
        "stylers": [{
                "hue": "#11ff00"
            }, {
                "weight": 0.1
            }, {
                "saturation": -52
            }, {
                "lightness": 2
            }, {
                "gamma": 0.66
            }]
    }, {
        "featureType": "road.local",
        "stylers": [{
                "visibility": "simplified"
            }]
    }];

function initMap() {
    mapCenter = new google.maps.LatLng(37.865159, -122.282138);
    google.maps.visualRefresh = true;
    google.maps.event.addDomListener(window, 'load', setCurrentLocation);
    // location.reload()
}

function setCurrentLocation() {

    if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition(showPosition);
    }

}



function showPosition(position) {

    var point = new Point(position);
    console.log(position);
    console.log(point);
    mapCenter = point.LatLng;
    var mapOptions = {
        center: mapCenter,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyle
    };
    map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);


    //    centerMap(point);
    createMarker(point, "You are here! (at least within a " + position.coords.accuracy + " meter radius)");
}

function centerMap(point) {
    mapCenter = point.LatLng;
    map.setCenter(mapCenter);
}

function createPointMarker(point, title, userIndex) {
    //    console.log('adding marker ' + point.lat + ' ' + point.lon);

    userIndex = (userIndex) ? userIndex : 0;
    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: title + "",
        icon: colors[userIndex]
    });
    markers.push(marker);
}

function createMarker(point, title) {

    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: title + ""
    });

    markers.push(marker);
}

function createPath(pts, userId, createMarkers) {

    console.log('Creating path');
    var userIndex = $.inArray(userId, drawnUserIds);

    if (userIndex === -1)
    {
        drawnUserIds.push(userId);
        userIndex = drawnUserIds.length - 1;
    }

//    userId = (userId) ? userId : userIndex;
    createMarkers = (createMarkers) ? createMarkers : true;
    var polyPoints = [];
    var ele = pts[0].elevation;
//    console.log('ele=' + ele);
//    console.log(pts);
    for (var i = 0, j = pts.length; i < j; i++) {
        var point = pts[i];
        if (createMarkers)
            createPointMarker(point, point.time, userIndex);
        if (point.deltaTime === -1)
        {
            console.log('splitting trip for ' + userId + "\t" + userIndex);
            drawPath(polyPoints, userIndex);
            polyPoints = [];
            polyPoints.push(point.LatLng);

        }
        polyPoints.push(point.LatLng);
        if (draw_elevation) {
            if (point.elevation !== ele) {
                drawPath(polyPoints, userIndex);
                ele = point.elevation;
                polyPoints = [];
                polyPoints.push(point.LatLng);
            }
        }
    }
    if (!draw_elevation)
        drawPath(polyPoints, userIndex);

}





function drawPath(polyPoints, userIndex)
{
    var color = new ColorCombo();
    userIndex = (userIndex) ? userIndex : 0;
    color = colors[userIndex];
    //            console.log(color);
    var path = new google.maps.Polyline({
        path: polyPoints,
        geodesic: true,
        strokeColor: color.strokeColor,
        strokeOpacity: color.strokeOpacity,
        strokeWeight: color.strokeWeight
    });
    paths.push(path);
    // path.setMap(null);
    path.setMap(map);
    // google.maps.event.addDomListener(window, 'load', initialize);

}

function getElevationColor(ele) {
    //    console.log(elevation);
    var color = Math.ceil((ele - elevation['min']) / (elevation['max'] - elevation['min']) * 255);
    return (color >= 0) ? color : 0;
}

function mapZoomIn() {
    console.log('zoom in');
    var zoom = map.getZoom();
    map.setZoom(zoom + 1);
}

function mapZoomOut() {
    console.log('Zoom out');

    var zoom = map.getZoom();
    map.setZoom(zoom - 1);
}


function deleteMarkers()
{
    hideMarkers();
    markers = [];
}

function hideMarkers()
{
    for (var i = 0, j = markers.length; i < j; i++)
    {
        markers[i].setMap(null);
    }
}


function deletePaths()
{
    hidePaths();
    paths = [];
}

function hidePaths()
{
    for (var i = 0, j = paths.length; i < j; i++)
    {
        paths[i].setMap(null);
    }
}


function clearMap()
{

    deleteMarkers();
    deletePaths();
    generateUserColors();
}
/*
function processTrkpts()
{
    var start, end;
    clearMap();
    console.log(getActiveUserIds());
    var points = getActivePoints(start, end, getActiveUserIds());
    
//    console.log(points);
    userPoints = [];
    for (var i = 0, j = points.length; i < j; i++)
    {
//        var point = new Point();
        var point = points[i];
        var id = point['userId'];
        if (typeof (userPoints[id]) === 'undefined')
        {
            console.log('New user array ' + id);
            userPoints[id] = [];
        }
        userPoints[id].push(point);
    }
    console.log(userPoints);
    for (var userId in userPoints)
    {
        if (typeof (userPoints[userId]) !== 'undefined')
        {
            console.log('Drawing user:' + userId);
//            userPoints[user] = sortPoints(userPoints[user]);
            createPath(userPoints[userId], userId);
        }
    }
//    manageCenter();
    getSteps(timeStats.min, timeStats.max);
}
*/
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
}

function generateUserColors()
{
    usrs = getActiveUserIds();
    console.log(usrs);
    numUsers = usrs.length;
    numUsers = (numUsers && numUsers > 0) ? numUsers : 1;
    console.log('generating user colors for ' + numUsers);

    var cmax = 255, R = 0, G1 = 64, G2 = 255, B = cmax;
    for (var i = 0; i < numUsers; i++)
    {
        var cc = new ColorCombo();
        var tR = Math.ceil((cmax - R) * i / (numUsers - 1) + R);
        cc.strokeColor = 'rgb(' + tR + ',' + G1 + ',' + B + ')';
        cc.fillColor = 'rgb(' + tR + ',' + G2 + ',' + B + ')';
        colors.push(cc);

    }
}
