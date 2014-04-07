var textContainer = document.querySelector("aside"),
    textList = document.querySelectorAll("aside li");

function highlight(elem) {
    // Only do something if the element is in the text block
    if (jQuery.contains(textContainer, elem)) {
        // Go through every item in the text block and:
        // 1. Highlight the desired item
        // 2. Fade everything else
        for (var i = 0; i < textList.length; i++) {
            if (textList[i] === elem) {
                textList[i].className = "text--active";
            } else {
                textList[i].className = "text--inactive";
            }
        }
    }
}

function unHighlight() {
    for (var i = 0; i < textList.length; i++) {
        textList[i].className = "";
    }
}