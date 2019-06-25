
var current_conversation;

function display_conv(){
  if(current_conversation.messages){
    current_conversation.messages.forEach(function(msg){
      $("#conversation" ).append(`<p>${msg.text}</p>`);
    });
  }
}

function appendError(err){
  $("#conversation" ).append(`<p>-- Error --</p>`);
  if(err){
    $("#conversation" ).append(`<p>${JSON.stringify(err)}</p>`);
  }
}

function load_conv(uuid1, uuid2){

/*  current_conversation = {parts: [uuid1, uuid2],
                          messages: [{timestamp:0, text:"Hi"},
                                     {timestamp:1, text:"Hello"}
                                    ]};

  display_conv(current_conversation);
  return;*/

  $("#conversation").empty();
  $("#conversation").show();
  

  $.get( `/user_page/load_conv?uuid1=${uuid1}&uuid2=${uuid2}`)
       .done(function(response_data){
                  if(response_data.error == false){
                    current_conversation = response_data.data;
                    display_conv(current_conversation);
                  }
                  else{
                    appendError(response_data.data);
                  }
                })
       .fail(function(jqXHR, textStatus, errorThrown) {appendError()});
}


function send_msg(current_user){
  if(current_conversation){
  $.ajax({
    type: "POST",
    url: "/user_page/send_msg",
    data: JSON.stringify({ sender: current_user,
                           parts: current_conversation.parts,
                           text: $("#msg_txt_box").val()}),
    contentType: "application/json; charset=utf-8",
    dataType: "json"})
        .done(function(response_data){
            if(response_data.error == false){
              display_conv(current_conversation);
            }
            else{
              appendError(response_data.data);
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {appendError()});
  
    }
}    
