var my_config = require("./my_config");
const UUID = require("uuid/v5");
var AWS = require("aws-sdk");
var SHA1 = require("sha1");

AWS.config.update({
  region: "eu-west-3",
  endpoint: "http://localhost:8000",
  accessKeyId: 'cacafuti',
  secretAccessKey: 'cacafuti'
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = "Users";

if(process.argv.length < 4){
  console.log("Username and password needed");
  process.exit(1);
}

var username = process.argv[2];
var password = process.argv[3];
var creation_date = new Date().getTime();
var uuid = UUID(username + '@' + my_config.DOMAIN, UUID.DNS);
password = SHA1(password + username + creation_date);

var params = {
    TableName:table,
    Item:{
        "username": username,
        "password": password,
        "uuid": uuid,
        "creation_date": creation_date,
        "chats": []
    },
    ConditionExpression: "attribute_not_exists(username)"
};

console.log("Adding a new item...");
docClient.put(params, function(err, data) {
    if (err) {
        if(err.code == "ConditionalCheckFailedException"){
          console.error(`User ${username} already exists.`);
        }
        console.error("Unable to add item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Added item:", JSON.stringify(params.Item, null, 2));
    }
});
