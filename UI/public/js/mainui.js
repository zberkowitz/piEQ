//Web audio code for frequency response plotting
var context = new AudioContext();

var filterCount = 10;
var filterBank = [];

//create filters for analysis
for (var i = 0; i < filterCount; i++){
	filterBank[i] = context.createBiquadFilter();
	filterBank[i].type = "peaking";
}

//setup response plot canvas
var responsePlot = document.getElementById('responsePlot');
responsePlot.width = responsePlot.parentNode.offsetWidth * window.devicePixelRatio;
responsePlot.height = 300 * window.devicePixelRatio;

var width = responsePlot.width;
var frequencyHz = new Float32Array(width);
var magResponse = new Float32Array(width);
var phaseResponse = new Float32Array(width);

var oct = 10;

//set frequencies for analysis
for (var i = 0; i < width; i++) {
	var n = oct * ((i / width) - 1.0);
	frequencyHz[i] = (context.sampleRate / 2) * Math.pow(2.0, n);
}

var shouldDraw = false; //used to prevent drawing on each change when loading presets and resetting

var colorScheme = ["#FF0000", "#FF8000", "#FFFF00", "#80FF00", "#00FF00", "#00FF80", "#00FFFF", "#0080FF", "#0000FF", "#8000FF", "#FF00FF", "#FF0080"];//color wheel color scheme

function plotResponse (){
	if (shouldDraw){
		var scale = 20;
		var ctx = responsePlot.getContext('2d');
		
		//Draw graph
		ctx.clearRect(0, 0, responsePlot.width, responsePlot.height);

		ctx.beginPath();
		ctx.strokeStyle = "#CCCCCC";
		ctx.fillStyle = "#000000";
		ctx.lineWidth = 2;
		ctx.font = (11 * window.devicePixelRatio) + "px sans-serif";
		//console.log(ctx.font);
		for (var f = 10; f < context.sampleRate / 2; f *= 10) {
			for (var n = 1; n < 10; n++) {
				var x = f * n;
				var i = Math.round(
					( (Math.log(x / context.sampleRate) + Math.log(2) * oct + Math.log(2)) * width ) /
					( Math.log(2) * oct )
				);
				ctx.moveTo(i, 0);
				ctx.lineTo(i, responsePlot.height);
				if (
					x == 1e2 ||
					x == 2e2 ||
					x == 4e2 ||
					x == 1e3 ||
					x == 2e3 ||
					x == 4e3 ||
					x == 1e4
				   ) {
					if (x < 1000){
						ctx.fillText(x + "Hz", i, responsePlot.height - 10);
					}else{
						ctx.fillText(x/1000 + "kHz", i, responsePlot.height - 10);
					}
					
				}
			}
		}
		ctx.stroke();

		ctx.beginPath();
		ctx.fillStyle = "#660000";
		for (var db = -30; db < 20; db += 5) {
			var y = ((responsePlot.height * scale) - (db * responsePlot.height)) / (3 * scale);
			ctx.moveTo(0, y);
			ctx.lineTo(width, y);
			ctx.fillText(db + "dB", 0, y);
		}
		ctx.stroke();
		
		//Draw response curves
		var magResponseCombined = new Float32Array(width);
		
		for (var i = 0; i < filterCount; i++){
			filterBank[i].getFrequencyResponse(frequencyHz, magResponse, phaseResponse);
			
			/*for (var j = 0; j < magResponse.length; j++){
				magResponseCombined[j] += magResponse[j];
			}*/
			ctx.beginPath();
			ctx.strokeStyle = colorScheme[i];
			ctx.lineWidth = 4;
			ctx.moveTo(0, responsePlot.height);
			for (var j = 0; j < width; j++) {
				var db = 20 * Math.log(magResponse[j]) / Math.LN10; // no warnings
				magResponseCombined[j] += db;
				ctx[j === 0 ? "moveTo" : "lineTo"](j, ((responsePlot.height * scale) - (db * responsePlot.height)) / (3 * scale));
			}
			ctx.stroke();
		}
		
		//Draw combined response
		ctx.beginPath();
		ctx.strokeStyle = "rgba(0,0,0,0.2)";
		ctx.lineWidth = 4;
		ctx.moveTo(0, responsePlot.height);
		for (var i = 0; i < width; i++) {
			//var db = 20 * Math.log(magResponseCombined[i]) / Math.LN10; // no warnings
			ctx[i === 0 ? "moveTo" : "lineTo"](i, ((responsePlot.height * scale) - (magResponseCombined[i] * responsePlot.height)) / (3 * scale));
		}
		ctx.stroke();
	}
}

