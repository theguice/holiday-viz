
$(document).ready(function() {

// Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
//
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }

    setup();
//  _map = initializeMap();
    //google.maps.event.addDomListener(window, 'load', initializeMap);
});
//var gpx = [];
var userPoints = [];
var userSteps = [];

var infowindow;


function setup()
{
    $('#files').bind('change', handleFileSelect);
    $('.map-refresh').on('click', processTrkpts);
    $('#play-button').on('click', takeSteps);
    $('#center-button').on('click', manageCenter);
    $('#upload-button').on('click', function() {
        toggleUploadWindow(true);
        var f = $('#files')
        f.replaceWith(f = f.clone());
        f.bind('change', handleFileSelect);
//        files.replaceWith(files = files.clone(true));
    });
    $('#cancel-upload-button').on('click', function() {
        toggleUploadWindow(false);
    });
}
function toggleUploadWindow(show)
{
    console.log('toggling upload window');
    if (show)
        $('#upload-div').show();
    else
        $('#upload-div').hide();

}

function showUserSet() {
//    var name = $("#users option:selected")[0].label;
    var name = $("#users").val();
    name = (name) ? name : 'user-' + ((users || users.length === 0) ? 1 : (users.length + 1));
    var user = new User(name);
    currentUser = user;
    if ($.inArray(name, users) > -1)
    {
        users.push(name);
        userObjects.push(user);
        $('#header').append('<h2>' + user.name + '</h2>');
        console.log('adding user name to header ' + user.name);
    }

//console.log($("#users option:selected")[0].value);
//    var val = $("#users option:selected")[0].value;
//    $('#header').append('<h2 style="color: ' + users[val].color + '">' + name + '</h2>');


}

function processFile(evt) {
    var x2js = new X2JS();
    var xml_string = evt.currentTarget.result;
    var json = x2js.xml_str2json(xml_string);
    var userId = $('#users option:selected').val();
    var user = getUser(userId);

    console.log('Processing files for ' + user.name + "\t" + user.id);


    if (typeof (userPoints[user.name]) === 'undefined')
    {
        userPoints[user.name] = [];
    }
    if ($.isArray(json.gpx.trk.trkseg))
    {
        for (var i = 0; i < json.gpx.trk.trkseg.length; i++)
        {
            for (var j = 0; j < json.gpx.trk.trkseg[i].trkpt.length; j++)
            {
                var point = new Point(json.gpx.trk.trkseg[i].trkpt[j]);
                addPointToLocalArray(user, point);
            }
        }
    }
    else
    {
        for (var j = 0; j < json.gpx.trk.trkseg.trkpt.length; j++)
        {
            var point = new Point(json.gpx.trk.trkseg.trkpt[j]);
            addPointToLocalArray(user, point);
        }
    }
}
/**
 * 
 * @param {User} user
 * @param {Point} point
 * @returns {undefined}
 */
function addPointToLocalArray(user, point)
{
//    userPoints[user.name].push(point);
    addGpxToDb(user, point);

}
// http://www.html5rocks.com/en/tutorials/file/dndfiles/
function handleFileSelect(evt)
{
    showUserSet();
    toggleUploadWindow(false);


    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, j = files.length; i < j; i++)
    {
        var f = files[i];
        // Only process gpx files.
        if (!f.name.match('.gpx')) {
            console.log('file: ', f.name, ' not permitted.  Only processing GPX files')
            continue;
        }
        var reader = new FileReader();
        reader.onloadend = processFile;
        reader.readAsText(f);
    }
}
/**
 * Refresh Map
 * @returns {undefined}
 */
