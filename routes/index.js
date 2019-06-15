const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const my_config = require("../my_config");
const users_api = require("../users_api");
const util = require('util');
const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;


passport.use(new LocalStrategy(
  function(username, password, done) {
    /*User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user || !user.validPassword(password)){
        return done(null, false, { message: 'Login unsuccessful' });
      }
      return done(null, user);
    });*/
    return done(null, {username: username});
  }
));

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

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


router.post('/', function(req, res, next){

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
    passport.authenticate('local', { successRedirect: `/user_page?username=${req.body.password}`,
                                   failureRedirect: '/',
                                   failureFlash: true})(req, res, next);
/*    users_api.try_login(req.body.username,
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
                    });*/
  }
});

module.exports = router;
