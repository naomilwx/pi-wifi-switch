const express = require('express');
const TuyAPI = require('tuyapi');
const TPLink = require('tplink-lightbulb');

const sys = require('sys');
const exec = require('child_process').exec;

const de = require('dotenv').config();
const { parsed: env } = de;

function sleep(t) {
	return new Promise(resolve => setTimeout(resolve, t));
}

async function smartSocketApplyAll(socket, state, shouldDisconnect = true) {
	try {
		socket.on('error', error => {
			console.log('Socket error', error);
		});
		await socket.find();
		await socket.connect();
		console.log('connected, sending...');
		await socket.set({ multiple: true, data: {1: state, 2: state, 3: state, 4: state} });

		const status = await socket.get({schema: true});
		console.log('New status', status);
		if (shouldDisconnect) {
			console.log('Disconnecting...');
			socket.disconnect();
		}

	} catch(err) {
		if (socket.isConnected()) {
			socket.disconnect();
		}
		console.log('smart sockets apply all error', err);
	}
}

function plugApply(socket, state) {
	try {
		socket.power(state)
			.then(status => { console.log(status); })
			.catch(err => { console.log(err); });
	} catch(err) {
		console.log('plug apply error', err);
	}
}

function powerAll(smartSockets, tpPlugs, on, shouldDisconnect = true) {
	smartSockets.forEach(s => smartSocketApplyAll(s, on, shouldDisconnect));
	tpPlugs.forEach(p => plugApply(p, on));
}


async function runSequence(smartSockets, tpPlugs, interval) {
	console.log('starting run');
	try {
		isRunning = true;
		powerAll(smartSockets, tpPlugs, false);
		await sleep(3000);

		console.log('starting sequence')
		await runSmartSocketsSequence(smartSockets, interval);

		for(let i = 0; i < tpPlugs.length; i++) {
			plugApply(tpPlugs[i], true);
			await sleep(interval);
		}
		await sleep(240000);
		powerAll(smartSockets, tpPlugs, false);
		sleep(900);
	} catch(err) {
		console.log('error in run sequence', err);
	} finally {
		isRunning = false;
		console.log('done');
	}

}

async function runAlternateSequence(smartSockets, tpPlugs, interval) {
	console.log('starting run');
	try {
		isRunning = true;
		powerAll(smartSockets, tpPlugs, false, false);
		await sleep(3000);

		console.log('starting sequence')
		for (let part = 1; part < 3; part++) {
			await runSmartSocketsAlternateSequence(smartSockets, interval, part, part == 2);
			plugApply(tpPlugs[part - 1], true);
			await sleep(interval);
		}

		await sleep(300000);
	} catch(err) {
		console.log('error in run sequence', err);
	} finally {
		isRunning = false;
		console.log('done');
	}

}

async function runSmartSocketsAlternateSequence(smartSockets, interval, part, shouldDisconnect = true) {
	for (let i = 0; i < smartSockets.length; i++) {
		let socket = smartSockets[i];
		socket.on('error', error => {
			console.log('Socket error', i + 1, 'part', part, error);
		});
		try {
			await socket.find();
			await socket.connect();
			console.log('found socket', i+1);
			for(let j = 1; j < 3; j++) {
				let dps = (part - 1) * 2 + j;
				await socket.set({ dps: dps, set: true});

				const status = await socket.get({schema: true});
				console.log('New status', status);

				await sleep(interval);
			}
		} catch(err) {
			console.log('error in smart sockets run sequence', err);

			smartSocketApplyAll(socket, true, shouldDisconnect);

		}
	}
}

// Takes in timing between lights switching on in ms
async function runSmartSocketsSequence(smartSockets, interval) {
	for(let i = 0; i < smartSockets.length; i++) {
		let socket = smartSockets[i];
		socket.on('error', error => {
			console.log('Socket error', i+1,  error);
		});
		try {
			await socket.find();
			await socket.connect();
			console.log('found socket', i+1);
			for(let j = 1; j < 5; j++) {
				await socket.set({ dps: j, set: true});

				const status = await socket.get({schema: true});
				console.log('New status', status);

				await sleep(interval);;
			}
			socket.disconnect();

		} catch(err) {
			console.log('error in smart sockets run sequence', err);

			smartSocketApplyAll(socket, true);
		}

	}

}



const app = express();
var isRunning = false;
async function initialise() {
	console.log("initialising");

	const socketIds = env.socketIds.split(":");
	const socketKeys = env.socketKeys.split(":");
	const socketKeyPairs =  socketIds.map((id, idx) => ({ id, key: socketKeys[idx] }));

	const smartSockets = socketKeyPairs.map(i => new TuyAPI(i));
	const tpPlugs = [new TPLink('192.168.4.19'), new TPLink('192.168.4.33')];
	for (let i = 0; i < smartSockets.length; i++) {
		console.log('finding socket', i+1);
		await smartSockets[i].find();
	}

	app.use('/on-all', (req, res) => {
		powerAll(smartSockets, tpPlugs, true);
		res.send({status: 'ok'});
	});
	app.use('/off-all', (req, res) => {
		powerAll(smartSockets, tpPlugs, false);
		res.send({status: 'ok'});
	});
	app.use('/run', (req, res) => {
		console.log('received run');
		if (isRunning) {
			res.send({status: 'running'});
			return
		}
		runAlternateSequence(smartSockets, tpPlugs, 1000);
		res.send({status: 'ok'});
	});
	app.use('/reset', (req, res) => { isRunning = False; res.send('done'); });
	app.use('/status',(req, res) => { res.send({ isRunning });  });
	app.use('/shutdown', (req, res) => { exec('sudo shutdown now', (err, stdout, stderr) => { sys.puts(stdout); }); });
	app.listen(8080);
	console.log('done');
}

initialise();
