/*global window, jQuery */
jQuery(document).ready(function ($) {
    "use strict";
    function resizeEls() {
        var newHeight = window.innerHeight - $('#top-toolbar').outerHeight();
        $('.height100').height(newHeight - 20);
    }
    resizeEls();
    window.onresize = function (e) {
        resizeEls();
    };
});