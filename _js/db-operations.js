/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var currentUser = "";
var DB_FILE = 'db-operations.php';
$(document).ready(function() {

});
function initDb()
{
    console.log('initiating database');
    var sql = [];
    sql.push("DELETE FROM `gpx_users` WHERE 1");
    sql.push("DELETE FROM `gpx_track` WHERE 1");
    sql.push("DELETE FROM `gpx_pictures` WHERE 1");
    for (var i = 0, j = sql.length; i < j; i++)
    {
        $.ajax({'type': 'GET',
            'url': DB_FILE,
            'data': {'q': sql[i]}
        }).done(function(data)
        {
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
function addGpxToDb(user, point)
{

    var sql = "INSERT INTO gpx_track "
            + "(user_id, track_timestamp, latitude, longitude, altitude) "
            + "VALUES (" + user['id'] + ",'" + point.time.toISOString() + "',"
            + point.lat + "," + point.lon + "," + point.elevation
            + ")";
//     console.log(sql);
    $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql}
    }).done(function(data)
    {
//        console.log(data);
    });

}
/**
 * 
 * @param {User} user
 * @returns {undefined}
 */
function addUserToDb(user)
{
    var sql = "INSERT INTO gpx_users "
            + "(first_name, last_name, picture_url, twitter, instagram)"
            + " VALUES ('" + user.firstName + "','" + user.lastName + "','"
            + user.avatar + "','" + user.twitter + "','" + user.instagram
            + "')";

//    console.log(sql);

    var jqXHR1 = $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql},
        'async': false
    });
    console.log(jqXHR1.responseText);

    var sql2 = "SELECT * FROM gpx_users WHERE first_name='" + user.firstName + "'"
            + " and last_name='" + user.lastName + "'"
            + " and twitter='" + user.twitter + "'";
    console.log(sql2);
    var jqXHR2 = $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql2},
        'async': false
    });

    var data = $.parseJSON(jqXHR2.responseText);

    console.log(data);
    return new User(data[0]);
}

function getUserById(id)
{
    var sql = "SELECT * FROM gpx_users WHERE id=" + id;
    console.log(sql2);
    var jqXHR2 = $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql},
        'async': false
    });

    var data = $.parseJSON(jqXHR2.responseText);

    console.log(data);
    return new User(data[0]);
}

function getAllUsers()
{
    var sql = "SELECT * FROM gpx_users";
    var jqXHR = $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql},
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
    return data;
}

function getPointsByDate(start, end)
{
    return getPointsByDate(start, end, userID);
}

function getPointsByUser(userID)
{
    return getPointsByDate(start, end, userID);
}

function getPoints(start, end, usersIds)
{

    var sql = "SELECT * FROM gpx_track ";
    var conditions = [];
    if (start)
        conditions.push("track_timestamp>=" + start);
    if (end)
        conditions.push("track_timestamp<=" + end);
    if (usersIds)
    {
        if (typeof (usersIds) === 'Array')
        {
            usersIds = [usersIds];
        }
        var str = "user_id in [";
        for (var i = 0, j = usersIds.length; i < j; i++)
            str += ((i !== 0) ? "," : "") + "'" + usersIds[i] + "'";
        str += "]";
    }

    if (conditions.length > 0)
    {
        sql += " where ";
        for (var i = 0, j = conditions.length; i < j; i++)
        {
            sql += ((i !== 0) ? " AND " : "") + conditions[i];

        }
    }
    console.log(sql);
    var jqXHR = $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql},
        'async': false
    });

    var data = $.parseJSON(jqXHR.responseText);
    console.log(data);
    var points = [];
    for (var i = 0, j = data.length; i < j; i++)
        points.push(new Point(data[i]));
    return points;

}