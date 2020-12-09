var osc = require('osc')

const express = require('express')
const app = express()
const port = 80

var fs = require('fs')

var bodyParser = require('body-parser')

app.use(express.static('public'))

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.listen(port, () => {
  console.log(`piEQ listening at http://localhost:${port}`)
})

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 3001,
    metadata: true
});

udpPort.open();

//format and send control data over OSC to Pd
function sendToPD(filter, param, value){
	var address = "/" + filter + "/" + param;
	udpPort.send({
		address: address,
		args: [
			{
				type: "f",
				value: value
			}
		]
	}, "localhost", 3000);
}

//handle control data from web UI
app.post('/control', function (req, res){
	//console.log("gotit");
	console.log(req.body);
	sendToPD(req.body.filter, req.body.param, req.body.value);
	res.end();
})

app.post('/preset', function (req, res){
	var body = JSON.stringify(req.body);
	fs.writeFile('presets/currentstate.json', body, function (err){
		if (err) return console.log(err);
		res.end();
	});
});
		