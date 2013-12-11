/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var mapLog = false;
var draw_elevation = false;
var map;
var geocoder;
var playing = false;
var autoCenter = true;
var increment = 5; //step increment in minutes
var pointWindow = 120; ///in minutes
var oldPointWindow = 1440;
var drawPointMarkers = false;
var drawMarkersToggle = false;
var autoCenterToggle = true;
var intervalDelay = 100;
var distance_limit = 200;
var startDate;
var endDate;
var doSkip = true;
var userPoints = [];
var userTimePoints = {};
var boundaryTimeStats = {};
var boundsByTime = {};
var pointCountByTime = {};
var sliderMap = {};
var sliderCount = 0;
var infowindow;
var userSteps = [];
var drawnUserIds = [];
var currentLevel = 0;
var points = [];
var markers = [];
var pictures = [];
var iconBase = 'http://maps.google.com/mapfiles/kml/pal2/';
var userMarkers = {};
var userLocations = {};
var userTransModes = {};
var paths = [];
var mapCenter;
var mapZoom = 14;
var mapStyle = [{
        "stylers": [{
                "visibility": "on"
            }, {
                "lightness": 1
            }]
    }];

var mapNightStyle = [{
        "stylers": [{
                "visibility": "on"
            }, {
                "lightness": 1
            },
            {"invert_lightness": true}]
    }];

function initMap() {

    loadDates();
    $('.map-refresh').unbind('click').on('click', processTrkpts);
    $('#draw-button').unbind('click').on('click', drawAll);
//    $('#play-button').on('click', takeSteps);
    $('#play-button').unbind('click').on('click', play);
    $('#auto-center-button').unbind('click').on('click', toggleAutoCenter);
    $('#draw-markers-button').unbind('click').on('click', toggleDrawMarkers);
    $('#center-button').unbind('click').on('click', manageCenter);
    addConfigEvents();
    geocoder = new google.maps.Geocoder();
    mapCenter = new google.maps.LatLng(37.865159, -122.282138);
    google.maps.visualRefresh = true;
    google.maps.event.addDomListener(window, 'load', setCurrentLocation);
    // location.reload()
}


function addConfigEvents()
{

    $('#step-duration').val(increment);
    $('#active-window').val(pointWindow);
    $('#inactive-steps').val(oldPointWindow);
    $('#config-button').unbind('click').on('click', function()
    {
        $('#config-div').show();
    });
    $('#hide-config').unbind('click').on('click', function() {
        $('#config-div').hide();
    });

    $('#config-form').unbind('click').on('submit', function() {
        increment = parseInt($('#step-duration').val());
        pointWindow = parseInt($('#active-window').val());
        oldPointWindow = parseInt($('#inactive-steps').val());
//        drawPointMarkers = Boolean($('#draw-markers').prop('checked'));
        drawPointMarkers = Boolean($('#draw-markers-button').hasClass('active'));
        autoCenter = Boolean($('#auto-center-button').hasClass('active'));
        if (mapLog)
            console.log("Config=" + increment + "\t" + pointWindow + "\t" + oldPointWindow + "\t" + drawPointMarkers);
        $('#config-div').hide();
        return false;
//        $('#map-refresh').trigger('click');
    });
}
function loadDates()
{
    var dates = getDatesFromDb();
    if (dates !== null)
    {
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

            self.parent().parent().attr('data-date', self.text());
            self.parent().parent().siblings('.dropdown-toggle').text(self.text());


            var dateType = self.parent().parent().attr('id');
            if (mapLog)
                console.log(dateType);
            var date = new Date(self.text());
            if (mapLog)
                console.log(date.toString());
            if (dateType === 'end-date-menu')
            {

                setEndDate(date);
                if (mapLog)
                    console.log('changed endDate=' + endDate);
            } else
            {
                setStartDate(date);
                if (mapLog)
                    console.log('changed startDate=' + startDate);
            }
            if (mapLog)
                console.log(startDate + "\t" + endDate);
            initDashboard(startDate, endDate);
        });
    }
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



    getAddress(point.lat, point.lon);

    showMap(point);
}
/**
 * 
 * @param {Point} point
 * @returns {undefined}
 */
