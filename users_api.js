var my_config = require("./my_config");
const UUID = require("uuid/v5");
var AWS = require("aws-sdk");
var SHA1 = require("sha1");
var util = require("util");
const crypto = require('crypto');

const RUNNING_ON_AWS = process.env.RUNNING_ON_AWS ? true : false;

var MESSAGES_TABLE_NAME;
var MESSAGES_TABLE_RECEIVER_INDEX;
var USERS_TABLE_NAME;
var USERS_TABLE_EMAIL_INDEX_NAME; 

if(RUNNING_ON_AWS){
  MESSAGES_TABLE_NAME = process.env.MESSAGES_TABLE;
  MESSAGES_TABLE_RECEIVER_INDEX = process.env.MESSAGES_TABLE_RECEIVER_INDEX;
  USERS_TABLE_NAME = process.env.USERS_TABLE;
  USERS_TABLE_EMAIL_INDEX_NAME = process.env.USERS_TABLE_EMAIL_INDEX;
}
else{
  MESSAGES_TABLE_NAME = "Messages";
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

function find_by_uuid(uuid, options, callback){
  if(typeof callback === 'undefined'){
    callback = options;
    options = {include_contacts: false};
  }

  var params = {
      TableName:USERS_TABLE_NAME,
      Key:{
          "uuid": uuid
      }
  };

  if(options.include_contacts){
      params.ProjectionExpression = 'email,contacts';
  }
  else{
      params.ProjectionExpression = 'email';
  }

  docClient.get(params, function(err, data) {
      if (err) {
        callback(true, 'Error while finding user' + '\n' + util.inspect(err) );
      }
      else {
        var login_ok = false;
        if(Object.getOwnPropertyNames(data).length > 0
          && data.Item
          && data.Item.email
          && data.Item.contacts){
          var email = data.Item.email;
          var contacts = data.Item.contacts;
          var user;
          if(options.include_contacts){
            user = {email:email,
                    uuid:uuid,
                    contacts:contacts}
          }
          else{
            user = {email:email,
                    uuid:uuid}
          }
          callback(false, {user_found: true,
                           user: user});
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
    return crypto.createHash('sha256').update(uuid1 + '_' + uuid2).digest("base64");
  }
  else{
    return crypto.createHash('sha256').update(uuid2 + '_' + uuid1).digest("base64");
  }
}

function get_conversation(uuid1, uuid2, callback){

  var parts = [uuid1, uuid2];
  var key = generate_parts_key(uuid1, uuid2);

  var params = {
    TableName:MESSAGES_TABLE_NAME,
    KeyConditionExpression: "#uuid= :parts_key",
    ExpressionAttributeNames:{
      "#uuid": "uuid",
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
          messages.push({timestamp: item.timestamp,
                         sender: item.sender,
                         receiver: item.receiver,
                         msg: item.msg});
        });
        callback(false, {parts:parts, messages:messages});
      }
      else{
        callback(true, 'Error processing conversation.');
      }
    }
  });
}

function send_message(sender, parts, msg, callback){
  const timestamp = new Date().getTime();

  // Record new message
  var key = generate_parts_key(parts[0], parts[1]);
  var receiver = parts[0] == sender ? parts[1] : parts[0];

  if(msg.text){
    var text = msg.text;

    var params = {
      TableName: MESSAGES_TABLE_NAME,
      Item:{
        "uuid" : key,
        "timestamp": timestamp,
        "sender" : sender,
        "receiver": receiver,
        "receiver_ack": 0,
        "msg": {"text" : text}
      }
    };


    docClient.put(params, function(err, data) {
      if(err){
        callback(true, err);
      }
      else{
        callback(false, data);
      }
    });
  }
  else{
    callback(true);
  }
}

function check_for_new_messages(receiver_uuid, callback){

  const MESSAGE_LIMIT = 25;

  var params = {
      TableName:MESSAGES_TABLE_NAME,
      IndexName:MESSAGES_TABLE_RECEIVER_INDEX,
      KeyConditionExpression: 'receiver = :receiver and receiver_ack = :receiver_ack',
      ExpressionAttributeValues: {
        ':receiver': receiver_uuid,
        ':receiver_ack': 0
      },
      Limit: MESSAGE_LIMIT + 1
  };

  docClient.query(params, function(err, data) {
      if (err) {
        callback(true, 'Error while checking for msgs' + '\n' + util.inspect(err) );
      }
      else {
        if(data.Items){
          var map = {};
          var count = data.Items.length;
          var more = count > MESSAGE_LIMIT ? true : false;

          if(more){
            // Discard last one
            data.Items.pop();
          }

          data.Items.forEach(function(item){
            if(map[item.sender]){
              map[item.sender]++;
            }
            else{
              map[item.sender] = 1;
            }
          });

          callback(false, {count:count, more:more , map:map});
        }
        else{
          callback(true, 'Error while checking for msgs.');
        }
      }
  });
}


function add_contact(uuid, contact, callback){


  var params = {
    TableName: USERS_TABLE_NAME,
    Key:{
      "uuid" : uuid,
    },
    UpdateExpression: 'set contacts = list_append(contacts, :new_contact_set)',
    ConditionExpression: 'not contains(contacts, :new_contact)',
    ExpressionAttributeValues: {
      ':new_contact' : contact,
      ':new_contact_set' : [contact]
    }
  };


  docClient.update(params, function(err, data) {
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
  running_on_aws : RUNNING_ON_AWS,
  check_for_new_messages: check_for_new_messages,
  add_contact: add_contact
};
