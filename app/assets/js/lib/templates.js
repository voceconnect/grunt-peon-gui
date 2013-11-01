this["guiTmpls"] = this["guiTmpls"] || {};

this["guiTmpls"]["accordian"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 var divID = title.replace(/ /g, ""); ;
__p += '\n<div class="accordion">\n    <div class="accordion-group">\n        <div class="accordion-heading">\n            <a class="accordion-toggle collapsed" data-toggle="collapse" href="#' +
((__t = ( divID )) == null ? '' : __t) +
'">\n                ' +
((__t = ( title )) == null ? '' : __t) +
'\n            </a>\n        </div>\n        <div id="' +
((__t = ( divID )) == null ? '' : __t) +
'" class="accordion-body collapse">\n            <div class="accordion-inner">\n                <pre>' +
((__t = ( content )) == null ? '' : __t) +
'</pre>\n            </div>\n        </div>\n    </div>\n</div>';

}
return __p
};

this["guiTmpls"]["dropdown"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {
__p += '<select id="task-config" class="pull-left">\n    <option>' +
((__t = ( title )) == null ? '' : __t) +
'</option>\n    ';
 _.each(options, function(key) { ;
__p += '\n        <option value="' +
((__t = ( key )) == null ? '' : __t) +
'">' +
((__t = ( key )) == null ? '' : __t) +
'</option>\n    ';
 }); ;
__p += '\n</select>';

}
return __p
};

this["guiTmpls"]["noConfigs"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += ' <p class="text-warning">\n    <em>\n    No configurations set.\n    If needed, you can pass colon delimited arguments below.\n    </em>\n</p>';

}
return __p
};

this["guiTmpls"]["outputLog"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<p>' +
((__t = ( time )) == null ? '' : __t) +
' - ' +
((__t = ( message )) == null ? '' : __t) +
'</p>\n';

}
return __p
};

this["guiTmpls"]["taskInfo"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape;
with (obj) {
__p += '<div class="col-sm-12">\n    <h2>' +
((__t = ( name )) == null ? '' : __t) +
'</h2>\n</div>\n<div class="col-sm-6">\n    <em>Description:</em>\n    <div class="description">\n        ' +
((__t = ( info )) == null ? '' : __t) +
'\n    </div>\n    ' +
((__t = ( example )) == null ? '' : __t) +
'\n</div>\n<div class="col-sm-6">\n    <em>Configurations</em>\n    <div class="configurations">\n        <pre>' +
((__t = ( configurations )) == null ? '' : __t) +
'</pre>\n        ' +
((__t = ( cliArgs )) == null ? '' : __t) +
'\n    </div>\n</div>\n';

}
return __p
};

this["guiTmpls"]["taskList"] = function(obj) {
obj || (obj = {});
var __t, __p = '', __e = _.escape, __j = Array.prototype.join;
function print() { __p += __j.call(arguments, '') }
with (obj) {

 _.each(tasks, function(task) { ;
__p += '\n    <li><a href="#" class="" data-task="' +
((__t = ( task )) == null ? '' : __t) +
'">' +
((__t = ( task )) == null ? '' : __t) +
'</a></li>\n';
 }); ;
__p += '\n';

}
return __p
};