function showMap(point)
{
    if (mapLog)
        console.log('showing map');
    if (mapLog)
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

function createPointMarker(point, title, userId) {


    userId = (userId) ? userId : 0;
    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: title + "",
        icon: {path: google.maps.SymbolPath.CIRCLE,
            scale: 2,
            fillColor: colorScale(userId),
            strokeColor: colorScale(userId)}
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
    console.log('creating marker for ' + userId);
    var user = getUserObjectById(userId);
    if (typeof (userMarkers[userId]) !== 'undefined')
    {
//        userMarkers[userId].setMap(null);
    }

    var marker = new google.maps.Marker({
        position: point.LatLng,
        map: map,
        title: user.firstName + " " + user.lastName,
        icon: {path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: colorScale(userId),
            strokeColor: colorScale(userId)}
    });
    userMarkers[userId] = marker;
//    if(mapLog)console.log(point);
//    userLocations[userId] = point.address;
//    if(mapLog)console.log(userMarkers);
}

function createPath(pts, userId, oldPath) {

//    if(mapLog)console.log('Creating path');
    userId = (userId) ? userId : 0;
//    userId = (userId) ? userId : userId;
//    createMarkers = (createMarkers) ? createMarkers : true;
    var polyPoints = [];
    var ele = 0;
    try {
        ele = pts[0].elevation;
    } catch (e)
    {

    }
//    if(mapLog)console.log('ele=' + ele);
//    if(mapLog)console.log(pts);
    for (var i = 0, j = pts.length; i < j; i++)
    {
        var point = pts[i];
        if (point)
        {
            if (i === 0)
            {
//            createUserMarker(point, userId);
            }
            if (i === (j - 1) && !oldPath)
            {
                if (userMarkers[userId])
                {
                    userMarkers[userId].setPosition(point.LatLng);
//                    if (userMarkers[userId].getMap === null)
                    showUserMarker(userId);
                    userLocations[userId] = point.address;
                    userTransModes[userId] = point.transMode;
                } else
                {
                    createUserMarker(point, userId);
                    userLocations[userId] = point.address;
                    userTransModes[userId] = point.transMode;
                }
            }
            else
            {
                if (drawPointMarkers && point.distance >= distance_limit)
                {
                    var title = userId + "\t" + point.id + "\t" + point.time + "\t" + point.lat + "\t" + point.lon;
                    createPointMarker(point, title, userId);
                }
            }
            if (point.startPoint === 1)
            {
                drawPath(polyPoints, userId, oldPath);
                polyPoints = [];
                polyPoints.push(point.LatLng);
            }
            polyPoints.push(point.LatLng);
            /*         if (draw_elevation)
             {
             if (point.elevation !== ele)
             {
             drawPath(polyPoints, userId, oldPath);
             ele = point.elevation;
             polyPoints = [];
             polyPoints.push(point.LatLng);
             }
             }*/
        }
    }


//    if (!draw_elevation)
    drawPath(polyPoints, userId, oldPath);
}

function drawPath(polyPoints, userId, oldPath)
{
//    oldPath = (typeof (oldPath) === 'undefined') ? false : oldPath;
    var color = new ColorCombo();
    userId = (userId) ? userId : 0;

    var path;
    if (oldPath)
    {
        if (mapLog)
            console.log('oldPath');
        var lineSymbol = {
            path: 'M 0,-1 0,1',
            strokeOpacity: .8,
            strokeWeight: 3,
            strokeColor: colorScale(userId)
        };
        var icon = [{icon: lineSymbol,
                offset: '0',
                repeat: '20px'
            }];

//        console.log(polyPoints);
        path = new google.maps.Polyline({
            path: polyPoints,
            strokeOpacity: 0,
            geodesic: true,
            icons: icon
        });
    }
    else
    {
        console.log('new points');
        console.log(polyPoints);
        path = new google.maps.Polyline({
            path: polyPoints,
            geodesic: true,
            strokeColor: colorScale(userId),
            strokeWeight: 3,
            strokeOpacity: 1});

    }


    paths.push(path);
    // path.setMap(null);
    path.setMap(map);
    // google.maps.event.addDomListener(window, 'load', initialize);

}

function getElevationColor(ele) {
//    if(mapLog)console.log(elevation);
    var color = Math.ceil((ele - elevation['min']) / (elevation['max'] - elevation['min']) * 255);
    return (color >= 0) ? color : 0;
}

function mapZoomIn() {
    if (mapLog)
        console.log('zoom in');
    var zoom = map.getZoom();
    map.setZoom(zoom + 1);
}

function mapZoomOut() {
    if (mapLog)
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
    if (mapLog)
        console.log(userMarkers);
    for (var i = 0, j = markers.length; i < j; i++)
    {
        markers[i].setMap(null);
    }
    for (var i = 0, j = userMarkers.length; i < j; i++)
    {
//        if (userMarkers[i])
//            userMarkers[i].setVisible(false)
//            userMarkers[i].setMap(null);
    }
}

function hideUserMarker(userId)
{
    if (userMarkers[userId])
        userMarkers[userId].setVisible(false);

}
function showUserMarker(userId)
{
    if (userMarkers[userId])
    {
        userMarkers[userId].setVisible(true);
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
function manageCenter(evt, val, statistics)
{

//    var sw = new google.maps.LatLng(statistics.lat.min, statistics.lon.min);
//    var ne = new google.maps.LatLng(statistics.lat.max, statistics.lon.max);
//    var bounds = new google.maps.LatLngBounds(sw, ne);
//    if(mapLog)console.log(val);
//    if(mapLog)console.log(bounds);
    if (val)
        map.fitBounds(boundsByTime[val]);
    else
    {
        map.fitBounds(bounds);
    }
}


function generateUserColors()
{
    usrs = getActiveUserIds();
    if (mapLog)
        console.log(usrs);
    numUsers = usrs.length;
    numUsers = (numUsers && numUsers > 0) ? numUsers : 1;
    if (mapLog)
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

    if (mapLog)
        console.log('Animation');
    prepareData();
    reloadSlider();
    prepareUsersTimePoints();
    fillUserPoints();
    $('#range-div').show();
    $('#play-button').trigger('click');
//    drawUsersPoints();


//    if(mapLog)console.log(points);
    userPoints = [];
}

function drawAll()
{
    if (mapLog)
        console.log('Drawing');
    prepareData();
    drawUsersPoints();
    addUsersPictures();
}

function prepareData()
{
    clearMap();
//    generateUserColors();
//    var start, end;
    if (mapLog)
        console.log('preparing data');
    var activeUsers = getActiveUserIds();
//    if(mapLog)console.log(activeUsers);
    var points = getActivePoints(startDate, endDate, activeUsers);
    pictures = getImages(startDate, endDate, activeUsers);
    if (mapLog)
        console.log(pictures);
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
    if (mapLog)
        console.log("dateRange=" + dateRangeMinutes);
    var min = 0;
    var max = Math.ceil(dateRangeMinutes / increment);
    for (var i = 0; i <= max; i++)
    {
        var dateInc = i * increment * 1000 * 60;
        var newDate = new Date(minDate.getTime() + dateInc);
//        if(mapLog)console.log(newDate);
        sliderMap[i] = newDate;
        boundaryTimeStats[i] = {'lat': {'min': 180, 'max': -180}, 'lon': {'min': 180, 'max': -180}};
        boundsByTime[i] = new google.maps.LatLngBounds();
        pointCountByTime[i] = 0;
    }
    sliderCount = max + 1;
//    if(mapLog)console.log(sliderMap);
//    if(mapLog)console.log(boundaryTimeStats);
    slider.prop('min', min).prop('max', max).prop('value', min);
    addSliderEvent();
}

function addSliderEvent()
{
    var slider = $('#slider');
    slider.on('change', function() {
        var self = $(this);
        var val = self.val();
        $('#slider-value').text(sliderMap[val].toLocaleDateString() + " " + sliderMap[val].toLocaleTimeString());
        updateUserLocations();
        clearMap();
        processUsersPictures(sliderMap[val - 1], sliderMap[val]);
        drawUsersTimePoints(val, pointWindow, oldPointWindow);
        var evt;
        updateMapStyle(val);
        if (autoCenter && boundaryTimeStats[val])
            manageCenter(evt, val, boundaryTimeStats[val]);
    });
}

function updateMapStyle(val)
{

    var date = new Date();
    date = sliderMap[val];
    var date2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 18, 0, 0, 0);
    var date3 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 6, 0, 0, 0);
//    if(mapLog)console.log(date + "\t" + date2);
    if (date > date2 || date < date3)
        map.setOptions({styles: mapNightStyle})
    else
    {
        map.setOptions({styles: mapStyle})
    }
}
function updateUserLocations()
{
    var activeUserIds = getActiveUserIds();
//    if(mapLog)console.log(userLocations);
    for (var i = 0, j = activeUserIds.length; i < j; i++)
    {
        var uid = activeUserIds[i];
        if (userLocations[uid])
        {
            var txt = ((userLocations[uid].city) ? userLocations[uid].city + ", " :
                    (userLocations[uid].street) ? userLocations[uid].street + ", "
                    : (userLocations[uid].county) ? userLocations[uid].county + ", " : "")
                    + ((userLocations[uid].state_code) ? userLocations[uid].state_code : "");

            txt = txt.replace('undefined', "");
            $('#user-location-' + uid).text(txt);
        }

        if (userTransModes[uid])
        {
//            var txt = '&#128690;'
            $('#user-trans-' + uid).html(transModeSymbola[userTransModes[uid]]);
            if (mapLog)
                console.log(userTransModes[uid]);
            if (!userTransModes[uid] === 'Stop' && !userTransModes[uid] === 'undefined')
                $('#user-trans-' + uid).css('background-color', 'rgba(255,255,255,0)');
            else {
                $('#user-trans-' + uid).css('background-color', 'rgba(255,255,255,0.6)');
            }
        }
        else
        {
            $('#user-trans-' + uid).css('background-color', 'rgba(255,255,255,0)');
        }
    }
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
//            if(mapLog)console.log('New user array ' + id);
            userPoints[id] = [];
        }
        userPoints[id].push(point);
    }
    if (mapLog)
        console.log(userPoints);

}

