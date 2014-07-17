QUnit.module("Nav", {
    setup: function() {
        Nav.init();
    },
    teardown: function() {
        Nav.destroy();
    }
});

QUnit.test("init()", function(assert) {
    var navElement = document.getElementById('kinectNavOverlay')

    expect(9);
    assert.ok(navElement, "Calling creates div#kinectNavOverlay");
    assert.strictEqual(navElement.parentNode.tagName, "BODY", "div#kinectNavOverlay is in the body element");
    assert.strictEqual(navElement.style.position, "absolute", "div#kinectNavOverlay has style 'position: absolute'");
    assert.strictEqual(navElement.style.top, "0px", "div#kinectNavOverlay has style 'top: 0'");
    assert.strictEqual(navElement.style.left, "0px", "div#kinectNavOverlay has style 'left: 0'");
    assert.strictEqual(navElement.style.width, "100%", "div#kinectNavOverlay has style 'width: 100%'");
    assert.strictEqual(navElement.style.height, "100%", "div#kinectNavOverlay has style 'height: 100%'");
    assert.strictEqual(navElement.style.pointerEvents, "none", "div#kinectNavOverlay has style 'pointer-events: none'");
    assert.strictEqual(navElement.style.zIndex, "999", "div#kinectNavOverlay has style 'z-index: 999'");
});

QUnit.test("setAppViewport(width,height)", function(assert) {
    expect(3);
    assert.deepEqual(Nav.setAppViewport(), {
        width: window.innerWidth,
        height: window.innerHeight
    }, "Calling with no inputs specified");
    assert.deepEqual(Nav.setAppViewport(314), {
        width: 314,
        height: window.innerHeight
    }, "Calling with 'width = 314'");
    assert.deepEqual(Nav.setAppViewport(314, 168), {
        width: 314,
        height: 168
    }, "Calling with 'width = 314' and 'height = 168'");
});

QUnit.test("setKinectViewport(width,height)", function(assert) {
    expect(3);
    assert.deepEqual(Nav.setKinectViewport(), {
        width: 512,
        height: 484
    }, "Calling with no inputs specified");
    assert.deepEqual(Nav.setKinectViewport(314), {
        width: 314,
        height: 484
    }, "Calling with 'width = 314'");
    assert.deepEqual(Nav.setKinectViewport(314, 168), {
        width: 314,
        height: 168
    }, "Calling with 'width = 314' and 'height = 168'");
});

QUnit.test("setUserSpineBase(x,y)", function(assert) {
    expect(3);
    assert.deepEqual(Nav.setUserSpineBase(), {
        x: Nav.getKinectViewport().width / 2,
        y: Nav.getKinectViewport().height
    }, "Calling with no inputs specified");
    assert.deepEqual(Nav.setUserSpineBase(200), {
        x: 200,
        y: Nav.getKinectViewport().height
    }, "Calling with 'x = 200'");
    assert.deepEqual(Nav.setUserSpineBase(200, 400), {
        x: 200,
        y: 400
    }, "Calling with 'x = 200' and 'y = 400'")
});

QUnit.test("setUserViewport(width,height)", function(assert) {
    expect(6);
    assert.deepEqual(Nav.setUserViewport(), {
        width: Nav.getKinectViewport().width,
        height: Nav.getKinectViewport().height,
        xMin: null,
        xMax: null,
        yMin: null,
        yMax: null
    }, "Calling with no inputs specified and no spinebase specified");
    assert.deepEqual(Nav.setUserViewport(314), {
        width: 314,
        height: Nav.getKinectViewport().height,
        xMin: null,
        xMax: null,
        yMin: null,
        yMax: null
    }, "Calling with 'width = 314' and no spinebase specified");
    assert.deepEqual(Nav.setUserViewport(314, 168), {
        width: 314,
        height: 168,
        xMin: null,
        xMax: null,
        yMin: null,
        yMax: null
    }, "Calling with 'width = 314', 'height = 168' and no spinebase specified");

    Nav.setUserSpineBase();

    assert.deepEqual(Nav.setUserViewport(), {
        width: Nav.getKinectViewport().width,
        height: Nav.getKinectViewport().height,
        xMin: Nav.getUserSpineBase().x - Nav.getKinectViewport().width / 2,
        xMax: Nav.getUserSpineBase().x + Nav.getKinectViewport().width / 2,
        yMin: Nav.getUserSpineBase().y - Nav.getKinectViewport().height,
        yMax: Nav.getUserSpineBase().y
    }, "Calling with no inputs specified and default spinebase specified");
    assert.deepEqual(Nav.setUserViewport(314), {
        width: 314,
        height: Nav.getKinectViewport().height,
        xMin: Nav.getUserSpineBase().x - 314 / 2,
        xMax: Nav.getUserSpineBase().x + 314 / 2,
        yMin: Nav.getUserSpineBase().y - Nav.getKinectViewport().height,
        yMax: Nav.getUserSpineBase().y
    }, "Calling with 'width = 314' and default spinebase specified");
    assert.deepEqual(Nav.setUserViewport(314, 168), {
        width: 314,
        height: 168,
        xMin: Nav.getUserSpineBase().x - 314 / 2,
        xMax: Nav.getUserSpineBase().x + 314 / 2,
        yMin: Nav.getUserSpineBase().y - 168,
        yMax: Nav.getUserSpineBase().y
    }, "Calling with 'width = 314', 'height = 168' and default spinebase specified");
});
