/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var currentUser = "";
var DB_FILE = 'db-operations.php';
_openWindow = null;
$(document).ready(function() {

});

function initDb() {
    console.log('initiating database');
    var sql = [];
    sql.push("DELETE FROM gpx_users WHERE 1");
    sql.push("DELETE FROM gpx_track WHERE 1");
    sql.push("DELETE FROM gpx_pictures WHERE 1");
    for (var i = 0, j = sql.length; i < j; i++) {
        $.ajax({
            'type': 'GET',
            'url': DB_FILE,
            'data': {
                'q': sql[i]
            }
        }).done(function(data) {
            console.log(data);
        });
    }

}
/**
 *
 * @param {User} user
 * @param {Point} point
 * @returns {undefined}
 */
function addGpxToDb(user, point) {

    var sql = "INSERT INTO gpx_track " + "(user_id, track_timestamp, latitude, longitude, altitude) " + "VALUES (" + user['id'] + ",'" + point.time.toISOString() + "'," + point.lat + "," + point.lon + "," + point.elevation + ")";
    //     console.log(sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
    }).done(function(data) {
        //        console.log(data);
    });

}

function updatGpxInDb(user, point, keys) {
    var sql = "UPDATE  gpx_track SET user_id=" + user['id']
            + (!keys || ($.inArray('time', keys) > -1) ? ", track_timestamp='" + point.time.toISOString() + "'" : "")
            + (!keys || ($.inArray('lat', keys) > -1) ? ", latitude=" + point.lat : "")
            + (!keys || ($.inArray('lon', keys) > -1) ? ", longitude=" + point.lon : "")
            + (!keys || ($.inArray('altitude', keys) > -1) ? ", altitude=" + point.altitude : "")
            + (!keys || ($.inArray('distance', keys) > -1) ? ", distance=" + point.distance : "")
            + (!keys || ($.inArray('speed', keys) > -1) ? ", speed=" + point.speed : "")
            + (!keys || ($.inArray('active', keys) > -1) ? ", active=" + point.active : "")
            + (!keys || ($.inArray('deltaTime', keys) > -1) ? ", delta_time=" + point.deltaTime : "")
            + (!keys || ($.inArray('transMode', keys) > -1) ? ", trans_mode='" + point.transMode + "'" : "")
            + (!keys || ($.inArray('startPoint', keys) > -1) ? ", start_point=" + point.startPoint : "")
            + " where track_id=" + point.id;
//    console.log("update sql:\n" + sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
        , 'async': false
    }).done(function(data) {
        //        console.log(data);
    });
}


function resetActiveGpxPoints()
{
    var sql = "update gpx_track set active=1";
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
        , 'async': false
    }).done(function(data) {
        //        console.log(data);
    });
}
/**
 *
 * @param {User} user
 * @returns {undefined}
 */
function addUserToDb(user) {
    var sql = "INSERT INTO gpx_users " + "(first_name, last_name, picture_url, twitter, instagram)" + " VALUES ('" + user.firstName + "','" + user.lastName + "','" + user.avatar + "','" + user.twitter + "','" + user.instagram + "')";

    //    console.log(sql);

    var jqXHR1 = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });
    console.log(jqXHR1.responseText);

    var sql2 = "SELECT * FROM gpx_users WHERE first_name='" + user.firstName + "'" + " and last_name='" + user.lastName + "'" + " and twitter='" + user.twitter + "'";
    console.log(sql2);
    var jqXHR2 = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql2
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR2.responseText);

    console.log(data);
    return new User(data[0]);
}

function getUserById(id) {
    var sql = "SELECT * FROM gpx_users WHERE id=" + id;
    console.log(sql2);
    var jqXHR2 = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR2.responseText);

    console.log(data);
    return new User(data[0]);
}

function getAllUsers() {
    var sql = "SELECT * FROM gpx_users";
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
//	console.log("getAllUsers:");
//	console.log(data);
    return data;
}

function getPointsByDate(start, end) {
    var userID;
    return getPoints(start, end, userID);
}

function getPointsByUser(userID) {
    var start;
    var end;
    return getPoints(start, end, userID);
}