function prepareUsersTimePoints()
{
    if (mapLog)
        console.log('preparing time points');
    for (var userId in userPoints)
    {
        var pts = userPoints[userId];
        if (mapLog)
            console.log(pts);
        userTimePoints[userId] = {};
        var mapCount = 0;
        userTimePoints[userId][0] = [];
        for (var i = 0, j = pts.length; i < j; i++)
        {
            var point = pts[i];
            if (point.time <= sliderMap[mapCount])
            {
                userTimePoints[userId][mapCount].push(point);
                boundsByTime[mapCount].extend(point.LatLng);
                pointCountByTime[mapCount] = pointCountByTime[mapCount] + 1;
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
//                if(mapLog)console.log('skipped ' + skipped);
                userTimePoints[userId][mapCount].push(point);
                boundsByTime[mapCount].extend(point.LatLng);
                updateCoundaryStats(mapCount, point);
                pointCountByTime[mapCount] = pointCountByTime[mapCount] + 1;
//                updateCoundaryStats(mapCount, point);
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
//            if(mapLog)console.log('clearing boundary ' + i);

            boundaryTimeStats[i] = temp;
        }
//        else
//            if(mapLog)console.log(i + "\t" + boundaryTimeStats[i]['lat']['min'] + "\t" + boundaryTimeStats[i]['lat']['max']);
    }
    if (mapLog)
        console.log(boundaryTimeStats);
//    if(mapLog)console.log(userTimePoints);
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
//        if(mapLog)console.log(e);
//        if(mapLog)console.log(stat);

    }
}
function drawUsersPoints()
{
    for (var userId in userPoints)
    {
        if (typeof (userPoints[userId]) !== 'undefined')
        {
            if (mapLog)
                console.log('Drawing user:' + userId);
            console.log(userPoints[userId]);
//            userPoints[user] = sortPoints(userPoints[user]);
            createPath(userPoints[userId], userId);
        }
    }
//    manageCenter();
//    getSteps(timeStats.min, timeStats.max);
}

