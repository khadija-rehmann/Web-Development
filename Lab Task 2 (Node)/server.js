const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
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

app.get("/hobbies", (req, res) => {
  const hobbies = ["Reading", "Web Development", "Photography", "Traveling"];
  res.render("hobbies", { hobbies });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
