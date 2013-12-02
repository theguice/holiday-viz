
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




function setup()
{
    $('#files').bind('change', handleFileSelect);
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
/*
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
*/
function processFile(evt) {
    var userPoints = [];
    var x2js = new X2JS();
    var xml_string = evt.currentTarget.result;
    var json = x2js.xml_str2json(xml_string);
    var userId = $('#users option:selected').val();
    var user = getUser(userId);

    console.log('Processing files for ' + user.id + "\t" + user.id);


    if (typeof (userPoints[user.id]) === 'undefined')
    {
        userPoints[user.id] = [];
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
//    showUserSet();
    toggleUploadWindow(false);


    var files = evt.target.files; // FileList object

    // Loop through the FileList and render image files as thumbnails.
    for (var i = 0, j = files.length; i < j; i++)
    {
        var f = files[i];
        // Only process gpx files.
        if (!f.name.match('.gpx')) {
            console.log('file: ', f.name, ' not permitted.  Only processing GPX files');
            continue;
        }
        var reader = new FileReader();
        reader.onloadend = processFile;
        reader.readAsText(f);
    }
}
