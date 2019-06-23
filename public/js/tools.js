
function load_conv(uuid1, uuid2){
  $.get( `/user_page/load_conv?uuid1=${uuid1}&uuid2=${uuid2}`, function( data ) {
    $( ".result" ).html( data );
    alert( `load_conv?uuid1=${uuid1}&uuid2=${uuid2} ${data}` );
  });
}
