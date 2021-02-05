(
//Server options for Windows

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
		~filterBank[0].free;
		switch (msg[1],
			0.0, {
				~filterBank[0] = Synth.before(~filterBank[1], \peakFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0], \gain, ~gainBusses[0].asMap, \q, ~qBusses[0].asMap]);
			},
			1.0, {
				~filterBank[0] = Synth.before(~filterBank[1], \lowShelfFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap, \gain, ~gainBusses[0].asMap] );
			},
			2.0, {
				~filterBank[0]= Synth.before(~filterBank[1], \hiPassFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap]);
			}, {
				~filterBank[0] = Synth.before(~filterBank[1], \peakFilter, [\inBus, ~audioBusses[0], \outBus, ~audioBusses[1], \freq, ~freqBusses[0].asMap, \gain, ~gainBusses[0].asMap, \q, ~qBusses[0].asMap]);
			}
		)
	},'/f0/type');

	~f1TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		~filterBank[1].free;
		switch (msg[1],
			0.0, {
				~filterBank[1] = Synth.before(~filterBank[2], \peakFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap, \q, ~qBusses[1].asMap]);
			},
			1.0, {
				~filterBank[1] = Synth.before(~filterBank[2], \lowShelfFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap] );
			},{
				~filterBank[1] = Synth.before(~filterBank[2], \peakFilter, [\inBus, ~audioBusses[1], \outBus, ~audioBusses[2], \freq, ~freqBusses[1].asMap, \gain, ~gainBusses[1].asMap, \q, ~qBusses[1].asMap]);
			}
		)
	},'/f1/type');

	~f8TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		~filterBank[8].free;
		switch (msg[1],
			0.0, {
				~filterBank[8] = Synth.before(~filterBank[9], \peakFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap, \q, ~qBusses[8].asMap]);
			},
			1.0, {
				~filterBank[8] = Synth.before(~filterBank[9], \hiShelfFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap] );
			},{
				~filterBank[8] = Synth.before(~filterBank[9], \peakFilter, [\inBus, ~audioBusses[8], \outBus, ~audioBusses[9], \freq, ~freqBusses[8].asMap, \gain, ~gainBusses[8].asMap, \q, ~qBusses[8].asMap]);
			}
		)
	},'/f8/type');

	~f9TypeReceiver = OSCFunc.newMatching({arg msg, time, addr, recvPort;
		//msg[1].postln;
		~filterBank[9].free;
		switch (msg[1],
			0.0, {
				~filterBank[9] = Synth.after(~filterBank[8], \peakFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap, \q, ~qBusses[9].asMap]);
			},
			1.0, {
				~filterBank[9] = Synth.after(~filterBank[8], \hiShelfFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap] );
			},
			2.0, {
				~filterBank[9]= Synth.after(~filterBank[8], \lowPassFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap]);
			}, {
				~filterBank[9] = Synth.after(~filterBank[8], \peakFilter, [\inBus, ~audioBusses[9], \outBus, ~audioBusses[10], \freq, ~freqBusses[9].asMap, \gain, ~gainBusses[9].asMap, \q, ~qBusses[9].asMap]);
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

	SynthDef (\peakFilter, {arg inBus, outBus, gain = 0, freq = 440, q = 1.41, scaler = 1;
		var in = In.ar(inBus, 2);
		var rq = 1 / q;
		var filter = BPeakEQ.ar(
			in,
			freq,
			rq,
			gain
		);
		Out.ar(outBus, filter * scaler);
	}).add;


	SynthDef (\lowShelfFilter, {arg inBus, outBus, gain = 0, freq = 100, scaler = 1;
		var in = In.ar(inBus, 2);
		var filter = BLowShelf.ar(
			in,
			freq: freq,
			db: gain
		);
		Out.ar(outBus, filter * scaler);
	}).add;

	SynthDef (\hiShelfFilter, {arg inBus, outBus, gain = 0, freq = 5000, scaler = 1;
		var in = In.ar(inBus, 2);
		var filter = BHiShelf.ar(
			in,
			freq: freq,
			db: gain
		);
		Out.ar(outBus, filter * scaler);
	}).add;

	SynthDef (\lowPassFilter, {arg inBus, outBus, freq = 5000, scaler = 1;
		var in = In.ar(inBus, 2);
		var filter = BLowPass.ar(
			in,
			freq: freq
		);
		Out.ar(outBus, filter * scaler);
	}).add;

	SynthDef (\hiPassFilter, {arg inBus, outBus, freq = 100, scaler = 1;
		var in = In.ar(inBus, 2);
		var filter = BHiPass.ar(
			in,
			freq: freq
		);
		Out.ar(outBus, filter * scaler);
	}).add;

	//for testing;
	SynthDef (\testOsc, {arg outBus;
		var sine = WhiteNoise.ar([1,1]);
		var preGain = 0.4;
		Out.ar(outBus, sine * preGain);
	}).add;

	//Audio In to filter bank
	SynthDef (\audioIn, {arg outBus, gain, switch = 1;
		var in = SoundIn.ar([0,1]);
		Out.ar(outBus, in * gain.dbamp * switch);
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

	~nodeAddress = NetAddr.new("127.0.0.1", 3001);
	~nodeAddress.sendMsg("/loadstate");
});

)