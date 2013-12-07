/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var currentUser = "";
var DB_FILE = 'db-operations.php';
var DELTA_TIME_DELETE_TOLERANCE = 15;
var doLog = true;

_openWindow = null;
$(document).ready(function() {

});

function initDb() {
    if (doLog)
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
            if (doLog)
                console.log(data);
        });
    }

}


var insertCount = 0;
/**
 *
 * @param {User} user
 * @param {Point} point
 * @returns {undefined}
 */
function addGpxToDb(user, point) {


    var sql = "INSERT INTO gpx_track "
            + "(user_id, track_timestamp, latitude, longitude, altitude, start_point) "
            + "VALUES (" + user['id'] + ",'" + point.time.toISOString() + "'," + point.lat
            + "," + point.lon + "," + point.elevation + ","
            + ((point.startPoint) ? point.startPoint : 0) + ")";
    if (doLog)
        console.log((insertCount++) + "\t" + sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        async: 'false'
    }).done(function(data) {
        //        if(doLog) console.log(data);
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
//    if(doLog) console.log("update sql:\n" + sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
        , 'async': false
    }).done(function(data) {
        //        if(doLog) console.log(data);
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
        //        if(doLog) console.log(data);
    });
}
/**
 *
 * @param {User} user
 * @returns {undefined}
 */
function addUserToDb(user) {
    var sql = "INSERT INTO gpx_users " + "(first_name, last_name, picture_url, twitter, instagram)" + " VALUES ('" + user.firstName + "','" + user.lastName + "','" + user.avatar + "','" + user.twitter + "','" + user.instagram + "')";

    //    if(doLog) console.log(sql);

    var jqXHR1 = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    });
    if (doLog)
        console.log(jqXHR1.responseText);

    var sql2 = "SELECT * FROM gpx_users WHERE first_name='" + user.firstName + "'" + " and last_name='" + user.lastName + "'" + " and twitter='" + user.twitter + "'";
    if (doLog)
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

    if (doLog)
        console.log(data);
    return new User(data[0]);
}

function getUserById(id) {
    var sql = "SELECT * FROM gpx_users WHERE user_id=" + id;
    if (doLog)
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

    if (doLog)
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
//	if(doLog) console.log("getAllUsers:");
//	if(doLog) console.log(data);
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
    if (doLog)
        console.log(start + "\t" + end);


//    if(doLog) console.log("I am here now-4!")
//    if(doLog) console.log(usersIds)
    // usersIds = 21
    /*    var n = $("input:checked").length;
     //    if(doLog) console.log("n=", n)
     if (n > 0) {
     usersIds = new Array();
     $("input:checkbox").each(function() {
     if ($(this).is(":checked")) {
     //                if(doLog) console.log($(this));
     usersIds.push($(this).attr("id"));
     }
     });
     }
     //    if(doLog) console.log("Generated usersids")
     //    if(doLog) console.log(usersIds)
     */
    return getPoints(start, end, usersIds, true);
}