function getActivePoints(start, end, usersIds) 
{
    console.log(start + "\t" + end);
//    console.log("I am here now-4!")
//    console.log(usersIds)
    // usersIds = 21
    var n = $("input:checked").length;
//    console.log("n=", n)
    if (n > 0) {
        usersIds = new Array();
        $("input:checkbox").each(function() {
            if ($(this).is(":checked")) {
//                console.log($(this));
                usersIds.push($(this).attr("id"));
            }
        });
    }
//    console.log("Generated usersids")
//    console.log(usersIds)
    getImages(start, end, usersIds);
    return getPoints(start, end, usersIds, true);
}

function getImages(start, end, usersIds) {
    console.log("I am in getImages!")
    if (typeof (activeOnly) === 'undefined')
        activeOnly = false;

    console.log(usersIds);
    var sql = "SELECT * FROM gpx_pictures ";
    var conditions = [];
    if (start)
        conditions.push("image_timestamp>='" + start.toISOString()+"'");
    if (end)
        conditions.push("image_timestamp<='" + end.toISOString()+"'");
    if (usersIds) {
        if (typeof (usersIds) !== 'Array') {
            usersIds = [usersIds];
        }
        var str = "user_id in (";
        for (var i = 0, j = usersIds.length; i < j; i++)
            str += ((i !== 0) ? "," : "") + "" + usersIds[i] + "";
        str += ")";
        conditions.push(str);
    }

    console.log(conditions);
    if (conditions.length > 0) {
        sql += " where ";
        for (var i = 0, j = conditions.length; i < j; i++) {
            sql += ((i !== 0) ? " AND " : "") + conditions[i];

        }
    }


    sql += " order by user_id, image_timestamp";
    console.log(sql);
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
    console.log(data);

    var iconBase = 'http://maps.google.com/mapfiles/kml/pal2/';

    // $('#image-canvas').remove();
    // $('body').append($('<div id="image-canvas"></div>'));
    $('#image-canvas').children().remove();
    for (var i = 0, j = data.length; i < j; i++) {
        $('#image-canvas').append("<a class='gallery' title='" + data[i].title + "'' href ='" + data[i].url + "' ><img src='" + data[i].url + "' class='img-picture' id='" + data[i].pic_id + "''></a>");
        LatLng = new google.maps.LatLng(data[i].latitude, data[i].longitude)
        var marker = new google.maps.Marker({
            position: LatLng,
            map: map,
            icon: iconBase + 'icon22.png',
            _data: data[i].title
        });
        // var infowindow = new google.maps.InfoWindow({
        // 	content: '<div class="infocontent"><h4>' + data[i].pic_id + '</h4></div>;'
        // });

        google.maps.event.addListener(marker, 'click', function() {
            console.log("In addListener", marker);
            // if (_openWindow == null) {
            if (!this.getMap()._infoWindow) {
                this.getMap()._infoWindow = new google.maps.InfoWindow();
            }
            this.getMap()._infoWindow.close();
            this.getMap()._infoWindow.setContent(marker._data);
            this.getMap()._infoWindow.open(this.getMap(), this);
            // _openWindow.close();
            console.log(data[i].pic_id, marker);
            // }

            // infowindow.open(map, marker);
            // _openWindow = infowindow;
        });

        console.log("URL = ", data[i].url, data[i].pic_id, data[i].latitude, _openWindow, marker);

    }
    $(".gallery").colorbox({
        rel: 'gallery',
        slideshow: true
    });
    console.log("Out of getImages!")

}
/*
 * 
 * @param {Date} start
 * @param {Date} end
 * @param {type} usersIds
 * @param {type} activeOnly
 * @returns {String}
 */
