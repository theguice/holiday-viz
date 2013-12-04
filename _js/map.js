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
var playing = false;
var autoCenter = false;
var increment = 5; //step increment in minutes
var pointWindow = 60; ///in minutes
var intervalDelay = 300;
var startDate;
var endDate;
var userPoints = [];
var userTimePoints = {};
var boundaryTimeStats = {};
var sliderMap = {};
var infowindow;
var userSteps = [];
var drawnUserIds = [];
var currentLevel = 0;
var points = [];
var markers = [];
var userMarkers = {};
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

    loadDates();
    $('.map-refresh').on('click', processTrkpts);
    $('#draw-button').on('click', drawAll);
//    $('#play-button').on('click', takeSteps);
    $('#play-button').on('click', play);
    $('#auto-center-button').on('click', toggleAutoCenter);
    $('#center-button').on('click', manageCenter);
    mapCenter = new google.maps.LatLng(37.865159, -122.282138);
    google.maps.visualRefresh = true;
    google.maps.event.addDomListener(window, 'load', setCurrentLocation);
    // location.reload()
}
function loadDates()
{
    var dates = getDatesFromDb();

    for (var i = 0, j = dates.length; i < j; i++)
    {
        var date = new Date(dates[i]['track_timestamp']);
        var str = "<li><a href='#'>" + date.toLocaleDateString() + "</a></li>";
        $('#start-date-menu').append(str);
        $('#end-date-menu').append(str);
    }

    $('.date-dropdown li a').on('click', function()
    {
//        startDate = new Date();
//        endDate = new Date();

        var self = $(this);
//        console.log(self);
        self.parent().parent().attr('data-date', self.text());
        self.parent().parent().siblings('.dropdown-toggle').text(self.text());
//        console.log(self.text());
//        console.log(self.parent().parent().singlins('.dropdown-toggle'));

        var dateType = self.parent().parent().attr('id');
        console.log(dateType);
        var date = new Date(self.text());
        console.log(date.toString());
        if (dateType === 'end-date-menu')
        {

            setEndDate(date);
            console.log('changed endDate=' + endDate);
        } else
        {
            setStartDate(date);
            console.log('changed startDate=' + startDate);

        }
        console.log(startDate + "\t" + endDate);
        initDashboard(startDate, endDate);
    });
}
function setStartDate(date)
{
    startDate = date;
}
function setEndDate(date)
{
    endDate = date;
}
function setCurrentLocation() {

    if (navigator.geolocation) {
        return navigator.geolocation.getCurrentPosition(showPosition);
    }
    else
    {

        showMap(new Point(mapCenter));
    }

}

function showPosition(position) {

    var point = new Point(position);
//    console.log(position);
//    console.log(point);

    showMap(point);
}
/**
 * 
 * @param {Point} point
 * @returns {undefined}
 */
function showMap(point)
{
    console.log('showing map');
    console.log(point);
    point.refreshLatLng();
    mapCenter = point.LatLng;
    var mapOptions = {
        center: mapCenter,
        zoom: 14,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        styles: mapStyle
    };

    map = new google.maps.Map(document.getElementById("map-canvas"),
            mapOptions);
    createMarker(point, "You are here!");
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

function createUserMarker(point, userId)
{
    var user = getUserObjectById(userId);
    if (typeof (userMarkers[userId]) !== 'undefined')
    {
//        userMarkers[userId].setMap(null);
    }

    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: user.firstName + " " + user.lastName
    });
    userMarkers[userId] = marker;
//    console.log(userMarkers);
}

