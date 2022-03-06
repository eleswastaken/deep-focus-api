

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const initializeMongo = require('./mongoConfig');

const app = express();
const entriesRouter = require('./routers/entries');

const User = require('./models/user');

const authenticate = require('./middleware/auth');

initializeMongo()

app.use(bodyParser.json());
app.use(cors({
	origin: ['http://localhost:3001']
}));

app.use(function(req, res, next) {
	// res.set("Access-Control-Allow-Origin", "localhost:3001");
	console.log(req.path); next()
});

app.use('/entries', authenticate, entriesRouter);


app.post('/sign-up', async function(req, res) {
	// simple sanitization
	const { email, username, password } = req.body;
	if ( !(email && username && password)) {
		res.sendStatus(400)
		return 
	}

	// check whether user already exists
	const exists = await User.findOne({ email });
	if (exists) {
		res.status(400).send('User already exists');
		return
	}

	// hash the password
	let hash;
	try {
		const salt = await bcrypt.genSalt(7);
		hash = await bcrypt.hash(password, salt);
	} catch(err) {
		console.log(err)
		res.sendStatus(500)
		return 
	}
	
	const user = new User({
		email,
		username,
		password: hash
	});
	
	// save new user
	if (user) {
		const u = await user.save();
		if (u) {
			// create jwt token
			const token = jwt.sign(
				{ email, username: user.username, id: user._id },
				process.env.JWT_KEY,
				// { exp: 60 *60 *24 * 7, aud: 'web' }
			);
			res.status(201).send({ token });
			return
		}
	}
	res.sendStatus(500)
});

app.post('/log-in', async function(req, res) {
	const { email, password } = req.body;
	if ( !(email && password)) {
		res.sendStatus(400);
		return 
	}

	// check whether user already exists
	const user = await User.findOne({ email });
	if (!user) {
		res.status(404).send('User does not exist');
		return
	}

	// authenticate the user
	if (await bcrypt.compare(password, user.password)) {
		// create jwt token
		const token = jwt.sign(
			{ email, username: user.username, id: user._id },
			process.env.JWT_KEY,
			{
				// expiresIn: 60 *60 *24 * 7,
				// expiresIn: 1,
				audience: 'web'
			}
		);
		res.send({ token });
		return
	}
	res.sendStatus(400)
});


const PORT = process.env.PORT || 3000
app.listen(PORT, () => 
	console.log(`Running on http://localhost:${PORT}`)
);
