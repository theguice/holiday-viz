/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var TIME_TOLERANCE = 120; //in seconds
var TIME_CEILING = 36000; //1 Hour
var DISTANCE_TOLERANCE = 50;//in meters


$(document).ready(function() {
    console.log("Before cleaning data!")

    cleanData();
});

function cleanData() {
    console.log('cleaning');
    resetActiveGpxPoints();
    var usersJSON = getAllUsers();
    var users = [];
    console.log(usersJSON);
    console.log(usersJSON.length + " users retrieved");
    for (var i = 0, j = usersJSON.length; i < j; i++)
    {
        var user = new User(usersJSON[i]);
//        console.log(user);
        users.push(user);
//        console.log("I am here now-67!")
        $('#users').append(formatUserHTML(user));
        var points = getPointsByUser(user['id']);
//        console.log(points.length + " points retrieved");
        var skipped = 0;
        for (var k = 0, l = points.length; k < l; k++)
        {
            var changed = false;
            var point = new Point(points[k]);


            /*   var x = 1;
             while (x <= k) {
             previousPoint = points[k - x];
             if (previousPoint.active === 1 || previousPoint.deltaTime === -1) {
             //                    console.log('previous point after ' + x);
             break;
             }
             x++;
             
             }*/
            if (k === 0)
            {
                point.distance = 0;
                point.deltaTime = 0;
                point.speed = 0;
                point.active = 1;
                point.startTrip = 1;

            }
            else
            {
                var previousPoint = points[k - 1];
                point.distance = distanceBetween(point, previousPoint);
                point.deltaTime = timeBetween(point, previousPoint);
                point.speed = calculateSpeed(point, previousPoint);
                point.active = checkActive(point);
                if (point.deltaTime > TIME_CEILING)
                    point.startTrip = 1;
                else
                    point.startTrip = 0;
            }
            point.refreshTransMode();

            if (point.transMode === 'Bike' && user.use_bike === 0)
            {//TODO: NEED TO TEST

                point.transMode = 'Drive';
                console.log('trans more changed\t' + point.id + '\t' + point.transMode);
            }

//            console.log(point);
//            console.log(points[k]);
            changed = (point.distance !== points[k].distance)
                    || (point.deltaTime !== points[k].deltaTime)
                    || (point.speed !== points[k].speed)
                    || (point.active !== points[k].active)
                    || (point.transMode !== points[k].transMode)
                    || (point.startPoint !== points[k].startPoint);

//            point.distance = (k === 0) ? 0 : distanceBetween(point, previousPoint);
//            point.deltaTime = (k === 0) ? -1 : timeBetween(point, previousPoint);
//            point.speed = (point.deltaTime === -1) ? 0 : (k === 0) ? 0 : calculateSpeed(point, previousPoint);
//            point.active = checkActive(point);
     /*      if (point.active === 0)
            {

                archiveGpxPoint(point);
                deleteGpxPoint(point);
            }
            else */if (changed)
            {
                console.log(point.id + " changed");
                updatGpxInDb(user, point, ['distance', 'speed', 'deltaTime', 'active', 'transMode', 'startPoint']);
            }
            else
            {
                console.log('ignored '+ point.id);
            }



            if (point.active === 1) {
                var str = "<tr><td>" + skipped + " points skipped" + "</td></tr>";
//                $('#user-' + user.id + " table").append(str);
                skipped = 0;
//                $('#user-' + user.id + " table").append(formatPointHTML(point));
            } else {
                skipped++;

            }

        }
//        console.log(points);
    }
//    console.log(users);
}
/**
 *
 * @param {User} user
 * @returns {undefined}
 */
function formatUserHTML(user) {
    var str = "<li id='user-" + user.id + "' class='user'>" + "<img src='" + user.avatar + "'/>" + user.firstName + " " + user.lastName + "(" + user.twitter + ")" + "<table id='user-" + user.id + "-points'>" + +"<tr><td>lat</td><td>lon</td><td>elevation</td><td>time</td><td>active</td><td>speed</td><td>distance</td><td>deltaTime</td></tr>" + "</table></li>";
    return str;
}

function formatPointHTML(point) {
    var str = "<tr><td>" + point.lat + "</td><td>" + point.lon + "</td><td>" + point.elevation + "</td><td>" + point.time.toLocaleString() + "</td><td>" + point.active + "</td><td>" + point.speed + "</td><td>" + point.distance + "</td><td>" + point.deltaTime + "</td></tr>";
    return str;

}

/**
 * returns speed in m/s
 * @param {Point} point1
 * @param {Point} point2
 * @returns {Number|Date|data.timestamp}
 */
function calculateSpeed(point1, point2) {

    var speed = distanceBetween(point1, point2) / timeBetween(point1, point2);
    return Math.abs(speed);

}
/**
 * returns time in seconds
 * @param {Point} point1
 * @param {Point} point2
 * @returns {Number}
 */
function timeBetween(point1, point2) {
    if (point1.time && point2.time) {
        var delta = (point1.time - point2.time) / 1000;

        return delta;

    } else
        return 0;
}
/**
 * Returns distanct in Meters
 * @param {Point} point1
 * @param {Point} point2
 * @returns {Number}
 */
function distanceBetween(point1, point2) {
    var lat1 = point1.lat,
            lat2 = point2.lat,
            lon1 = point1.lon,
            lon2 = point2.lon;
    //    console.log(lat1 + "\t" + lat2 + "\t" + lon1 + "\t" + lon2);
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    //    dLat = (dLat === 0) ? 0 : dLat.toRad();
    //    dLon = (dLon === 0) ? 0 : dLon.toRad();
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d * 1000;
}


function toRad(Value) {
    /** Converts numeric degrees to radians */
    return Value * Math.PI / 180;
}
/**
 *
 * @param {Point} point
 * @returns {undefined}
 */
function checkActive(point) {

    var active = 1;

    if (point.distance === 0)
        active = 0;
    /*
     if (point.distance < DISTANCE_TOLERANCE && point.deltaTime < TIME_TOLERANCE && point.deltaTime > 0) {
     active = 0;
     
     }
     */

    return active;
}
