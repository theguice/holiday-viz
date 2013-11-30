/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
var currentUsers = [];
var currentUserObjects = {};
var currentUserId;
var currentUser;


$(document).ready(function() {

	loadUsers();
	addUserEvents();
});

function loadUsers() {
	console.log("Step1:")
	var users = getAllUsers();
	//    console.log(users);
	if (users) {
		for (var i = 0, j = users.length; i < j; i++) {
			var user = new User(users[i]);
			currentUsers.push(user['id']);
			currentUserObjects[user['id']] = user;
			$('#users').append("<option value='" + user['id'] + "'>" + user['name'] + "</option>");
			$('#user-pic').append("<img src='" + user['avatar'] + "' class='user-picture'><input type='checkbox' id = '" + user['id'] + "'>");
			console.log("Building images..");
			console.log(user['avatar']);
		}
		console.log("In loadUsers function: ");
		console.log(currentUserObjects);
		//load from db
	}
}

function addUserEvents() {
	$('#new-user-cancel').on('click', function() {
		$('#new-user').hide();
	});
	$('#users').on('change', function() {
		console.log('user changed');
		var self = $(this);
		var selected = self.children('option:selected');
		console.log(selected);
		currentUserId = selected.val();

		if (currentUserId === 'new') {
			console.log('adding new user');
			$('#new-user').show();
			$('#new-user-first-name').focus();
		} else {
			currentUser = currentUserObjects[currentUserId];
			console.log('Current User Changed:');
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
			console.log(user);
			var user2 = addUserToDb(user);

			console.log(user2);
			var str = " < option value = '" + user2['id '] + "' > " + user2['name'] + " < /option>";
			console.log(str)
			$('#users').append(str);
			$('#users').val(user2['id']);
			$('#new-user').hide();
			currentUser = new User(user2);
			console.log('Current User Changed:');
			console.log(currentUser);
			return false;
		} catch (e) {
			console.log(e);
			return false;
		}
	});
}


function getCurrentUser() {
	console.log(currentUser);
	return currentUser;
}

function getUser(id) {
	return currentUserObjects[id];
}
