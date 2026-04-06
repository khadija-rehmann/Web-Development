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

// NEW ARRIVALS CAROUSEL (simple jQuery style)
var slider = null;
var section = null;
var counter = null;
var currentIndex = 0;
var totalCards = 0;
var autoTimer = null;
var touchStartX = 0;
var touchEndX = 0;
var isMoving = false;
var slideTime = 500;

$(function () {
    section = $(".new-arrivals-section");
    slider = $("#newArrivalsSlider");
    counter = $("#counter");

    if (!slider.length) {
        return;
    }

    // Cleanup safety in case old runtime left clones.
    slider.children(".clone").remove();
    totalCards = slider.children(".product-card").length;

    showCurrentSlide(false);
    updateCounter();
    doBindings();
    startAutoPlay();
});

function doBindings() {
    // Remove old handlers first to avoid duplicate bindings.
    $("#nextBtn").off("click").on("click", showNext);
    $("#prevBtn").off("click").on("click", showPrev);

    section.off("mouseenter", ".product-card").on("mouseenter", ".product-card", stopAutoPlay);
    section.off("mouseleave", ".product-card").on("mouseleave", ".product-card", startAutoPlay);

    slider.off("touchstart").on("touchstart", handleTouchStart);
    slider.off("touchmove").on("touchmove", handleTouchMove);
    slider.off("touchend").on("touchend", handleTouchEnd);

    $(window).off("resize", handleResize).on("resize", handleResize);
}

function getItemsToShow() {
    if ($(window).width() <= 768) return 1;
    if ($(window).width() <= 1024) return 2;
    return 3;
}

function getStepPercent() {
    return 100 / getItemsToShow();
}

function showCurrentSlide(animate) {
    var move = currentIndex * getStepPercent();

    if (animate) {
        slider.css("transition", "transform 0.5s ease");
    } else {
        slider.css("transition", "none");
    }

    slider.css("transform", "translateX(-" + move + "%)");
}

function updateCounter() {
    counter.text("Showing " + (currentIndex + 1) + " of " + totalCards);
}

function showNext() {
    if (isMoving) return;
    isMoving = true;

    if (currentIndex >= totalCards - 1) {
        currentIndex = 0; // after 7 go back to 1
    } else {
        currentIndex = currentIndex + 1;
    }

    showCurrentSlide(true);
    updateCounter();

    setTimeout(function () {
        isMoving = false;
    }, slideTime + 20);
}

function showPrev() {
    if (isMoving) return;
    isMoving = true;

    if (currentIndex <= 0) {
        currentIndex = totalCards - 1;
    } else {
        currentIndex = currentIndex - 1;
    }

    showCurrentSlide(true);
    updateCounter();

    setTimeout(function () {
        isMoving = false;
    }, slideTime + 20);
}

function startAutoPlay() {
    stopAutoPlay();
    autoTimer = setInterval(showNext, 5000);
}

function stopAutoPlay() {
    if (autoTimer) {
        clearInterval(autoTimer);
        autoTimer = null;
    }
}

function handleTouchStart(e) {
    touchStartX = e.originalEvent.touches[0].clientX;
    stopAutoPlay();
}

function handleTouchMove(e) {
    touchEndX = e.originalEvent.touches[0].clientX;
}

function handleTouchEnd() {
    var distance = touchStartX - touchEndX;

    if (distance > 40) {
        showNext();
    } else if (distance < -40) {
        showPrev();
    }

    touchStartX = 0;
    touchEndX = 0;
    startAutoPlay();
}

function handleResize() {
    showCurrentSlide(false);
}