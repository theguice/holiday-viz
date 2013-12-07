var elevationStats = {
    'min': 100000,
    'max': 0,
    'range': 0
};
var timeStats = {
    'min': 0,
    'max': 0,
    range: 0
};
var coordinateStats = {
    'lat': {
        'min': 180,
        'max': -180,
        'range': 0
    },
    'lon': {
        'min': 180,
        'max': -180,
        'range': 0
    }
};


$(document).ready(function() {

    timeStats = {'min': new Date(), 'max': new Date(01, 01, 1970)};
    // Check for the various File API support.
//    generateUserColors();
});

var numUsers = 3;
var colors = [];
function Point(data /*TRKPT or position*/)
{
    if (data)
    {
        if (data.coords)
        {

//            console.log('Object Type 1');
            this.elevation = (data.coords.altitude) ? parseFloat(data.coords.altitude) : 0;

            this.lat = (data.coords.latitude) ? data.coords.latitude : 0;
            this.lon = (data.coords.longitude) ? data.coords.longitude : 0;
            console.log(data.timestamp);
            this.time = data.timestamp;
            this.accuracy = (data.coords.accuracy) ? data.coords.accuracy : 0;
        }
        else if (data.transMode)
        {//CLONE Point
//            console.log('cloning point');
            this.id = (data['id']);
            this.elevation = (data['elevation']);
            this.lat = (data['lat']);
            this.lon = (data['lon']);
            this.time = (data['time']);
            this.userId = data['user_id'];
            this.distance = parseFloat(data['distance']);
            this.speed = (data['speed']);
            this.deltaTime = (data['deltaTime']);
            this.active = (data['active']);
            this.transMode = data['transMode'];
            this.LatLng = data['LatLng'];
            this.startPoint = data['startPoint'];
        }
        else if (data._lat)
        {
//            console.log('Object Type 2');
            this.elevation = (data.ele) ? parseFloat(data.ele) : 0;
            this.lat = (data._lat) ? parseFloat(data._lat) : 0;
            this.lon = (data._lon) ? parseFloat(data._lon) : 0;
            this.time = (data.time) ? new Date(data.time) : 0;

            this.accuracy = 0;
        }
        else if (data.lat)
        {
//            console.log('Object Type 3');
            this.elevation = (data['ele'] && data['ele'][0]) ? parseFloat(data.ele[0].text) : 0;
            this.lat = (data.lat) ? parseFloat(data.lat) : 0;
            this.lon = (data.lon) ? parseFloat(data.lon) : 0;
            this.time = (data['time'] && data['time'][0]) ? new Date(data.time[0].text) : 0;
            this.startPoint = 0;

            this.accuracy = 0;
        }
        else if (data.user_id)
        {
//            console.log('object type 4');
//            console.log('processing data from db');
            this.id = parseInt(data['track_id']);
            this.elevation = parseFloat(data['altitude']);
            this.lat = parseFloat(data['latitude']);
            this.lon = parseFloat(data['longitude']);
            this.time = new Date(data['track_timestamp']);
            this.userId = data['user_id'];
            this.distance = parseFloat(data['distance']);
            this.speed = parseFloat(data['speed']);
            this.deltaTime = parseFloat(data['delta_time']);
            this.active = parseInt(data['active']);
            this.transMode = getTransMode(this.speed);
            this.LatLng = new google.maps.LatLng(this.lat, this.lon);
            this.startPoint = parseInt(data['start_point']);
        }
//        else if(data.)
        else
        {
            this.elevation = 0;
            this.lat = 0;
            this.lon = 0;
            this.time;
            this.LatLng;
            this.accuracy;
            this.speed = 0;
            this.distance = 0;
            this.startPoint = 0;
        }

    }



}
Point.prototype.refreshTransMode = function()
{
    this.transMode = getTransMode(this.speed);
};
Point.prototype.refreshLatLng = function()
{
    this.LatLng = new google.maps.LatLng(this.lat, this.lon);
};

