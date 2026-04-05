var menuBtn = document.getElementById("menuBtn");
var navLinks = document.getElementById("navLinks");
var menuLinks = document.querySelectorAll("#navLinks a");

menuBtn.addEventListener("click", function () {
    navLinks.classList.toggle("active");
});

for (var i = 0; i < menuLinks.length; i++) {
    menuLinks[i].addEventListener("click", function () {
        if (window.innerWidth <= 1024) {
            navLinks.classList.remove("active");
        }
    });
}