function processTrkpts()
{
    var points = getActivePoints();
    console.log(points);
    userPoints = [];
    for (var i = 0, j = points.length; i < j; i++)
    {
//        var point = new Point();
        var point = points[i];
        var id = point['userId'];
        if (typeof (userPoints[id]) === 'undefined')
        {
            console.log('New user array '+id);
            userPoints[id] = [];
        }
        userPoints[id].push(point);
    }
    console.log(userPoints);
    for (var user in userPoints)
    {
        if (typeof (userPoints[user]) !== 'undefined')
        {
            userPoints[user] = sortPoints(userPoints[user]);
            createPath(userPoints[user], user);
        }
    }
    getSteps(timeStats.min, timeStats.max);
}


function moveToStep(m, user, c) {
    window.setTimeout(function() {
        step = users[user].steps[c];
        console.log('step', step);
        point = new google.maps.LatLng(userPoints[user][step]._lat, userPoints[user][step]._lon);
        m.setPosition(point);
        if (c == 25) {
            infowindow.open(_map, m);
        }
        if (c == 50) {
            infowindow.close();
        }

        manageCenter();
        if (typeof (users[user].steps[c + 1]) !== undefined)
        {
            moveToStep(m, user, c + 1);
        }
    }, 50);
}

function takeSteps() {
    for (var i = 0; i < users.length; i++)
    {

        var user = users[i];
        console.log('Steps for user:' + user)
        if (typeof (userPoints[user]) !== undefined)
        {
            users[i].marker = createPointMarker(userPoints[i][0], user, i);
            moveToStep(users[i].marker, i, 0);
        }
    }
}

function getSteps(starttime, endtime) {
    var step = 60; // 1 real minute

    // set index of last gps point read for each user
    for (var i = 0; i < users.length; i++) {
        if (userPoints[i]) {
            users[i].last = 0;
        }
    }
    var count = 0;
    for (var i = 0; i < users.length; i++) {
        if (userPoints[i]) {
            //users[i].last-1 < userPoints[i].length || c
            //console.log(d2i(userPoints[i][users[i].last+1].time) - d2i(userPoints[i][users[i].last].time));
            //var t = d2i(userPoints[i][users[i].last].time);
            var t = starttime;
            while (users[i].last < userPoints[i].length - 1) {
                //console.log(userPoints[i][users[i].last+1]);
                if (d2i(userPoints[i][users[i].last + 1].time) - t < step) {
                    users[i]['steps'].push(users[i].last + 1);
                    users[i].last += 1;
                    count = 0;
                } else {
                    t += step;
                    count++;
                    if (count > 100) {
                        continue;
                    }
                    users[i]['steps'].push(users[i].last);
                }
            }
        }
    }
    console.log(users);
}

function manageCenter()
{
    // using the active marker for each user
    // if one of them gets close to an edge, zoom out

    // if all are close to center, zoom in
    console.log('Re-center');
    var count = 0;

    var center = new Point();
    center.lat = coordinateStats.lat.min + (coordinateStats.lat.max - coordinateStats.lat.min) / 2;
    center.lon = coordinateStats.lon.min + (coordinateStats.lon.max - coordinateStats.lon.min) / 2;
    center.refreshLatLng();
    centerMap(center);
    var zoomout = false;
    var zoomin = true;
    while ((zoomout || zoomin) && count < 10)
    {
        var bounds = map.getBounds();
        console.log(bounds);
        console.log(coordinateStats.lat.min + "\t" + bounds.fa.d);

        if (coordinateStats.lat.min < bounds.fa.d)
        {
            console.log('zoom rule 1');
            zoomout = true;
        }
        else if (coordinateStats.lat.max > bounds.fa.b)
        {
            console.log('zoom rule 2');
            zoomout = true;
        }
        else if (Math.abs(coordinateStats.lon.min) < Math.abs(bounds.ga.d))
        {
            console.log('zoom rule 3\t' + coordinateStats.lon.min + "\t" + bounds.ga.d);

            zoomout = true;
        }
        else if (Math.abs(coordinateStats.lon.max) > Math.abs(bounds.ga.b))
        {
            console.log('zoom rule 4');
            zoomout = true;
        }
        else
        {
            console.log('zoom rule 5');
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
