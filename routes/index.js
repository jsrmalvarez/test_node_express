const express = require("express");
const router = express.Router();
const AWS = require("aws-sdk");
const my_config = require("../my_config");
const users_api = require("../users_api");
const util = require('util');
const passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

var withoutdb = false;

passport.use(new LocalStrategy(
  function(username, password, done) {
    if(withoutdb){
      done(null, {email:username, uuid:25});
    }
    else{
    users_api.try_login(username, password,
      function(err, data){
        if(err){
          //log = util.inspect(data);
          //res.render('index', {title: 'Express', log:log})
          return done(err);
        }
        else{
          if(data.login_ok){
            //log = '';
            //res.render('user_page', {username: data.email, log:log})
            return done(null, {email:data.email, uuid:data.uuid});
          }
          else{
            //log = 'Unsuccessful login';
            //res.render('index', {title: 'Express', log:log})
            return done(null, false, { message: 'Login unsuccessful' });
          }
        }
      });
    }
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.uuid);
});

passport.deserializeUser(function(uuid, done) {
  if(withoutdb){
    done(null, {email:'alice@bla.com', uuid:25});
  }
  else{
    users_api.find_by_uuid(uuid, function(err, data){
      if(err){
        done(err);
      }
      else{
        if(data.user_found){
            done(null, data.user);
        }
        else{
          done('dserror');
        }
      }
    });
  }
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
    passport.authenticate('local', {successRedirect: `/user_page`,
                                   failureRedirect: '/',
                                   failureFlash: false}/*,
                                     function(user, info){
                                     req.logIn(info.user, function(err){
                                       if(err){return next(err);}
                                       else{
                                         return res.redirect(`/user_page?username=${info.user.email}&uuid=${info.user.uuid}`);

                                       }
                                     });
                                      }*/)(req, res, next);
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
