
$(document).ready(function() {
    $('#goToMap').on('click', init);
});



function init() {
    $('#user-selection').slideUp();
}
/*
function loadUsers2(elementId) {
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
            $('#'+elementId).append("<option value='" + user['id'] + "'>" + user['name'] + "</option>");
            $('#'+elementId+'-pics').append(formatUserSelectHTML(user));
//            if(doLog) console.log("Building images..");
//            if(doLog) console.log(user['avatar']);
        }
//        if(doLog) console.log("In loadUsers function: ");
//        if(doLog) console.log(currentUserObjects);
        //load from db
    }
}*/