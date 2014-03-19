using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Text;
using Fleck;
using Microsoft.Kinect;

namespace Kinect.Server
{
	class Program
	{
		static List<IWebSocketConnection> allSockets = new List<IWebSocketConnection> ();
		static bool _serverInitialized = false;

		static void Main (string[] args)
		{	
			InitializeKinect ();
			InitializeServer ();
		}

		private static void InitializeServer ()
		{
			var server = new WebSocketServer ("ws://localhost:1620");
			server.Start (socket => {
				socket.OnOpen = () => {
					Console.WriteLine ("Open!");
					allSockets.Add (socket);
				};
				socket.OnClose = () => {
					Console.WriteLine ("Close!");
					allSockets.Remove (socket);
				};
				socket.OnMessage = message => {
					Console.WriteLine (message);
				};
			});

			_serverInitialized = true;

			var input = Console.ReadLine ();
			while (input != "exit") {
				foreach (var socket in allSockets.ToList()) {
					socket.Send (input);
				}
				input = Console.ReadLine ();
			}
		}

		private static void InitializeKinect ()
		{
			var sensor = KinectSensor.Default;

			if (sensor != null) {
				var coordinateMapper = sensor.CoordinateMapper;

				sensor.Open ();
			}
		}
	}
}
