using Emgu.CV;
using Emgu.CV.Structure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Xml;

namespace facerec
{
    public class Classifier_Train
    {
        #region variables

        private float eigenDistance = 0;
        private string eigenLabel;
        private string error;
        private List<string> namesList = new List<string>();
        private List<int> namesListId = new List<int>();
        private int numLabels;
        private FaceRecognizer recognizer;

        private List<Image<Gray, Byte>> trainingImages = new List<Image<Gray, Byte>>();
        private bool trainStatus = false;
        #endregion variables

        #region constructors

        public Classifier_Train()
        {
            trainStatus = loadTrainingData(System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/");
        }

        public Classifier_Train(string trainingFolder)
        {
            trainStatus = loadTrainingData(trainingFolder);
        }

        #endregion constructors

        public void dispose()
        {
            // Nullify all initialized variables
            recognizer = null;
            trainingImages = null;
            namesList = null;
            namesListId = null;
            error = null;

            // Garbage collect everything
            GC.Collect();
        }

        /// <summary>
        /// Uses LBHP face recognizer to identify a face in an image.
        /// </summary>
        /// <param name="inputImage">The image containing the face to be identified.</param>
        /// <returns>The name/label of the face identified in the image, and "Unknown" otherwise.</returns>
        public Dictionary<string, dynamic> recognize(Image<Gray, Byte> inputImage)
        {
            if (trainStatus)
            {
                FaceRecognizer.PredictionResult result = recognizer.Predict(inputImage);

                if (result.Label == -1)
                {
                    eigenLabel = "Unknown";
                    eigenDistance = 0;
                }
                else
                {
                    eigenLabel = namesList[result.Label];
                    eigenDistance = (float)result.Distance;
                }

                Dictionary<string, dynamic> eigenData = new Dictionary<string, dynamic>();

                eigenData.Add("name", eigenLabel);
                eigenData.Add("confidence", eigenDistance);

                return eigenData;
            }
            else
            {
                return null;
            }
        }

        #region recognizerMethods

        public void loadRecognizer(string fileName)
        {
            // Reinitialize the recognizer and load in the file
            recognizer = new LBPHFaceRecognizer(1, 8, 8, 9, 100);
            recognizer.Load(fileName);

            string directory = Path.GetDirectoryName(fileName);

            // Purge all existing name labels
            namesList.Clear();

            if (File.Exists(directory + "/TrainedLabels.xml"))
            {
                // Read the file into memory
                FileStream fileStream = File.OpenRead(directory + "/TrainedLabels.xml");
                long fileLength = fileStream.Length;
                byte[] xmlBytes = new byte[fileLength];
                fileStream.Read(xmlBytes, 0, (int)fileLength);
                fileStream.Close();

                MemoryStream xmlStream = new MemoryStream(xmlBytes);

                using (XmlReader xmlReader = XmlTextReader.Create(xmlStream))
                {
                    while (xmlReader.Read())
                    {
                        if (xmlReader.IsStartElement())
                        {
                            switch (xmlReader.Name)
                            {
                                case "NAME":
                                    if (xmlReader.Read())
                                    {
                                        namesList.Add(xmlReader.Value.Trim());
                                    }
                                    break;
                            }
                        }
                    }
                }
            }
            trainStatus = true;
        }

        public bool reTrain()
        {
            return trainStatus = loadTrainingData(System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/");
        }

        public bool reTrain(string trainingFolder)
        {
            return trainStatus = loadTrainingData(trainingFolder);
        }

        /// <summary>
        /// Saves a trained recognizer to disk.
        /// </summary>
        /// <param name="fileName">The filename to be utilized when saving the recognizer.</param>
        public void saveRecognizer(string fileName)
        {
            recognizer.Save(fileName);

            string direct = Path.GetDirectoryName(fileName);
            FileStream labelData = File.OpenWrite(direct + "/TrainedLabels.xml");

            using (XmlWriter writer = XmlWriter.Create(labelData))
            {
                writer.WriteStartDocument();
                writer.WriteStartElement("recognizer_labels");

                for (int i = 0; i < namesList.Count; i++)
                {
                    writer.WriteStartElement("LABEL");
                    writer.WriteElementString("POS", i.ToString());
                    writer.WriteElementString("NAME", namesList[i]);
                    writer.WriteEndElement();
                }

                writer.WriteEndElement();
                writer.WriteEndDocument();
            }

            labelData.Close();
        }
        private bool loadTrainingData(string folderLocation)
        {
            if (File.Exists(folderLocation + "/TrainedLabels.xml"))
            {
                try
                {
                    // Purge all existing data
                    namesList.Clear();
                    trainingImages.Clear();

                    // Read the XML file into memory
                    FileStream fileStream = File.OpenRead(folderLocation + "/TrainedLabels.xml");
                    long fileLength = fileStream.Length;
                    byte[] xmlBytes = new byte[fileLength];
                    fileStream.Read(xmlBytes, 0, (int)fileLength);
                    fileStream.Close();

                    MemoryStream xmlStream = new MemoryStream(xmlBytes);

                    using (XmlReader xmlReader = XmlTextReader.Create(xmlStream))
                    {
                        while (xmlReader.Read())
                        {
                            if (xmlReader.IsStartElement())
                            {
                                switch (xmlReader.Name)
                                {
                                    case "NAME":
                                        if (xmlReader.Read())
                                        {
                                            // Add the name to the data set
                                            namesList.Add(xmlReader.Value.Trim());

                                            // Store an identifier. This is merely the position in namesList
                                            namesListId.Add((namesList.Count));

                                            // Increment the counter for entries in the data set
                                            numLabels += 1;
                                        }
                                        break;

                                    case "FILE":
                                        if (xmlReader.Read())
                                        {
                                            // Add the image to the data set
                                            trainingImages.Add(new Image<Gray, Byte>(System.AppDomain.CurrentDomain.BaseDirectory + "/TrainedFaces/" + xmlReader.Value.Trim()));
                                        }
                                        break;
                                }
                            }
                        }
                    }

                    if (trainingImages.ToArray().Length != 0)
                    {
                        recognizer = new LBPHFaceRecognizer(1, 8, 8, 9, 100);
                        recognizer.Train(trainingImages.ToArray(), namesListId.ToArray());

                        return true;
                    }
                    else
                    {
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    error = ex.ToString();
                    return false;
                }
            }
            else
            {
                return false;
            }
        }

        #endregion recognizerMethods

        #region getters

        public float getEigenDistance
        {
            get { return eigenDistance; }
        }

        public string getEigenLabel
        {
            get { return eigenLabel; }
        }

        public bool isTrained
        {
            get { return trainStatus; }
        }
        #endregion getters
    }
}