//Nexus stuff

var mainui = new Nexus.Rack("#mainui");
//set attributes.  Sizes are pretty goofy on mobile landscape mode, need to make this responsive

var gsWidth = 60;
var gsHeight = 240;

var buttonWidth = 80;
var buttonHeight = 40

mainui.pgs.resize (gsHeight/2, gsWidth/1.5)

mainui.preset.resize(buttonWidth, buttonHeight);
mainui.reset.resize(buttonWidth, buttonHeight);


mainui.gs0.resize (gsWidth, gsHeight);
mainui.gs1.resize (gsWidth, gsHeight);
mainui.gs2.resize (gsWidth, gsHeight);
mainui.gs3.resize (gsWidth, gsHeight);
mainui.gs4.resize (gsWidth, gsHeight);
mainui.gs5.resize (gsWidth, gsHeight);
mainui.gs6.resize (gsWidth, gsHeight);
mainui.gs7.resize (gsWidth, gsHeight);
mainui.gs8.resize (gsWidth, gsHeight);
mainui.gs9.resize (gsWidth, gsHeight);

mainui.pgs.colorize("accent", "#000000");
mainui.bypass.colorize("accent", "#000000");

mainui.gs0.colorize("accent", colorScheme[0]);
mainui.gs1.colorize("accent", colorScheme[1]);
mainui.gs2.colorize("accent", colorScheme[2]);
mainui.gs3.colorize("accent", colorScheme[3]);
mainui.gs4.colorize("accent", colorScheme[4]);
mainui.gs5.colorize("accent", colorScheme[5]);
mainui.gs6.colorize("accent", colorScheme[6]);
mainui.gs7.colorize("accent", colorScheme[7]);
mainui.gs8.colorize("accent", colorScheme[8]);
mainui.gs9.colorize("accent", colorScheme[9]);

mainui.pgs.min = -20;

mainui.gs0.min = -20;
mainui.gs1.min = -20;
mainui.gs2.min = -20;
mainui.gs3.min = -20;
mainui.gs4.min = -20;
mainui.gs5.min = -20;
mainui.gs6.min = -20;
mainui.gs7.min = -20;
mainui.gs8.min = -20;
mainui.gs9.min = -20;

mainui.pgs.max = 20;

mainui.gs0.max = 20;
mainui.gs1.max = 20;
mainui.gs2.max = 20;
mainui.gs3.max = 20;
mainui.gs4.max = 20;
mainui.gs5.max = 20;
mainui.gs6.max = 20;
mainui.gs7.max = 20;
mainui.gs8.max = 20;
mainui.gs9.max = 20;

mainui.pgs.step = 0.1;

mainui.gs0.step = 0.1;
mainui.gs1.step = 0.1;
mainui.gs2.step = 0.1;
mainui.gs3.step = 0.1;
mainui.gs4.step = 0.1;
mainui.gs5.step = 0.1;
mainui.gs6.step = 0.1;
mainui.gs7.step = 0.1;
mainui.gs8.step = 0.1;
mainui.gs9.step = 0.1;

mainui.pgn.link(mainui.pgs);

