const express = require('express');
const TuyAPI = require('tuyapi');
const TPLink = require('tplink-lightbulb');

const smartSockets = [
	{ id: '180420433c71bf3ec73d', key: 'd874494af90f4bec' },
	{ id: '180420433c71bf3ec3fb', key: 'a34311909410a2e5' },
	{ id: '180420433c71bf3ec4e4', key: '57ebc818ed572c39' }
].map(i => new TuyAPI(i));
const tpPlugs = [new TPLink('192.168.4.19')];

function smartSocketApplyAll(socket, state) {
	try {
		socket.find().then(() => {

			(async () => {
				await socket.connect();
				await socket.set({ multiple: true, data: {1: state, 2: state, 3: state, 4: state} });
				status = await socket.get({schema: true});

				console.log(`New status: ${status}.`);
				socket.disconnect();

			})();
			;
		})
			.catch(async err => {
				socket.disconnect();
				console.log(err);
			});;

	} catch(err) {
		console.log(err);
	}
}

// Takes in timing between lights switching on in ms
async function runSequence(interval) {
  //TODO:
}

function plugsApplyAll(socket, state) {
	try {
		socket.power(state)
			.then(status => { console.log(status); });
	} catch(err) {
		console.log(err);
	}
}

function powerAll(on) {
	smartSockets.forEach(s => smartSocketApplyAll(s, on));
	tpPlugs.forEach(p => plugsApplyAll(p, on));
}
/*
tpDevice1.info()
	.then(info => {
		console.log(info)
	})
	*/

const app = express();
app.use('/on-all', (req, res) => {
	powerAll(true);
	res.send({status: 'ok'});
});
app.use('/off-all', (req, res) => {
	powerAll(false);
	res.send({status: 'ok'});
});
app.use('run', (req, res) => {
	// TODO:
});
app.listen(8080);



