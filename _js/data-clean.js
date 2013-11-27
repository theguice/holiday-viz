/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */



$(document).ready(function() {

    cleanData();
});

function cleanData()
{
    var usersJSON = getAllUsers();
    var users = [];
    console.log(usersJSON);
    for (var i = 0, j = usersJSON.length; i < j; i++)
    {
        var user = new User(usersJSON[i]);
        users.push(user);
        $('#users').append(formatUserHTML(user));
        var points = getPointsByUser(user['id']);

        console.log(points);

    }
    console.log(users);


}
/**
 * 
 * @param {User} user
 * @returns {undefined}
 */
function formatUserHTML(user)
{
    var str = "<li id='user-" + user.id + "' class='user'>"
            + "<img src='" + user.avatar + "'.?"
            + user.firstName + " " + user.lastName + "(" + user.twitter + ")</li>";
    return str;
}