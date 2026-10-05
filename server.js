// Entry point: boots DB (Singleton), seeds data, registers Observers, starts Express.
const express = require('express');
const session = require('express-session');
const { seedIfEmpty } = require('./src/seed');
const { bootObservers } = require('./src/patterns/Observer');

seedIfEmpty();      // creates schema + dummy data on first run
bootObservers();    // attaches every verified user as an Observer

const app = express();
app.use(express.json());
app.use(session({ secret: 'lab-secret-change-me', resave: false, saveUninitialized: false }));
app.use(express.static('public'));
app.use('/api', require('./src/routes/api'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Alumni Portal running at http://localhost:${PORT}`));
