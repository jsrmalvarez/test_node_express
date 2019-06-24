var express = require("express");
var router = express.Router();
var AWS = require("aws-sdk");
var my_config = require("../my_config");
var users_api = require("../users_api");
var util = require('util');


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
  if(req.user){
    res.render('user_page', {username: req.user.email,
                             uuid: req.user.uuid,
                             contacts: req.user.contacts});
  }
  else{
    //res.render('user_page', {username: 'you are NOT LOGGED IN'});
    res.redirect('/');
  }
});

router.get('/load_conv', function(req, res, next){
  users_api.get_conversation(req.query.uuid1,
                             req.query.uuid2,
                             req.query.timestamp,
                             function(err, data){
                               res.send({error:err, data:data});
                             });
  
});

router.post('/send_msg', function(req, res, next){
  if(req.body.msg && req.body.parts){
    var parts = req.body.parts;
    var sender = req.body.sender;
    var msg = req.body.msg;

    users_api.send_message(sender_idx, parts, msg,
                           function(err,data){
                             res.send({error:err, data:data});
                           });
  }
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


module.exports = router;
