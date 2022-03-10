const mongoose = require('mongoose');
const dotenv = require('dotenv').config({ path: './config.env' });

const dbConnectionString = process.env.ATLAS_DB_CONNECTION_STRING.replace(
  '<password>',
  process.env.ATLAS_DB_PASSWORD
);

mongoose
  .connect(dbConnectionString, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('database connected...');
  });
