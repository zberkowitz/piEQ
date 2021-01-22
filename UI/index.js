var osc = require('osc')

const express = require('express')
const app = express()
const port = 80
const http = require('http').createServer(app);

var fs = require('fs')

var bodyParser = require('body-parser')

var io = require('socket.io')(http)

app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use(express.static(__dirname + '/public'))

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

//format and send control data over OSC to audio engine
function sendToAudioServer(filter, param, value){
	var address = "/" + filter + "/" + param;
	udpPort.send({
		address: address,
		args: [
			{
				type: "f",
				value: value
			}
		]
	}, "localhost", 57120);
}


//save current state to file
app.post('/savecurrentstate', function (req, res){
	var body = JSON.stringify(req.body);
	fs.writeFile('currentstate/currentstate.json', body, function (err){
		if (err) return console.log(err);
		res.end();
	});
});

//save a preset to a file
app.post('/savepreset', function (req, res){
	var body = JSON.stringify(req.body);
	var filepath = "presets/" + req.body.name + ".json";
	fs.writeFile(filepath, body, function (err){
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

//get list of all presets and send back to client, stripping out ".json" from file name
app.get('/listpresets', function (req, res){
	var dir = "presets";
	if (!fs.existsSync(dir)){ //make presets directory if it doesn't exist (otherwise returns error)
		fs.mkdirSync(dir);
	}
	fs.readdir('presets/', (err, files) => {
		for (var i = 0; i < files.length; i++){
			files[i] = files[i].substring(0, files[i].length - 5);
		}
		res.send(files);
	});
});

//read the current state file and send back to client
app.get('/loadcurrentstate', function (req, res){
	var filepath = "currentstate/currentstate.json"
	fs.readFile (filepath, (err, data) => {
		if (err) return console.log(err);
		res.send(data);
	});
});

//Socket.io connection for real-time controls
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('control', (data) => {
	//console.log (data);
	sendToAudioServer(data.filter, data.param, data.value);
  });
});
		