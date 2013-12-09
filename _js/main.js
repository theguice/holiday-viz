
var doLog = true;

var pageInitialized = false;
$(document).ready(function()
{
    if (!pageInitialized)
    {
        pageInitialized = true;
        console.log('doc ready');
        /********************
         * From import.js
         ********************/
        // Check for the various File API support.
        if (window.File && window.FileReader && window.FileList && window.Blob) {
            //
        } else {
            alert('The File APIs are not fully supported in this browser.');
        }
        console.log('setup import');
        setupImport();

        /********************
         * From map.js
         ********************/
        console.log('init map');

        initMap();

        /********************
         * From objects.js
         ********************/
        timeStats = {'min': new Date(), 'max': new Date(01, 01, 1970)};

        /********************
         * From user-operations.js
         ********************/
        console.log('loading users');

        colorScale = d3.scale.category20();
        loadUsers();
        addUserEvents();
        $('#goToMap').on('click', closeOverlay);


        /********************
         * From dashboard.js
         ********************/
        console.log('init dashboard');

        initDashboard();

        /********************
         * From data-clean.js
         ********************/
        /*
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
         */

        /********************
         * From db-operations.js
         ********************/
//    geocoder = new google.maps.Geocoder();

    }
    else
    {
        console.log('Attempt to re-load page');
    }


});
