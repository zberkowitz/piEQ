var osc = require('osc')

const express = require('express')
const app = express()
const port = 80
const http = require('http').createServer(app);

var fs = require('fs')

var bodyParser = require('body-parser')

var io = require('socket.io')(http)

app.use(express.static('public'))

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

http.listen(port, () => {
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


//save current state to file
app.post('/savecurrentstate', function (req, res){
	var body = JSON.stringify(req.body);
	fs.writeFile('presets/currentstate/currentstate.json', body, function (err){
		if (err) return console.log(err);
		res.end();
	});
});

//read a preset file and send back to client
app.post('/loadpreset', function (req, res){
	var filepath = "presets/" + req.body.preset + ".json";
	//console.log (req.body);
	fs.readFile (filepath, (err, data) => {
		if (err) return console.log(err);
		res.send(data);
	});
});

//read the current state file and send back to client
app.get('/loadcurrentstate', function (req, res){
	var filepath = "presets/currentstate/currentstate.json"
	fs.readFile (filepath, (err, data) => {
		if (err) return console.log(err);
		res.send(data);
	});
});

//Socket.io connection for real-time controls
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('control', (data) => {
	console.log (data);
	sendToPD(data.filter, data.param, data.value);
  });
});
		