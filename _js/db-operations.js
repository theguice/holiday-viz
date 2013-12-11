/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var doLog = false;
var currentUser = "";
var DB_FILE = 'db-operations.php';
var MAP_FILE = 'map-api.php';
var PROXY_FILE = 'ba-simple-proxy.php';
var DELTA_TIME_DELETE_TOLERANCE = 15;

var geocoder;

_openWindow = null;

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

function _newGoogleMapsMarker(param) {
    var iconBase = 'http://maps.google.com/mapfiles/kml/pal2/';
    var r = new google.maps.Marker({
        map: param._map,
        position: new google.maps.LatLng(param._lat, param._lng),
        title: param._head,
        //icon: IconType[place.types[0]]
        icon: iconBase + '/icon22.png'
    });
//    console.log("Made marker")

    if (param._data) {
//        console.log("In addListener", param._data);
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
            + (!keys || ($.inArray('street', keys) > -1) ? ", street='" + point.address.street + "'" : "")
            + (!keys || ($.inArray('city', keys) > -1) ? ", city='" + point.address.city + "'" : "")
            + (!keys || ($.inArray('county', keys) > -1) ? ", county='" + point.address.county + "'" : "")
            + (!keys || ($.inArray('state', keys) > -1) ? ", state='" + point.address.state + "'" : "")
            + (!keys || ($.inArray('country', keys) > -1) ? ", country='" + point.address.country + "'" : "")
            + (!keys || ($.inArray('zip', keys) > -1) ? ", zip='" + point.address.zip + "'" : "")

//    ,'street', 'city','county','state', 'country', 'zip'

            + " where track_id=" + point.id;
    if (doLog)
        console.log("update sql:\n" + sql);

//    var address = getAddress(point.lat, point.lon);
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

        return(data);
        $('#image-list').children().remove();
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
function getSummary(start, end, usersIds, activeOnly, byDate, byTransMode)
{
    var conditions = parseConditions(start, end, usersIds, activeOnly);
    var sql = "SELECT "
            + ((usersIds) ? "user_id," : "")
            + ((byDate) ? "Date(track_timestamp) as date," : "")
            + ((byTransMode) ? "trans_mode," : "")
            + "COUNT(track_id) as track_count"
//            + ",ROUND(SUM(distance))AS total_distance_m"
//            + ",ROUND(SUM(delta_time))AS total_time_s"
//            + ",ROUND(SUM(distance)/sum(delta_time),1) AS average_speed_ms"
            + ",ROUND((SUM(distance)*0.000621371)) AS total_distance_mi"
            + ",ROUND((SUM(delta_time)/(60*60))) AS total_time_hr "
            + ",ROUND((SUM(distance)/sum(delta_time)*2.23694),1) AS average_speed_mph "
            + " FROM gpx_track "

    sql += conditions;
    if (usersIds || byDate || byTransMode)
    {
        sql += " GROUP BY "
                + ((byTransMode) ? "trans_mode," : "")
                + ((usersIds) ? "user_id," : "")
                + ((byDate) ? "Date(track_timestamp)," : "");
        sql = sql.substr(0, sql.length - 1);
    }

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


function getAddress(lat, lon)
{
    /*
     var latlng = new google.maps.LatLng(lat, lng);
     geocoder.geocode({'latLng': latlng}, function(results, status) {
     if (status == google.maps.GeocoderStatus.OK) {
     if (results[1]) {
     console.log(results[1]);
     return results[1];
     } else {
     alert('No results found');
     }
     } else {
     alert('Geocoder failed due to: ' + status);
     }
     });
     */

    var url = 'http://maps.googleapis.com/maps/api/geocode/json?latlng=' + lat + ',' + lon + '&sensor=true';
    var enc_url = encodeURI(url);
//    console.log(enc_url);
    jqXHR = $.ajax({
        'type': 'GET',
        'url': PROXY_FILE,
        'data': {'url': enc_url},
        'async': false
    }
    );
//    console.log(jqXHR);
//    var response = $.parseJSON(jqXHR.responseText);
//    console.log(response);
    var data = jqXHR.responseJSON.contents.results;
//    var data = $.parseJSON(response.responseText);
    var address = new Address(data[0]);
    /*   if (doLog)
     console.log(address);
     */ return address;

}


function runCustomQuery(sql)
{

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
        console.log(data);
    return data;
}


function runCustomFetch(url)
{
    var enc_url = encodeURI(url);
//    console.log(enc_url);
    jqXHR = $.ajax({
        'type': 'GET',
        'url': PROXY_FILE,
        'data': {'url': enc_url},
        'async': false
    }
    );

//    console.log(jqXHR);
    var response;
    if (jqXHR.responseJSON)
        response = jqXHR.responseJSON;
    else
        response = $.parseJSON(jqXHR.responseText);
//    console.log(response);
    return response;

//    var data = jqXHR.responseJSON.contents.results;
//    var data = $.parseJSON(response.responseText);
//    var address = new Address(data[0]);
//    /*   if (doLog)
//     console.log(address);
//     */ return address;
}


function rankUsersByTime() {

    var sql = "select user_id, sum(delta_time) as total_time_s, round(sum(delta_time)*0.000277778) as total_time_hr from gpx_track group by user_id order by sum(delta_time)  desc";
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
        console.log('Top User By Time data');
    if (doLog)
        console.log(data);
    return data;
}


function rankUsersByDistance() {

    var sql = "select user_id, sum(distance) as total_distance_m, round(sum(distance)*0.000621371) as total_distance_mi from gpx_track group by user_id order by sum(distance)  desc";
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
        console.log('Top User By Distance data');
    if (doLog)
        console.log(data);
    return data;
}




