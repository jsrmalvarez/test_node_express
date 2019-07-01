var express = require("express");
var router = express.Router();
var AWS = require("aws-sdk");
var my_config = require("../my_config");
var users_api = require("../users_api");
var util = require('util');

var withoutdb = !users_api.running_on_aws;

function update_log(log, err, data){
  if(err){ 
   log = log + `DBG: Error: ${JSON.stringify(err, null, 2)}\n`
  }
  else{
   log = log + `DBG OK: ${JSON.stringify(data, null, 2)}\n`
  }
}


/*function describe_table(db, table_name, callback){
    db.describeTable({TableName:table_name}, callback);
}*/


/* GET home page. */
router.get('/', function(req, res, next) {
  if(  req.user
    && req.user.email
    && req.user.uuid
    && req.user.contacts){
    res.render('user_page', {username: req.user.email,
                             uuid: req.user.uuid,
                             contacts: req.user.contacts,
                             contacts_str: JSON.stringify(req.user.contacts)});
  }
  else{
    //res.render('user_page', {username: 'you are NOT LOGGED IN'});
    res.redirect('/');
  }
});

router.get('/load_conv', function(req, res, next){
  if(withoutdb){
    var msg1 = {timestamp:42, msg:{text:'Ladies and gentlemen of the jury exZIPIT A'}};
    var msg2 = {timestamp:42, msg:{text:'Sex at noon taxes'}};
    var messages = [msg1, msg2];
    var data = {parts:[req.query.uuid1, req.query.uuid2], messages:messages};
    res.send({error:false, data:data});
  }
  else{
  users_api.get_conversation(req.query.uuid1,
                             req.query.uuid2,
                             function(err, data){
                               res.send({error:err, data:data});
                             });
  }
  
});

router.post('/send_msg', function(req, res, next){

  if(   req.body.sender
     && req.body.parts
     && req.body.text){
    var parts = req.body.parts;
    var sender = req.body.sender;
    var text = req.body.text;

    users_api.send_message(sender, parts, text,
                           function(err,data){
                             res.send({error:err, data:data});
                           });
  }

  
});

router.post('/check_for_new_messages', function(req, res, next){
  if(req.body.uuid){
    var uuid = req.body.uuid;

    users_api.check_for_new_messages(uuid,
                           function(err,data){
                             res.send({error:err, data:data});
                           });
  }

  
});

router.post('/find_by_uuid', function(req, res, next){
  if(req.body.uuid){
    var uuid = req.body.uuid;

    users_api.find_by_uuid(uuid, function(err, data){
          if(err){
            res.send({error:true});
          }
          else{
            if(data.user_found){
              res.send({error:false, data:{user_found:true,
                                           user:{ uuid: data.user.uuid,
                                                 email: data.user.email}}});
            }
            else{
              res.send({error:false, data:{user_found:false}});
            }
          }
        });
  }
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


module.exports = router;
