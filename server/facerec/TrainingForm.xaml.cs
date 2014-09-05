using Microsoft.Kinect;
using Microsoft.Kinect.Face;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Xml;
using System.Xml.Linq;

namespace facerec
{
    public partial class TrainingForm : Window, INotifyPropertyChanged
    {
        #region Variables

            #region Face Detection
            /// <summary>
            /// The thickness of the line used to stroke the face bounding box.
            /// </summary>
            private const double drawFaceShapeThickness = 8;

            /// <summary>
            /// The size of the circles used to denote face features (eye, nose, etc.).
            /// </summary>
            private const double facePointRadius = 2;

            /// <summary>
            /// The font size used to display text for face properties.
            /// </summary>
            private const double drawTextFontSize = 45;

            /// <summary>
            /// The y-position of the text displayed underneath the face bounding box.
            /// FIXME: Replace magic number with relative position
            /// </summary>
            private const double textLayoutOffsetY = 10.0;

            /// <summary>
            /// The precision clamp for calculating face rotation angle.
            /// This has to be a reasonably small number because the face rotation is used to
            /// straighten the cropped face image when capturing faces for face recognition.
            /// </summary>
            private const double faceRotationAngleDegrees = 1.0;

            /// <summary>
            /// The angle by which a detected face is rotated at any point in time.
            /// </summary>
            private double faceRotation;

            /// <summary>
            /// The minimum number of faces that should be captured when acquiring faces
            /// for face recognition. This number can be as large as one desires, but not
            /// smaller than 10, because face recognition will not be accurate otherwise.
            /// </summary>
            private const int minImageCount = 10;
            
            /// <summary>
            /// A list of colors used when drawing the face bounding box and feature markers
            /// </summary>
            private List<Brush> faceBrush;

            /// <summary>
            /// The rectangle for face bounding box.
            /// </summary>
            private System.Drawing.Rectangle faceBoundingBox;


            /// <summary>
            /// The cached list of face profiles (and metadata) captured by the user
            /// </summary>
            private List<Profile> capturedImages = new List<Profile>();
            #endregion

            #region Bodies
            /// <summary>
            /// An array of stored bodies. These bodies are currently tracked.
            /// </summary>
            private Body[] bodies = null;

            /// <summary>
            /// The number of bodies the Kinect can/should keep track of.
            /// </summary>
            private int bodyCount;
            #endregion         

            #region XAML Writers

            private XDocument doc = new XDocument();

            #endregion

            #region UI Data Binds
            /// <summary>
            /// The drawing group for face frames
            /// </summary>
            private DrawingGroup faceDrawingGroup;

            /// <summary>
            /// The image source for face frames
            /// </summary>
            private DrawingImage faceImageSource;

            /// <summary>
            /// The image source for color frames
            /// </summary>
            private WriteableBitmap rgbImageSource = null;

            /// <summary>
            /// A file dialog modal for selecting the gesture database for a user
            /// </summary>
            private Microsoft.Win32.OpenFileDialog openGestureDBFileDialog = new Microsoft.Win32.OpenFileDialog();

            #endregion

            #region Dimensions
            /// <summary>
            /// The width of a color image frame
            /// </summary>
            private int colorDisplayWidth;

            /// <summary>
            /// The height of a color image frame
            /// </summary>
            private int colorDisplayHeight;
            #endregion

            #region Kinect Readers
            /// <summary>
            /// Used to convert coordinates from millimeters (i.e. Kinect space) to pixels (i.e. screen space)
            /// </summary>
            private CoordinateMapper coordinateMapper = null;

            /// <summary>
            /// Used to pull skeletal data from the Kinect
            /// </summary>
            private BodyFrameReader bodyFrameReader = null;
        
            /// <summary>
            /// Used to pull color images from the Kinect
            /// </summary>
            private ColorFrameReader colorFrameReader = null;

            /// <summary>
            /// Used to pull face detection (note: not recognition) data from the Kinect
            /// </summary>
            private FaceFrameReader[] faceFrameReaders = null;
            #endregion  

            #region Kinect Sources
            /// <summary>
            /// A reference to the Kinect sensor itself
            /// </summary>
            private KinectSensor kinectSensor = null;

            /// <summary>
            /// The Kinect face frame source. This is not entirely too different from the body/color sources,
            /// except that it's really a combination of the depth data, IR data and color data.
            /// </summary>
            private FaceFrameSource[] faceFrameSources = null;

