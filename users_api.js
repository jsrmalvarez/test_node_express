var my_config = require("./my_config");
const UUID = require("uuid/v5");
var AWS = require("aws-sdk");
var SHA1 = require("sha1");

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
var docClient = new AWS.DynamoDB.DocumentClient();

//var table = "Users";

/*if(process.argv.length < 4){
  console.log("Username and password needed");
  process.exit(1);
}

var username = process.argv[2];
var password = process.argv[3];
*/


function create_new_user(email, password, callback){
  var creation_date = new Date().getTime();
  var uuid = UUID(email + '@' + my_config.DOMAIN, UUID.DNS);
  password = SHA1(password + email + creation_date);

  var params = {
      TableName:USERS_TABLE_NAME,
      Item:{
          "email": email,
          "password": password,
          "uuid": uuid,
          "creation_date": creation_date,
          "chats": []
      },
      ConditionExpression: "attribute_not_exists(email)"
  };

  docClient.put(params, function(err, data) {
      if (err) {
          if(err.code == "ConditionalCheckFailedException"){
            callback(true, `User ${email} already exists.`);
          }
          else{
            callback(true, `Unable to add user.`);
          }
      }
      else {
        callback(false, `User ${email} sucessfully created.`);
      }
  });
}

function try_login(email, password, callback){

  var params = {
      TableName:"Users",
      Key:{
          "email": email
      }
  };

  docClient.get(params, function(err, data) {
      if (err) {
        callback(true, 'Error while trying to log in');
      } else {
        var login_ok = false;
        if(Object.getOwnPropertyNames(data).length > 0
          && data.Item
          && data.Item.password
          && data.Item.creation_date){
          const hashed_password = data.Item.password;
          const creation_date = data.Item.creation_date;
          const calculated_hash = SHA1(password + email + creation_date);
          if(calculated_hash ==  hashed_password){
            login_ok = true;
          }
        }

        if(login_ok){
          callback(false, 'Successful login.') ;
        }
        else{
          callback(false, 'Unsuccessful login.') ;
        }
      }
  });
}

module.exports = {
  create_new_user: create_new_user,
  try_login: try_login
};
