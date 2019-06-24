
var current_conversation;

function display_conv(){
  if(current_conversation.messages){
    current_conversation.messages.forEach(function(msg){
      $("#conversation" ).append(`<p>${msg.text}</p>`);
    });
  }
}

function load_conv(uuid1, uuid2){

/*  current_conversation = {parts: [uuid1, uuid2],
                          messages: [{timestamp:0, text:"Hi"},
                                     {timestamp:1, text:"Hello"}
                                    ]};

  display_conv(current_conversation);
  return;*/

  $.get( `/user_page/load_conv?uuid1=${uuid1}&uuid2=${uuid2}`, function(err,data) {
    if(err){
      $("#conversation" ).append(`<p>-- Error --</p>`);
    }
    else{
      current_conversation = data;
      display_conv(current_conversation);
    }
  });
}


function send_msg(current_user){
  if(current_conversation){
  $.ajax({
    type: "POST",
    url: "/user_page/send_msg",
    data: JSON.stringify({ sender: current_user,
                           parts: current_conversation.parts,
                           msg: $("#msg_txt_box").val()}),
    contentType: "application/json; charset=utf-8",
    dataType: "json"/*,
    success: function(data){alert(data);},
    failure: function(errMsg) {
      alert(errMsg);
    }*/
  });

/*  $.post('/user_page/send_msg',
          current_conversation,
          function(err,data){
            alert($("#msg_txt_box").val());
          });*/
  }
}