mainui.gn0.link(mainui.gs0);
mainui.gn1.link(mainui.gs1);
mainui.gn2.link(mainui.gs2);
mainui.gn3.link(mainui.gs3);
mainui.gn4.link(mainui.gs4);
mainui.gn5.link(mainui.gs5);
mainui.gn6.link(mainui.gs6);
mainui.gn7.link(mainui.gs7);
mainui.gn8.link(mainui.gs8);
mainui.gn9.link(mainui.gs9);

mainui.fn0.min = 20;
mainui.fn1.min = 20;
mainui.fn2.min = 20;
mainui.fn3.min = 20;
mainui.fn4.min = 20;
mainui.fn5.min = 20;
mainui.fn6.min = 20;
mainui.fn7.min = 20;
mainui.fn8.min = 20;
mainui.fn9.min = 20;

mainui.fn0.max = 20000;
mainui.fn1.max = 20000;
mainui.fn2.max = 20000;
mainui.fn3.max = 20000;
mainui.fn4.max = 20000;
mainui.fn5.max = 20000;
mainui.fn6.max = 20000;
mainui.fn7.max = 20000;
mainui.fn8.max = 20000;
mainui.fn9.max = 20000;

mainui.fn0.step = 1;
mainui.fn1.step = 1;
mainui.fn2.step = 1;
mainui.fn3.step = 1;
mainui.fn4.step = 1;
mainui.fn5.step = 1;
mainui.fn6.step = 1;
mainui.fn7.step = 1;
mainui.fn8.step = 1;
mainui.fn9.step = 1;

mainui.fn0.value = 31;
mainui.fn1.value = 62;
mainui.fn2.value = 125;
mainui.fn3.value = 250;
mainui.fn4.value = 500;
mainui.fn5.value = 1000;
mainui.fn6.value = 2000;
mainui.fn7.value = 4000;
mainui.fn8.value = 8000;
mainui.fn9.value = 16000;

mainui.qn0.min = 0.10;
mainui.qn1.min = 0.10;
mainui.qn2.min = 0.10;
mainui.qn3.min = 0.10;
mainui.qn4.min = 0.10;
mainui.qn5.min = 0.10;
mainui.qn6.min = 0.10;
mainui.qn7.min = 0.10;
mainui.qn8.min = 0.10;
mainui.qn8.min = 0.10;

mainui.qn0.max = 10;
mainui.qn1.max = 10;
mainui.qn2.max = 10;
mainui.qn3.max = 10;
mainui.qn4.max = 10;
mainui.qn5.max = 10;
mainui.qn6.max = 10;
mainui.qn7.max = 10;
mainui.qn8.max = 10;
mainui.qn9.max = 10;

mainui.qn0.step = 0.01;
mainui.qn1.step = 0.01;
mainui.qn2.step = 0.01;
mainui.qn3.step = 0.01;
mainui.qn4.step = 0.01;
mainui.qn5.step = 0.01;
mainui.qn6.step = 0.01;
mainui.qn7.step = 0.01;
mainui.qn8.step = 0.01;
mainui.qn9.step = 0.01;

mainui.qn0.value = 1.41;
mainui.qn1.value = 1.41;
mainui.qn2.value = 1.41;
mainui.qn3.value = 1.41;
mainui.qn4.value = 1.41;
mainui.qn5.value = 1.41;
mainui.qn6.value = 1.41;
mainui.qn7.value = 1.41;
mainui.qn8.value = 1.41;
mainui.qn9.value = 1.41;

mainui.fs0.defineOptions(["Peak", "Low Shelf", "High Pass"]);
mainui.fs1.defineOptions(["Peak", "Low Shelf"]);
mainui.fs8.defineOptions(["Peak", "High Shelf"]);
mainui.fs9.defineOptions(["Peak", "High Shelf", "Low Pass"]);

mainui.reset.text = "Reset";
mainui.preset.text = "Preset";

//mainui.bypass.resize(100, 80);
			
//function to pass control data back to node 
var socket = io()

