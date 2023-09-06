# Express-LocalLibrary-MySQL

To Run the project

1. Make sure you have a database named "local_library", replace the Database settings in sequelize.js
2. `npm install` 
3. `node populatedb.js` to generate a template database
4. `npm run serverstart`


Note: you may need to change `"serverstart": "SET DEBUG=express-locallibrary-tutorial:* & npm run devstart"` in package.json if you are using a Windows machine.
