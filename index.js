const osc = require('osc');

const express = require('express');
const app = express();
const port = 3000;
const http = require('http').createServer(app);

const fs = require('fs');
const glob = require('glob');
const path = require('path');

const bodyParser = require('body-parser');

const io = require('socket.io')(http);

const { spawn } = require('child_process');

app.use('/scripts', express.static(__dirname + '/node_modules/'));
app.use(express.static(__dirname + '/public'))

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

http.listen(port, () => {
  console.log(`piEQ Active! Adjust settings at http://localhost:${port}`)
});

var udpPort = new osc.UDPPort({
    localAddress: "0.0.0.0",
    localPort: 3001,
    metadata: true
});

udpPort.on("message", function(oscMsg, timeTag, info){
	if (oscMsg.address == '/loadstate'){
		currentStateOnload();
	}
	else if (oscMsg.address == '/exit'){
		process.exit();
	}
});

udpPort.open();

//create directories for current states and presets
var currentStateDir = "C:/ProgramData/piEQ/currentstate";
var presetDir = "C:/ProgramData/piEQ/presets";

if (!fs.existsSync("C:/ProgramData/piEQ")){
	fs.mkdirSync("C:/ProgramData/piEQ");
}

if (!fs.existsSync(currentStateDir)){
	fs.mkdirSync(currentStateDir);
}

if (!fs.existsSync(presetDir)){
	fs.mkdirSync(presetDir);
}

