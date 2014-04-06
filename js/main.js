$(document).ready(function () {
    $("#sortable").sortable({
        stop: function (event, ui) {
            alert("New position: " + ui.item.index());
        }
    });
    $("#sortable").disableSelection();
});