function postControl (data) {
	uiChanged = true; //trigger to save the state
	//console.log(data.filter);
	//console.log(data.value);
	socket.emit('control', data);
}

// event handlers for GUI elements, post data through socket to node to send osc to pd 

mainui.pgs.on('change', function(v){
	var data = {filter: "pg", param: "gain", value: v};
	postControl(data);
})


//set change event behavior for gain sliders

//attempt to do a loop doesn't work.
/*var gsData = []; //Array to hold gain slider identifiers
for (var i = 0; i < 9; i++){
	var gsi = "gs" + i;
	mainui[gsi].on('change', function(v){
		//var index = i;
		gsData[i] = {filter: "f" + i, param: "gain", value: v};
		postControl(gsData[i]);
	});
}
*/
mainui.gs0.on('change', function(v){
	var data = {filter: "f0", param: "gain", value: v};
	postControl(data);
	filterBank[0].gain.value = v;
	plotResponse();
})
mainui.gs1.on('change', function(v){
	var data = {filter: "f1", param: "gain", value: v};
	postControl(data);
	filterBank[1].gain.value = v;
	plotResponse();
})
mainui.gs2.on('change', function(v){
	var data = {filter: "f2", param: "gain", value: v};
	postControl(data);
	filterBank[2].gain.value = v;
	plotResponse();
})
mainui.gs3.on('change', function(v){
	var data = {filter: "f3", param: "gain", value: v};
	postControl(data);
	filterBank[3].gain.value = v;
	plotResponse();
})
mainui.gs4.on('change', function(v){
	var data = {filter: "f4", param: "gain", value: v};
	postControl(data);
	filterBank[4].gain.value = v;
	plotResponse();
})
mainui.gs5.on('change', function(v){
	var data = {filter: "f5", param: "gain", value: v};
	postControl(data);
	filterBank[5].gain.value = v;
	plotResponse();
})
mainui.gs6.on('change', function(v){
	var data = {filter: "f6", param: "gain", value: v};
	postControl(data);
	filterBank[6].gain.value = v;
	plotResponse();
})
mainui.gs7.on('change', function(v){
	var data = {filter: "f7", param: "gain", value: v};
	postControl(data);
	filterBank[7].gain.value = v;
	plotResponse();
})
mainui.gs8.on('change', function(v){
	var data = {filter: "f8", param: "gain", value: v};
	postControl(data);
	filterBank[8].gain.value = v;
	plotResponse();
})
mainui.gs9.on('change', function(v){
	var data = {filter: "f9", param: "gain", value: v};
	postControl(data);
	filterBank[9].gain.value = v;
	plotResponse();
})

//change event data for freq number boxes
mainui.fn0.on('change', function(v){
	var data = {filter: "f0", param: "freq", value: v};
	postControl(data);
	filterBank[0].frequency.value = v;
	plotResponse();
})
mainui.fn1.on('change', function(v){
	var data = {filter: "f1", param: "freq", value: v};
	postControl(data);
	filterBank[1].frequency.value = v;
	plotResponse();
})
mainui.fn2.on('change', function(v){
	var data = {filter: "f2", param: "freq", value: v};
	postControl(data);
	filterBank[2].frequency.value = v;
	plotResponse();
})
mainui.fn3.on('change', function(v){
	var data = {filter: "f3", param: "freq", value: v};
	postControl(data);
	filterBank[3].frequency.value = v;
	plotResponse();
})
mainui.fn4.on('change', function(v){
	var data = {filter: "f4", param: "freq", value: v};
	postControl(data);
	filterBank[4].frequency.value = v;
	plotResponse();
})
mainui.fn5.on('change', function(v){
	var data = {filter: "f5", param: "freq", value: v};
	postControl(data);
	filterBank[5].frequency.value = v;
	plotResponse();
})
mainui.fn6.on('change', function(v){
	var data = {filter: "f6", param: "freq", value: v};
	postControl(data);
	filterBank[6].frequency.value = v;
	plotResponse();
})
mainui.fn7.on('change', function(v){
	var data = {filter: "f7", param: "freq", value: v};
	postControl(data);
	filterBank[7].frequency.value = v;
	plotResponse();
})
mainui.fn8.on('change', function(v){
	var data = {filter: "f8", param: "freq", value: v};
	postControl(data);
	filterBank[8].frequency.value = v;
	plotResponse();
})
mainui.fn9.on('change', function(v){
	var data = {filter: "f9", param: "freq", value: v};
	postControl(data);
	filterBank[9].frequency.value = v;
	plotResponse();
})