            /// <summary>
            /// The Kinect detected face frame source. This provides specific data about detected faces in
            /// the Kinect's FOV.
            /// </summary>
            private FaceFrameResult[] faceFrameResults = null;
            #endregion

        #endregion variables

        #region Window Handlers

        /// <summary>
        /// The constructor for the training window. Initializes all the GUI elements on-screen
        /// </summary>
        /// <param name="parent">
        /// A handle to the parent window, which is normally the main 
        /// application window, since the training window is launched from there.
        /// </param>
        public TrainingForm(MainWindow parent)
        {
            InitializeComponent();
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            initializeKinect();

            initializeGUI();

            // Set the data context for the window
            this.DataContext = this;

            // Disable the Capture and Save buttons.
            // Other functions enable the buttons when suitable conditions are met
            captureButton.IsEnabled = false;
            saveButton.IsEnabled = false;
        }

        /// <summary>
        /// Implements the INotifyPropertyChanged interface to detect changes in Kinect connectivity
        /// </summary>
        public event PropertyChangedEventHandler PropertyChanged;

        #endregion

        #region Initializers and Destroyers

        public void initializeKinect()
        {
            #region Sensor Dimensions

            // Initialize the Kinect sensor.
            this.kinectSensor = KinectSensor.GetDefault();

            // Initialize the coordinate mapper to map coordinates from depth space to screen space
            this.coordinateMapper = this.kinectSensor.CoordinateMapper;

            // Get the sensor dimensions
            FrameDescription colorFrameDescription = this.kinectSensor.ColorFrameSource.CreateFrameDescription(ColorImageFormat.Bgra);

            // Assign the dimensions to local variables
            this.colorDisplayWidth = colorFrameDescription.Width;
            this.colorDisplayHeight = colorFrameDescription.Height;

            this.bodyCount = this.kinectSensor.BodyFrameSource.BodyCount;
            this.bodies = new Body[this.bodyCount];

            #endregion Sensor Dimensions

            #region Face Features

            // Specify the required face frame results
            FaceFrameFeatures faceFrameFeatures =
                FaceFrameFeatures.BoundingBoxInColorSpace
                | FaceFrameFeatures.PointsInColorSpace
                | FaceFrameFeatures.RotationOrientation
                | FaceFrameFeatures.FaceEngagement
                | FaceFrameFeatures.LookingAway;

            #endregion Face Features

            #region Drawing Colors

            this.faceBrush = new List<Brush>()
            {
                Brushes.Red,
                Brushes.Orange,
                Brushes.Green,
                Brushes.Blue,
                Brushes.Indigo,
                Brushes.Violet
            };

            #endregion Drawing Colors

            #region Sensor Sources and Readers

            // Initialize grabbers to pull frames from the sensor
            this.bodyFrameReader = this.kinectSensor.BodyFrameSource.OpenReader();
            this.colorFrameReader = this.kinectSensor.ColorFrameSource.OpenReader();
            this.faceFrameSources = new FaceFrameSource[this.bodyCount];
            this.faceFrameReaders = new FaceFrameReader[this.bodyCount];

            // Faces have to be tracked by individual readers, unlike bodies
            for (int i = 0; i < this.bodyCount; i++)
            {
                // Initialize a face frame source with the desired features to be tracked
                this.faceFrameSources[i] = new FaceFrameSource(this.kinectSensor, 0, faceFrameFeatures);

                // Open the corresponding face readers
                this.faceFrameReaders[i] = this.faceFrameSources[i].OpenReader();
            }

            // Open the sensor feed
            this.kinectSensor.Open();

            #endregion Sensor Sources and Readers

            // Pull frames from the body buffer if it exists
            if (this.bodyFrameReader != null)
            {
                this.bodyFrameReader.FrameArrived += this.Reader_BodyFrameArrived;
            }

            // Pull frames from the color buffer if it exists
            if (this.colorFrameReader != null)
            {
                this.colorFrameReader.FrameArrived += this.Reader_ColorFrameArrived;
            }

            // Pull frames from the face buffers, if they exist
            for (int i = 0; i < this.bodyCount; i++)
            {
                if (this.faceFrameReaders[i] != null)
                {
                    // wire handler for face frame arrival
                    this.faceFrameReaders[i].FrameArrived += this.Reader_FaceFrameArrived;
                }
            }
        }

