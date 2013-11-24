/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var map;
var currentLevel = 0;
init();
var points = [];
var elevation = {'min': 100000, 'max': 0};
function Point(trkpt)
{
    this.elevation = (trkpt['ele'] && trkpt['ele'][0]) ? parseFloat(trkpt.ele[0].text) : 0;
    elevation['min'] = (this.elevation < elevation.min) ? this.elevation : elevation['min'];
    elevation['max'] = (this.elevation > elevation.max) ? this.elevation : elevation['max'];
    this.lat = (trkpt.lat) ? parseFloat(trkpt.lat) : 0;
    this.lon = (trkpt.lon) ? parseFloat(trkpt.lon) : 0;
    this.time = (trkpt['time'] && trkpt['time'][0]) ? new Date(trkpt.time[0].text) : 0;
    this.LatLng = new google.maps.LatLng(parseFloat(trkpt.lat), parseFloat(trkpt.lon));

}
function init() {

    google.maps.visualRefresh = true;
    google.maps.event.addDomListener(window, 'load', initialize);


}
function initialize() {

    if (navigator.geolocation)
    {
        return navigator.geolocation.getCurrentPosition(showPosition);
    }

}



function showPosition(position)
{

    lat = position.coords.latitude;
    lon = position.coords.longitude;
    var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
    console.log("Latitude: " + lat + "\t" + typeof (lat) + "\nLongitude: " + lon);

//    $("#lat-label").text(lat);
//    $("#lon-label").text(lon);
    var mapOptions = {
        center: latlng,
        zoom: 16,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);

    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: "You are here! (at least within a " + position.coords.accuracy + " meter radius)"
    });

    loadXML();
}

function loadXML()
{

    var request = new XMLHttpRequest();
    request.open("GET", "data.gpx", false);
    request.send();
    var xml = request.responseXML;

    request.close;
    var json = $.xml2json(xml, true /* extended structure */);
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

}

function createMarker(point, title)
{
    var latlng = new google.maps.LatLng(point.lat, point.lon);
    var marker = new google.maps.Marker({
        position: latlng,
        map: map,
        title: title + ""
    });
}

function creatPath(pts)
{
    var polyPoints = [];
    var ele = pts[0].elevation;
    console.log('ele=' + ele);
    for (var i = 0, j = pts.length; i < j; i++)
    {
        var point = pts[i];
        polyPoints.push(point.LatLng);
        if (point.elevation !== ele)
        {
//            polyPoints.push(point.LatLng);
//            console.log(polyPoints);
            var color = 'rgb(255,' + getElevationColor(ele) + ', 0)';
//            console.log(color);
            var path = new google.maps.Polyline({
                path: polyPoints,
                geodesic: true,
                strokeColor: color,
                strokeOpacity: 1.0,
                strokeWeight: 2
            });

            path.setMap(map);
            ele = point.elevation;
            polyPoints = [];
            polyPoints.push(point.LatLng);
        }
    }
}

function getElevationColor(ele)
{
//    console.log(elevation);
    var color = Math.ceil((ele - elevation['min']) / (elevation['max'] - elevation['min']) * 255);
    return (color >= 0) ? color : 0;

}