function sortPoints(pts) {
    console.log(pts);
    var sorted = pts;


    sorted.sort(function(a, b) {
        //        console.log(a);
        //        console.log(b);
        a = a['time'];
        b = b['time'];
        //        console.log(a + "\t" + b);
        return a < b ? -1 : (a > b ? 1 : 0);
    });
    //    console.log(sorted);
    //    console.log('Min Time=' + timeStats['min'] + "\t" + 'Max Time=' + timeStats['max'])\
    generateStats(sorted);
    return sorted;
}

function generateStats(sorted)
{
    console.log('General Stats');
//    timeStats['min'] = (sorted[0]['time'] < timeStats['min']) ? sorted[0]['time'] : timeStats['min'];
//    timeStats['max'] = (sorted[sorted.length - 1]['time'] > timeStats['max']) ? sorted[sorted.length - 1]['time'] : timeStats['max'];

    for (var i = 0, j = sorted.length; i < j; i++)
    {
        var point = new Point();
        point = sorted[i];
        timeStats['min'] = (point['time'] < timeStats['min']) ? point['time'] : timeStats['min'];
        timeStats['max'] = (point['time'] > timeStats['max']) ? point['time'] : timeStats['max'];

        elevationStats['min'] = (point.elevation < elevationStats.min) ? point.elevation : elevationStats['min'];
        elevationStats['max'] = (point.elevation > elevationStats.max) ? point.elevation : elevationStats['max'];
        coordinateStats.lat.min = (point.lat < coordinateStats.lat.min) ? point.lat : coordinateStats.lat.min;
        coordinateStats.lat.max = (point.lat > coordinateStats.lat.max) ? point.lat : coordinateStats.lat.max;
        coordinateStats.lon.min = (point.lon < coordinateStats.lon.min) ? point.lon : coordinateStats.lon.min;
        coordinateStats.lon.max = (point.lon > coordinateStats.lon.max) ? point.lon : coordinateStats.lon.max;
    }

    timeStats.range = timeStats.max - timeStats.min;
    elevationStats.range = elevationStats.max - elevationStats.min;
    coordinateStats.lat.range = coordinateStats.lat.max - coordinateStats.lat.min;
    coordinateStats.lon.range = coordinateStats.lon.max - coordinateStats.lon.min;

    console.log(elevationStats);
    console.log(coordinateStats);
    console.log(timeStats);

}

function ColorCombo() {
    this.path = google.maps.SymbolPath.CIRCLE;
    this.scale = 2;
    this.fillColor = "#f00";
    this.strokeColor = "#000";
    this.strokeWeight = 1;
    this.strokeOpacity = 1.0;

}



function User(data)
{
    if (typeof (data) === 'string')
    {
        this.id = 0;
        this.name = (name) ? name : "";
        this.firstName = this.name;
        this.lastName = "";
        this.avatar = "";
        this.twitter = "";
        this.instagram = "";
        this.use_bike = 0;

    }
    else if (data)
    {

//        console.log(data);
        this.id = parseInt(data['user_id']);
        this.firstName = data['first_name'];
        this.lastName = data['last_name'];
        this.name = this.firstName + " " + this.lastName;
        this.avatar = data['picture_url'];
        this.twitter = data['twitter'];
        this.instagram = data['instagram'];
        this.use_bike = (data['use_bike']) ? parseInt(data['use_bike']) : 0;

    }
    else
    {
        this.id = 0;
        this.name = "";
        this.firstName = "";
        this.lastName = "";
        this.avatar = "";
        this.twitter = "";
        this.instagram = "";
        this.use_bike = 0;
    }
    this.color = "#fff";
    this.steps = [];
}


function convertSpeedMStoMPH(speed)
{
    return Math.round(speed * 2.23694 * 100) / 100;
}

function convertDistanceMtoMI(distance)
{

    return Math.round(distance * 0.000621371 * 100) / 100;

}

function getTransMode(speed)
{
    for (var s in modes)
        if (speed <= s)
            return modes[s];
}


var modes = {0: "Stop", 2: "Walk", 6: "Bike", 45: "Drive", 400: "Fly"};
