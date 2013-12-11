/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var currentUsers = [];
var currentUserObjects = {};
var currentUserId;
var currentUser;
var usersByTime = [];
var usersByDistance = [];
var usersTransModes = [];
var userTopCities = [];

var activeUserIds = [];
var allUserIds = [];
var colorScale;
var go_bears_user;

function loadUsers() {

    usersByTime     = rankUsersByTime();
    usersByDistance = rankUsersByDistance();
    usersTransModes = runCustomQuery("select distinct user_id, trans_mode from gpx_track where active=1 and trans_mode not in ('undefined','Stop') order by user_id");
    userTopCities   = runCustomQuery("select  user_id, city, state, round((sum(delta_time))) as total_time_s, round((sum(delta_time)*0.000277778)) as total_time_hr, round(sum(distance)) as total_distance_m, round( sum(distance)*0.000621371) as total_distance_mi from gpx_track  where city<> 'undefined' and state<>'undefined' group by user_id, city, state order by user_id, round((sum(delta_time)))  desc");
    usersByAvgSpeed = runCustomQuery("SELECT user_id, AVG( average_speed_mi_hrs ) AS avg FROM  `gpx_active_stats` GROUP BY user_id ORDER BY avg ASC");

    // find who spent the most time in berkeley  // go bears award
    var count = 0;
    for (var i=0; i<userTopCities.length; i++) {
        if (userTopCities[i].city == "Berkeley") {
            if (count < userTopCities[i].total_time_s) {
                go_bears_user = userTopCities[i].user_id;
            }
        }
    }



    currentUsers = [];
    currentUserObjects = {};
    var users = getAllUsers();
    if (doLog)
        console.log(users);
    if (users)
    {
        for (var i = 0, j = users.length; i < j; i++)
        {
            var user = new User(users[i]);
            currentUsers.push(user['id']);
            currentUserObjects[user['id']] = user;
            //activeUserIds.push(user['id']);
            // Upload User Dropdown

            $('#users').append("<option value='" + user['id'] + "'>" + user['name'] + "</option>");
            // Main page header
            $('#user-columns').append(formatUserColumnHTML(user));

//            if(doLog) console.log("Building images..");
//            if(doLog) console.log(user['avatar']);
        }
//        if(doLog) console.log("In loadUsers function: ");
//        if(doLog) console.log(currentUserObjects);
        //load from db
    }
}

function displayActiveUsers() {
    var activeUsers = getActiveUserIds();
    
    $('#users-pics').html('');
    for (var i = 0; i < activeUsers.length; i++) {
        $('#users-pics').append(formatUserSelectHTML(currentUserObjects[activeUsers[i]]));
    }
}


function addUserEvents() {
    $('#goToMap').on('click', displayActiveUsers);

    $('#new-user-cancel').on('click', function() {
        $('#new-user').hide();
    });
    $('#users').on('change', function() {
        if (doLog)
            console.log('user changed');
        var self = $(this);
        var selected = self.children('option:selected');
        if (doLog)
            console.log(selected);
        currentUserId = selected.val();

        if (currentUserId === 'new') {
            if (doLog)
                console.log('adding new user');
            $('#new-user').show();
            $('#new-user-first-name').focus();
        } else {
            currentUser = currentUserObjects[currentUserId];
            if (doLog)
                console.log('Current User Changed:');
            if (doLog)
                console.log(currentUser);
        }
    });

    $('#new-user-form').on('submit', function() {
        try {
            var self = $(this);
            var user = new User();
            user.firstName = $('#new-user-first-name').val();
            user.lastName = $('#new-user-last-name').val();
            user.avatar = $('#new-user-image-url').val();
            user.twitter = $('#new-user-twitter').val();
            user.instagram = $('#new-user-instagram').val();
            user.use_bike = $('#new-user-use-bike').prop('checked');
            if (doLog)
                console.log(user);
            var user2 = addUserToDb(user);

            if (doLog)
                console.log(user2);
            var str = " < option value = '" + user2['id '] + "' > " + user2['name'] + " < /option>";
            if (doLog)
                console.log(str);
            $('#users').append(str);
            $('#users').val(user2['id']);
            $('#new-user').hide();
            currentUser = new User(user2);
            if (doLog)
                console.log('Current User Changed:');
            if (doLog)
                console.log(currentUser);
            return false;
        } catch (e) {
            if (doLog)
                console.log(e);
            return false;
        }
    });

    userSelectAction();
}


function getCurrentUser() {
    if (doLog)
        console.log(currentUser);
    return currentUser;
}

function getUser(id) {
    return currentUserObjects[id];
}



/**
 * 
 * @param {User} user
 * @returns {undefined}
 */
function formatUserSelectHTML(user)
{
    var str = "<div class='user-pic' data-id='" + user.id + "'>"
//    + "<img src='" + user['avatar'] + "' class='user-picture'><input type='checkbox' id = '" + user['id'] + "'>"
            + "<img src='" + user['avatar'] + "' class='user-picture selected-user' alt='" + user.firstName + " " + user.lastName + "'  style='border-color:" + colorScale(user.id) + "'/>"
            + "<div class='user-stat-button' style='background-color:" + colorScale(user.id) + "' data-id='"+user.id+"' ><i class='fa fa-bar-chart-o'></i>"
            + "</div>"
            + "<div class='user-location' id='user-location-" + user.id + "' ></div>"
            + "<div class='user-trans' id='user-trans-" + user.id + "' style='color:" + colorScale(user.id) + "' ></div>"
            + "</div>";

    return str;
}

