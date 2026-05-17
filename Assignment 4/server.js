const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("homepage");
});

app.get("/women", (req, res) => {
  res.render("homepage");
});

app.get("/men", (req, res) => {
  res.render("homepage");
});

app.get("/girls", (req, res) => {
  res.render("homepage");
});

app.get("/sale", (req, res) => {
  res.render("homepage");
});

app.get("/contact-us", (req, res) => {
  res.render("contact-us");
});

app.use("/admin", require("./routes/admin"));
app.use("/", require("./routes/products"));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  
  // Connect to MongoDB asynchronously after server starts
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