function getImages(start, end, usersIds) {
    if (doLog)
        console.log("I am in getImages!")
    if (typeof (activeOnly) === 'undefined')
        activeOnly = false;

    if (doLog)
        console.log(usersIds);
    var sql = "SELECT * FROM gpx_pictures ";
    var conditions = [];
    if (start)
        conditions.push("image_timestamp>='" + start.toISOString() + "'");
    if (end)
        conditions.push("image_timestamp<='" + end.toISOString() + "'");
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

    if (doLog)
        console.log(conditions);
    if (conditions.length > 0) {
        sql += " where ";
        for (var i = 0, j = conditions.length; i < j; i++) {
            sql += ((i !== 0) ? " AND " : "") + conditions[i];

        }
    }


    sql += " order by user_id, image_timestamp";
    if (doLog)
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
    if (data) {
        if (doLog)
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
                if (doLog)
                    console.log("In addListener", marker);
                // if (_openWindow == null) {
                if (!this.getMap()._infoWindow) {
                    this.getMap()._infoWindow = new google.maps.InfoWindow();
                }
                this.getMap()._infoWindow.close();
                this.getMap()._infoWindow.setContent(marker._data);
                this.getMap()._infoWindow.open(this.getMap(), this);
                // _openWindow.close();
                if (doLog)
                    console.log(data[i].pic_id, marker);
                // }

                // infowindow.open(map, marker);
                // _openWindow = infowindow;
            });

            if (doLog)
                console.log("URL = ", data[i].url, data[i].pic_id, data[i].latitude, _openWindow, marker);

        }
        $(".gallery").colorbox({
            rel: 'gallery',
            slideshow: true
        });
        if (doLog)
            console.log("Out of getImages!")
    }
    else
    {
        if (doLog)
            console.log('No Pictures');
    }
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
        conditions.push("track_timestamp>='" + start.toISOString() + "'");
    if (end)
        conditions.push("track_timestamp<='" + end.toISOString() + "'");
    if (usersIds)
    {
        if (doLog)
            console.log(typeof (usersIds));
        if (doLog)
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
    if (doLog)
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
//    if(doLog) console.log("I am here now-3!")
    if (typeof (activeOnly) === 'undefined')
        activeOnly = false;

//    if(doLog) console.log(usersIds);
    var sql = "SELECT * FROM gpx_track ";
    sql += parseConditions(start, end, usersIds, activeOnly)




    sql += " order by user_id, track_timestamp";
    if (doLog)
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
//    if(doLog) console.log(data);
    var points = [];
    if (data)
    {

        for (var i = 0, j = data.length; i < j; i++)
            points.push(new Point(data[i]));

        if (doLog)
            console.log(points.length + ' points retrieved');
    }
    return points;
}
/**
 * 
 * @param {Point} point
 * @returns {undefined}
 */
function archiveGpxPoint(point)
{
    if (doLog)
        console.log('archiving point ' + point.id);
    var sql = "INSERT INTO gpx_track_inactive "
            + "(user_id, track_timestamp, latitude, longitude, altitude,active, speed, delta_time, trans_mode) "
            + "VALUES (" + point.userId + ",'" + point.time.toISOString()
            + "'," + point.lat + "," + point.lon + "," + point.elevation
            + "," + point.active + "," + point.speed + "," + point.deltaTime + ",'" + point.transMode + "'"
            + ")";
//         if(doLog) console.log(sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
    }).done(function(data) {
        //        if(doLog) console.log(data);
    });

}

function deleteUselessPoints()
{

    var sql = 'delete from gpx_track where active=0 and start_point=0 and distance=0 and deltaTime<' + DELTA_TIME_DELETE_TOLERANCE;
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
//        ,'async': false
    });

    var sql = 'delete from gpx_track where start_point=0 and distance=0 and delta_time=0 and trans_mode = ""';
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
//        ,'async': false
    });
}

function deleteGpxPoint(point)
{
    if (doLog)
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
    if (doLog)
        console.log('summary data');
    if (doLog)
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

    sql += conditions;
    sql += " GROUP BY trans_mode"
            + ((usersIds) ? ",user_id" : "")
            + ((byDate) ? ",Date(track_timestamp)" : "");

    if (doLog)
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
    if (doLog)
        console.log('summary data');
    if (doLog)
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
    if (doLog)
        console.log('summary data');
    if (doLog)
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
    if (doLog)
        console.log('dates');
    if (doLog)
        console.log(data);
    return data;
}

function reloadTable(table)
{

    cloneTable(table, 'gpx_track');
}

function backupTable(table)
{
    cloneTable('gpx_track', table);
}


function cloneTable(from, to)
{
    if (doLog)
        console.log('cloning table from ' + from + " to " + to);
    var sql = "DROP TABLE IF EXISTS " + to;
    var jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );
    sql = "CREATE TABLE " + to + " LIKE " + from;

    jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );



    sql = " INSERT " + to + " SELECT * FROM " + from;

    jqXHR = $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        },
        'async': false
    }
    );
}