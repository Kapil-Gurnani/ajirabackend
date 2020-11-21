var express = require('express');
var router = express.Router();
const url = require('url');

let network = {};

router.post('/check', function(req, res, next) {
  res.send(network);
});
/* GET users listing. */
router.post('/', function(req, res, next) {
  let data = req.body.split('\r\n');
  let commandText = data[0].split(' ');
  let command = commandText[0];
  let text = commandText[1];
  
  switch(command){
    case "CREATE":
      try{
        let jsonData = JSON.parse(data[3]);
        if(text == "/devices"){
          let type = {"COMPUTER":true,"REPEATER":true};
          if(type[jsonData.type] == undefined) res.status(400).json({"msg": `type '${jsonData.type}' is not supported`});
          else if(network[jsonData.name] != undefined) res.status(400).json({"msg": `Device '${jsonData.name}' already exists`});
          else{
            network[jsonData.name] = jsonData;
            network[jsonData.name].strength = 5;
            res.status(200).json({"msg": `Successfully added ${jsonData.name}`});
          }
        }else if(text == "/connections"){
          if(network[jsonData.source] == undefined){
            res.status(400).json({"msg": `"Node '${jsonData.source}' not found`});
          }else if(!jsonData.source || !jsonData.targets){
            res.status(400).json({"msg": "Invalid command syntax"});
          }else if(jsonData.source == jsonData.targets[0]){
            res.status(400).json({"msg": "Cannot connect device to itself"});
          }else if(jsonData.source == jsonData.targets[0]){
            res.status(400).json({"msg": "Devices are already connected"});
          }else {
            if(!network[jsonData.source].targets) network[jsonData.source].targets = [];
            network[jsonData.source].targets = network[jsonData.source].targets.concat(jsonData.targets);
            if(network[jsonData.source].type == "REPEATER"){
              if(!network[jsonData.source].source) network[jsonData.source].source = [];
              network[jsonData.source].source = network[jsonData.source].source.concat(jsonData.targets);
            }
            jsonData.targets.forEach(target => {
              console.log(target);
              if(!network[target].source) network[target].source = [];
              network[target].source = network[target].source.concat(jsonData.source);

              if(network[jsonData.source].type == "REPEATER"){
                if(!network[target].targets) network[target].targets = [];
                network[target].targets = network[target].targets.concat(jsonData.source);
              }
            });
            res.status(200).json({"msg": `Successfully connected`});
          }
        }else{

        }
      }catch(error){
        res.status(400).json({"msg": "Invalid Command."+error});
      }
      break;
    case "FETCH":
      if(text == "/devices"){
        let devices = [];
        Object.keys(network).forEach(net=>{
            devices.push({type:network[net].type, name:network[net].name});
        });
        res.status(200).json({"devices": devices});
      }else if(url.parse(text,true).pathname == "/info-routes"){
        let query = url.parse(text,true).query;
        if(!query.from || !query.to){
          res.status(400).json({"msg": "Invalid Request"});
        }else if(!network[query.to].source){
          res.status(404).json({"msg": "Route not found"});
        }else if(network[query.from].type == "REPEATER" || network[query.to].type == "REPEATER"){
          res.status(400).json({"msg": "Route cannot be calculated with repeater"});
        }else if(!network[query.from]){
          res.status(400).json({"msg": `Node '${network[query.from]}' not found`});
        }else if(!network[query.to]){
          res.status(400).json({"msg": `Node '${network[query.to]}' not found`});
        }else{
          findPath(query);
        }
        res.json(network);
      }else{
        
      }
      break;
    case "MODIFY":
      let jsonData = JSON.parse(data[3]);
      if(text.split("/")[1] == "devices"){
        if(network[text.split("/")[2]] == undefined){
          res.status(404).json( {"msg": "Device Not Found"});
        }else if(!Number(jsonData.value)){
          res.status(400).json( {"msg": "value should be an integer"});
        }else{
          network[text.split("/")[2]].strength = jsonData.value;
          res.status(200).json( {"msg": "Successfully defined strength"});
        }
      }
      break;
    default:
  }
});

module.exports = router;