        public void initializeGUI()
        {
            // Creates the face recognition canvas to be displayed
            this.faceDrawingGroup = new DrawingGroup();
            this.faceImageSource = new DrawingImage(this.faceDrawingGroup);

            // Create the color bitmap to be displayed
            this.rgbImageSource = new WriteableBitmap(colorDisplayWidth, colorDisplayHeight, 96.0, 96.0, PixelFormats.Bgr32, null);

            // Allocate storage to store face frame detection results for each face in the FOV
            this.faceFrameResults = new FaceFrameResult[this.bodyCount];

            // Set the minimum number of images that must be captured before the training data can be saved
            progressBar.Maximum = minImageCount;

            // Filter the extensions that are shown in the gesture DB selection file dialog
            openGestureDBFileDialog.DefaultExt = ".gbd";
            openGestureDBFileDialog.Filter = "Gesture Database (*.gbd, *.gba)|*.gbd;*.gba|All Files (*.*)|*.*";
        }

        #endregion

        /// <summary>
        /// Saves the cached face profiles captured by the user to disk in two forms:
        /// 1. An XML file (either created or updated) containing the profile metadata.
        /// 2. A directory of JPEG images containing the actual cropped face images.
        /// </summary>
        /// <param name="capturedProfiles">A list of profiles captured by the user</param>
        /// <returns>True if the save was successful, false otherwise.</returns>
        private bool saveTrainingData(List<Profile> capturedProfiles)
        {
            try
            {
                string directoryPath = System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/";

                if (!Directory.Exists(directoryPath))
                {
                    Directory.CreateDirectory(directoryPath);
                }

                // Load the training labels if they exist
                // Otherwise create a root element in the new file
                if (File.Exists(directoryPath + "TrainedLabels.xml"))
                {
                    doc = XDocument.Load(directoryPath + "TrainedLabels.xml");
                }
                else
                {
                    doc = new XDocument(new XElement("faceDatabase"));
                }

                foreach (Profile faceProfile in capturedProfiles)
                {
                    // Create a new JPEG encoder to save out the image
                    JpegBitmapEncoder encoder = new JpegBitmapEncoder();

                    // Set the encoder to save images at high quality so face recognition will be more accurate.
                    // This incurs a disk space penalty, but we're living in freaking 2014. Disk space is cheap.
                    encoder.QualityLevel = 100;

                    // Add the current image to the encoder
                    encoder.Frames.Add(BitmapFrame.Create(faceProfile.Face));

                    // Generate a unique file name/path for each image.
                    // Note: We could have used Path.GetRandomFileName() here, but that thing produces really
                    // weird shit like abcdefg.ijk. We don't want dots in our nice filenames, do we?
                    string faceFilePath = Path.Combine(directoryPath, faceProfile.Name + "-" + Guid.NewGuid().ToString() + ".jpg");

                    // Save everything
                    try
                    {
                        using (FileStream fs = new FileStream(faceFilePath, FileMode.Create))
                        {
                            encoder.Save(fs);
                        }

                        statusBarDisplay.Text = "Saved face profile image at " + faceFilePath;
                    }
                    catch (IOException)
                    {
                        statusBarDisplay.Text = "Unable to save face profile image at " + faceFilePath + ". Skipping...";
                    }

                    // Construct an XML node containing all the data
                    var xmlData = new XElement("face",
                        new XElement("name", faceProfile.Name),
                        new XElement("faceImagePath", faceFilePath),
                        new XElement("gestureDBPath", faceProfile.GestureDB),
                        new XElement("priority", faceProfile.Priority)
                    );

                    // Add the created node to the main XML structure
                    doc.Root.Add(xmlData);
                }

                doc.Save(directoryPath + "TrainedLabels.xml");

                return true;
            }
            catch
            {
                return false;
            }
        }

        #region Source Readers

