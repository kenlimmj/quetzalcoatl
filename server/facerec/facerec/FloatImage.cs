using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace facerec
{
    /// <summary>
    /// An image comprised of floating point pixels
    /// </summary>
    public class FloatImage
    {
        /// <summary>
        /// Initializes a new instance of the FloatImage class
        /// </summary>
        /// <param name="width">The width of the image</param>
        /// <param name="height">The height of the image</param>
        public FloatImage(int width, int height)
        {
            this.Step = width;
            this.Size = new Size(width, height);
            this.Data = new float[width * height];
        }

        /// <summary>
        /// Gets the step size of the image (width of the row)
        /// </summary>
        public int Step { get; private set; }

        /// <summary>
        /// Gets the actual size of the image
        /// </summary>
        public Size Size { get; private set; }

        /// <summary>
        /// Gets the raw image data
        /// </summary>
        public float[] Data { get; private set; }
    }
}
