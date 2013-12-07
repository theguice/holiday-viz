
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
function processFile(evt) {

    var userPoints = [];
    var x2js = new X2JS();
    var xml_string = evt.currentTarget.result;
    var json = x2js.xml_str2json(xml_string);
    var userId = $('#users option:selected').val();
    var user = getUser(userId);

    console.log('Processing files for ' + user.id + "\t" + user.id);
    console.log(json);

    if (typeof (userPoints[user.id]) === 'undefined')
    {
        userPoints[user.id] = [];
    }

    console.log(typeof (json.gpx.trk.trkseg));
    console.log($.isArray(json.gpx.trk.trkseg));
    if ($.isArray(json.gpx.trk))
    {
        for (var i = 0, j = json.gpx.trk.length; i < j; i++)
            addTrk(user, json.gpx.trk[i]);
    }
    else
        addTrk(user, json.gpx.trk);
}

function addTrk(user, trk)
{
    if ($.isArray(trk.trkseg))
    {

        for (var i = 0; i < trk.trkseg.length; i++)
        {
            for (var j = 0; j < trk.trkseg[i].trkpt.length; j++)
            {
                var point = new Point(trk.trkseg[i].trkpt[j]);
                if (j === 0)
                    point.startPoint = 1;
                addGpxToDb(user, point);
            }
        }
    }
    else
    {
        for (var j = 0; j < trk.trkseg.trkpt.length; j++)
        {
            var point = new Point(trk.trkseg.trkpt[j]);
            if (j === 0)
                point.startPoint = 1;
            addGpxToDb(user, point);
        }
    }
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
