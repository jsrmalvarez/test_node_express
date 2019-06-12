var express = require("express");
var router = express.Router();
var AWS = require("aws-sdk");
var my_config = require("../my_config");
var users_api = require("../users_api");


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

/*  var log = "";
  var chats_item_count = -1;
  var users_item_count = -1;

  update_log(log, false, {running_on_aws: RUNNING_ON_AWS});
  update_log(log, false, {chats_table_name : CHATS_TABLE_NAME});
  update_log(log, false, {users_table_name : USERS_TABLE_NAME});


  describe_table(dynamodb, CHATS_TABLE_NAME,
      function(err, data){
        if(err){
          log = log + `DBG: Error: ${JSON.stringify(err, null, 2)}\n`
        }
        else{
          chats_item_count = data.Table.ItemCount;
          describe_table(dynamodb, USERS_TABLE_NAME,
              function(err, data){
                if(err){
                  log = log + `DBG: Error: ${JSON.stringify(err, null, 2)}\n`
                }
                else{
                  users_item_count = data.Table.ItemCount;
                  res.render('index', { title: 'Express',
                                        chats: chats_item_count,
                                        users: users_item_count,
                                        log:log});
                }
              });
        }
      });*/
      res.render('index', {title: 'Express'});

});

router.post('/', function(req, res){
  /*var log = "";
  log = log + `DBG OK: ${JSON.stringify(req.body.username, null, 2)}\n`;
  log = log + `DBG OK: ${JSON.stringify(req.body.password, null, 2)}\n`;
  res.render('index', { title: 'Express',
                        chats: 'unknown',
                        users: 'unknown',
                        log:log});
  */

  var log = "";
  if(req.body.new_user){
    users_api.create_new_user(req.body.username,
                    req.body.password,
                    function(err, msg){
                      if(err){
                        log = msg;
                      }
                      else{
                        log = msg;
                      }
                      res.render('index', {title: 'Express', log:log})
                    });
  }
  else if(req.body.login){
    users_api.try_login(req.body.username,
                    req.body.password,
                    function(err, msg){
                      if(err){
                        log = msg;
                      }
                      else{
                        log = msg;
                      }
                      res.render('index', {title: 'Express', log:log})
                    });
  }
});

module.exports = router;
