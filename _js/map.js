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
var pathIndex = 0;
var currentLevel = 0;
var points = [];
var mapCenter;
var mapZoom = 14;
var mapStyle = [
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
];
function initMap()
{
    mapCenter = new google.maps.LatLng(37.865159, -122.282138);
    google.maps.visualRefresh = true;
    google.maps.event.addDomListener(window, 'load', setCurrentLocation);
}
function setCurrentLocation() {

    if (navigator.geolocation)
    {
        return navigator.geolocation.getCurrentPosition(showPosition);
    }

}



function showPosition(position)
{

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

function centerMap(point)
{
    mapCenter = point.LatLng;
    map.setCenter(mapCenter);
}
function createPointMarker(point, title, userIndex)
{
//    console.log('adding marker ' + point.lat + ' ' + point.lon);

    userIndex = (userIndex) ? userIndex : 0;
    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: title + ""
        , icon: colors[userIndex]});
}
function createMarker(point, title)
{

    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: title + ""
    });
}

function createPath(pts, user, createMarkers)
{
    console.log('Creating path');
    pathIndex++;
    user = (user) ? user : 'path-' + pathIndex;
    createMarkers = (createMarkers) ? createMarkers : true;
    var polyPoints = [];
    var ele = pts[0].elevation;
    console.log('ele=' + ele);
    console.log(pts);
    for (var i = 0, j = pts.length; i < j; i++)
    {
        var point = pts[i];
        if (createMarkers)
            createPointMarker(point, point.time);
        polyPoints.push(point.LatLng);
        if (draw_elevation)
        {
            if (point.elevation !== ele)
            {
                drawPath(polyPoints);
                ele = point.elevation;
                polyPoints = [];
                polyPoints.push(point.LatLng);
            }
        }
    }
    if (!draw_elevation)
        drawPath(polyPoints);

}

function drawPath(polyPoints)
{
    var color = new ColorCombo();
    color = colors[pathIndex];
//            console.log(color);
    var path = new google.maps.Polyline({
        path: polyPoints,
        geodesic: true,
        strokeColor: color.strokeColor,
        strokeOpacity: color.strokeOpacity,
        strokeWeight: color.strokeWeight
    });
    path.setMap(map);
}

function getElevationColor(ele)
{
//    console.log(elevation);
    var color = Math.ceil((ele - elevation['min']) / (elevation['max'] - elevation['min']) * 255);
    return (color >= 0) ? color : 0;
}

function mapZoomIn()
{
    console.log('zoom in');
    var zoom = map.getZoom();
    map.setZoom(zoom + 1);
}

function mapZoomOut()
{
    console.log('Zoom out');

    var zoom = map.getZoom();
    map.setZoom(zoom - 1);
}