        private void Reader_BodyFrameArrived(object sender, BodyFrameArrivedEventArgs e)
        {
            using (BodyFrame bodyFrame = e.FrameReference.AcquireFrame())
            {
                if (bodyFrame != null)
                {
                    bodyFrame.GetAndRefreshBodyData(this.bodies);

                    using (DrawingContext dc = this.faceDrawingGroup.Open())
                    {
                        // Draw a white background to set the drawing box
                        dc.DrawRectangle(Brushes.Transparent, null, new Rect(0.0, 0.0, this.colorDisplayWidth, this.colorDisplayHeight));

                        bool drawFaceResult = false;

                        for (int i = 0; i < this.bodyCount; i++)
                        {
                            // check if a valid face is tracked in this face source
                            if (this.faceFrameSources[i].IsTrackingIdValid)
                            {
                                // check if we have valid face frame results
                                if (this.faceFrameResults[i] != null)
                                {
                                    // draw face frame results
                                    this.DrawFaceFrameResults(i, this.faceFrameResults[i], dc);

                                    if (!drawFaceResult)
                                    {
                                        drawFaceResult = true;
                                    }
                                }
                            }
                            else
                            {
                                // check if the corresponding body is tracked
                                if (this.bodies[i].IsTracked)
                                {
                                    // update the face frame source to track this body
                                    this.faceFrameSources[i].TrackingId = this.bodies[i].TrackingId;
                                }
                            }
                        }
                    }
                }
            }
        }

        private void Reader_ColorFrameArrived(object sender, ColorFrameArrivedEventArgs e)
        {
            // ColorFrame is IDisposable
            using (ColorFrame colorFrame = e.FrameReference.AcquireFrame())
            {
                if (colorFrame != null)
                {
                    FrameDescription colorFrameDescription = colorFrame.FrameDescription;

                    using (KinectBuffer colorBuffer = colorFrame.LockRawImageBuffer())
                    {
                        this.rgbImageSource.Lock();

                        // verify data and write the new color frame data to the display bitmap
                        if ((colorFrameDescription.Width == this.rgbImageSource.PixelWidth) && (colorFrameDescription.Height == this.rgbImageSource.PixelHeight))
                        {
                            colorFrame.CopyConvertedFrameDataToIntPtr(
                                this.rgbImageSource.BackBuffer,
                                (uint)(colorFrameDescription.Width * colorFrameDescription.Height * 4),
                                ColorImageFormat.Bgra);

                            this.rgbImageSource.AddDirtyRect(new Int32Rect(0, 0, this.rgbImageSource.PixelWidth, this.rgbImageSource.PixelHeight));
                        }

                        this.rgbImageSource.Unlock();
                    }
                }
            }
        }

        private void Reader_FaceFrameArrived(object sender, FaceFrameArrivedEventArgs e)
        {
            using (FaceFrame faceFrame = e.FrameReference.AcquireFrame())
            {
                if (faceFrame != null)
                {
                    // Get the index of the face source from the face source array
                    int index = this.GetFaceSourceIndex(faceFrame.FaceFrameSource);

                    // Check if this face frame has valid face frame results
                    if (this.ValidateFaceBoxAndPoints(faceFrame.FaceFrameResult))
                    {
                        // Store this face frame result to draw later
                        this.faceFrameResults[index] = faceFrame.FaceFrameResult;
                    }
                    else
                    {
                        // Indicates that the latest face frame result from this reader is invalid
                        this.faceFrameResults[index] = null;
                    }
                }
            }
        }

        private int GetFaceSourceIndex(FaceFrameSource faceFrameSource)
        {
            int index = -1;

            for (int i = 0; i < this.bodyCount; i++)
            {
                if (this.faceFrameSources[i] == faceFrameSource)
                {
                    index = i;
                    break;
                }
            }

            return index;
        }

        #endregion

        #region Drawing Functions