//change event data for Q number boxes
mainui.qn0.on('change', function(v){
	var data = {filter: "f0", param: "q", value: v};
	postControl(data);
	if (filterBank[0].type != "highpass"){ //prevent setting Q for high pass on page reload
		filterBank[0].Q.value = v;
	}
	plotResponse();
})
mainui.qn1.on('change', function(v){
	var data = {filter: "f1", param: "q", value: v};
	postControl(data);
	filterBank[1].Q.value = v;
	plotResponse();
})
mainui.qn2.on('change', function(v){
	var data = {filter: "f2", param: "q", value: v};
	postControl(data);
	filterBank[2].Q.value = v;
	plotResponse();
})
mainui.qn3.on('change', function(v){
	var data = {filter: "f3", param: "q", value: v};
	postControl(data);
	filterBank[3].Q.value = v;
	plotResponse();
})
mainui.qn4.on('change', function(v){
	var data = {filter: "f4", param: "q", value: v};
	postControl(data);
	filterBank[4].Q.value = v;
	plotResponse();
})
mainui.qn5.on('change', function(v){
	var data = {filter: "f5", param: "q", value: v};
	postControl(data);
	filterBank[5].Q.value = v;
	plotResponse();
})
mainui.qn6.on('change', function(v){
	var data = {filter: "f6", param: "q", value: v};
	postControl(data);
	filterBank[6].Q.value = v;
	plotResponse();
})
mainui.qn7.on('change', function(v){
	var data = {filter: "f7", param: "q", value: v};
	postControl(data);
	filterBank[7].Q.value = v;
	plotResponse();
})
mainui.qn8.on('change', function(v){
	var data = {filter: "f8", param: "q", value: v};
	postControl(data);
	filterBank[8].Q.value = v;
	plotResponse();
})
mainui.qn9.on('change', function(v){
	var data = {filter: "f9", param: "q", value: v};
	postControl(data);
	if (filterBank[9].type != "lowpass"){ //prevent setting Q for low pass on page reload
		filterBank[9].Q.value = v;
	}
	plotResponse();
})

//filter select actions
mainui.fs0.on('change', function(v){
	var data = {filter: "f0", param: "type", value: v.index};
	postControl(data);
	
	if (v.index == 0){
		$('#gs0overlay, #gn0overlay, #qn0overlay').hide();
		filterBank[0].type = "peaking";
		filterBank[0].Q.value = mainui.qn0.value;
	}else if (v.index == 1){
		$('#gs0overlay, #gn0overlay').hide();
		$('#qn0overlay').show();
		filterBank[0].type = "lowshelf";
	}else if (v.index == 2){
		$('#gs0overlay, #gn0overlay, #qn0overlay').show();
		filterBank[0].type = "highpass";
		filterBank[0].Q.value = 1; //set Q for accurate representation
	}
	plotResponse();
})

mainui.fs1.on('change', function(v){
	var data = {filter: "f1", param: "type", value: v.index};
	postControl(data);
	
	if (v.index == 0){
		$('#gs1overlay, #gn1overlay, #qn1overlay').hide();
		filterBank[1].type = "peaking";
		filterBank[1].Q.value = mainui.qn1.value;
	}else if (v.index == 1){
		$('#gs1overlay, #gn1overlay').hide();
		$('#qn1overlay').show();
		filterBank[1].type = "lowshelf";
	}else if (v.index == 2){
		$('#gs1overlay, #gn1overlay, #qn1overlay').show();
	}
	plotResponse();
})

