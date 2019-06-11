var express = require('express');
var router = express.Router();
var AWS = require("aws-sdk");

const RUNNING_ON_AWS = process.env.RUNNING_ON_AWS ? true : false;

var CHATS_TABLE_NAME;
var USERS_TABLE_NAME;

if(RUNNING_ON_AWS){
  CHATS_TABLE_NAME = process.env.CHATS_TABLE;
  USERS_TABLE_NAME = process.env.USERS_TABLE;
}
else{
  CHATS_TABLE_NAME = "Chats";
  USERS_TABLE_NAME = "Users";
}


if(RUNNING_ON_AWS){
  AWS.config.update({
    region: "eu-west-3",
  });
}
else{
  AWS.config.update({
    region: "eu-west-3",
    endpoint: "http://localhost:8000",
    accessKeyId: 'cacafuti',
    secretAccessKey: 'cacafuti'
  });
}

var dynamodb = new AWS.DynamoDB();

function update_log(log, err, data){
  if(err){ 
   log = log + `DBG: Error: ${JSON.stringify(err, null, 2)}\n`
  }
  else{
   log = log + `DBG OK: ${JSON.stringify(data, null, 2)}\n`
  }
}


function describe_table(db, table_name, callback){
    db.describeTable({TableName:table_name}, callback);
}


/* GET home page. */
router.get('/', function(req, res, next) {

  var log = "";
  var chats_item_count = -1;
  var users_item_count = -1;

  update_log(log, false, {running_on_aws: RUNNING_ON_AWS});
  update_log(log, false, {chats_table_name : CHATS_TABLE_NAME});
  update_log(log, false, {users_table_name : USERS_TABLE_NAME});


  describe_table(dynamodb, CHATS_TABLE_NAME,
      function(err, data){
        if(err){
          update_log(log, err, data);
        }
        else{
          chats_item_count = data.Table.ItemCount;
          describe_table(dynamodb, USERS_TABLE_NAME,
              function(err, data){
                if(err){
                  update_log(log, err, data);
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
      });

});

router.post('/', function(req, res){
  var log = "";
  update_log(log, false, req.body.username);
  update_log(log, false, req.body.password);
  res.render('index', { title: 'Express',
                        chats: 'unknown',
                        users: 'unknown',
                        log:log});
});

module.exports = router;