//Load SuperCollider 
var scCode = String.raw`
(

Server.killAll; //start by cleaning up any other servers just in case
//Server options for Windows

~nodeAddress = NetAddr.new("127.0.0.1", 3001);

~arguments = thisProcess.argv;
~arguments.do({arg item, i;
	switch(item,
		"/i", {
			Server.default.options.inDevice = ~arguments[i+1];
		},
		"/o", {
			Server.default.options.outDevice = ~arguments[i+1];
		},
		"/l", {
			"Input Devices:".postln;
			ServerOptions.inDevices.do({arg item, i;
				item.postln;
			});
			"".postln;
			"Output Devices:".postln;
			ServerOptions.outDevices.do({arg item, i;
				item.postln;
			});
			Server.killAll;
			~nodeAddress.sendMsg('/exit');
			0.exit;
		}
	);
});

//Server.default.options.inDevice = "Windows WASAPI : Line 1";
//Server.default.options.outDevice = "Windows WASAPI : Headphones";
//Server.default.options.sampleRate = 48000;
//Server.default.options.hardwareBufferSize = 128;
//Server.killAll;

s.waitForBoot({
	// create busses

	~filterCount = 10;

	~audioBusses = Array.newClear(~filterCount + 1); //one for each filter plus output
	~audioBusses.do ({arg item, i; ~audioBusses[i] = Bus.audio(s, 2)});

	~gainBusses = Array.newClear(~filterCount);
	~gainBusses.do ({arg item, i; ~gainBusses[i] = Bus.control(s); ~gainBusses[i].set(0)});

	~tenBandFreqs = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

	~freqBusses = Array.newClear(~filterCount);
	~freqBusses.do ({arg item, i; ~freqBusses[i] = Bus.control(s); ~freqBusses[i].set(~tenBandFreqs[i])});

	~qBusses = Array.newClear(~filterCount);
	~qBusses.do ({arg item, i; ~qBusses[i] = Bus.control(s); ~qBusses[i].set(1.41)});

	~preGain = 0;

	~pgBus = Bus.control(s);
	~pgBus.set(~preGain);


	//create OSC receivers
	~gainReceivers = Array.newClear(~filterCount);
	~gainReceivers.do({arg item, i;
		var address = '/f' ++ i ++ '/gain';
		~gainReceivers[i] = OSCFunc.newMatching({ arg msg, time, addr, recvPort;
			~gainBusses[i].set(msg[1]);
		}, address);
	});

	~freqReceivers = Array.newClear(~filterCount);
	~freqReceivers.do({arg item, i;
		var address = '/f' ++ i ++ '/freq';
		~freqReceivers[i] = OSCFunc.newMatching({ arg msg, time, addr, recvPort;
			~freqBusses[i].set(msg[1]);
		}, address);
	});

	~qReceivers = Array.newClear(~filterCount);
	~qReceivers.do({arg item, i;
		var address = '/f' ++ i ++ '/q';
		~qReceivers[i] = OSCFunc.newMatching({ arg msg, time, addr, recvPort;
			~qBusses[i].set(msg[1]);
		}, address);
	});

	~preGainReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		~preGain = msg[1];
		~pgBus.set(~preGain);
	},'/pg/gain');

	~f0TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		switch (msg[1],
			0.0, {
				~filterBank[0] = Synth.replace(~filterBank[0], \peakFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap, \gain, ~gainBusses[0].asMap, \q, ~qBusses[0].asMap]);
			},
			1.0, {
				~filterBank[0] = Synth.replace(~filterBank[0], \lowShelfFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap, \gain, ~gainBusses[0].asMap] );
			},
			2.0, {
				~filterBank[0]= Synth.replace(~filterBank[0], \hiPassFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap]);
			}, {
				~filterBank[0] = Synth.replace(~filterBank[0], \peakFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap, \gain, ~gainBusses[0].asMap, \q, ~qBusses[0].asMap]);
			}
		)
	},'/f0/type');

	~f1TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		switch (msg[1],
			0.0, {
				~filterBank[1] = Synth.replace(~filterBank[1], \peakFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap, \q, ~qBusses[1].asMap]);
			},
			1.0, {
				~filterBank[1] = Synth.replace(~filterBank[1], \lowShelfFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap] );
			},{
				~filterBank[1] = Synth.replace(~filterBank[1], \peakFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap, \q, ~qBusses[1].asMap]);
			}
		)
	},'/f1/type');

	~f8TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		switch (msg[1],
			0.0, {
				~filterBank[8] = Synth.replace(~filterBank[8], \peakFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap, \q, ~qBusses[8].asMap]);
			},
			1.0, {
				~filterBank[8] = Synth.replace(~filterBank[8], \hiShelfFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap] );
			},{
				~filterBank[8] = Synth.replace(~filterBank[8], \peakFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap, \q, ~qBusses[8].asMap]);
			}
		)
	},'/f8/type');

	~f9TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		switch (msg[1],
			0.0, {
				~filterBank[9] = Synth.replace(~filterBank[9], \peakFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap, \q, ~qBusses[9].asMap]);
			},
			1.0, {
				~filterBank[9] = Synth.replace(~filterBank[9], \hiShelfFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap] );
			},
			2.0, {
				~filterBank[9]= Synth.replace(~filterBank[9], \lowPassFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap]);
			}, {
				~filterBank[9] = Synth.replace(~filterBank[9], \peakFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap, \q, ~qBusses[9].asMap]);
			}
		)
	},'/f9/type');

	~bpReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		switch (msg[1],
			0.0, {
				~pgBus.set(~preGain);
				~source.set(\outBus, ~audioBusses[0]);
			},
			1.0, {
				~pgBus.set(0);
				~source.set(\outBus, 0);
			}
		)
	}, '/bypass/state');

	//SynthDefs

	//Peaking Filters

	SynthDef (\peakFilter, {arg inBus, outBus, gain = 0, freq = 440, q = 1.41;
		var in = In.ar(inBus, 2);
		var rq = 1 / q;
		var filter = BPeakEQ.ar(
			in,
			freq,
			rq,
			gain
		);
		Out.ar(outBus, filter);
	}).add;


	SynthDef (\lowShelfFilter, {arg inBus, outBus, gain = 0, freq = 100;
		var in = In.ar(inBus, 2);
		var filter = BLowShelf.ar(
			in,
			freq: freq,
			db: gain
		);
		Out.ar(outBus, filter);
	}).add;

	SynthDef (\hiShelfFilter, {arg inBus, outBus, gain = 0, freq = 5000;
		var in = In.ar(inBus, 2);
		var filter = BHiShelf.ar(
			in,
			freq: freq,
			db: gain
		);
		Out.ar(outBus, filter);
	}).add;

	SynthDef (\lowPassFilter, {arg inBus, outBus, freq = 5000;
		var in = In.ar(inBus, 2);
		var filter = BLowPass.ar(
			in,
			freq: freq
		);
		Out.ar(outBus, filter);
	}).add;

	SynthDef (\hiPassFilter, {arg inBus, outBus, freq = 100;
		var in = In.ar(inBus, 2);
		var filter = BHiPass.ar(
			in,
			freq: freq
		);
		Out.ar(outBus, filter);
	}).add;

	//for testing;
	SynthDef (\testOsc, {arg outBus;
		var sine = WhiteNoise.ar([1,1]);
		var preGain = 0.4;
		Out.ar(outBus, sine * preGain);
	}).add;

	//Audio In to filter bank w/pre-gain
	SynthDef (\audioIn, {arg outBus, gain;
		var in = SoundIn.ar([0,1]);
		Out.ar(outBus, in * gain.dbamp);
	}).add;

	//Patch output of filter bank to audio device
	SynthDef(\patchOut, {arg inBus;
		var in = In.ar(inBus, 2);
		Out.ar(0, in);
	}).add;

	s.sync; //Wait for synthdefs to load before continuing

	//Bank of filters, initialized with peak filters
	~filterBank = Array.newClear(~filterCount);

	~filterBank.do({arg item, i;
		~filterBank[i] = Synth.tail(s, \peakFilter, [\inBus, ~audioBusses[i], \outBus, ~audioBusses[i+1], \freq, ~freqBusses[i].asMap, \gain, ~gainBusses[i].asMap, \q, ~qBusses[i].asMap]);
	});

	//Audio in to EQ and audio through
	~source = Synth.before(~filterBank[0], \audioIn, [\outBus, ~audioBusses[0], \gain, ~pgBus.asMap]);

	~out = Synth.tail(s, \patchOut, [\inBus, ~audioBusses[~filterCount]]);

	//send OSC to Node to get current filter state
	~nodeAddress.sendMsg("/loadstate");
});

)`

