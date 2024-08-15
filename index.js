const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const path = require('path');
const logger = require('morgan');
const bodyParser = require('body-parser');


const app = express();
const server = http.createServer(app)

app.use(express.json());
app.use(cors());
app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public/build')));
// app.use('/files', express.static('files'));
// app.use('/invoices', express.static('invoices'));
app.use(bodyParser.json())
require('dotenv').config();


const dbUri = process.env.ATLAS_URI;
const port = process.env.PORT;


// Connect to MongoDB
mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => {
    console.log('MongoDB database connection established successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });



app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});



//Routes
app.use('/api/users', require('./routes/user'));
app.use('/api/admins', require('./routes/admin'));
app.use('/api/activity', require('./routes/activityLogs'));
app.use('/api', require('./routes/userrecords'));
// app.use('/api', require('./routes/schedule'));
// app.use('/vendors', require('./routes/vendor'));
// app.use(require('./routes/contracts'));
// app.use(require('./routes/chatgpt'));
// app.use('/api', require('./routes/sheet'));
// app.use('/api/files', require('./routes/uploadFiles'));
// app.use(require('./routes/retainers'));
// app.use('/api', require('./routes/invoices'));
// app.use('/api', require('./routes/organization'));



app.get('/*', (req, res) => {
  //   res.status(200).json({message: "invalid url"});
  res.sendFile(path.resolve(__dirname, 'public', 'build', 'index.html'));
});


module.exports = app;










// mongoose.connect(dbUri, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(async () => {
//       await Counter.findOneAndUpdate(
//           { _id: 'userId' },
//           { $setOnInsert: { sequence_value: 2999 } },
//           { upsert: true }
//       );
//       console.log('Counter initialized.');
//       mongoose.connection.close();
//   })
//   .catch(err => {
//       console.error('Error initializing counter:', err);
//       mongoose.connection.close();
//   });