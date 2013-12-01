/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var currentUser = "";
var DB_FILE = 'db-operations.php';
$(document).ready(function() {

});

function initDb() {
    console.log('initiating database');
    var sql = [];
    sql.push("DELETE FROM `gpx_users` WHERE 1");
    sql.push("DELETE FROM `gpx_track` WHERE 1");
    sql.push("DELETE FROM `gpx_pictures` WHERE 1");
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
            + " where track_id=" + point.id;
//    console.log("update sql:\n" + sql);
    $.ajax({
        'type': 'GET',
        'url': DB_FILE,
        'data': {
            'q': sql
        }
//        ,'async':false
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

function getActivePoints(start, end, usersIds) {
//		console.log(usersIds);
    // usersIds = 21
    var n = $("input:checked").length;
//	console.log("n=", n);
    if (n > 0) {
        usersIds = new Array();
        $("input:checkbox").each(function() {
            if ($(this).is(":checked")) {
                usersIds.push($(this).attr("id"));
            }
        });
    }
//    console.log("Generated usersids")
//    console.log(usersIds)

    return getPoints(start, end, usersIds, true);
}

function getPoints(start, end, usersIds, activeOnly) {
//    console.log("I am here now-3!")
    if (typeof (activeOnly) === 'undefined')
        activeOnly = false;

//    console.log(usersIds);
    var sql = "SELECT * FROM gpx_track ";
    var conditions = [];
    if (start)
        conditions.push("track_timestamp>=" + start);
    if (end)
        conditions.push("track_timestamp<=" + end);
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
    if (conditions.length > 0) {
        sql += " where ";
        for (var i = 0, j = conditions.length; i < j; i++) {
            sql += ((i !== 0) ? " AND " : "") + conditions[i];

        }
    }


    sql += " order by user_id, track_timestamp";
//    console.log(sql);
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
    return points;

}
/**
 * 
 * @param {Point} point
 * @returns {undefined}
 */
function archiveGpxPoint(point)
{
    console.log('archiving point '+point.id);
    var sql = "INSERT INTO gpx_track_inactive "
            + "(user_id, track_timestamp, latitude, longitude, altitude,active, speed, delta_time, trans_mode) "
            + "VALUES (" + point.userId+ ",'" + point.time.toISOString()
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
    console.log('Deletes point '+point.id);
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