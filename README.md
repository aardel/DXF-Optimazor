# DXF Optimizer

A web-based application designed to optimize the layout of DXF files for efficient sheet usage. The application helps minimize material waste by optimally arranging parts on standard sheet sizes.

## Features

- **File Management**
  - Upload and preview DXF files
  - Manage multiple parts with different quantities
  - Automatic part dimension detection
  - Preview parts before adding them to the layout

- **Sheet Settings**
  - Customizable sheet dimensions
  - Edge gap and part spacing settings
  - Material cost calculation
  - Save and manage material presets
  - Material thickness configuration

- **Optimization Options**
  - Part rotation support
  - Part mirroring support
  - Multi-part optimization
  - Visual layout preview
  - Layout comparison tool

- **Results & Export**
  - Detailed optimization results
  - Sheet utilization statistics
  - Parts distribution breakdown
  - Export individual sheets or all sheets
  - Support for print-ready PDF export

- **User Interface**
  - Dark/light mode support
  - Responsive design
  - Toast notifications
  - Loading indicators
  - Accessibility features

## Installation

1. Create a new directory for the project:
```bash
mkdir dxf-optimizer
cd dxf-optimizer
```

2. Create the necessary folders:
```bash
mkdir -p src/css src/js assets/dxf-samples
```

3. Create the `index.html` file in the `src` folder:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DXF Optimizer</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div id="app">
        <!-- App content goes here -->
    </div>
    <script src="js/app.js"></script>
</body>
</html>
```

4. Create the `styles.css` file in the `src/css` folder:
```css
/* Add your styles here */
body {
    font-family: Arial, sans-serif;
}
```

5. Create the `app.js` file in the `src/js` folder:
```javascript
// Add your JavaScript code here
document.addEventListener('DOMContentLoaded', function() {
    console.log('DXF Optimizer loaded');
});
```

6. Create the `optimizer.js` file in the `src/js` folder:
```javascript
// Add your optimization logic here
```

7. Create the `sample-generator.html` file in the `assets` folder:
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sample Generator</title>
</head>
<body>
    <h1>Sample Generator</h1>
    <script src="sample-generator.js"></script>
</body>
</html>
```

8. Create the `sample-generator.js` file in the `assets` folder:
```javascript
// Add your sample generation logic here
```

## Usage

### Adding Parts

1. Click "Upload DXF File" to select a DXF file
2. Use the "Preview File" button to verify the part
3. Set the desired quantity
4. Click "Add Part" to include it in the layout

### Configuring Sheet Settings

1. Select a material preset or enter custom dimensions
2. Set sheet width and height in millimeters
3. Configure edge gap and part spacing
4. Set material cost and thickness if needed
5. Enable/disable rotation and mirroring options

### Optimizing Layout

1. Add all required parts with quantities
2. Configure sheet settings
3. Click "Optimize Layout" to generate the layout
4. View results in the visual preview
5. Compare layouts if needed
6. Export individual sheets or all sheets

### Managing Materials

1. Click "Manage Materials" to open the materials manager
2. Add new materials with dimensions and costs
3. Edit existing materials
4. Delete unused materials
5. Select materials from the dropdown menu

## Development

### Project Structure
```
dxf-optimizer/
├── src/
│   ├── css/
│   │   └── styles.css        # Styles for the user interface
│   ├── js/
│   │   ├── app.js           # Main application logic
│   │   └── optimizer.js     # DXF optimization logic
│   └── index.html          # Main HTML document
├── assets/
│   └── dxf-samples/        # Sample DXF files for testing
└── README.md
```

### Key Components

- **DXF Parser**: Handles parsing and interpretation of DXF files
- **Optimizer**: Implements the layout optimization algorithm
- **Renderer**: Handles visual representation of DXF files and layouts
- **Material Manager**: Manages material presets and configurations
- **UI Components**: Implements user interface elements and interactions

### Algorithm Overview

The optimization algorithm uses the following strategies:
1. Part Analysis: Analyzes part dimensions and properties
2. Sheet Fitting: Determines optimal part placement
3. Rotation/Mirroring: Applies transformations when enabled
4. Space Optimization: Minimizes waste space between parts
5. Multi-sheet Distribution: Distributes parts across sheets efficiently

## Contributing

### Getting Started

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Make your changes
4. Run tests if available
5. Commit your changes (`git commit -am 'Add new feature'`)
6. Push to the branch (`git push origin feature/your-feature`)
7. Create a Pull Request

### Code Style Guidelines

- Use meaningful variable and function names
- Add comments for complex logic
- Follow consistent indentation (2 spaces)
- Break down complex functions into smaller, reusable ones
- Use TypeScript-style JSDoc comments for documentation

### Testing

- Test with various DXF files
- Verify optimization results
- Check different sheet sizes and configurations
- Test with edge cases (very large/small parts)
- Verify material cost calculations

## Troubleshooting

### Common Issues

1. **File Upload Issues**
   - Verify file format is DXF
   - Check file size limits
   - Ensure file is not corrupted

2. **Optimization Problems**
   - Check sheet dimensions
   - Verify part dimensions
   - Adjust spacing settings
   - Try enabling/disabling rotation

3. **Display Issues**
   - Clear browser cache
   - Try different browsers
   - Check zoom level
   - Verify screen resolution

### Support

If you encounter any issues or have suggestions:
1. Check existing issues on GitHub
2. Create a new issue with detailed information
3. Include steps to reproduce the problem
4. Attach relevant screenshots or files

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Acknowledgments

- DXF Parser library
- Three.js for rendering
- Contributors and testers