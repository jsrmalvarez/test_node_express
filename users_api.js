var my_config = require("./my_config");
const UUID = require("uuid/v5");
var AWS = require("aws-sdk");
var SHA1 = require("sha1");
var util = require("util");

const RUNNING_ON_AWS = process.env.RUNNING_ON_AWS ? true : false;

var CHATS_TABLE_NAME;
var USERS_TABLE_NAME;
var USERS_TABLE_EMAIL_INDEX_NAME; 

if(RUNNING_ON_AWS){
  CHATS_TABLE_NAME = process.env.CHATS_TABLE;
  USERS_TABLE_NAME = process.env.USERS_TABLE;
  USERS_TABLE_EMAIL_INDEX_NAME = process.env.USERS_TABLE_EMAIL_INDEX;
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
          "contacts": []
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
      TableName:USERS_TABLE_NAME,
      IndexName:USERS_TABLE_EMAIL_INDEX_NAME, 
      ProjectionExpression: "password, uuid, creation_date"
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email,
      },
      Limit: 1
  };

  docClient.query(params, function(err, data) {
/*        if(err){
          callback(true, 'Error while trying to log in' + '\n' + util.inspect(err) );
        }
        else{
          callback(true, 'Error while trying to log in' + '\n' + util.inspect(data) );
        }*/
      if (err) {
        callback(true, 'Error while trying to log in' + '\n' + util.inspect(err) );
      }
      else {
        var login_ok = false;
        if(Object.getOwnPropertyNames(data).length > 0
          && data.Items
          && data.Items.length > 0
          && data.Items[0].password
          && data.Items[0].uuid
          && data.Items[0].creation_date){
          const hashed_password = data.Items[0].password;
          const creation_date = data.Items[0].creation_date;
          const calculated_hash = SHA1(password + email + creation_date);
          if(calculated_hash ==  hashed_password){
            // Login OK
            var uuid = data.Items[0].uuid;
            callback(false, {login_ok: true, email:email, uuid:uuid});
          }
          else{
            // Login KO
            callback(false, {login_ok: false});
          }
        }
        else{
          // Login KO
          callback(false, {login_ok: false});
        }
      }
  });
}

function find_by_uuid(uuid, callback){

  var params = {
      TableName:USERS_TABLE_NAME,
      Key:{
          "uuid": uuid,
      }
  };

  docClient.get(params, function(err, data) {
      if (err) {
        callback(true, 'Error while finding user' + '\n' + util.inspect(err) );
      }
      else {
        var login_ok = false;
        if(Object.getOwnPropertyNames(data).length > 0
          && data.Item
          && data.Item.email
          && data.Item.uuid
          && data.Item.contacts){
          var uuid = data.Item.uuid;
          var email = data.Item.email;
          var contacts = data.Item.contacts;
          callback(false, {user_found: true,
                           user: {email:email,
                                  uuid:uuid,
                                  contacts:contacts}});
        }
        else{
          callback(false, {user_found: false});
        }
      }
  });
}


function generate_parts_key(uuid1, uuid2){
  var num = 
    uuid1.localeCompare(uuid2, 'us', {numeric:true, caseFirst:false});

  if(num <= 0){
    return uuid1 + '_' + uuid2;
  }
  else{
    return uuid2 + '_' + uuid1;
  }
}

function get_conversation(uuid1, uuid2, callback){

  var parts = [uuid1, uuid2];
  var key = generate_parts_key(uuid1, uuid2);

  var params = {
    TableName:CHATS_TABLE_NAME,
    KeyConditionExpression: "#parts = :parts_key",
    ExpressionAttributeNames:{
      "#parts": "parts",
    },
    ExpressionAttributeValues: {
      ":parts_key": key,
    },
    Limit: 10,
    ScanIndexForward: false    
  };

  docClient.query(params, function(err, data) {
    if (err) {
      callback(true, 'Error fetching conversation.' + '\n' + util.inspect(err) );
    }
    else {
      if(data.Items){
        var messages = [];
        data.Items.forEach(function(item){
          messages.push({timestamp: item.timestamp, text: item.text});
        });
        callback(false, {parts:parts, messages:messages});
      }
      else{
        callback(true, 'Error processing conversation.');
      }
    }
  });
}

function send_message(sender, parts, text, callback){
  const timestamp = new Date().getTime();

/*  
  var error_happened = false;
  var error_msg = '';

  // Update all non-sender parts so they
  // have the sender as contact
  // (sender already knows the other parts)
  // jsrmalvarez: TODO: optimize

  parts.forEach(function(part){
    if(part != sender){

      var update_params = {
          Key: part,
          TableName: USERS_TABLE_NAME,
          UpdateExpression:
            'set #contacts = list_append(if_not_exists(#contacts, :empty_list), :new_contact)',
          ConditionExpression:
            'not contains(#contacts, :new_contact_str)',
          ExpressionAttributeNames: {
            '#contacts': 'contacts'
          },
          ExpressionAttributeValues: {
            ':new_contact': [sender],
            ':new_contact_str': sender,
            ':empty_list': []
          },
      };

      docClient.update(update_params, function(err, data) {
          if (err) {
            error_happened = true;
            error_msg = error_msg + JSON.stringify(err);
            console.log(`-- Update error: ${error_msg}`);
          } 
          else{ 
            console.log("-- Data:");
            console.log(util.inspect(data));
          }
      });
    }
  });
*/

  // Record new message
  var key = generate_parts_key(parts[0], parts[1]);

  var params = {
    TableName: CHATS_TABLE_NAME,
    Item:{
      "parts" : key,
      "timestamp": timestamp,
      "sender" : sender,
      "text" : text
    }
  };


  docClient.put(params, function(err, data) {
    if(err){
      callback(true, data);
    }
    else{
      callback(false, data);
    }
  });
}


module.exports = {
  create_new_user: create_new_user,
  try_login: try_login,
  find_by_uuid : find_by_uuid,
  get_conversation: get_conversation,
  send_message: send_message,
  running_on_aws : RUNNING_ON_AWS
};
