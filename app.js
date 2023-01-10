const { getDatabase } = require('firebase/database');
const { initializeApp } = require('firebase/app');
const cookieParser = require('cookie-parser');
const express = require('express');
const logger = require('morgan');

require('dotenv').config();

const mazesRouter = require('./routes/mazes');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(function (req, res, next) {
  const firebaseConfig = {
    apiKey: process.env.API_KEY,
    authDomain: process.env.AUTH_DOMAIN,
    databaseURL: process.env.DB_URL,
    projectId: process.env.PROJECT_ID,
    storageBucket: process.env.STORAGE_BUCKET,
    messagingSenderId: process.env.MESSAGING_SENDER_ID,
    appId: process.env.APP_ID,
  };

  const firebaseApp = initializeApp(firebaseConfig);
  const db = getDatabase(firebaseApp);

  res.locals.db = db;

  next();
});

app.use('/mazes', mazesRouter);

module.exports = app;
