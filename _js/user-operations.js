/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var currentUsers = [];
var currentUserObjects = {};
var currentUserId;
var currentUser;

var activeUserIds = [];
var colorScale;

function loadUsers() {
//    if(doLog) console.log("Step1:");
    var users = getAllUsers();
    //    if(doLog) console.log(users);
    if (users) {
        for (var i = 0, j = users.length; i < j; i++)
        {
            var user = new User(users[i]);
            currentUsers.push(user['id']);
            currentUserObjects[user['id']] = user;
            activeUserIds.push(user['id']);
            $('#users').append("<option value='" + user['id'] + "'>" + user['name'] + "</option>");
            $('#user-pics').append(formatUserSelectHTML(user));
//            if(doLog) console.log("Building images..");
//            if(doLog) console.log(user['avatar']);
        }
//        if(doLog) console.log("In loadUsers function: ");
//        if(doLog) console.log(currentUserObjects);
        //load from db
    }
}

function addUserEvents() {
    $('#new-user-cancel').on('click', function() {
        $('#new-user').hide();
    });
    $('#users').on('change', function() {
        if(doLog) console.log('user changed');
        var self = $(this);
        var selected = self.children('option:selected');
        if(doLog) console.log(selected);
        currentUserId = selected.val();

        if (currentUserId === 'new') {
            if(doLog) console.log('adding new user');
            $('#new-user').show();
            $('#new-user-first-name').focus();
        } else {
            currentUser = currentUserObjects[currentUserId];
            if(doLog) console.log('Current User Changed:');
            if(doLog) console.log(currentUser);
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
            if(doLog) console.log(user);
            var user2 = addUserToDb(user);

            if(doLog) console.log(user2);
            var str = " < option value = '" + user2['id '] + "' > " + user2['name'] + " < /option>";
            if(doLog) console.log(str);
            $('#users').append(str);
            $('#users').val(user2['id']);
            $('#new-user').hide();
            currentUser = new User(user2);
            if(doLog) console.log('Current User Changed:');
            if(doLog) console.log(currentUser);
            return false;
        } catch (e) {
            if(doLog) console.log(e);
            return false;
        }
    });

    userSelectAction();
}


function getCurrentUser() {
    if(doLog) console.log(currentUser);
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
            + "<div class='user-button-img' data-mode='remove'><img src='_images/remove-button.png'/>"
            + "</div></div>";

    return str;
}

function userSelectAction()
{
    $('user-button-img').unbind('click');
    $('.user-button-img').on('click', function()
    {
        var self = $(this);
        var mode = self.attr('data-mode');
        var id = parseInt(self.parent().attr('data-id'));
        if(doLog) console.log('mode=' + mode);
        if (mode === 'remove')
        {
            if(doLog) console.log('removing user ' + id);
            self.attr("data-mode", 'add');
            self.children('img').attr('src', '_images/add-button.png');
            self.siblings('.user-picture').removeClass('selected-user').addClass('unselected-user');
            for (var i = 0, j = activeUserIds.length; i < j; i++)
            {
                var aid = parseInt(activeUserIds[i]);
                if (parseInt(id) === aid)
                {
                    if(doLog) console.log('removing ' + id + "\t" + aid);
                    activeUserIds.splice(i, 1);
                }
            }


        }
        else
        {

            if(doLog) console.log('adding user ' + id);
            self.attr('data-mode', 'remove');
            self.children('img').attr('src', '_images/remove-button.png');
            self.siblings('.user-picture').removeClass('unselected-user').addClass('selected-user');
            activeUserIds.push(id);
        }
        if(doLog) console.log(activeUserIds);
    });
}


function getActiveUserIds()
{
    return activeUserIds;
}

function getUserObjectById(userId)
{
    return currentUserObjects[userId];
}