//Find SC installation directory, need to add error if not found
var scdir = glob.sync("C:/Program Files/SuperCollider-3*/");

// create scd file somewhere accessible
var scdPath = "C:/ProgramData/piEQ/audio/piEQ.scd";

if (!fs.existsSync(scdPath)){
	fs.mkdirSync("C:/ProgramData/piEQ/audio");
	fs.writeFileSync(scdPath, scCode);
}

//Spawn supercollider with arguments.  Probably need to check for invalid args, etc.
var arguments = process.argv.slice(2);
arguments.unshift(scdPath);

spawn("sclang.exe", arguments, {cwd: scdir[scdir.length-1]}).stdout.pipe(process.stdout);		

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
	fs.writeFile(currentStateDir + '/currentstate.json', body, function (err){
		if (err) return console.log(err);
		res.end();
	});
});

//save a preset to a file
app.post('/savepreset', function (req, res){
	var body = JSON.stringify(req.body);
	var filepath = presetDir + "/" + req.body.name + ".json";
	fs.writeFile(filepath, body, function (err){
		if (err) return console.log(err);
		res.end();
	});
});

//read a preset file and send back to client
app.post('/loadpreset', function (req, res){
	var filepath = presetDir + "/" + req.body.preset + ".json";
	//console.log (req.body);
	fs.readFile (filepath, (err, data) => {
		if (err) return console.log(err);
		res.send(data);
	});
});

//get list of all presets and send back to client, stripping out ".json" from file name
app.get('/listpresets', function (req, res){
	fs.readdir(presetDir, (err, files) => {
		for (var i = 0; i < files.length; i++){
			files[i] = files[i].substring(0, files[i].length - 5);
		}
		res.send(files);
	});
});

//read the current state file and send back to client
app.get('/loadcurrentstate', function (req, res){
	var filepath = currentStateDir + "/currentstate.json"
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

//Load last saved current state and send to audio server on load
function currentStateOnload() {
	var filepath = currentStateDir + "/currentstate.json";
	if (fs.existsSync(filepath)){
		fs.readFile (filepath, (err, data) => {
			if (err) return console.log(err);
			var object = JSON.parse(data);
			var filterNumber;
			for (var key in object) {
				if (object.hasOwnProperty(key)){
					if (key.includes("gn")){
						filterNumber = "f" + key.substring(2); //get the filter number
						sendToAudioServer(filterNumber, "gain", object[key]["value"]);
					}
					else if (key.includes("qn")){
						filterNumber = "f" + key.substring(2);
						sendToAudioServer(filterNumber, "q", object[key]["value"]);
					}
					else if (key.includes("fn")){
						filterNumber = "f" + key.substring(2);
						sendToAudioServer(filterNumber, "freq", object[key]["value"]);
					}
					else if (key.includes("fs")){
						filterNumber = "f" + key.substring(2);
						sendToAudioServer(filterNumber, "type", object[key]["value"]);
					}
					else if (key == "pgs"){
						sendToAudioServer("pg", "gain", object[key]["value"]);
					}
					else if (key == "bypass"){
						sendToAudioServer("bypass", "state", object[key]["value"]);
					}
				}
			}
		});
	}
}

currentStateOnload();
		