function drawUsersTimePoints(sliderMapVal, window, oldPathWindow)
{

    oldPathWindow = (oldPathWindow) ? oldPathWindow : 0;
//    var start = new Date(end.getTime() - window * 60 * 1000);
    var stepCount = Math.floor(window / increment);
    var oldStepCount = Math.floor(oldPathWindow / increment);
//    if(mapLog)console.log('drawing time points ' + sliderMapVal);
    var activeUserIds = getActiveUserIds();
//    if(mapLog)console.log(activeUserIds);
    for (var i = 0, j = activeUserIds.length; i < j; i++)
    {

        var id = activeUserIds[i];
        userTransModes[id] = '';
//        if(mapLog)console.log('drawing user ' + id);
        var points = [];
        var oldPoints = [];
        for (var k = stepCount; k >= 0; k--)
        {
            var sliderStep = sliderMapVal - k;
            if (sliderStep >= 0 && userTimePoints[id])
            {
                if (userTimePoints[id][sliderStep])
                    points = points.concat(userTimePoints[id][sliderStep]);
            }
        }
        for (var k = oldStepCount - stepCount; k >= 0; k--)
        {
            var sliderStep = sliderMapVal - k;
            if (sliderStep >= 0 && userTimePoints[id])
            {
                if (userTimePoints[id][sliderStep])
                    oldPoints = oldPoints.concat(userTimePoints[id][sliderStep]);

            }
        }
        /*     for (var k = 0, l = points.length; k < l; k++)
         if (points[k])
         boundsByTime[sliderMapVal].extend(points[k].LatLng);
         
         for (var k = 0, l = oldPoints.length; k < l; k++)
         if (oldPoints[k])
         boundsByTime[sliderMapVal].extend(oldPoints[k].LatLng);
         //        if(mapLog)console.log(oldPoints);
         */
        if (points.length > 0)
        {
//            if(mapLog)console.log(points);
            for (var k = 0, l = points.length; k < l; k++)
//            if (points[k])
                boundsByTime[sliderMapVal].extend(points[k].LatLng);

            createPath(points, id, false);
        }
        if (oldPoints.length > 0)
        {
//            alert('old path 1');
//            if(mapLog)console.log(oldPoints);
            for (var k = 0, l = oldPoints.length; k < l; k++)
                boundsByTime[sliderMapVal].extend(oldPoints[k].LatLng);
            createPath(oldPoints, id, true);
        }
    }
//    manageCenter();
//    getSteps(timeStats.min, timeStats.max);

}

