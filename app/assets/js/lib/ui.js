/*global window, jQuery */
jQuery(document).ready(function ($) {
    "use strict";

    window.onresize = function (e) {
        var height = 1000;
        $('#sidebar').height(height);
    };
});