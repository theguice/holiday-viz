
$(document).ready(function() {

    /********************
    * From import.js
    ********************/
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
        //
    } else {
        alert('The File APIs are not fully supported in this browser.');
    }
    setup();

    /********************
    * From map.js
    ********************/
    initMap();
    
    /********************
    * From objects.js
    ********************/
    timeStats = {'min': new Date(), 'max': new Date(01, 01, 1970)};

    /********************
    * From user-operations.js
    ********************/
    colorScale = d3.scale.category20();
    loadUsers();
    addUserEvents();

    /********************
    * From dashboard.js
    ********************/
    initDashboard();

    /********************
    * From data-clean.js
    ********************/
    $('#clean').click(function() {
        cleanData();
    });
    $('#reload').click(function() {
        reloadTable($('#reload-target').val());
    });
    $('#backup').click(function() {
        backupTable($('#backup-target').val());
    });
    generateColors();

    /********************
    * From db-operations.js
    ********************/
    geocoder = new google.maps.Geocoder();


    

});
