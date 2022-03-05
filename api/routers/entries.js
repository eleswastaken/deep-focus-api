
const express = require('express');

const router = express.Router();

router.get('/', function(req, res) {
	res.send(req.currentUser)
});


router.post('/', function(req, res) {

	const user = req.currentUser;
	if (user.isRecording) {
		res.status(400).send('Already recording');
		return
	}

	const { startTime } = req.body; // 1646386140569

	const lastEntry = user.entries.slice(-1)[0];

	const entry = {
		startTime,
		elapsedTime: 0,
		hasFinished: false,
	};
	entry.id = lastEntry ? lastEntry.id+1 : 0;

	user.entries.push(entry);
	user.isRecording = true;

	user.save( err => {
		if (err) {
			res.status(500).send("Could not create an entry");
			return
		}
		res.sendStatus(201);
	});
});

module.exports = router;