function createPath(pts, userId, createMarkers) {

//    console.log('Creating path');
    var userIndex = $.inArray(userId, drawnUserIds);
    if (userIndex === -1)
    {
        drawnUserIds.push(userId);
        userIndex = drawnUserIds.length - 1;
    }

//    userId = (userId) ? userId : userIndex;
//    createMarkers = (createMarkers) ? createMarkers : true;
    var polyPoints = [];
    var ele = 0;
    try {
        ele = pts[0].elevation;
    } catch (e)
    {

    }
//    console.log('ele=' + ele);
//    console.log(pts);
    for (var i = 0, j = pts.length; i < j; i++)
    {
        var point = pts[i];
        if (i === 0)
        {
//            createUserMarker(point, userId);
        }
        if (i === (j - 1))
        {
            if (userMarkers[userId])
            {
                userMarkers[userId].setPosition(point.LatLng);

            } else
                createUserMarker(point, userId);
        }
        if (point.deltaTime === -1)
        {
            drawPath(polyPoints, userIndex);
            polyPoints = [];
            polyPoints.push(point.LatLng);
        }
        polyPoints.push(point.LatLng);
        if (draw_elevation)
        {
            if (point.elevation !== ele)
            {
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
    userMarkers = [];
}

function hideMarkers()
{
    console.log(userMarkers);
    for (var i = 0, j = markers.length; i < j; i++)
    {
//        markers[i].setMap(null);
    }
    for (var i = 0, j = userMarkers.length; i < j; i++)
    {
        /*    if (userMarkers[i])
         userMarkers[i].setMap(null);
         */ }
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

function manageCenter(evt, statistics)
{

    console.log(statistics);
//    console.log(coordinateStats);
    var stat = (statistics) ? statistics : coordinateStats;
    console.log(stat);
    // using the active marker for each user
    // if one of them gets close to an edge, zoom out

    // if all are close to center, zoom in
    console.log('Re-center');
    var count = 0;
    var center = new Point();
    center.lat = stat.lat.min + (stat.lat.max - stat.lat.min) / 2;
    center.lon = stat.lon.min + (stat.lon.max - stat.lon.min) / 2;
    center.refreshLatLng();
    centerMap(center);
    var zoomout = false;
    var zoomin = true;
    while ((zoomout || zoomin) && count < 10)
    {
        var bounds = map.getBounds();
        console.log(bounds);
        console.log(stat.lat.min + "\t" + bounds.fa.d);
        if (stat.lat.min < bounds.fa.d)
        {
//            console.log('zoom rule 1');
            zoomout = true;
        }
        else if (stat.lat.max > bounds.fa.b)
        {
//            console.log('zoom rule 2');
            zoomout = true;
        }
        else if (Math.abs(stat.lon.min) < Math.abs(bounds.ga.d))
        {
//            console.log('zoom rule 3\t' + stat.lon.min + "\t" + bounds.ga.d);
            zoomout = true;
        }
        else if (Math.abs(stat.lon.max) > Math.abs(bounds.ga.b))
        {
//            console.log('zoom rule 4');
            zoomout = true;
        }
        else
        {
//            console.log('zoom rule 5');
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


/**
 * Refresh Map
 * @returns {undefined}
 */
function processTrkpts()
{

    prepareData();
    reloadSlider();
    prepareUsersTimePoints();
//    drawUsersPoints();


//    console.log(points);
    userPoints = [];
}

function drawAll()
{
    prepareData();
    drawUsersPoints();

}

function prepareData()
{
    clearMap();
    generateUserColors();
//    var start, end;
    var points = getActivePoints(startDate, endDate, getActiveUserIds());
    generateStats(points);
    prepareUsersPoints(points);
}

function clearMap()
{

//    deleteMarkers();
    deletePaths();
//    generateUserColors();
}

function reloadSlider()
{
    var slider = $('#slider');
    var minDate = new Date(timeStats.min.getFullYear(), timeStats.min.getMonth(), timeStats.min.getDate(),
            timeStats.min.getHours(), 0, 0, 0);
    var maxDate = new Date(timeStats.max.getFullYear(), timeStats.max.getMonth(), timeStats.max.getDate(),
            timeStats.max.getHours(), 0, 0, 0);
    maxDate = new Date(maxDate.getTime() + (60 * 60 * 1000)); //add 1 hour
    var dateRangeMinutes = (maxDate - minDate) / (1000 * 60);
    console.log("dateRange=" + dateRangeMinutes);
    var min = 0;
    var max = Math.ceil(dateRangeMinutes / 15);
    for (var i = 0; i <= max; i++)
    {
        var dateInc = i * increment * 1000 * 60;
        var newDate = new Date(minDate.getTime() + dateInc);
//        console.log(newDate);
        sliderMap[i] = newDate;
        boundaryTimeStats[i] = {'lat': {'min': 180, 'max': -180}, 'lon': {'min': 180, 'max': -180}};
    }
//    console.log(sliderMap);
//    console.log(boundaryTimeStats);
    slider.prop('min', min).prop('max', max).prop('value', min);

    addSliderEvent();

}

function addSliderEvent()
{
    var slider = $('#slider');
    slider.on('change', function() {
        var self = $(this);
        var val = self.val();
        $('#slider-value').text(sliderMap[val].toString());
        clearMap();
        drawUsersTimePoints(val, pointWindow);
        if (autoCenter && boundaryTimeStats[val])
            manageCenter(val, boundaryTimeStats[val]);
    });
}

function prepareUsersPoints(points)
{
    for (var i = 0, j = points.length; i < j; i++)
    {
//        var point = new Point();
        var point = points[i];
        var id = point['userId'];
        if (typeof (userPoints[id]) === 'undefined')
        {
//            console.log('New user array ' + id);
            userPoints[id] = [];
        }
        userPoints[id].push(point);
    }
//    console.log(userPoints);

}

function prepareUsersTimePoints()
{
    console.log('preparing time points');
    for (var userId in userPoints)
    {
        var pts = userPoints[userId];
        userTimePoints[userId] = {};
        var mapCount = 0;
        userTimePoints[userId][0] = [];
        for (var i = 0, j = pts.length; i < j; i++)
        {
            var point = pts[i];
            if (point.time <= sliderMap[mapCount])
            {
                userTimePoints[userId][mapCount].push(point);
                updateCoundaryStats(mapCount, point);
            }
            else
            {
                var skipped = 0;
                while (point.time > sliderMap[mapCount])
                {

                    mapCount++;
                    skipped++;
                    userTimePoints[userId][mapCount] = [];

                }
//                console.log('skipped ' + skipped);
                userTimePoints[userId][mapCount].push(point);
                updateCoundaryStats(mapCount, point);
//                  i--;
            }

        }
    }


    for (var i in boundaryTimeStats)
    {
        var temp;
//       
        if (boundaryTimeStats[i]['lat']['min'] === 180 && boundaryTimeStats[i]['lat']['max'] === -180)
        {
//            console.log('clearing boundary ' + i);

            boundaryTimeStats[i] = temp;
        }
        else
            console.log(i + "\t" + boundaryTimeStats[i]['lat']['min'] + "\t" + boundaryTimeStats[i]['lat']['max']);
    }
    console.log(boundaryTimeStats);
//    console.log(userTimePoints);
}
/**
 * 
 * @param {type} index
 * @param {Point} point
 * @returns {undefined}
 */
function updateCoundaryStats(index, point)
{
    var stat = boundaryTimeStats[index];
    try {
        boundaryTimeStats[index]['lat']['min'] = (point.lat < stat.lat.min) ? point.lat : stat.lat.min;
        boundaryTimeStats[index]['lat']['max'] = (point.lat > stat.lat.max) ? point.lat : stat.lat.max;
        boundaryTimeStats[index]['lon']['min'] = (point.lon < stat.lon.min) ? point.lon : stat.lon.min;
        boundaryTimeStats[index]['lon']['max'] = (point.lon > stat.lon.max) ? point.lon : stat.lon.max;
    } catch (e)
    {
//        console.log(e);
//        console.log(stat);

    }
}
function drawUsersPoints()
{
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
//    getSteps(timeStats.min, timeStats.max);
}

function drawUsersTimePoints(sliderMapVal, window)
{
//    var start = new Date(end.getTime() - window * 60 * 1000);
    var stepCount = Math.floor(window / increment);
//    console.log('drawing time points ' + sliderMapVal);
    var activeUserIds = getActiveUserIds();
//    console.log(activeUserIds);
    for (var i = 0, j = activeUserIds.length; i < j; i++)
    {

        var id = activeUserIds[i];
//        console.log('drawing user ' + id);
        var points = [];
        for (var k = stepCount; k >= 0; k--)
        {
            var sliderStep = sliderMapVal - k;
//            console.log(sliderStep);
            if (sliderStep >= 0 && userTimePoints[id] )
                points = points.concat(userTimePoints[id][sliderStep]);
        }
//        console.log(points);
//        var points = getPoints(start, end, id);
//        console.log(points);
//        console.log('Drawing user:' + id);
//            userPoints[user] = sortPoints(userPoints[user]);
        if (points.length > 0)
            createPath(points, id);
    }
//    manageCenter();
//    getSteps(timeStats.min, timeStats.max);

}
function toggleAutoCenter()
{
    autoCenter = !autoCenter;

    if (autoCenter)
    {
        $('#auto-center-button').removeClass('btn-success').addClass('btn-info');
    }
    else
    {
        $('#auto-center-button').removeClass('btn-info').addClass('btn-success');
    }
}
function play()
{
    console.log('clicked play');
    playing = !playing;

    if (playing)
    {
        $('#play-button').text('Pause').removeClass('btn-success').addClass('btn-info');
    }
    else
        $('#play-button').text('Play').removeClass('btn-info').addClass('btn-success');

//    console.log(sliderMap.length);
//    console.log('playing ' + playing);
    var val = parseInt($('#slider').val())
    for (var key in sliderMap)
    {
        if (key >= val && playing)
        {

            return playing = setInterval(doPlay, intervalDelay);

            doPlay();//(*)
        }
    }

}

function doPlay()
{

//    setInterval(function() {
    if (playing)
    {
        var val = parseInt($('#slider').val()) + 1;
        $('#slider').val(val).trigger('change');
    }
//    console.log('new value = ' + val);
//    }, 10000);

}