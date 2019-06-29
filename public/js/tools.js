
var current_conversation;
var current_user;

function init_user_state(uuid){
  current_user = uuid;
  check_for_new_messages();
}

function prepend_conv_msg(message_obj){
  $("#conversation" ).prepend(`<p>${message_obj.msg.text}</p>`);
}

function append_conv_msg(message_obj){
  $("#conversation" ).append(`<p>${message_obj.msg.text}</p>`);
}

function display_conv(conv){
  $("#conversation").empty();
  if(conv.messages){
    conv.messages.forEach(function(message_obj){
      prepend_conv_msg(message_obj);
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


function send_msg(){
  if(current_conversation){
    var new_msg = { sender: current_user,
                           parts: current_conversation.parts,
                           msg: {text: $("#msg_txt_box").val()}}
    $.ajax({
      type: "POST",
      url: "/user_page/send_msg",
      data: JSON.stringify(new_msg),
      contentType: "application/json; charset=utf-8",
      dataType: "json"})
          .done(function(response_data){
              if(response_data.error == false){
                append_conv_msg(new_msg);
              }
              else{
                display_error(response_data.data);
              }
          })
          .fail(function(jqXHR, textStatus, errorThrown) {display_error()});
  
  }
}    

function process_new_messages(new_messages){
  var count = new_messages.count;
  var map = new_messages.map;
  var more = new_messages.more;

  if(count > 0){
    $('#new_messages_notification').text(`You have ${more ? many : count} new messages`);
  }
  else{
    $('#new_messages_notification').text(`You have no new messages`);
  }
}

function check_for_new_messages(){
  $.ajax({
    type: 'POST',
    url: 'user_page/check_for_new_messages',
    data: JSON.stringify({uuid:current_user}),
    contentType: "application/json; charset=utf-8",
    dataType: 'json'})
          .done(function(response_data){
              if(response_data.error == false){
                process_new_messages(response_data.data);
              }
              setTimeout(check_for_new_messages, 10000);
          })
          .fail(function(jqXHR, textStatus, errorThrown) {display_error()});
          
}
