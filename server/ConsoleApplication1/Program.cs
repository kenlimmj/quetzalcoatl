using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.ComponentModel;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using Fleck;
using Microsoft.Kinect;
using Newtonsoft.Json;

namespace Kinect.Server
{
	class Program
	{
		// Maintain a list of all clients connected to the server
		static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection> ();

		static void Main (string[] args)
		{
			// Start the Kinect Server when the program loads
			InitializeServer ();
		}

		/// An instance starts the Kinect server
		/// Input: Unit
		/// Output: Unit
		private static void InitializeServer ()
		{	
			// Initialize a server at the address specified
			var server = new WebSocketServer ("ws://localhost:1620");
			server.Start (socket => {
				socket.OnOpen = () => {
					Console.WriteLine ("Opening a new socket...");
					allSockets.Add (socket);

					// Initialize a new Kinect object
					Kinect alpha = new Kinect ();
					alpha.InitializeKinect ();
				};
				socket.OnClose = () => {
					Console.WriteLine ("Closing all connections...");
					allSockets.Remove (socket);
				};
			});

			// Logic to allow for a soft quit of the server when "Exit" is input at the CLI
			var input = Console.ReadLine ();
			while (input != "exit") {
				foreach (var socket in allSockets.ToList()) {
					socket.Send (input);
				}
				input = Console.ReadLine ();
			}
		}

		public class Kinect
		{
			// Initialize a handler for the bodies the Kinect tracks
			private Body[] bodies = null;
			// Initialize a handler for the Kinect itself
			private KinectSensor kinectSensor = null;
			// Initialize a handler for the coordinate mapping function
			private CoordinateMapper coordinateMapper = null;
			// Initialize a buffer to handle the frames coming in from the Kinect
			private BodyFrameReader reader = null;

			public void InitializeKinect ()
			{
				// Initialize the Kinect itself. Since we're running the Dev API, there's support for only one Kinect.
				this.kinectSensor = KinectSensor.Default;

				if (this.kinectSensor != null) {
					Console.WriteLine ("Kinect detected. Awaiting start gesture...");
					allSockets.ToList ().ForEach (s => s.Send ("Kinect detected. Awaiting start gesture..."));

					// Get the coordinate mapper
					// The Kinect depth sensor measures in millimeters. CoordinateMapper converts millimeters to pixels.
					this.coordinateMapper = this.kinectSensor.CoordinateMapper;

					// Initialize the depth sensor
					this.kinectSensor.Open ();

					// Retrieve the bodies that the Kinect detects
					this.bodies = new Body[this.kinectSensor.BodyFrameSource.BodyCount];

					// Open the reader for the body frames
					this.reader = this.kinectSensor.BodyFrameSource.OpenReader ();

					if (this.reader != null) {
						// If the Kinect is connected properly, keep pulling frames from the sensor
						this.reader.FrameArrived += this.Reader_FrameArrived;
					}
				}
			}

			/// An instance handles the body frame data arriving from the sensor
			/// Input: Object sending the event and any event arguments 
			private void Reader_FrameArrived (object sender, BodyFrameArrivedEventArgs e)
			{
				BodyFrameReference frameReference = e.FrameReference;

				try {
					BodyFrame frame = frameReference.AcquireFrame ();

					if (frame != null) {
						using (frame) {
							frame.GetAndRefreshBodyData (this.bodies);

							foreach (Body body in this.bodies) {
								if (body.IsTracked) {
									IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

									// Invoke the coordinate mapper to convert the joint coordinates from millimeters to pixels
									Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point> ();
									foreach (JointType jointType in joints.Keys) {
										DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace (joints [jointType].Position);
										jointPoints [jointType] = new Point (depthSpacePoint.X, depthSpacePoint.Y);
									}
										
									if (engaged == true) {
										// If the start gesture is detected, package the current joint information and send it
										string packet = MakeJson (body.HandRightState, jointPoints [JointType.HandRight], body.HandLeftState, jointPoints [JointType.HandLeft]);
										allSockets.ToList ().ForEach (s => s.Send (packet));
										this.CheckStartStop (sender, e);
									} else {
										Console.WriteLine ("Awaiting start gesture");
										this.CheckStartStop (sender, e);
									}
								}
								//    }
							}
						}
					}
				} catch (Exception) {
					// Ignore if the frame is no longer available
				}
			}

			public bool engaged = false;

			private void CheckStartStop (object sender, BodyFrameArrivedEventArgs e)
			{
				BodyFrameReference frameReference = e.FrameReference;

				try {
					BodyFrame frame = frameReference.AcquireFrame ();

					if (frame != null) {
						using (frame) {
							frame.GetAndRefreshBodyData (this.bodies);

							foreach (Body body in this.bodies) {
								if (body.IsTracked) {
									IReadOnlyDictionary<JointType, Joint> joints = body.Joints;

									// convert the joint points to depth (display) space
									Dictionary<JointType, Point> jointPoints = new Dictionary<JointType, Point> ();
									foreach (JointType jointType in joints.Keys) {
										DepthSpacePoint depthSpacePoint = this.coordinateMapper.MapCameraPointToDepthSpace (joints [jointType].Position);
										jointPoints [jointType] = new Point (depthSpacePoint.X, depthSpacePoint.Y);
									}

									if (jointPoints [JointType.ShoulderRight].X <= jointPoints [JointType.WristRight].X && jointPoints [JointType.WristRight].X <= jointPoints [JointType.ElbowRight].X) {
										if (jointPoints [JointType.ShoulderRight].Y >= jointPoints [JointType.WristRight].Y && jointPoints [JointType.WristRight].Y <= jointPoints [JointType.ElbowRight].Y) {
											Console.WriteLine ("Start gesture detected...");
											engaged = true;
										}
									} else if (jointPoints [JointType.HandLeft].Y >= jointPoints [JointType.SpineBase].Y && jointPoints [JointType.HandRight].Y >= jointPoints [JointType.SpineBase].Y) {
										engaged = false;
									}
								}
							}
						}
					}
				} catch (Exception) {
					// ignore if the frame is no longer available
				}
			}

			/// An instance is a constructor for the JSON packet
			private class Hands
			{
				/// Right Hand Coordinates
				public double rx { get; set; }

				public double ry { get; set; }

				/// Left Hand Coordinates
				public double lx { get; set; }

				public double ly { get; set; }

				/// Left and Right Hand States
				public HandState rhandState { get; set; }

				public HandState lhandState { get; set; }

				/// Boolean States
				public bool startState { get; set; }

				public bool endState { get; set; }
			}

			/// An instance constructs a JSON from a list of parameters
			/// Input: Left and right hand coordinates, and left and right hand states
			/// Output: Formatted JSON packet
			public string MakeJson (HandState rightstate, Point rightpos, HandState leftstate, Point leftpos)
			{
				Hands hands = new Hands {
					rx = rightpos.X,
					ry = rightpos.Y,

					lx = leftpos.X,
					ly = leftpos.Y,

					rhandState = rightstate,
					lhandState = leftstate
				};

				// Create a nicely formatted JSON from the hand object
				string json = JsonConvert.SerializeObject (hands, Formatting.Indented);
				return json;
			}
		}
	}
}