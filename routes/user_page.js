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
router.get('/user_page', function(req, res, next) {
  res.render('user_page', {username: 'you are NOT LOGGED IN'});
});


module.exports = router;
