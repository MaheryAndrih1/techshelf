const loadedFonts = new Set();

/**
 * Load a Google Font dynamically
 * @param {string} fontName - The name of the font to load
 * @returns {Promise} A promise that resolves when the font is loaded
 */
export const loadGoogleFont = (fontName) => {
  if (!fontName || loadedFonts.has(fontName)) {
    return Promise.resolve();
  }

  // Common system fonts don't need to be loaded
  const systemFonts = [
    'Arial', 'Helvetica', 'Verdana', 'Tahoma', 'Trebuchet MS',
    'Times New Roman', 'Georgia', 'Garamond', 'Courier New', 'Brush Script MT',
    'sans-serif', 'serif', 'monospace', 'cursive', 'fantasy'
  ];

  if (systemFonts.includes(fontName)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    try {
      const formattedFontName = fontName.replace(/\s+/g, '+');
      const link = document.createElement('link');
      link.href = `https://fonts.googleapis.com/css2?family=${formattedFontName}:wght@400;500;700&display=swap`;
      link.rel = 'stylesheet';
      
      link.onload = () => {
        loadedFonts.add(fontName);
        resolve();
      };
      
      link.onerror = () => {
        reject(new Error(`Failed to load font: ${fontName}`));
      };
      
      document.head.appendChild(link);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Apply a font to an HTML element
 * @param {HTMLElement} element - The element to apply the font to
 * @param {string} fontName - The name of the font to apply
 */
export const applyFont = async (element, fontName) => {
  if (!element || !fontName) return;
  
  try {
    await loadGoogleFont(fontName);
    element.style.fontFamily = `'${fontName}', sans-serif`;
  } catch (error) {
    console.error('Error applying font:', error);
    element.style.fontFamily = 'sans-serif';
  }
};

export default {
  loadGoogleFont,
  applyFont
};
