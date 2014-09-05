using Microsoft.Kinect;
using Microsoft.Kinect.Face;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Media;
using System.Windows.Media.Imaging;

namespace facerec
{
    public partial class MainWindow : Window
    {
        #region Variables

        // Face Recognition
        public Classifier_Train eigenRecog = new Classifier_Train();

        // Face Detection
        private const double drawFaceShapeThickness = 8;

        private const double facePointRadius = 2;
        private const double drawTextFontSize = 45;
        private const double textLayoutOffsetY = 10.0;
        private const double faceRotationAngleDegrees = 5.0;
        private List<Brush> faceBrush;

        // Body Objects
        private Body[] bodies = null;

        private List<Tuple<JointType, JointType>> bones;
        private List<Pen> bodyColors;

        // Body Drawing Variables
        private int bodyCount;

        private const double handSize = 30;
        private const double jointThickness = 2;
        private const double clipBoundsThickness = 10;
        private const float inferredZPositionClamp = 0.1f;

        // Handstate Indicators
        private readonly Brush handClosedBrush = new SolidColorBrush(Color.FromArgb(128, 255, 0, 0));

        private readonly Brush handOpenBrush = new SolidColorBrush(Color.FromArgb(128, 0, 255, 0));
        private readonly Brush handLassoBrush = new SolidColorBrush(Color.FromArgb(128, 0, 0, 255));

        // Joint/Bone Indicators
        private readonly Brush trackedJointBrush = new SolidColorBrush(Color.FromArgb(255, 68, 192, 68));

        private readonly Brush inferredJointBrush = Brushes.Yellow;
        private readonly Pen inferredBonePen = new Pen(Brushes.Gray, 1);

        // On-screen data binds
        private DrawingGroup skeletalDrawingGroup;

        private DrawingImage skeletalImageSource;

        private DrawingGroup faceDrawingGroup;
        private DrawingImage faceImageSource;

        private WriteableBitmap rgbImageSource = null;

        // Sensor Dimensions
        private int bodyDisplayWidth;
        private int bodyDisplayHeight;
        private int colorDisplayWidth;
        private int colorDisplayHeight;

        // Kinect Sensor
        private KinectSensor kinectSensor = null;
        private bool isCaptureInProgress = false;

        // Kinect Readers
        private CoordinateMapper coordinateMapper = null;
        private BodyFrameReader bodyFrameReader = null;
        private ColorFrameReader colorFrameReader = null;
        private FaceFrameReader[] faceFrameReaders = null;

        // Kinect Sources
        private FaceFrameSource[] faceFrameSources = null;
        private FaceFrameResult[] faceFrameResults = null;

        #endregion Variables

        #region Window Handlers

        public MainWindow()
        {
            InitializeComponent();

            // Set the console's default output location to the console text block
            ConsoleOutputter outputter = new ConsoleOutputter(consoleDisplay);
            Console.SetOut(outputter);

            if (eigenRecog.isTrained)
            {
                statusBarDisplay.Text = "Training data loaded from default location. Face recognition is working in the background.";
            }
            else
            {
                statusBarDisplay.Text = "No training data found. Face recognition will not be possible. Select 'Load Face Recognition Data' to provide a training set.";
            }
        }

        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            startKinectCapture();
        }

        private void Window_Closing(object sender, CancelEventArgs e)
        {
            stopKinectCapture();
        }

        #endregion Window Handlers

        #region Initializers and Destroyers

        public void startKinectCapture()
        {
            initializeKinect();

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

            // Set the data context for the window
            this.DataContext = this;

            // Set the capture button text in File > Start Capture to File > Stop Capture
            captureStartButton.Header = "Stop Capture";
            statusBarDisplay.Text = "Kinect capture started.";

            // Switch the capture state
            isCaptureInProgress = true;
        }

        public void stopKinectCapture()
        {
            // Shutdown the body frame reader
            if (this.bodyFrameReader != null)
            {
                // BodyFrameReader is IDisposable
                this.bodyFrameReader.Dispose();
                this.bodyFrameReader = null;
            }

            // Shut down the RGB frame reader
            if (this.colorFrameReader != null)
            {
                // ColorFrameReder is IDisposable
                this.colorFrameReader.Dispose();
                this.colorFrameReader = null;
            }

            for (int i = 0; i < this.bodyCount; i++)
            {
                if (this.faceFrameReaders[i] != null)
                {
                    // FaceFrameReader is IDisposable
                    this.faceFrameReaders[i].Dispose();
                    this.faceFrameReaders[i] = null;
                }

                if (this.faceFrameSources[i] != null)
                {
                    // FaceFrameSource is IDisposable
                    this.faceFrameSources[i].Dispose();
                    this.faceFrameSources[i] = null;
                }
            }

            // Lastly, shut down the Kinect sensor itself
            if (this.kinectSensor != null)
            {
                this.kinectSensor.Close();
                this.kinectSensor = null;
            }

            // Set the capture button text in File > Stop Capture to File > Start Capture
            captureStartButton.Header = "Start Capture";
            statusBarDisplay.Text = "Kinect capture stopped.";

            // Switch the capture state
            isCaptureInProgress = false;
        }