function addUsersPictures()
{
    if (pictures) {
        if (mapLog)
            console.log('adding pictures');
        var img_srcs = [];
        for (var i = 0, j = pictures.length; i < j; i++) {

            $.each($('#image-list').children(), function(k, v) {
                img_srcs.push($(v).find('img').attr('src'));
            });

            // only append new images if this one doesn't already exist in the DOM
            if ($.inArray(pictures[i].url, img_srcs) == -1) {
                $('#image-list').append('<li><a class="gallery" target="_blank" title="' + pictures[i].title + '" href ="' + pictures[i].url + '" ><img src="' + pictures[i].url + '" alt="' + pictures[i].title + '"></a></li>');
            }

            if (mapLog)
                console.log("URL = ", pictures[i].url, pictures[i].pic_id, pictures[i].latitude, _openWindow, marker);
        }
        // THE ONE LINE!!!!!!!!!!!!!!!!!!!!!   CHALENGE!!!!!!!!!!!!!!!!
        $('.jcarousel').jcarousel('reload');


        // New marker code
//        map = new google.maps.Map(document.getElementById("map-canvas"), map);

        for (var a = 0; a < pictures.length; a++) {
            var tmpLat = pictures[a].latitude;
            var tmpLng = pictures[a].longitude;
            var marker = _newGoogleMapsMarker({
                _map: map,
                _lat: tmpLat,
                _lng: tmpLng,
                _head: '|' + new google.maps.LatLng(tmpLat, tmpLng),
                //_data: '<div class="infowindow" id ="' + pictures[a].pic_id + '"><a class="gallery" title="thumbnail" href ="' + pictures[a].url + '" ><img class="thumbnail" src = "' + pictures[a].url + ' id ="' + pictures[a].pic_id + '" ></div>'
                _data: '<div class="infowindow" id ="' + pictures[a].pic_id + '"><a class="gallery" target="_blank" title="' + pictures[a].title + '" href ="' + pictures[a].url + '" ><img class="thumbnail" src = "' + pictures[a].url + '" id ="' + pictures[a].pic_id + '" ></div>'
            });
            if (mapLog)
                console.log("Marker", pictures[a].pic_id, marker._data, marker)
        }

        if (($('#image-list li').size()) > 3) {
            $('.jcarousel-control').css('visibility', 'visible');
        }

        $('#image-canvas').css('visibility', 'visible');
        $(".gallery").colorbox({
            rel: 'gallery',
            slideshow: false
        });

        if (mapLog)
            console.log("Out of getImages!");
    }
}

