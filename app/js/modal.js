// Initialize a handle for all items in the main block
var items = document.getElementsByClassName("item");

// An instance adds a click event listener to a DOM node
// The click event listener adds .active to the node which is clicked,
// and removes .active from all others.
// Input: A valid DOM node
// Output: Unit
function clickListener(entry) {
    entry.addEventListener("click", function() {
        for (var i = 0; i < items.length; i++) {
            if (items[i] !== entry) {
                items[i].classList.remove("active");
                items[i].classList.add("inactive");
            }
        }
        entry.classList.remove("inactive");
        entry.classList.add("active");
    });
}

// Assign click listeners to all the items in the main block
for (var i = 0; i < items.length; i++) {
    clickListener(items[i]);
}