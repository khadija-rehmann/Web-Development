require('dotenv').config();

const express = require("express");
const session = require('express-session');
const flash = require('connect-flash');

const app = express();
const PORT = process.env.PORT || 3000;


app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); //to reads data sent from HTML forms.
app.use(express.static("public"));

// Session store and flash messages
const MongoStore = require('connect-mongo').default;
app.use(session({
  secret: 'limelight-secret-key',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({ mongoUrl: 'mongodb://localhost:27017/limelight' }),
  cookie: { maxAge: 1000 * 60 * 60 * 24 }
}));
app.use(flash());

// Make auth and flash variables available to every view
app.use((req, res, next) => {
  res.locals.currentUser = req.session ? req.session.user : null;
  res.locals.successMsg = req.flash('success');
  res.locals.errorMsg = req.flash('error');
  res.locals.req = req; // Make request object available in views for session access
  next();
});

// Route modules
app.use("/admin", require("./routes/admin"));//connect routes of admin
app.use("/", require("./routes/auth"));
app.use("/", require("./routes/products"));

// Cart and checkout routes
app.use('/', require('./routes/cart'));

// API routes — returns JSON data, used by external clients
// These are separate from the normal EJS website routes
app.use('/api/v1', require('./routes/api'));

// Start server and connect to MongoDB
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Connect to MongoDB asynchronously after the server starts
  setImmediate(async () => {
    try {
      const mongoose = require("mongoose");
      await mongoose.connect("mongodb://localhost:27017/limelight", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB");
    } catch (err) {
      console.error("MongoDB connection error:", err);
    }
  });
});
