using System;
using System.Collections.Generic;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace facerec
{
    public class TargetFace
    {
        /// <summary>
        /// Gets or sets the key that is returned when a face is found
        /// </summary>
        public string Key { get; set; }

        /// <summary>
        /// Gets or sets the grayscale, 100x100 target image
        /// </summary>
        public Bitmap Image { get; set; }
    }
}