function formatUserColumnHTML(user)
{
    var str = "<div class='user-column' id='user-column-"+user.id+"' data-id='" + user.id + "'>"
            + "<img src='" + user['avatar'] + "' class='user-picture unselected-user' alt='" + user.firstName + " " + user.lastName + "'  style='border-color:" + colorScale(user.id) + "'/>"
            + "<div class='user-button-img' data-mode='add'  style='background-color:" + colorScale(user.id) + "' >"
            + "<i class='fa fa-plus'></i>"
            + "</div><div class='user-facts'>"
            + "<span class='name'>" + user.firstName + "</span>";

    for (var i=0; i<usersTransModes.length; i++) {
        if (usersTransModes[i].user_id == user.id) {
            str += "<span class='symbola trans-mode-symbol'>" + transModeSymbols[usersTransModes[i].trans_mode] + "</span>";
        }
    }
    str += "<ol start='1' class='user-top-cities'>";
    var count = 1;
    for (var i=0; i<userTopCities.length; i++) {
        if (userTopCities[i].user_id == user.id) {
            str += "<li>" + userTopCities[i].city + ', ' + userTopCities[i].state + "</li>";
            if (count > 2) {
                break;
            }
            count++;
        }
    }
    str += "</ol><ul class='user-awards'>";
    // most time spent travelling badge
    if (usersByTime[0].user_id == user.id) {
        str += "<li><span class='symbola award-symbol'>" + transModeSymbols['time'] + "</span></li>";
        str += "<li>Most Time Spent Traveling</li>";
    }
    // most distance travelled badge
    if (usersByDistance[0].user_id == user.id) {
        str += "<li><span class='symbola award-symbol'>" + transModeSymbols['distance'] + "</span></li>";
        str += "<li>Most Distance Traveled</li>";
    }
    if (go_bears_user == user.id) {
        str += "<li><img class='award' src='_images/cal_bear.png'/></li>";
        str += "<li>Go Bears</li>";
    }
    if (usersByAvgSpeed[0].user_id == user.id) {
        str += "<li><span class='symbola award-symbol'>" + transModeSymbols['slow'] + "</span></li>";
        str += "<li>Slowest Traveler</li>";
    }
    str += "</ul></div></div>";

//    console.log(summary);

    return str;
}

function userSelectAction()
{
    console.log('adding user select actions');
    $('.user-button-img').unbind('click');
    $('.user-button-img').on('click', function()
    {
        console.log('user image clicked');
        var self = $(this);
        var mode = self.attr('data-mode');
        var id = parseInt(self.parent().attr('data-id'));

        if (doLog)
            console.log('mode=' + mode);
        if (mode === 'remove')
        {
            if (doLog)
                console.log('removing user ' + id);
            self.attr("data-mode", 'add');
//            self.children('img').attr('src', '_images/add-button.png');
            self.empty().append('<i class="fa fa-plus"></i>');
            self.siblings('.user-picture').removeClass('selected-user').addClass('unselected-user');
            for (var i = 0, j = activeUserIds.length; i < j; i++)
            {
                var aid = parseInt(activeUserIds[i]);
                if (parseInt(id) === aid)
                {
                    if (doLog)
                        console.log('removing ' + id + "\t" + aid);
                    activeUserIds.splice(i, 1);
                }
            }
            
            //hideUserMarker(id);

            $(this).parent().css('display', 'none');
            console.log($(this).parent());
            $('#user-column-'+id).css('display', 'inline-block');
            //$('#user-column-'+id).show();

            //$('#user-columns').append('<div class="user-column" id="column-'+id+'"></div>');
            //$('#user-columns').append($(this).prev());
            //$('#user-columns').append($(this));

        }
        else
        {

            if (doLog)
                console.log('adding user ' + id);
            self.attr('data-mode', 'remove').empty().append('<i class="fa fa-minus"></i>');
//            self.children('img').attr('src', '_images/remove-button.png');
            self.siblings('.user-picture').removeClass('unselected-user').addClass('selected-user');
            activeUserIds.push(id);

            $('#user-column-'+id).clone(true).attr("id","user-column-"+id+"-clone").appendTo('#selected');
            $('#user-column-'+id+'-clone').find(".user-facts").hide();
            $('#user-column-'+id).css('display', 'none');

            //showUserMarker(id);
        }
        if (doLog)
            console.log(activeUserIds);
    });

    $('.user-button-img').on('hover', function() {
        console.log('hovering');
    });


    $('.user-stat-button').unbind('click')
            .on('click', function()
            {
                //TODO 
            });
}

function closeOverlay() {
    $('#user-selection').slideUp();
}


function getActiveUserIds()
{
    return activeUserIds;
}

function getUserObjectById(userId)
{
    return currentUserObjects[userId];
}