mainui.fs8.on('change', function(v){
	var data = {filter: "f8", param: "type", value: v.index};
	postControl(data);
	
	if (v.index == 0){
		$('#gs8overlay, #gn8overlay, #qn8overlay').hide();
		filterBank[8].type = "peaking";
		filterBank[8].Q.value = mainui.qn8.value;
	}else if (v.index == 1){
		$('#gs8overlay, #gn8overlay').hide();
		$('#qn8overlay').show();
		filterBank[8].type = "highshelf";
	}else if (v.index == 2){
		$('#gs8overlay, #gn8overlay, #qn8overlay').show();
	}
	plotResponse();
})

mainui.fs9.on('change', function(v){
	var data = {filter: "f9", param: "type", value: v.index};
	postControl(data);
	
	if (v.index == 0){
		$('#gs9overlay, #gn9overlay, #qn9overlay').hide();
		filterBank[9].type = "peaking";
		filterBank[9].Q.value = mainui.qn9.value;
	}else if (v.index == 1){
		$('#gs9overlay, #gn9overlay').hide();
		$('#qn9overlay').show();
		filterBank[9].type = "highshelf";
	}else if (v.index == 2){
		$('#gs9overlay, #gn9overlay, #qn9overlay').show();
		filterBank[9].type = "lowpass";
		filterBank[9].Q.value = 1; //set Q for accurate representation
	}
	plotResponse();
})

//bypass button
mainui.bypass.on('change', function (v){
	//console.log(v);
	if (v == true){
		$('#bpoverlay, #pgsoverlay, #pgnoverlay, #rpoverlay').show();
		
		var data = {filter: "bypass", param: "state", value: v};
		postControl(data);
	}else{
		$('#bpoverlay, #pgsoverlay, #pgnoverlay, #rpoverlay').hide();

		var data = {filter: "bypass", param: "state", value: v};
		postControl(data);
	}
});


//Quick reset function

mainui.reset.on('change', function (v){
	if (mainui.reset.state == false){
		reset();
	}
})

function reset(){
	shouldDraw = false;
	for (var i = 0; i < 10; i++){
		var gsi = "gs" + i;
		mainui[gsi].value = 0;
		
		var qni = "qn" + i;
		mainui[qni].value = 1.41;
	}
	mainui.pgs.value = 0;
	
	mainui.fn0.value = 31;
	mainui.fn1.value = 62;
	mainui.fn2.value = 125;
	mainui.fn3.value = 250;
	mainui.fn4.value = 500;
	mainui.fn5.value = 1000;
	mainui.fn6.value = 2000;
	mainui.fn7.value = 4000;
	mainui.fn8.value = 8000;
	mainui.fn9.value = 16000;
	
	mainui.fs0.value = "Peak";
	mainui.fs1.value = "Peak";
	mainui.fs8.value = "Peak";
	mainui.fs9.value = "Peak";
	
	shouldDraw = true;
	plotResponse();
}


//Preset UI display controls.  Need to add input sanitization

var saveButton = new Nexus.TextButton('#savebutton');
var selectPreset = new Nexus.Select('#selectpreset');
var loadButton = new Nexus.TextButton('#loadbutton');

saveButton.text = "Save";
saveButton.resize(buttonWidth, buttonHeight);

loadButton.text = "Load";
loadButton.resize(buttonWidth, buttonHeight);

selectPreset.defineOptions([]);

mainui.preset.on('change', function (v){
	if (mainui.preset.state == false){
		$('#savemodal').css("display", "block");
		listPresets();
	}
})	

