/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */


$(document).ready(function() 
{

loadUsers();
addUserEvents();
});

function loadUsers()
{
    //load from db
}

function addUserEvents()
{
    $('#users').on('change',function()
    {
        console.log('user changed');
        var self = $(this);
        var selected =  self.children('option:selected');
        console.log(selected);
        var selected_id = selected.val();
        if(selected_id==='new')
        {
            console.log('adding new user');
            $('#new-user').show();
        }
        
    });
    
    $('#new-user-form').on('submit',function()
    {
        
        var self = $(this);
        var user = new User();
        user.firstName = $('#new-user-first-name').val();
        user.lastName = $('#new-user-last-name').val();
        user.avatar = $('#new-user-image-url').val();
        user.twitter = $('#new-user-twitter').val();
        user.instagram = $('#new-user-instagram').val();
        console.log(user);
        addUserToDb(user);
       
         $('#new-user').hide();
         return false;
    });
}