        public void initializeKinect()
        {
            #region Sensor Dimensions

            // Initialize the Kinect sensor.
            this.kinectSensor = KinectSensor.GetDefault();

            // Initialize the coordinate mapper to map coordinates from depth space to screen space
            this.coordinateMapper = this.kinectSensor.CoordinateMapper;

            // Get the sensor dimensions
            FrameDescription bodyFrameDescription = this.kinectSensor.DepthFrameSource.FrameDescription;
            FrameDescription colorFrameDescription = this.kinectSensor.ColorFrameSource.CreateFrameDescription(ColorImageFormat.Bgra);

            // Assign the dimensions to local variables
            this.bodyDisplayWidth = bodyFrameDescription.Width;
            this.bodyDisplayHeight = bodyFrameDescription.Height;
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

            #region Bones

            // A bone defined as a line between two joints
            this.bones = new List<Tuple<JointType, JointType>>();

            // Torso
            this.bones.Add(new Tuple<JointType, JointType>(JointType.Head, JointType.Neck));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.Neck, JointType.SpineShoulder));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineShoulder, JointType.SpineMid));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineMid, JointType.SpineBase));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineShoulder, JointType.ShoulderRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineShoulder, JointType.ShoulderLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineBase, JointType.HipRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.SpineBase, JointType.HipLeft));

            // Right Arm
            this.bones.Add(new Tuple<JointType, JointType>(JointType.ShoulderRight, JointType.ElbowRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.ElbowRight, JointType.WristRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.WristRight, JointType.HandRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.HandRight, JointType.HandTipRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.WristRight, JointType.ThumbRight));

            // Left Arm
            this.bones.Add(new Tuple<JointType, JointType>(JointType.ShoulderLeft, JointType.ElbowLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.ElbowLeft, JointType.WristLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.WristLeft, JointType.HandLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.HandLeft, JointType.HandTipLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.WristLeft, JointType.ThumbLeft));

            // Right Leg
            this.bones.Add(new Tuple<JointType, JointType>(JointType.HipRight, JointType.KneeRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.KneeRight, JointType.AnkleRight));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.AnkleRight, JointType.FootRight));

            // Left Leg
            this.bones.Add(new Tuple<JointType, JointType>(JointType.HipLeft, JointType.KneeLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.KneeLeft, JointType.AnkleLeft));
            this.bones.Add(new Tuple<JointType, JointType>(JointType.AnkleLeft, JointType.FootLeft));

            #endregion Bones

            #region Drawing Colors

            // Populate body colors, one for each BodyIndex
            this.bodyColors = new List<Pen>()
            {
                new Pen(Brushes.Red, 6),
                new Pen(Brushes.Orange, 6),
                new Pen(Brushes.Green, 6),
                new Pen(Brushes.Blue, 6),
                new Pen(Brushes.Indigo, 6),
                new Pen(Brushes.Violet, 6)
            };

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

            #region GUI Objects

            // Create the skeletal canvas to be displayed
            this.skeletalDrawingGroup = new DrawingGroup();
            this.skeletalImageSource = new DrawingImage(this.skeletalDrawingGroup);

            // Creates the face recognition canvas to be displayed
            this.faceDrawingGroup = new DrawingGroup();
            this.faceImageSource = new DrawingImage(this.faceDrawingGroup);

            // Create the color bitmap to be displayed
            this.rgbImageSource = new WriteableBitmap(colorDisplayWidth, colorDisplayHeight, 96.0, 96.0, PixelFormats.Bgr32, null);

            // Allocate storage to store face frame detection results for each face in the FOV
            this.faceFrameResults = new FaceFrameResult[this.bodyCount];

            #endregion GUI Objects
        }

        #endregion Initializers and Destroyers

        #region Source Readers

        private void Reader_BodyFrameArrived(object sender, BodyFrameArrivedEventArgs e)
        {
            using (BodyFrame bodyFrame = e.FrameReference.AcquireFrame())
            {
                if (bodyFrame != null)
                {
                    bodyFrame.GetAndRefreshBodyData(this.bodies);

                    using (DrawingContext dc = this.skeletalDrawingGroup.Open())
                    {
                        // Draw a white background to set the drawing box
                        dc.DrawRectangle(Brushes.White, null, new Rect(0.0, 0.0, this.bodyDisplayWidth, this.bodyDisplayHeight));

                        int penIndex = 0;

                        foreach (Body body in this.bodies)
                        {
                            Pen drawPen = this.bodyColors[penIndex++];

                            if (body.IsTracked)
                            {
                                this.DrawClippedEdges(body, dc);

                                IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

                                // convert the joint points to depth (display) space
                                Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point>();

                                foreach (JointType jointType in joints.Keys)
                                {
                                    // sometimes the depth(Z) of an inferred joint may show as negative
                                    // clamp down to 0.1f to prevent coordinatemapper from returning (-Infinity, -Infinity)
                                    CameraSpacePoint position = joints[jointType].Position;
                                    if (position.Z < 0)
                                    {
                                        position.Z = inferredZPositionClamp;
                                    }

                                    DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace(position);
                                    jointPoints[jointType] = new Point(depthSpacePoint.X, depthSpacePoint.Y);
                                }

                                this.DrawBody(joints, jointPoints, dc, drawPen);

                                this.DrawHand(body.HandLeftState, jointPoints[JointType.HandLeft], dc);
                                this.DrawHand(body.HandRightState, jointPoints[JointType.HandRight], dc);
                            }
                        }
                    }

                    using (DrawingContext dc = this.faceDrawingGroup.Open())
                    {
                        // Draw a white background to set the drawing box
                        dc.DrawRectangle(Brushes.White, null, new Rect(0.0, 0.0, this.colorDisplayWidth, this.colorDisplayHeight));

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

                        // Prevent drawing outside of our render area
                        this.skeletalDrawingGroup.ClipGeometry = new RectangleGeometry(new Rect(0.0, 0.0, this.bodyDisplayWidth, this.bodyDisplayHeight));
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

        #endregion Source Readers

        #region Drawing Functions

        private void DrawBody(IReadOnlyDictionary<JointType, Joint> joints, IDictionary<JointType, Point> jointPoints, DrawingContext drawingContext, Pen drawingPen)
        {
            // Draw the bones
            foreach (var bone in this.bones)
            {
                this.DrawBone(joints, jointPoints, bone.Item1, bone.Item2, drawingContext, drawingPen);
            }

            // Draw the joints
            foreach (JointType jointType in joints.Keys)
            {
                Brush drawBrush = null;

                TrackingState trackingState = joints[jointType].TrackingState;

                if (trackingState == TrackingState.Tracked)
                {
                    drawBrush = this.trackedJointBrush;
                }
                else if (trackingState == TrackingState.Inferred)
                {
                    drawBrush = this.inferredJointBrush;
                }

                if (drawBrush != null)
                {
                    drawingContext.DrawEllipse(drawBrush, null, jointPoints[jointType], jointThickness, jointThickness);
                }
            }
        }

        private void DrawBone(IReadOnlyDictionary<JointType, Joint> joints, IDictionary<JointType, Point> jointPoints, JointType jointType0, JointType jointType1, DrawingContext drawingContext, Pen drawingPen)
        {
            Joint joint0 = joints[jointType0];
            Joint joint1 = joints[jointType1];

            // If we can't find either of these joints, exit
            if (joint0.TrackingState == TrackingState.NotTracked ||
                joint1.TrackingState == TrackingState.NotTracked)
            {
                return;
            }

            // We assume all drawn bones are inferred unless BOTH joints are tracked
            Pen drawPen = this.inferredBonePen;
            if ((joint0.TrackingState == TrackingState.Tracked) && (joint1.TrackingState == TrackingState.Tracked))
            {
                drawPen = drawingPen;
            }

            drawingContext.DrawLine(drawPen, jointPoints[jointType0], jointPoints[jointType1]);
        }

        private void DrawHand(HandState handState, Point handPosition, DrawingContext drawingContext)
        {
            switch (handState)
            {
                case HandState.Closed:
                    drawingContext.DrawEllipse(this.handClosedBrush, null, handPosition, handSize, handSize);
                    break;

                case HandState.Open:
                    drawingContext.DrawEllipse(this.handOpenBrush, null, handPosition, handSize, handSize);
                    break;

                case HandState.Lasso:
                    drawingContext.DrawEllipse(this.handLassoBrush, null, handPosition, handSize, handSize);
                    break;
            }
        }

        private void DrawClippedEdges(Body body, DrawingContext drawingContext)
        {
            FrameEdges clippedEdges = body.ClippedEdges;

            if (clippedEdges.HasFlag(FrameEdges.Bottom))
            {
                drawingContext.DrawRectangle(
                    Brushes.Red,
                    null,
                    new Rect(0, this.bodyDisplayHeight - clipBoundsThickness, this.bodyDisplayWidth, clipBoundsThickness));
            }

            if (clippedEdges.HasFlag(FrameEdges.Top))
            {
                drawingContext.DrawRectangle(
                    Brushes.Red,
                    null,
                    new Rect(0, 0, this.bodyDisplayWidth, clipBoundsThickness));
            }

            if (clippedEdges.HasFlag(FrameEdges.Left))
            {
                drawingContext.DrawRectangle(
                    Brushes.Red,
                    null,
                    new Rect(0, 0, clipBoundsThickness, this.bodyDisplayHeight));
            }

            if (clippedEdges.HasFlag(FrameEdges.Right))
            {
                drawingContext.DrawRectangle(
                    Brushes.Red,
                    null,
                    new Rect(this.bodyDisplayWidth - clipBoundsThickness, 0, clipBoundsThickness, this.bodyDisplayHeight));
            }
        }

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
            var faceBoxSource = faceResult.FaceBoundingBoxInColorSpace;
            Rect faceBox = new Rect(faceBoxSource.Left, faceBoxSource.Top, faceBoxSource.Width, faceBoxSource.Height);
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

            // convert face rotation quaternion to Euler angles in degrees
            double yawD, pitchD, rollD;
            pitchD = Math.Atan2(2 * ((y * z) + (w * x)), (w * w) - (x * x) - (y * y) + (z * z)) / Math.PI * 180.0;
            yawD = Math.Asin(2 * ((w * y) - (x * z))) / Math.PI * 180.0;
            rollD = Math.Atan2(2 * ((x * y) + (w * z)), (w * w) + (x * x) - (y * y) - (z * z)) / Math.PI * 180.0;

            // clamp the values to a multiple of the specified increment to control the refresh rate
            double increment = faceRotationAngleDegrees;
            pitch = (int)((pitchD + ((increment / 2.0) * (pitchD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
            yaw = (int)((yawD + ((increment / 2.0) * (yawD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
            roll = (int)((rollD + ((increment / 2.0) * (rollD > 0 ? 1.0 : -1.0))) / increment) * (int)increment;
        }

        #endregion Drawing Functions

        #region UI Binding Sources

        public ImageSource skeletalImageDisplay
        {
            get { return this.skeletalImageSource; }
        }

        public ImageSource faceImageDisplay
        {
            get { return this.faceImageSource; }
        }

        public ImageSource rgbImageDisplay
        {
            get { return this.rgbImageSource; }
        }

        #endregion UI Binding Sources

        #region UI Event Handlers

        private void captureFaces_Click(object sender, RoutedEventArgs e)
        {
            // Stop the feed on the main window
            //stopWebcamCapture();

            // Create a new training form window
            TrainingForm tf = new TrainingForm(this);

            // Display the window
            tf.Show();
        }

        private void kinectCapture_Click(object sender, RoutedEventArgs e)
        {
            if (isCaptureInProgress)
            {
                stopKinectCapture();
            }
            else
            {
                startKinectCapture();
            }
        }

        private void loadFaces_Click(object sender, RoutedEventArgs e)
        {
            FolderBrowserDialog openFolderDialog = new System.Windows.Forms.FolderBrowserDialog();
            openFolderDialog.ShowDialog();

            var loadResult = eigenRecog.reTrain(openFolderDialog.SelectedPath);

            if (loadResult == true)
            {
                statusBarDisplay.Text = "Training data loaded from " + openFolderDialog.SelectedPath + ". Face recognition is working in the background.";
            }
            else
            {
                statusBarDisplay.Text = "No valid training data found. Generate new training data using the 'Capture Faces' function.";
            }
        }

        private void clearConsoleButton_Click(object sender, RoutedEventArgs e)
        {
            consoleDisplay.Text = "";
        }

        private void clearFaces_Click(object sender, RoutedEventArgs e)
        {
            MessageBoxResult confirmationResult = System.Windows.MessageBox.Show("Are you sure? This will remove all saved faces and profile metadata.", "Delete Confirmation", System.Windows.MessageBoxButton.YesNo);

            if (confirmationResult == MessageBoxResult.Yes)
            {
                string directoryPath = System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/";

                if (Directory.Exists(directoryPath))
                {
                    Directory.Delete(directoryPath, true);

                    statusBarDisplay.Text = "Training data purged. It was fun while it lasted...";
                }
                else
                {
                    statusBarDisplay.Text = "Training directory does not exist. No action needed.";
                }
            }
        }

        private void openFacesFolder_Click(object sender, RoutedEventArgs e)
        {
            string directoryPath = System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/";

            if (Directory.Exists(directoryPath))
            {
                Process.Start(directoryPath);
            }
        }

        #endregion UI Event Handlers
    }
}