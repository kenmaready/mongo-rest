# Natours

Natours app from Jonas Schmedtmann's "Node.js Bootcamp" course on Udemy

This is a code-along project from the ["Nodejs Express MongoDB Bootcamp 2021"](https://www.udemy.com/course/nodejs-express-mongodb-bootcamp/) course on udemy.com, run by Jonas Schmedtmann. The course includes lessons on Node.js, Express, MongoDB, Mongoose, MVC architecture, APIs, Postman, server-side rendering, Pug, error-handling, bundling JS files, security, authorization, middleware, collecting payments (Stripe integration), email resetting process and more.

To run in development mode:

`npm run dev` (runs with nodemon)

If you want to add the dummy/test data to Database:

`npm import-data`

If you are editing the javascript files in the public folder, and are using parcel to bundle, run:

`npm watch:js` in a separate terminal so that it will monitor and re-bundle any changes

Environment variables that will need to be set (e.g., in an config.env file):

```
NODE_ENV=development (or production)
PORT=3000 (or whichever port you wish to use)

JWT_SECRET=
JWT_EXPIRES_IN=24h
JWT_COOKIE_EXPIRES_IN=24h
PASSWORD_RESET_EXPIRES_IN=10

ATLAS_DB_USERNAME=
ATLAS_DB_PASSWORD=
ATLAS_DB_CONNECTION_STRING=

EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USERNAME=
EMAIL_PASSWORD=
EMAIL_FROM=

SENDGRID_USERNAME=
SENDGRID_PASSWORD=
STRIPE_SECRET_KEY=

API_URL=http://localhost:3000/api/v1 (for example)
```
