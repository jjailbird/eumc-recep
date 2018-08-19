$(".dial").click(function () {
    var number = $(this).data('number');
    $("#numInfo").val(function() {
        return this.value + number;
    });
});
$('.btn-remove').click(function(){
    $("#numInfo").val(function() {
        $(this).val('');
    });
});
$('.btn-ok').click(function(){
    $("#popup").css("display","block")
});
