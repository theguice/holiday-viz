/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var currentUser = "";
var DB_FILE = 'db-operations.php';
$(document).ready(function() {
    getAllUsers();

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
            + "VALUES (" + user.id + ",'" + point.time.toISOString() + "',"
            + point.lat + "," + point.lon + "," + point.elevation
            + ")";

    $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql}
    }).done(function(data)
    {
        console.log(data);
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
    
    console.log(sql);

    $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql}
    }).done(function(data)
    {
        var sql2 = "SELECT * FROM gpx_users WHERE first_name='" + user.firstName
                + " and last_name='" + user.lastName + "'"
                + " and twitter='" + user.twitter + "'";
        $.ajax({'type': 'GET',
            'url': DB_FILE,
            'data': {'q': sql2}
        }).done(function(data)
        {
            console.log(data);

        });

    });
}

function getAllUsers()
{
    var sql = "SELECT * FROM gpx_users";
    $.ajax({'type': 'GET',
        'url': DB_FILE,
        'data': {'q': sql}
    }).done(function(data)
    {
        console.log(data);
        data = $.parseJSON(data);
        console.log(data);
        if(data!=='null')
        {
            console.log('users exist');
        }

    });

}
