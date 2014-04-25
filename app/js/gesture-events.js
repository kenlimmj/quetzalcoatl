document.querySelector("body").addEventListener("pull", function() {
    console.log("Pull detected!");
});

document.querySelector("body").addEventListener("push", function() {
    console.log("Push detected!");
});

document.querySelector("body").addEventListener("zoom", function() {
    console.log("Zoom detected!");
});