        private void DrawFaceFrameResults(int faceIndex, FaceFrameResult faceResult, DrawingContext drawingContext)
        {
            // Choose the brush based on the face index
            Brush drawingBrush = this.faceBrush[0];

            if (faceIndex < this.bodyCount)
            {
                drawingBrush = this.faceBrush[faceIndex];
            }

            Pen drawingPen = new Pen(drawingBrush, drawFaceShapeThickness);

            // Draw the face bounding box
            faceBoundingBox = faceResult.FaceBoundingBoxInColorSpace;
            Rect faceBox = new Rect(faceBoundingBox.Left, faceBoundingBox.Top, faceBoundingBox.Width, faceBoundingBox.Height);
            drawingContext.DrawRectangle(null, drawingPen, faceBox);

            if (faceResult.FacePointsInColorSpace != null)
            {
                // Draw each face point
                foreach (PointF pointF in faceResult.FacePointsInColorSpace.Values)
                {
                    drawingContext.DrawEllipse(drawingBrush, drawingPen, new Point(pointF.X, pointF.Y), facePointRadius, facePointRadius);
                }
            }

            string faceText = string.Empty;

            // Extract each face property information and store it in faceText
            if (faceResult.FaceProperties != null)
            {
                faceText += "Engaged: " + faceResult.FaceProperties[FaceProperty.Engaged].ToString() + "\n";
                faceText += "Looking Away: " + faceResult.FaceProperties[FaceProperty.LookingAway].ToString() + "\n";
            }

            // Extract the face rotation in degrees
            if (faceResult.FaceRotationQuaternion != null)
            {
                int pitch, yaw, roll;
                ExtractFaceRotationInDegrees(faceResult.FaceRotationQuaternion, out pitch, out yaw, out roll);

                faceRotation = roll;

                faceText += "Face Yaw : " + yaw + "\n" +
                            "Face Pitch : " + pitch + "\n" +
                            "Face Roll : " + roll + "\n";
            }

            drawingContext.DrawText(
                    new FormattedText(
                        faceText,
                        CultureInfo.GetCultureInfo("en-us"),
                        System.Windows.FlowDirection.LeftToRight,
                        new Typeface("Segoe UI"),
                        drawTextFontSize,
                        drawingBrush),
                    new Point(
                        faceBox.BottomLeft.X,
                        faceBox.BottomLeft.Y + textLayoutOffsetY));
        }

        private bool ValidateFaceBoxAndPoints(FaceFrameResult faceResult)
        {
            bool isFaceValid = faceResult != null;

            if (isFaceValid)
            {
                var faceBox = faceResult.FaceBoundingBoxInColorSpace;
                if (faceBox != null)
                {
                    // check if we have a valid rectangle within the bounds of the screen space
                    isFaceValid = faceBox.Width > 0 &&
                                  faceBox.Height > 0 &&
                                  faceBox.Right <= this.colorDisplayWidth &&
                                  faceBox.Bottom <= this.colorDisplayHeight;

                    if (isFaceValid)
                    {
                        var facePoints = faceResult.FacePointsInColorSpace;
                        if (facePoints != null)
                        {
                            foreach (PointF pointF in facePoints.Values)
                            {
                                // check if we have a valid face point within the bounds of the screen space
                                bool isFacePointValid = pointF.X > 0.0f &&
                                                        pointF.Y > 0.0f &&
                                                        pointF.X < this.colorDisplayWidth &&
                                                        pointF.Y < this.colorDisplayHeight;

                                if (!isFacePointValid)
                                {
                                    isFaceValid = false;
                                    break;
                                }
                            }
                        }

                        captureButton.IsEnabled = true;
                    }
                    else
                    {
                        captureButton.IsEnabled = false;
                    }
                }
            }
            return isFaceValid;
        }

