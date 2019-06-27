
var current_conversation;

function prepend_conv_msg(msg){
  $("#conversation" ).prepend(`<p>${msg.text}</p>`);
}

function append_conv_msg(msg){
  $("#conversation" ).append(`<p>${msg.text}</p>`);
}

function display_conv(conv){
  $("#conversation").empty();
  if(conv.messages){
    conv.messages.forEach(function(msg){
      prepend_conv_msg(msg);
    });
  }
  $("#conversation").show();
}

function display_error(err){
  $("#conversation").empty();
  $("#conversation" ).append(`<p>-- Error --</p>`);
  if(err){
    $("#conversation" ).append(`<p>${JSON.stringify(err)}</p>`);
  }
  $("#conversation").show();
}

function load_conv(uuid1, uuid2){

/*  current_conversation = {parts: [uuid1, uuid2],
                          messages: [{timestamp:0, text:"Hi"},
                                     {timestamp:1, text:"Hello"}
                                    ]};

  display_conv(current_conversation);
  return;*/

  

  $.get( `/user_page/load_conv?uuid1=${uuid1}&uuid2=${uuid2}`)
       .done(function(response_data){
                  if(response_data.error == false){
                    current_conversation = response_data.data;
                    display_conv(current_conversation);
                  }
                  else{
                    display_error(response_data.data);
                  }
                })
       .fail(function(jqXHR, textStatus, errorThrown) {display_error()});

}


function send_msg(current_user){
  if(current_conversation){
    var new_msg = { sender: current_user,
                           parts: current_conversation.parts,
                           text: $("#msg_txt_box").val()}
    $.ajax({
      type: "POST",
      url: "/user_page/send_msg",
      data: JSON.stringify(new_msg),
      contentType: "application/json; charset=utf-8",
      dataType: "json"})
          .done(function(response_data){
              if(response_data.error == false){
                display_conv(current_conversation);
                append_conv_msg(new_msg);
              }
              else{
                display_error(response_data.data);
              }
          })
          .fail(function(jqXHR, textStatus, errorThrown) {display_error()});
  
  }
}    
