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
  res.render('index', {title: 'Express'});
});

router.post('/', function(req, res){

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
                    function(err, data){
                      if(err){
                        log = util.inspect(data);
                        res.render('index', {title: 'Express', log:log})
                      }
                      else{
                        if(data.login_ok){
                          log = '';
                          res.render('user_page', {username: data.email, log:log})
                        }
                        else{
                          log = 'Unsuccessful login';
                          res.render('index', {title: 'Express', log:log})
                        }
                      }
                    });
  }
});

module.exports = router;
