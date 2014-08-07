window.onload = function() {
  var foo = new AppInterface(),
      kinect = new KinectInterface(foo),
      user = new UserInterface(foo, kinect, "Kenneth"),
      cursor = new CursorInterface(foo, kinect, user);

  cursor.setLeftHandDebug(true);
  cursor.setRightHandDebug(true);

  window.foo = foo;
  window.kinect = kinect;
  window.user = user;
  window.cursor = cursor;
}