saveButton.on('change', function (v){
	if (saveButton.state == false){
		var presetName = $('#savepresetname').val();
		savePreset(presetName);
		$('#savemodal').css("display", "none");
	}
})	

loadButton.on('change', function (v){
	if (loadButton.state == false){
		loadPreset(selectPreset.value);
		$('#savepresetname').val(selectPreset.value);
		$('#savemodal').css("display", "none");
	}
})

$('.close').click(function(e){
	$('.modal').css("display", "none");
})

$(window).click(function(e){
	if (e.target.className == "modal"){
		$('.modal').css("display", "none");
	}
})


//saving current state of all UI elements in JSON to store presets
var currentState = {};
var uiChanged = true; //only save current state if UI changed to reduce overhead

//set currentState JSON object and post to server (should be done on a timer)
function setCurrentState (){
	if (uiChanged){
		for (var key in mainui){
			if (mainui.hasOwnProperty(key)){
				if (key == "fs0" || key == "fs1" || key == "fs8" || key == "fs9"){ //special for filter type selects
					currentState[key] = {"value" : mainui[key].selectedIndex}
				}
				else if (key == "bypass"){
					currentState[key] = {"value" : mainui[key].state};
				}
				else{
					currentState[key] = {"value" : mainui[key].value}
				}
			}
		}
		$.ajax({
			url: '/savecurrentstate', 
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(currentState)
		});
	}
	uiChanged = false;
}

//function to save a preset to the server
function savePreset(presetName){
	var preset = currentState;
	preset["name"] = presetName;
	delete preset["bypass"]; //don't save bypass state to a preset
	$.ajax({
			url: '/savepreset', 
			type: "POST",
			contentType: 'application/json',
			data: JSON.stringify(preset)
	});
}

// function to load a preset from the server
function loadPreset(presetName){
	shouldDraw = false;
	$.ajax({
		url: '/loadpreset', 
		type: "POST",
		contentType: 'application/json',
		data: JSON.stringify({"preset" : presetName}),
		success: function (data){
			//console.log(data);
			var preset = JSON.parse(data);
			for (var key in preset){
				if (preset.hasOwnProperty(key)){
					if (key != "name") {
						if (key == "fs0" || key == "fs1" || key == "fs8" || key == "fs9"){
							mainui[key].selectedIndex = preset[key]["value"]
						}else{
							mainui[key]["value"] = preset[key]["value"]; 
						}
					}
				}
			}
			mainui.bypass.state = mainui.bypass.state; //re-emit bypass to set SC volume if loading preset while in bypass mode
		}
	});
	shouldDraw = true;
	plotResponse();
}

//function to get list of presets
function listPresets(){
	$.ajax({
		url: '/listpresets',
		success: function (data){
			selectPreset.defineOptions(data);
			selectPreset.selectedIndex = 0;
		}
	});
}

//function to request the "current state", or last state the UI was in
function loadCurrentState(){
	shouldDraw = false;
	$.ajax({
		url: '/loadcurrentstate', 
		success: function (data){
			//console.log(data);
			var preset = JSON.parse(data);
			for (var key in preset){
				if (preset.hasOwnProperty(key)){
					if (key != "name"){
						if (key == "fs0" || key == "fs1" || key == "fs8" || key == "fs9"){
							mainui[key].selectedIndex = preset[key]["value"]
						}
						else if (key == "bypass"){
							//var bpstate = (preset[key]["value"] == 'true');
							mainui[key].state = preset[key]["value"]
						}
						else{
							mainui[key]["value"] = preset[key]["value"];
						}
					}
				}
			}
			mainui.bypass.state = mainui.bypass.state; //re-emit bypass to set SC volume if loading preset while in bypass mode
		}
	});
	shouldDraw = true;
	plotResponse();
}

//load the previous saved state on window refresh
$( document ).ready(function() {
	loadCurrentState();
});

setInterval(setCurrentState, 2000); //save the current state every 2 seconds, will only fire if there are changes
			