function processUsersPictures(date1, date2)
{
    var activeUsers = getActiveUserIds();
    pictures = getImages(date1, date2, activeUsers);
    addUsersPictures();
}

function _newGoogleMapsMarker(param) {
    var iconBase = 'http://maps.google.com/mapfiles/kml/pal2/';
    var r = new google.maps.Marker({
        map: param._map,
        position: new google.maps.LatLng(param._lat, param._lng),
        title: param._head,
        //icon: IconType[place.types[0]]
        icon: iconBase + '/icon22.png'
    });
    if (mapLog)
        console.log("Made marker")

    if (param._data) {
        if (mapLog)
            console.log("In addListener", param._data)
        google.maps.event.addListener(r, 'click', function() {
            // this -> the marker on which the onclick event is being attached
            if (!this.getMap()._infoWindow) {
                this.getMap()._infoWindow = new google.maps.InfoWindow();
            }
            this.getMap()._infoWindow.close();
            this.getMap()._infoWindow.setContent(param._data);
            this.getMap()._infoWindow.open(this.getMap(), this);
        });
    }
    return r;
}

function toggleDrawMarkers()
{
    if (mapLog)
        console.log('toggeling draw markers');
    drawMarkersToggle = !drawMarkersToggle;
    if (drawMarkersToggle)
    {
        $('#draw-markers-button').addClass('btn-info');
    }
    else
    {
        $('#draw-markers-button').removeClass('btn-info');
    }
}
function toggleAutoCenter()
{
    autoCenterToggle = !autoCenterToggle;
//    var active  autoCenter = !autoCenter;= $('#auto-center-button').hasClass('active');
    if (autoCenterToggle)
    {
        $('#auto-center-button').addClass('btn-info');
    }
    else
    {
        $('#auto-center-button').removeClass('btn-info');
    }
}
function play()
{
    if (mapLog)
        console.log('clicked play');
    playing = !playing;
    if (playing)
    {
        $('#play-button').removeClass('btn-success').addClass('btn-info');
        $('#play-button i').removeClass('fa-play').addClass('fa-pause');
    }
    else
    {
        $('#play-button').removeClass('btn-info').addClass('btn-success');
        $('#play-button i').removeClass('fa-pause').addClass('fa-play');
    }
//    if(mapLog)console.log(sliderMap.length);
//    if(mapLog)console.log('playing ' + playing);
    if (mapLog)
        console.log(pointCountByTime);
    var val = parseInt($('#slider').val());

    for (var key in sliderMap)
    {
        if (key >= val && playing)
        {
            var doInterval = intervalDelay;
            return playing = setInterval(doPlay, doInterval);
            doPlay(); //(*)
        }
    }

}
var extendCount = 0;
var extendLimit = 3;
var skipLimit = 2;
function doPlay()
{

//    setInterval(function() {
    if (playing)
    {
        var val = parseInt($('#slider').val());
        val += (extendCount === 0) ? 1 : 0;
        var skip = false;
        var extend = false;
        var skipCount = 0;
        while (pointCountByTime[val] === 0 && skipCount < skipLimit && doSkip)
        {
//            if(mapLog)console.log('skipping point ' + sliderMap[val]);
            val++;
            skipCount++;
        }


        if (!calculateMapChange(val))
        {

            extend = true;
            extendCount++;
//            if(mapLog)console.log('map bounds will change. extending ' + extendCount);
        }
        if (extendCount > extendLimit || !extend)
        {
//            if(mapLog)console.log('reset extendCount');
//            val++;
            extendCount = 0;
        }
//        if(mapLog)console.log(val);
        $('#slider').val(val);
        if (extendCount <= 1)
            $('#slider').trigger('change');
    }
//    if(mapLog)console.log('new value = ' + val);
//    }, 10000);

}