function parseConditions(start, end, usersIds, activeOnly)
{
    var conditions = [];
    if (start)
        conditions.push("track_timestamp>='" + start.toISOString()+"'");
    if (end)
        conditions.push("track_timestamp<='" + end.toISOString()+"'");
    if (usersIds)
    {
        console.log(typeof (usersIds));
        console.log(usersIds);
        if (typeof (usersIds) === 'number')
        {
            usersIds = [usersIds];
        }

        var str = "user_id in (";
        for (var i = 0, j = usersIds.length; i < j; i++)
            str += ((i !== 0) ? "," : "") + "'" + parseInt(usersIds[i]) + "'";
        str += ")";
        conditions.push(str);
    }
    if (activeOnly) {
        var str = " active=1";
        conditions.push(str);
    }
    console.log(conditions);
    var sql = "";
    if (conditions.length > 0) {
        sql += " where ";
        for (var i = 0, j = conditions.length; i < j; i++) {
            sql += ((i !== 0) ? " AND " : "") + conditions[i];

        }
    }
    return sql;
}
function getPoints(start, end, usersIds, activeOnly) {
//    console.log("I am here now-3!")
    if (typeof (activeOnly) === 'undefined')
        activeOnly = false;

//    console.log(usersIds);
    var sql = "SELECT * FROM gpx_track ";
    sql += parseConditions(start, end, usersIds, activeOnly)




    sql += " order by user_id, track_timestamp";
    console.log(sql);
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
//    console.log(data);
    var points = [];
    for (var i = 0, j = data.length; i < j; i++)
        points.push(new Point(data[i]));

    console.log(points.length + ' points retrieved');
    return points;

}
/**
 * 
 * @param {Point} point
 * @returns {undefined}
 */
function archiveGpxPoint(point)
{
    console.log('archiving point ' + point.id);
    var sql = "INSERT INTO gpx_track_inactive "
            + "(user_id, track_timestamp, latitude, longitude, altitude,active, speed, delta_time, trans_mode) "
            + "VALUES (" + point.userId + ",'" + point.time.toISOString()
            + "'," + point.lat + "," + point.lon + "," + point.elevation
            + "," + point.active + "," + point.speed + "," + point.deltaTime + ",'" + point.transMode + "'"
            + ")";
//         console.log(sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
    }).done(function(data) {
        //        console.log(data);
    });

}

function deleteGpxPoint(point)
{
    console.log('Deletes point ' + point.id);
    var sql = 'delete from gpx_track where track_id=' + point.id;
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
//        ,'async': false
    });
}


function getDataSummary()
{

    var sql = "select * from gpx_stats_summary";
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
    console.log('summary data');
    console.log(data);
    return data;

}
//function getSummaryByDate()
function getSummary(start, end, usersIds, activeOnly, byDate)
{
    var conditions = parseConditions(start, end, usersIds, activeOnly);
    var sql = "SELECT "
            + ((usersIds) ? "user_id," : "")
            + ((byDate) ? "Date(track_timestamp) as date," : "")
            + "trans_mode"
            + ",COUNT(track_id) as track_count"
            + ",ROUND(SUM(distance),2)AS total_distance_m"
            + ",ROUND(SUM(delta_time),2)AS total_time_s"
            + ",ROUND(AVG(speed),2) AS average_speed_ms"
            + ",ROUND((SUM(distance)*0.000621371),2) AS total_distance_mi"
            + ",ROUND((SUM(delta_time)/(60*60)),2) AS total_time_hr "
            + ",ROUND((AVG(speed)*2.23694),2) AS average_speed_mph "
            + " FROM gpx_track "

    sql += parseConditions(start, end, usersIds, activeOnly)
    sql += " GROUP BY trans_mode"
            + ((usersIds) ? ",user_id" : "")
            + ((byDate) ? ",Date(track_timestamp)" : "");

    console.log(sql);
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );
    var data = $.parseJSON(jqXHR.responseText);
    console.log('summary data');
    console.log(data);
    return data;

}
function getUserDataSummary()
{

    var sql = "select * from gpx_stats_summary";
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );
    var data = $.parseJSON(jqXHR.responseText);
    console.log('summary data');
    console.log(data);
    return data;
}


function getDatesFromDb()
{
    var sql = "select distinct Date(track_timestamp) as track_timestamp from gpx_track where active=1 order by 1";

    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );
    var data = $.parseJSON(jqXHR.responseText);
    console.log('dates');
    console.log(data);
    return data;
}