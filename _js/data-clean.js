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
    for (var i = 0, j = usersJSON.length; i < j; i++)
    {
        var user = new User(usersJSON[i]);
        users.push(user);
        var points = getPointsByUser(user['id']);

        console.log(points);

    }
    console.log(users);


}