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
                             contacts: req.user.chats});
  }
  else{
    //res.render('user_page', {username: 'you are NOT LOGGED IN'});
    res.redirect('/');
  }
});

router.get('/load_conv', function(req, res, next){
  console.log(util.inspect(req));
  res.send('blah');
});

router.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


module.exports = router;