        private static void ExtractFaceRotationInDegrees(Vector4 rotQuaternion, out int pitch, out int yaw, out int roll)
        {
            double x = rotQuaternion.X;
            double y = rotQuaternion.Y;
            double z = rotQuaternion.Z;
            double w = rotQuaternion.W;

            // Convert face rotation quaternion to Euler angles in degrees
            double yawD, pitchD, rollD;
            pitchD = Math.Atan2(2 * ((y * z) + (w * x)), (w * w) - (x * x) - (y * y) + (z * z)) / Math.PI * 180.0;
            yawD = Math.Asin(2 * ((w * y) - (x * z))) / Math.PI * 180.0;
            rollD = Math.Atan2(2 * ((x * y) + (w * z)), (w * w) + (x * x) - (y * y) - (z * z)) / Math.PI * 180.0;

            // Clamp the values to a multiple of the specified increment to control the refresh rate
            double increment = faceRotationAngleDegrees;

            // Return all these beautiful values
            pitch = (int)((pitchD + ((increment / 2.0) * (pitchD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
            yaw = (int)((yawD + ((increment / 2.0) * (yawD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
            roll = (int)((rollD + ((increment / 2.0) * (rollD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
        }

        #endregion

        #region UI Binding Sources

        /// <summary>
        /// A constructor for a captured face profile
        /// </summary>
        public class Profile
        {
            /// <summary>
            /// The name of the face being captured
            /// </summary>
            public string Name { get; set; }

            /// <summary>
            /// The priority level of the face being captured.
            /// FIXME: This should be provided as an enum rather than as an int/string
            /// </summary>
            public string Priority { get; set; }

            /// <summary>
            /// The cropped image of the face being captured
            /// </summary>
            public WriteableBitmap Face { get; set; }

            /// <summary>
            /// The file path to the gesture database associated with the face being captured
            /// </summary>
            public string GestureDB { get; set; }
        }

        /// <summary>
        /// A getter for the face frame source
        /// </summary>
        public ImageSource faceImageDisplay
        {
            get { return this.faceImageSource; }
        }

        /// <summary>
        /// A getter for the color frame source
        /// </summary>
        public ImageSource rgbImageDisplay
        {
            get { return this.rgbImageSource; }
        }

        /// <summary>
        /// A getter for the data grid showing the captured face profiles
        /// </summary>
        public List<Profile> capturedImagesDisplay
        {
            get { return this.capturedImages; }
        }

        #endregion

        #region UI Event Handlers

        /// <summary>
        /// Captures an image and the profile metadata from the form fields when the "Capture" button is clicked
        /// </summary>
        private void captureButton_click(object sender, RoutedEventArgs e)
        {
            // Sanity check to make sure there's something for us to capture in the first place
            if (rgbImageSource != null)
            {
                // Extract a crop of the face from the color image
                var result = BitmapFactory.ConvertToPbgra32Format(rgbImageSource).Crop(faceBoundingBox.Left, faceBoundingBox.Top, faceBoundingBox.Width, faceBoundingBox.Height);

                // Straighten the image by measuring the angle between the eyes and rotating it.
                // This is hypothetically an optional step, but it produces more reliable results.
                result = result.RotateFree(faceRotation);

                // Construct the face profile object
                var resultProfile = new Profile()
                {
                    Name = faceName.Text,
                    Priority = facePriority.SelectedValue.ToString(),
                    Face = result,
                    GestureDB = openGestureDBFileDialog.FileName
                };
                
                capturedImages.Add(resultProfile);

                // Update the data-grid to show the newly captured image
                // FIXME: This works about 99% of the time. I have no idea why it doesn't work 1% of the time,
                // or for that matter, what the domain of that 1% is
                capturedImagesGrid.Items.Refresh();

                // Increment the progress bar.
                // Note that the behavior of the progress bar clamps this value to progressBar.Maximum,
                // so we don't need to check for it ourselves
                progressBar.Value++;

                // Flash a message in the status bar to notify the user
                statusBarDisplay.Text = "Face information for " + faceName.Text + " captured.";

                // Enable the save button if a sufficient number of images have been captured
                if (progressBar.Value >= progressBar.Maximum)
                {
                    saveButton.IsEnabled = true;
                }
                else
                {
                    saveButton.IsEnabled = false;
                }
            }
        }

        /// <summary>
        /// Saves the user's captured face profiles to disk when the "Save" button is clicked
        /// </summary>
        private void saveButton_click(object sender, RoutedEventArgs e)
        {
            // Go through all the captured images and save them to disk
            bool saveResult = saveTrainingData(capturedImages);

            if (saveResult == true)
            {
                // Flash a message in the status bar to notify the user
                statusBarDisplay.Text = "Training data saved.";
            }
            else
            {
                statusBarDisplay.Text = "Unable to save training data. Something bad happened, and it's your job to fix it!";
            }
            
        }

        /// <summary>
        /// Shows a file dialog as a modal over the calling window when the "Browse" button is clicked.
        /// </summary>
        private void browseButton_click(object sender, RoutedEventArgs e)
        {
            // Filter the extensions that are shown in the file dialog
            openGestureDBFileDialog.DefaultExt = ".gbd";
            openGestureDBFileDialog.Filter = "Gesture Database (*.gbd, *.gba)|*.gbd;*.gba" +
                                    "|All Files (*.*)|*.*";

            // Evaluate the result of showing the file dialog. Unless unspeakable things
            // happened, this should always evaluate to true.
            Nullable<bool> openFileDialogResult = openGestureDBFileDialog.ShowDialog();

            if (openFileDialogResult == true)
            {
                // Set the display of the file path so the users have visual verification of their choice.
                browseFilePathDisplay.Text = openGestureDBFileDialog.FileName;

                // Also set the tooltip to show the file path, because the text display get truncated on overflow.
                browseFilePathDisplay.ToolTip = openGestureDBFileDialog.FileName;
            }
        }

        #endregion
    }
}