function calculateMapChange(val)
{
    var bound = boundsByTime[val];
    if (bound)
    {
//        if(mapLog)console.log(bound);
//        var minLat = bound[0][0], minLon = bound[1][0], maxLat = bound[0][1], maxLon = bound[1][1];
//        if(mapLog)console.log(minLat + "\t" + maxLat + "\t" + minLon + "\t" + maxLon);
        var mapBounds = map.getBounds();
        return mapBounds.equals(bound);
    }
    else
        return true;
}


function fillUserPoints()
{
    if (mapLog)
        console.log('filling data');
    var filled = 0;
    if (mapLog)
        console.log(userTimePoints);

    for (var uid in userTimePoints)
    {
        var lastPoint;
        var firstPoint = false;
        if (mapLog)
            console.log('filling user ' + uid);
        for (var i = 0; i < sliderCount; i++)
        {
            var points = userTimePoints[uid][i];
            if (points && points.length > 0)
            {
                if (mapLog)
                    console.log('last point found');
                lastPoint = points[points.length - 1];
                firstPoint = true;
            }
            else
            {

                if (firstPoint)
                {
                    var skipped = 1;
                    while (i < sliderCount && (!points || points.length === 0))
                    {
                        i++;
                        points = userTimePoints[uid][i];
                        skipped++;
//                        if(mapLog)console.log('skipping');

                    }
                    if (mapLog)
                        console.log('skipped =' + skipped);
                    if (i < sliderCount && points)
                    {
//                        if(mapLog)console.log('skipped =' + skipped);
                        var point = points[0];
                        var distance = distanceBetween(lastPoint, point);
                        if (distance > 0 && point.transMode === 'Fly')
                        {
                            var deltaLat = point.lat - lastPoint.lat;
                            var deltaLon = point.lon - lastPoint.lon;
                            var userFilled = 0;
                            for (var k = 1; k < skipped; k++)
                            {

                                var fillPoint = new Point(lastPoint);
                                fillPoint.lat += deltaLat * k / skipped;
                                fillPoint.lon += deltaLon * k / skipped;
                                fillPoint.refreshLatLng();
                                var index = i - skipped + k;
//                                if(mapLog)console.log(index+"\t"+k);
                                if (userTimePoints[uid][index] && userTimePoints[uid][index].length === 0)
                                {
//                                    userTimePoints[uid][index] = [];
                                    userTimePoints[uid][index].push(fillPoint);
                                    pointCountByTime[index] = pointCountByTime[i - skipped + k] + 1;
                                    boundsByTime[index].extend(fillPoint.LatLng);
                                    filled++;
                                    userFilled++;
                                }
                            }
//                            if(mapLog)console.log('user filled = ' + userFilled);
                        }
                        else
                        {
//                            if(mapLog)console.log('distance too small');
                        }

                        lastPoint = points[points.length - 1];
                    }

                }
            }
        }

    }
    if (mapLog)
        console.log('filled points=' + filled);
    if (mapLog)
        console.log(userTimePoints);
}