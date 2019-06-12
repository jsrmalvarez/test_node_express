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


function create_new_user(username, password, callback){
  var creation_date = new Date().getTime();
  var uuid = UUID(username + '@' + my_config.DOMAIN, UUID.DNS);
  password = SHA1(password + username + creation_date);

  var params = {
      TableName:USERS_TABLE_NAME,
      Item:{
          "username": username,
          "password": password,
          "uuid": uuid,
          "creation_date": creation_date,
          "chats": []
      },
      ConditionExpression: "attribute_not_exists(username)"
  };

  docClient.put(params, function(err, data) {
      if (err) {
          if(err.code == "ConditionalCheckFailedException"){
            callback(true, `User ${username} already exists.`);
          }
          else{
            callback(true, `Unable to add user.`);
          }
      }
      else {
        callback(false, `User ${username} sucessfully created.`);
      }
  });
}

module.exports = {
  create_new_user: create_new_user
};
