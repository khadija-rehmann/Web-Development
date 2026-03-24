function toggleMenu() {
    var navLinks = document.getElementById("navLinks");

    if (!navLinks) {
        console.warn("#navLinks not found");
        return;
    }

    navLinks.classList.toggle("active");
}

function closeMenu() {
    var navLinks = document.getElementById("navLinks");

    if (!navLinks) {
        return;
    }

    navLinks.classList.remove("active");
}

function bindings() {
    var hamburger = document.getElementById("hamburger");
    var menuLinks = document.querySelectorAll(".nav-links a");

    if (hamburger) {
        hamburger.addEventListener("click", toggleMenu);
        console.log("Bound #hamburger click to toggleMenu");
    } else {
        console.warn("#hamburger not found - menu toggle not bound");
    }

    for (var i = 0; i < menuLinks.length; i++) {
        menuLinks[i].addEventListener("click", closeMenu);
    }
}

window.onload = bindings;
