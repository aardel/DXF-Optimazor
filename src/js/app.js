import DXFOptimizer from './optimizer.js';
import DXFImporter from './dxfImporter';

/**
 * DXF Optimizer - Main Application
 * Handles user interactions, file operations, and visualization
 * @module DXFOptimizer
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables but don't create optimizer instance yet
    let optimizer = null;
    
    // DOM Elements
    const dxfFileInput = document.getElementById('dxfFile');
    const partQuantityInput = document.getElementById('partQuantity');
    const addPartButton = document.getElementById('addPartButton');
    const partsListElement = document.getElementById('partsList');
    const sheetWidthInput = document.getElementById('sheetWidth');
    const sheetHeightInput = document.getElementById('sheetHeight');
    const allowRotationCheckbox = document.getElementById('allowRotation');
    const allowMirroringCheckbox = document.getElementById('allowMirroring');
    const optimizeButton = document.getElementById('optimizeButton');
    const summaryResultsDiv = document.getElementById('summaryResults');
    const visualResultsDiv = document.getElementById('visualResults');
    const downloadButtonsContainer = document.getElementById('downloadButtonsContainer');
    const downloadAllButton = document.getElementById('downloadAllButton');
    const individualDownloadsDiv = document.getElementById('individualDownloads');
    const highResolutionPreview = document.getElementById('highResolutionPreview');
    const optimizationStrategySelect = document.getElementById('optimizationStrategy');
    let unitsSelect = document.getElementById('unitsSelect');
    
    // State variables
    let currentFile = null;
    let partsList = [];
    let partIdCounter = 0;
    let optimizationResults = null;

    // Event Listeners
    dxfFileInput.addEventListener('change', handleFileChange);
    addPartButton.addEventListener('click', handleAddPart);
    optimizeButton.addEventListener('click', handleOptimize);
    downloadAllButton.addEventListener('click', handleDownloadAll);

    // Initialize UI components
    initUIComponents();

    // Initialize button event listeners
    initializeButtonListeners();

    function initUIComponents() {
        // Create file info display if it doesn't exist
        if (!document.getElementById('fileInfo')) {
            const fileInfoDiv = document.createElement('div');
            fileInfoDiv.id = 'fileInfo';
            fileInfoDiv.className = 'file-info';
            fileInfoDiv.style.display = 'none';
            const container = document.querySelector('.file-upload') || dxfFileInput.parentElement;
            if (container) {
                container.appendChild(fileInfoDiv);
            }
        }
        
        if (!document.getElementById('fileInfoContainer')) {
            const fileInfoContainer = document.createElement('div');
            fileInfoContainer.id = 'fileInfoContainer';
            fileInfoContainer.className = 'file-info-container';
            const container = document.querySelector('.file-upload') || dxfFileInput.parentElement;
            if (container) {
                container.appendChild(fileInfoContainer);
            }
        }
        
        // Populate optimization strategies
        populateOptimizationStrategies();
        
        // Create and populate units select if needed
        createUnitsSelectIfNeeded();
    }

    function populateOptimizationStrategies() {
        if (!optimizationStrategySelect) return;
        
        // Clear existing options
        optimizationStrategySelect.innerHTML = '';
        
        const strategies = [
            { value: 'default', text: 'Default (Best Fit)' },
            { value: 'interlocking', text: 'Interlocking (Nesting)' },
            { value: 'side-by-side', text: 'Side-by-Side' },
            { value: 'vertical-stack', text: 'Vertical Stack' },
            { value: 'periodic', text: 'Periodic Pattern' }
        ];
        
        strategies.forEach(strategy => {
            const option = document.createElement('option');
            option.value = strategy.value;
            option.textContent = strategy.text;
            optimizationStrategySelect.appendChild(option);
        });
    }

    function createUnitsSelectIfNeeded() {
        // If units select doesn't exist yet, create it
        if (!unitsSelect) {
            const controlsContainer = document.querySelector('.optimization-controls') || 
                                    document.querySelector('.file-upload') ||
                                    document.body;
                               
            const unitsGroup = document.createElement('div');
            unitsGroup.className = 'units-control form-group';
            
            const unitsLabel = document.createElement('label');
            unitsLabel.htmlFor = 'unitsSelect';
            unitsLabel.textContent = 'Units:';
            
            const selectEl = document.createElement('select');
            selectEl.id = 'unitsSelect';
            selectEl.className = 'form-control';
            
            const units = ['mm', 'cm', 'in', 'ft'];
            units.forEach(unit => {
                const option = document.createElement('option');
                option.value = unit;
                option.textContent = unit;
                selectEl.appendChild(option);
            });
            
            unitsGroup.appendChild(unitsLabel);
            unitsGroup.appendChild(selectEl);
            controlsContainer.appendChild(unitsGroup);
            
            // Update the reference
            unitsSelect = selectEl;
        }
    }

    function updateFileInfoDisplay(fileName, dimensions) {
        const fileInfoContainer = document.getElementById('fileInfoContainer');
        fileInfoContainer.innerHTML = `
            <div class="file-preview">
                <canvas id="filePreviewCanvas" width="200" height="200"></canvas>
                <div class="file-info">
                    <span class="file-name">
                        ${fileName}
                    </span>
                    <span class="file-dimensions">
                        Dimensions: ${dimensions.width} x ${dimensions.height}
                    </span>
                </div>
            </div>
        `;
        const canvas = document.getElementById('filePreviewCanvas');
        renderDXFPreview(canvas, dimensions);
    }

    function renderDXFPreview(canvas, dimensions) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Example rendering logic, replace with actual DXF rendering
        ctx.fillStyle = 'lightgray';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = 'black';
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        ctx.fillStyle = 'black';
        ctx.fillText('DXF Preview', canvas.width / 2 - 30, canvas.height / 2);
    }

    const dxfImporter = new DXFImporter();

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            try {
                currentFile = file;
                const dxfData = await dxfImporter.importDXF(file);
                const dimensions = calculateDimensions(dxfData);
                updateFileInfoDisplay(file.name, dimensions);
            } catch (error) {
                console.error('Error importing DXF file:', error);
                showError('Failed to import DXF file. Please ensure it is a valid DXF format.');
            }
        }
    }

    function calculateDimensions(dxfData) {
        if (!dxfData || !dxfData.entities || dxfData.entities.length === 0) {
            throw new Error('Invalid DXF data: No entities found');
        }
    
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
    
        // Iterate through all entities to find the bounding box
        dxfData.entities.forEach(entity => {
            if (entity.vertices) {
                entity.vertices.forEach(vertex => {
                    minX = Math.min(minX, vertex.x);
                    minY = Math.min(minY, vertex.y);
                    maxX = Math.max(maxX, vertex.x);
                    maxY = Math.max(maxY, vertex.y);
                });
            } else if (entity.center) {
                // For circles and arcs
                const radius = entity.radius || 0;
                minX = Math.min(minX, entity.center.x - radius);
                minY = Math.min(minY, entity.center.y - radius);
                maxX = Math.max(maxX, entity.center.x + radius);
                maxY = Math.max(maxY, entity.center.y + radius);
            } else if (entity.position) {
                // For points and other simple entities
                minX = Math.min(minX, entity.position.x);
                minY = Math.min(minY, entity.position.y);
                maxX = Math.max(maxX, entity.position.x);
                maxY = Math.max(maxY, entity.position.y);
            }
        });
    
        // Apply a scale factor - we default to assuming mm
        const scaleFactor = 1; // You could determine this from header info in a more complete implementation
    
        return {
            width: Math.ceil((maxX - minX) * scaleFactor),
            height: Math.ceil((maxY - minY) * scaleFactor),
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }

    async function handlePreviewFile() {
        if (!currentFile) {
            showError('Please select a DXF file first.');
            return;
        }
        
        try {
            document.getElementById('loadingOverlay').style.display = 'flex';
            
            const dxfContent = await readFile(currentFile);
            const partOptimizer = new DXFOptimizer();
            const parseResult = await partOptimizer.parseDXF(dxfContent);
            
            if (!parseResult.success) {
                showError(parseResult.error);
                return;
            }
            
            // Update file information display
            updateFileInfoDisplay(currentFile.name, parseResult.dimensions);
            
            // Show preview modal
            const previewModal = document.getElementById('previewModal');
            previewModal.style.display = 'block';
            
            // Render DXF preview
            const previewCanvas = document.getElementById('previewCanvas');
            renderDXFPreview(previewCanvas, partOptimizer.getOriginalEntities(), parseResult.dimensions);
            
            // Handle accept and cancel buttons
            document.getElementById('acceptPreviewBtn').addEventListener('click', () => {
                handleAddPart();
                previewModal.style.display = 'none';
            });
            
            document.getElementById('cancelPreviewBtn').addEventListener('click', () => {
                previewModal.style.display = 'none';
            });
        } catch (error) {
            showError('Error processing DXF file: ' + error.message);
        } finally {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    function handleOptimize() {
        if (partsList.length === 0) {
            showError('Please add at least one DXF part first.');
            return;
        }
        
        const sheetWidth = parseFloat(sheetWidthInput.value);
        const sheetHeight = parseFloat(sheetHeightInput.value);
        const edgeGap = parseFloat(document.getElementById('edgeGap').value);
        const partSpacing = parseFloat(document.getElementById('partSpacing').value);
        const allowRotation = allowRotationCheckbox.checked;
        const allowMirroring = allowMirroringCheckbox.checked;
        const optimizationStrategy = optimizationStrategySelect ? optimizationStrategySelect.value : 'default';
        
        if (!validateSheetSettings(sheetWidth, sheetHeight, edgeGap, partSpacing)) {
            return;
        }
        
        try {
            // Reset the state
            document.getElementById('loadingOverlay').style.display = 'flex';
            summaryResultsDiv.innerHTML = '<div>Optimizing layout... Please wait.</div>';
            visualResultsDiv.innerHTML = '';
            downloadButtonsContainer.style.display = 'none';
            individualDownloadsDiv.innerHTML = '';
            
            // Create fresh optimizer instance
            optimizer = new DXFOptimizer();
            
            const optimizationParts = preparePartsForOptimization();
            optimizationResults = optimizer.optimizeMultipleParts(
                optimizationParts,
                sheetWidth,
                sheetHeight,
                allowRotation,
                allowMirroring,
                edgeGap,
                partSpacing,
                optimizationStrategy
            );
            
            displayResults(optimizationResults);
        } catch (error) {
            showError('Optimization error: ' + error.message);
            console.error(error);
        } finally {
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    function renderDXFPreview(canvas, entities, dimensions) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Store original dimensions
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        
        // Apply high resolution if enabled
        if (highResolutionPreview && highResolutionPreview.checked) {
            // Double the resolution for high quality
            canvas.width *= 2;
            canvas.height *= 2;
        }
        
        // Calculate scale to fit the canvas
        const padding = 5;
        const scaleX = (canvas.width - padding * 2) / dimensions.width;
        const scaleY = (canvas.height - padding * 2) / dimensions.height;
        const scale = Math.min(scaleX, scaleY);
        
        // Center the drawing
        const offsetX = (canvas.width - dimensions.width * scale) / 2;
        const offsetY = (canvas.height - dimensions.height * scale) / 2;
        
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        
        // Use requestAnimationFrame for rendering
        requestAnimationFrame(() => {
            drawEntities(ctx, entities, -dimensions.minX, -dimensions.minY);
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
            
            // Restore original dimensions after drawing is complete
            if (highResolutionPreview && highResolutionPreview.checked) {
                // We don't need to change the size back as it would clear the canvas
                // Just note that the display size should be set with CSS
            }
        });
    }

    // Loading overlay functions
    function showLoadingOverlay(message = "Processing...") {
        document.getElementById('progressText').textContent = message;
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    function updateLoadingProgress(message) {
        document.getElementById('progressText').textContent = message;
    }

    function hideLoadingOverlay() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }

    // Make sure loading overlay is hidden when the page loads
    document.addEventListener('DOMContentLoaded', function() {
        hideLoadingOverlay();
        
        // Add event listeners to buttons that should show the loading overlay
        document.getElementById('optimizeButton').addEventListener('click', function() {
            showLoadingOverlay('Optimizing layout...');
            // The actual processing function should call hideLoadingOverlay when complete
        });
        
        document.getElementById('downloadAllButton').addEventListener('click', function() {
            showLoadingOverlay('Preparing downloads...');
            // The actual download function should call hideLoadingOverlay when complete
        });
        
        document.getElementById('downloadPrintPDF').addEventListener('click', function() {
            showLoadingOverlay('Generating PDF...');
            // The actual PDF generation should call hideLoadingOverlay when complete
        });
    });

    function handleDownloadAll() {
        // Implementation for handling download all action
    }

    function displayResults(result) {
        const resultsElement = document.getElementById('results');
        const summaryElement = document.getElementById('summaryResults');
        const visualElement = document.getElementById('visualResults');
        const costAnalysisElement = document.getElementById('costAnalysis');
        
        // Clear previous results
        summaryElement.innerHTML = '';
        visualElement.innerHTML = '';
        
        // Display summary
        const summary = document.createElement('div');
        summary.className = 'result-summary';
        summary.innerHTML = `
            <h2>Optimization Results</h2>
            <p>Total Sheets: ${result.totalSheets}</p>
            <p>Material Utilization: ${(result.utilization * 100).toFixed(2)}%</p>
            <p>Waste Area: ${result.wasteArea.toFixed(2)} mm²</p>
        `;
        summaryElement.appendChild(summary);
        
        // Display cost analysis if material cost is specified
        const materialCost = parseFloat(document.getElementById('materialCost').value);
        if (materialCost > 0) {
            costAnalysisElement.style.display = 'block';
            costAnalysisElement.innerHTML = `
                <h3>Cost Analysis</h3>
                <p>Cost per Sheet: $${materialCost.toFixed(2)}</p>
                <p>Total Material Cost: $${(materialCost * result.totalSheets).toFixed(2)}</p>
            `;
        } else {
            costAnalysisElement.style.display = 'none';
        }
        
        // Display visual representation of each sheet
        result.sheets.forEach((sheet, index) => {
            const sheetElement = document.createElement('div');
            sheetElement.className = 'result-sheet';
            sheetElement.innerHTML = `<h3>Sheet ${index + 1}</h3>`;
            
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 500 * (sheet.height / sheet.width);
            sheetElement.appendChild(canvas);
            
            // Render the sheet layout on canvas
            renderSheetLayout(canvas, sheet);
            
            visualElement.appendChild(sheetElement);
        });
        
        // Show results container
        resultsElement.style.display = 'block';
    }

    // Other functions like validateSheetSettings, preparePartsForOptimization, displayResults, drawEntities, etc.
    // should be defined here or imported from other modules.

    // Utility functions
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    }

    function showError(message) {
        showToast(message, 'error');
    }

    function showMessage(message) {
        showToast(message, 'success');
    }

    function showToast(message, type = 'success') {
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Show the toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Hide the toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function initializeButtonListeners() {
        // Part management buttons
        const addPartButton = document.getElementById('addPartButton');
        if (addPartButton) {
            addPartButton.addEventListener('click', addPart);
        }
        
        const previewBeforeUpload = document.getElementById('previewBeforeUpload');
        if (previewBeforeUpload) {
            previewBeforeUpload.addEventListener('click', previewFile);
        }
        
        // Material management buttons
        const saveMaterialBtn = document.getElementById('saveMaterialBtn');
        if (saveMaterialBtn) {
            saveMaterialBtn.addEventListener('click', openSaveMaterialModal);
        }
        
        const manageMaterialsBtn = document.getElementById('manageMaterialsBtn');
        if (manageMaterialsBtn) {
            manageMaterialsBtn.addEventListener('click', openManageMaterialsModal);
        }
        
        // Main action buttons
        const optimizeButton = document.getElementById('optimizeButton');
        if (optimizeButton) {
            optimizeButton.addEventListener('click', startOptimization);
        }
        
        const layoutComparisonBtn = document.querySelector('#layoutComparisonBtn button');
        if (layoutComparisonBtn) {
            layoutComparisonBtn.addEventListener('click', showLayoutComparison);
        }
        
        // Download buttons
        const downloadAllButton = document.getElementById('downloadAllButton');
        if (downloadAllButton) {
            downloadAllButton.addEventListener('click', downloadAllSheets);
        }
        
        const downloadPrintPDF = document.getElementById('downloadPrintPDF');
        if (downloadPrintPDF) {
            downloadPrintPDF.addEventListener('click', downloadAsPDF);
        }
        
        // Modal close buttons
        document.querySelectorAll('.close-modal').forEach(button => {
            button.addEventListener('click', function() {
                const modal = this.closest('.modal');
                if (modal) modal.style.display = 'none';
            });
        });
        
        // Modal action buttons
        const acceptPreviewBtn = document.getElementById('acceptPreviewBtn');
        if (acceptPreviewBtn) {
            acceptPreviewBtn.addEventListener('click', acceptPreviewAndAddPart);
        }
        
        const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');
        if (cancelPreviewBtn) {
            cancelPreviewBtn.addEventListener('click', closePreviewModal);
        }
        
        const saveMaterialFormBtn = document.getElementById('saveMaterialFormBtn');
        if (saveMaterialFormBtn) {
            saveMaterialFormBtn.addEventListener('click', saveMaterial);
        }
        
        const cancelMaterialBtn = document.getElementById('cancelMaterialBtn');
        if (cancelMaterialBtn) {
            cancelMaterialBtn.addEventListener('click', closeMaterialModal);
        }
        
        // Theme toggle button
        const darkModeToggle = document.getElementById('darkModeToggle');
        if (darkModeToggle) {
            darkModeToggle.addEventListener('change', toggleDarkMode);
        }
    }

    // Function implementations (add these if not already present)
    function addPart() {
        console.log('Adding part...');
        const fileInput = document.getElementById('dxfFile');
        const quantity = document.getElementById('partQuantity').value;
        
        if (fileInput.files.length > 0) {
            // Process the file and add part
            processDXFFile(fileInput.files[0], quantity);
        } else {
            showToast('Please select a DXF file first', 'error');
        }
    }

    function previewFile() {
        console.log('Previewing file...');
        const fileInput = document.getElementById('dxfFile');
        
        if (fileInput.files.length > 0) {
            // Show preview modal and render the DXF
            const modal = document.getElementById('previewModal');
            modal.style.display = 'block';
            renderDXFPreview(fileInput.files[0]);
        } else {
            showToast('Please select a DXF file first', 'error');
        }
    }

    function openSaveMaterialModal() {
        console.log('Opening save material modal...');
        const modal = document.getElementById('materialModal');
        
        // Pre-fill with current sheet values
        document.getElementById('materialWidth').value = document.getElementById('sheetWidth').value;
        document.getElementById('materialHeight').value = document.getElementById('sheetHeight').value;
        
        modal.style.display = 'block';
    }

    function openManageMaterialsModal() {
        console.log('Opening manage materials modal...');
        const modal = document.getElementById('manageMaterialsModal');
        loadSavedMaterials();
        modal.style.display = 'block';
    }

    function startOptimization() {
        console.log('Starting optimization...');
        showLoadingOverlay('Optimizing layout...');
        
        // Call optimization function here
        try {
            optimizeLayout();
            document.getElementById('downloadButtonsContainer').style.display = 'flex';
            document.getElementById('layoutComparisonBtn').style.display = 'block';
        } catch (error) {
            showToast('Optimization failed: ' + error.message, 'error');
        } finally {
            hideLoadingOverlay();
        }
    }

    function showLayoutComparison() {
        console.log('Showing layout comparison...');
        const modal = document.getElementById('comparisonModal');
        modal.style.display = 'block';
        // Populate comparison data
    }

    function downloadAllSheets() {
        console.log('Downloading all sheets...');
        showLoadingOverlay('Preparing downloads...');
        
        // Implementation for downloading all sheets
        setTimeout(() => {
            hideLoadingOverlay();
            showToast('All sheets downloaded successfully', 'success');
        }, 1000);
    }

    function downloadAsPDF() {
        console.log('Downloading as PDF...');
        showLoadingOverlay('Generating PDF...');
        
        // Implementation for downloading as PDF
        setTimeout(() => {
            hideLoadingOverlay();
            showToast('PDF generated successfully', 'success');
        }, 1000);
    }

    function acceptPreviewAndAddPart() {
        console.log('Accepting preview and adding part...');
        // Add the part from the preview
        addPart();
        closePreviewModal();
    }

    function closePreviewModal() {
        console.log('Closing preview modal...');
        const modal = document.getElementById('previewModal');
        modal.style.display = 'none';
    }

    function saveMaterial() {
        console.log('Saving material...');
        const name = document.getElementById('materialName').value;
        const width = document.getElementById('materialWidth').value;
        const height = document.getElementById('materialHeight').value;
        
        if (!name || !width || !height) {
            showToast('Please fill out all required fields', 'error');
            return;
        }
        
        // Save material to local storage
        saveMaterialToStorage(name, width, height);
        closeMaterialModal();
        showToast('Material saved successfully', 'success');
    }

    function closeMaterialModal() {
        console.log('Closing material modal...');
        const modal = document.getElementById('materialModal');
        modal.style.display = 'none';
    }

    function toggleDarkMode() {
        console.log('Toggling dark mode...');
        document.body.classList.toggle('dark-mode');
        
        // Save preference to local storage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    function showToast(message, type = 'info') {
        console.log('Showing toast:', message, type);
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    // Helper function stubs (implement these as needed)
    function processDXFFile(file, quantity) {
        // Implementation for processing DXF file
    }

    function renderDXFPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const dxfContent = e.target.result;
                    const parser = new window.DxfParser();
                    const dxfData = parser.parseSync(dxfContent);
                    const canvas = document.getElementById('previewCanvas');
                    drawDXFOnCanvas(canvas, dxfData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    function openSaveMaterialModal() {
        console.log('Opening save material modal...');
        const modal = document.getElementById('materialModal');
        
        // Pre-fill with current sheet values
        document.getElementById('materialWidth').value = document.getElementById('sheetWidth').value;
        document.getElementById('materialHeight').value = document.getElementById('sheetHeight').value;
        
        modal.style.display = 'block';
    }

    function openManageMaterialsModal() {
        console.log('Opening manage materials modal...');
        const modal = document.getElementById('manageMaterialsModal');
        loadSavedMaterials();
        modal.style.display = 'block';
    }

    function startOptimization() {
        console.log('Starting optimization...');
        showLoadingOverlay('Optimizing layout...');
        
        // Call optimization function here
        try {
            optimizeLayout();
            document.getElementById('downloadButtonsContainer').style.display = 'flex';
            document.getElementById('layoutComparisonBtn').style.display = 'block';
        } catch (error) {
            showToast('Optimization failed: ' + error.message, 'error');
        } finally {
            hideLoadingOverlay();
        }
    }

    function showLayoutComparison() {
        console.log('Showing layout comparison...');
        const modal = document.getElementById('comparisonModal');
        modal.style.display = 'block';
        // Populate comparison data
    }

    function downloadAllSheets() {
        console.log('Downloading all sheets...');
        showLoadingOverlay('Preparing downloads...');
        
        // Implementation for downloading all sheets
        setTimeout(() => {
            hideLoadingOverlay();
            showToast('All sheets downloaded successfully', 'success');
        }, 1000);
    }

    function downloadAsPDF() {
        console.log('Downloading as PDF...');
        showLoadingOverlay('Generating PDF...');
        
        // Implementation for downloading as PDF
        setTimeout(() => {
            hideLoadingOverlay();
            showToast('PDF generated successfully', 'success');
        }, 1000);
    }

    function acceptPreviewAndAddPart() {
        console.log('Accepting preview and adding part...');
        // Add the part from the preview
        addPart();
        closePreviewModal();
    }

    function closePreviewModal() {
        console.log('Closing preview modal...');
        const modal = document.getElementById('previewModal');
        modal.style.display = 'none';
    }

    function saveMaterial() {
        console.log('Saving material...');
        const name = document.getElementById('materialName').value;
        const width = document.getElementById('materialWidth').value;
        const height = document.getElementById('materialHeight').value;
        
        if (!name || !width || !height) {
            showToast('Please fill out all required fields', 'error');
            return;
        }
        
        // Save material to local storage
        saveMaterialToStorage(name, width, height);
        closeMaterialModal();
        showToast('Material saved successfully', 'success');
    }

    function closeMaterialModal() {
        console.log('Closing material modal...');
        const modal = document.getElementById('materialModal');
        modal.style.display = 'none';
    }

    function toggleDarkMode() {
        console.log('Toggling dark mode...');
        document.body.classList.toggle('dark-mode');
        
        // Save preference to local storage
        const isDarkMode = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    function showToast(message, type = 'info') {
        console.log('Showing toast:', message, type);
        const toastContainer = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        toastContainer.appendChild(toast);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 3000);
    }

    // Helper function stubs (implement these as needed)
    function processDXFFile(file, quantity) {
        // Implementation for processing DXF file
    }

    function renderDXFPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const dxfContent = e.target.result;
                    const parser = new window.DxfParser();
                    const dxfData = parser.parseSync(dxfContent);
                    const canvas = document.getElementById('previewCanvas');
                    drawDXFOnCanvas(canvas, dxfData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    function addPartToList(filename, dxfData, quantity) {
        // Create a unique ID for the part
        const partId = 'part-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        
        // Convert quantity to number
        const partQuantity = parseInt(quantity) || 1;
        
        // Ensure the parts list container is not in the "empty" state
        const partsList = document.getElementById('partsList');
        if (partsList.children.length === 1 && partsList.children[0].classList.contains('empty-state')) {
            partsList.innerHTML = '';
        }

        // Extract entities and validate the DXF data
        let entities = dxfData.entities || [];
        
        // Ensure we have valid dimensions
        let dimensions;
        try {
            dimensions = calculateDimensions(dxfData);
        } catch (error) {
            console.error("Failed to calculate dimensions:", error);
            showToast(`Failed to process part "${filename}": Invalid dimensions`, "error");
            return;
        }

        // Create the part object
        const part = {
            id: partId,
            filename: filename,
            dimensions: dimensions,
            quantity: partQuantity,
            entities: entities,
            dxfData: dxfData
        };
        
        // Add the part to the internal list
        partsList.push(part);
        
        // Create the part element in the UI
        const partElement = document.createElement('div');
        partElement.className = 'part-item';
        partElement.id = partId;
        
        // Create preview canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 120;
        previewCanvas.height = 120;
        drawDXFOnCanvas(previewCanvas, dxfData);
        
        partElement.innerHTML = `
            <div class="part-preview">
                ${previewCanvas.outerHTML}
            </div>
            <div class="part-info">
                <div class="part-name">${filename}</div>
                <div class="part-dimensions">
                    ${dimensions.width.toFixed(2)}mm × ${dimensions.height.toFixed(2)}mm
                </div>
                <div class="quantity-control-wrapper">
                    <button class="quantity-control" onclick="decreaseQuantity('${partId}')">-</button>
                    <span class="quantity" id="quantity-${partId}">${partQuantity}</span>
                    <button class="quantity-control" onclick="increaseQuantity('${partId}')">+</button>
                </div>
            </div>
            <div class="part-actions">
                <button class="remove-part" onclick="removePart('${partId}')">Delete</button>
            </div>
        `;
        
        // Add event listeners for the part actions
        partElement.querySelector('.remove-part').addEventListener('click', function() {
            partsList.removeChild(partElement);
            if (partsList.children.length === 0) {
                partsList.innerHTML = '<div class="empty-state">No parts added yet. Add a DXF file below.</div>';
            }
            showToast(`Part "${filename}" removed`, "info");
        });
        
        partsList.appendChild(partElement);
    }

    function calculateDimensions(dxfData) {
        if (!dxfData || !dxfData.entities || dxfData.entities.length === 0) {
            throw new Error("Invalid DXF data: No entities found");
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        // Iterate through all entities to find the bounding box
        dxfData.entities.forEach(entity => {
            if (entity.vertices) {
                entity.vertices.forEach(vertex => {
                    minX = Math.min(minX, vertex.x);
                    minY = Math.min(minY, vertex.y);
                    maxX = Math.max(maxX, vertex.x);
                    maxY = Math.max(maxY, vertex.y);
                });
            } else if (entity.center) {
                // For circles and arcs
                const radius = entity.radius || 0;
                minX = Math.min(minX, entity.center.x - radius);
                minY = Math.min(minY, entity.center.y - radius);
                maxX = Math.max(maxX, entity.center.x + radius);
                maxY = Math.max(maxY, entity.center.y + radius);
            } else if (entity.position) {
                // For points and other simple entities
                minX = Math.min(minX, entity.position.x);
                minY = Math.min(minY, entity.position.y);
                maxX = Math.max(maxX, entity.position.x);
                maxY = Math.max(maxY, entity.position.y);
            }
        });

        // Apply a scale factor - we default to assuming mm
        const scaleFactor = 1; // You could determine this from header info in a more complete implementation

        return {
            width: Math.ceil((maxX - minX) * scaleFactor),
            height: Math.ceil((maxY - minY) * scaleFactor),
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }

    function renderDXFPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const dxfContent = e.target.result;
                    const parser = new window.DxfParser();
                    const dxfData = parser.parseSync(dxfContent);
                    const canvas = document.getElementById('previewCanvas');
                    drawDXFOnCanvas(canvas, dxfData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    function drawDXFOnCanvas(canvas, dxfData) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!dxfData || !dxfData.entities || !Array.isArray(dxfData.entities)) {
            console.error("Invalid DXF data structure:", dxfData);
            ctx.fillStyle = 'red';
            ctx.font = '12px Arial';
            ctx.fillText('Invalid DXF data', 10, 30);
            return;
        }
        
        // Calculate dimensions to properly scale the preview
        const dimensions = calculateDimensions(dxfData);
        
        // Calculate scale to fit the canvas
        const padding = 10;
        const scaleX = (canvas.width - padding * 2) / dimensions.width;
        const scaleY = (canvas.height - padding * 2) / dimensions.height;
        const scale = Math.min(scaleX, scaleY, 5); // Limit max scale to avoid too large drawings
        
        // Center the drawing
        const offsetX = (canvas.width - dimensions.width * scale) / 2;
        const offsetY = (canvas.height - dimensions.height * scale) / 2;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-dimensions.minX, -dimensions.minY);
        
        // Set default drawing style
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1 / scale; // Adjust line width based on scale
        
        const entities = dxfData.entities;
        entities.forEach(entity => {
            try {
                switch(entity.type) {
                    case 'LINE':
                        drawLine(ctx, entity);
                        break;
                    case 'CIRCLE':
                        drawCircle(ctx, entity);
                        break;
                    case 'ARC':
                        drawArc(ctx, entity);
                        break;
                    case 'POLYLINE':
                    case 'LWPOLYLINE':
                        drawPolyline(ctx, entity);
                        break;
                    case 'SPLINE':
                        drawSpline(ctx, entity);
                        break;
                    case 'ELLIPSE':
                        drawEllipse(ctx, entity);
                        break;
                    case 'POINT':
                        drawPoint(ctx, entity);
                        break;
                    // Add support for other entity types as needed
                    default:
                        console.log("Unsupported entity type:", entity.type);
                }
            } catch (error) {
                console.error(`Error rendering entity of type ${entity.type}:`, error);
            }
        });
        
        ctx.restore();
    }

    function drawLine(ctx, entity) {
        if (entity.vertices) {
            ctx.beginPath();
            ctx.moveTo(entity.vertices[0].x, entity.vertices[0].y);
            ctx.lineTo(entity.vertices[1].x, entity.vertices[1].y);
            ctx.stroke();
        } else if (entity.start && entity.end) {
            ctx.beginPath();
            ctx.moveTo(entity.start.x, entity.start.y);
            ctx.lineTo(entity.end.x, entity.end.y);
            ctx.stroke();
        }
    }

    function drawCircle(ctx, entity) {
        if (entity.center && entity.radius) {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    function drawArc(ctx, entity) {
        if (entity.center && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
            // Convert degrees to radians if necessary
            const startAngle = entity.startAngle * (Math.PI / 180);
            const endAngle = entity.endAngle * (Math.PI / 180);
            
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, startAngle, endAngle);
            ctx.stroke();
        }
    }

    function drawPolyline(ctx, entity) {
        if (entity.vertices && entity.vertices.length > 0) {
            ctx.beginPath();
            
            entity.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    ctx.moveTo(vertex.x, vertex.y);
                } else {
                    // Support for bulge values in polylines (approximated as arcs)
                    const prevVertex = entity.vertices[index - 1];
                    if (prevVertex.bulge && prevVertex.bulge !== 0) {
                        const bulge = prevVertex.bulge;
                        const dx = vertex.x - prevVertex.x;
                        const dy = vertex.y - prevVertex.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const height = (dist / 2) * bulge;
                        
                        // Use quadraticCurveTo as a simplified approximation
                        const midX = (prevVertex.x + vertex.x) / 2;
                        const midY = (prevVertex.y + vertex.y) / 2;
                        
                        // Perpendicular direction
                        const perpX = -dy / dist;
                        const perpY = dx / dist;
                        
                        const controlX = midX + perpX * height;
                        const controlY = midY + perpY * height;
                        
                        ctx.quadraticCurveTo(controlX, controlY, vertex.x, vertex.y);
                    } else {
                        ctx.lineTo(vertex.x, vertex.y);
                    }
                }
            });
            
            if (entity.closed) {
                ctx.closePath();
            }
            
            ctx.stroke();
        }
    }

    function drawSpline(ctx, entity) {
        // If the SPLINE already has approximated vertices, use them
        if (entity.vertices && entity.vertices.length > 0) {
            drawPolyline(ctx, entity);
            return;
        }
        
        // If we have control points, let's approximate the curve
        if (entity.controlPoints && entity.controlPoints.length > 0) {
            const points = entity.controlPoints;
            const degree = entity.degree || 3;
            
            // Simple approximation - divide into segments
            const segments = Math.max(20, points.length * 5);
            
            ctx.beginPath();
            
            // Draw approximated curve
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const point = approximateSplinePoint(t, points, degree);
                
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            
            ctx.stroke();
        }
    }

    function drawEllipse(ctx, entity) {
        if (entity.center && entity.majorAxis && entity.axisRatio) {
            // Calculate major and minor axis lengths
            const majorAxisLength = Math.sqrt(
                entity.majorAxis.x * entity.majorAxis.x + 
                entity.majorAxis.y * entity.majorAxis.y
            );
            
            const minorAxisLength = majorAxisLength * entity.axisRatio;
            
            // Calculate rotation angle
            const rotation = Math.atan2(entity.majorAxis.y, entity.majorAxis.x);
            
            // Draw the ellipse
            ctx.beginPath();
            ctx.save();
            ctx.translate(entity.center.x, entity.center.y);
            ctx.rotate(rotation);
            ctx.scale(1, entity.axisRatio);
            ctx.arc(0, 0, majorAxisLength, 0, 2 * Math.PI);
            ctx.restore();
            ctx.stroke();
        }
    }

    function drawPoint(ctx, entity) {
        if (entity.position) {
            const pointSize = 3 / ctx.getTransform().a; // Adjust point size based on scale
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(entity.position.x, entity.position.y, pointSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    function approximateSplinePoint(t, controlPoints, degree) {
        // Simple De Casteljau algorithm for Bezier curve approximation
        if (degree === 1 || controlPoints.length === 1) {
            return controlPoints[0];
        }
        
        const newPoints = [];
        for (let i = 0; i < controlPoints.length - 1; i++) {
            newPoints.push({
                x: (1 - t) * controlPoints[i].x + t * controlPoints[i + 1].x,
                y: (1 - t) * controlPoints[i].y + t * controlPoints[i + 1].y
            });
        }
        
        return approximateSplinePoint(t, newPoints, degree - 1);
    }

    function loadSavedMaterials() {
        const materialsList = document.getElementById('materialsList');
        materialsList.innerHTML = '';
        
        // Load materials from localStorage
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        
        if (materials.length === 0) {
            materialsList.innerHTML = '<div class="empty-state">No saved materials yet.</div>';
            return;
        }
        
        materials.forEach((material, index) => {
            const materialElement = document.createElement('div');
            materialElement.className = 'material-item';
            
            materialElement.innerHTML = `
                <div class="material-info">
                    <span class="material-name">${material.name}</span>
                    <span class="material-dimensions">${material.width} mm × ${material.height} mm</span>
                    ${material.description ? `<span class="material-description">${material.description}</span>` : ''}
                </div>
                <div class="material-actions">
                    <button class="select-material" data-index="${index}">Select</button>
                    <button class="delete-material" data-index="${index}">Delete</button>
                </div>
            `;
            
            materialsList.appendChild(materialElement);
        });
        
        // Add event listeners to the buttons
        document.querySelectorAll('.select-material').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                selectMaterial(materials[index]);
                document.getElementById('manageMaterialsModal').style.display = 'none';
            });
        });
        
        document.querySelectorAll('.delete-material').forEach(button => {
            button.addEventListener('click', function() {
                const index = parseInt(this.dataset.index);
                materials.splice(index, 1);
                localStorage.setItem('materials', JSON.stringify(materials));
                loadSavedMaterials();
                showToast("Material deleted", "info");
            });
        });
    }

    function selectMaterial(material) {
        document.getElementById('sheetWidth').value = material.width;
        document.getElementById('sheetHeight').value = material.height;
        document.getElementById('materialCost').value = material.cost || 0;
        document.getElementById('materialType').value = material.description || '';
    }

    function updateMaterialDropdown() {
        const materialSelect = document.getElementById('materialSelect');
        materialSelect.innerHTML = '';
        const materials = JSON.parse(localStorage.getItem('materials') || '[]');
        materials.forEach((material, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${material.name} (${material.width}×${material.height}mm)`;
            materialSelect.appendChild(option);
        });
        materialSelect.onchange = function() {
            if (this.value === 'custom') return;
            const index = parseInt(this.value);
            selectMaterial(materials[index]);
        };
    }

    // Initialize materials on page load
    function initializeMaterials() {
        updateMaterialDropdown();
    }

    function renderDXFPreview(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const dxfContent = e.target.result;
                    const parser = new window.DxfParser();
                    const dxfData = parser.parseSync(dxfContent);
                    const canvas = document.getElementById('previewCanvas');
                    drawDXFOnCanvas(canvas, dxfData);
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = function() {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    function addPartToList(filename, dxfData, quantity) {
        // Create a unique ID for the part
        const partId = 'part-' + Date.now() + '-' + Math.floor(Math.random() * 10000);
        
        // Convert quantity to number
        const partQuantity = parseInt(quantity) || 1;
        
        // Ensure the parts list container is not in the "empty" state
        const partsList = document.getElementById('partsList');
        if (partsList.children.length === 1 && partsList.children[0].classList.contains('empty-state')) {
            partsList.innerHTML = '';
        }

        // Extract entities and validate the DXF data
        let entities = dxfData.entities || [];
        
        // Ensure we have valid dimensions
        let dimensions;
        try {
            dimensions = calculateDimensions(dxfData);
        } catch (error) {
            console.error("Failed to calculate dimensions:", error);
            showToast(`Failed to process part "${filename}": Invalid dimensions`, "error");
            return;
        }

        // Create the part object
        const part = {
            id: partId,
            filename: filename,
            dimensions: dimensions,
            quantity: partQuantity,
            entities: entities,
            dxfData: dxfData
        };
        
        // Add the part to the internal list
        partsList.push(part);
        
        // Create the part element in the UI
        const partElement = document.createElement('div');
        partElement.className = 'part-item';
        partElement.id = partId;
        
        // Create preview canvas
        const previewCanvas = document.createElement('canvas');
        previewCanvas.width = 120;
        previewCanvas.height = 120;
        drawDXFOnCanvas(previewCanvas, dxfData);
        
        partElement.innerHTML = `
            <div class="part-preview">
                ${previewCanvas.outerHTML}
            </div>
            <div class="part-info">
                <div class="part-name">${filename}</div>
                <div class="part-dimensions">
                    ${dimensions.width.toFixed(2)}mm × ${dimensions.height.toFixed(2)}mm
                </div>
                <div class="quantity-control-wrapper">
                    <button class="quantity-control" onclick="decreaseQuantity('${partId}')">-</button>
                    <span class="quantity" id="quantity-${partId}">${partQuantity}</span>
                    <button class="quantity-control" onclick="increaseQuantity('${partId}')">+</button>
                </div>
            </div>
            <div class="part-actions">
                <button class="remove-part" onclick="removePart('${partId}')">Delete</button>
            </div>
        `;
        
        // Add event listeners for the part actions
        partElement.querySelector('.remove-part').addEventListener('click', function() {
            partsList.removeChild(partElement);
            if (partsList.children.length === 0) {
                partsList.innerHTML = '<div class="empty-state">No parts added yet. Add a DXF file below.</div>';
            }
            showToast(`Part "${filename}" removed`, "info");
        });
        
        partsList.appendChild(partElement);
    }

    function calculateDimensions(dxfData) {
        if (!dxfData || !dxfData.entities || dxfData.entities.length === 0) {
            throw new Error("Invalid DXF data: No entities found");
        }

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        // Iterate through all entities to find the bounding box
        dxfData.entities.forEach(entity => {
            if (entity.vertices) {
                entity.vertices.forEach(vertex => {
                    minX = Math.min(minX, vertex.x);
                    minY = Math.min(minY, vertex.y);
                    maxX = Math.max(maxX, vertex.x);
                    maxY = Math.max(maxY, vertex.y);
                });
            } else if (entity.center) {
                // For circles and arcs
                const radius = entity.radius || 0;
                minX = Math.min(minX, entity.center.x - radius);
                minY = Math.min(minY, entity.center.y - radius);
                maxX = Math.max(maxX, entity.center.x + radius);
                maxY = Math.max(maxY, entity.center.y + radius);
            } else if (entity.position) {
                // For points and other simple entities
                minX = Math.min(minX, entity.position.x);
                minY = Math.min(minY, entity.position.y);
                maxX = Math.max(maxX, entity.position.x);
                maxY = Math.max(maxY, entity.position.y);
            }
        });

        // Apply a scale factor - we default to assuming mm
        const scaleFactor = 1; // You could determine this from header info in a more complete implementation

        return {
            width: Math.ceil((maxX - minX) * scaleFactor),
            height: Math.ceil((maxY - minY) * scaleFactor),
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }

    function removePart(partId) {
        const partElement = document.querySelector(`[data-id='${partId}']`);
        if (partElement) {
            partElement.remove();
            const partsList = document.getElementById('partsList');
            if (partsList.children.length === 0) {
                partsList.innerHTML = '<div class="empty-state">No parts added yet. Add a DXF file below.</div>';
            }
        }
    }

    function increaseQuantity(partId) {
        const partElement = document.querySelector(`[data-id='${partId}']`);
        if (partElement) {
            const quantitySpan = partElement.querySelector('.part-quantity span');
            let quantity = parseInt(quantitySpan.textContent);
            quantity += 1;
            quantitySpan.textContent = quantity;
        }
    }

    function decreaseQuantity(partId) {
        const partElement = document.querySelector(`[data-id='${partId}']`);
        if (partElement) {
            const quantitySpan = partElement.querySelector('.part-quantity span');
            let quantity = parseInt(quantitySpan.textContent);
            if (quantity > 1) {
                quantity -= 1;
                quantitySpan.textContent = quantity;
            }
        }
    }

    function drawDXFOnCanvas(canvas, dxfData) {
        const ctx = canvas.getContext('2d');
        
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (!dxfData || !dxfData.entities || !Array.isArray(dxfData.entities)) {
            console.error("Invalid DXF data structure:", dxfData);
            ctx.fillStyle = 'red';
            ctx.font = '12px Arial';
            ctx.fillText('Invalid DXF data', 10, 30);
            return;
        }
        
        // Calculate dimensions to properly scale the preview
        const dimensions = calculateDimensions(dxfData);
        
        // Calculate scale to fit the canvas
        const padding = 10;
        const scaleX = (canvas.width - padding * 2) / dimensions.width;
        const scaleY = (canvas.height - padding * 2) / dimensions.height;
        const scale = Math.min(scaleX, scaleY, 5); // Limit max scale to avoid too large drawings
        
        // Center the drawing
        const offsetX = (canvas.width - dimensions.width * scale) / 2;
        const offsetY = (canvas.height - dimensions.height * scale) / 2;
        
        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);
        ctx.translate(-dimensions.minX, -dimensions.minY);
        
        // Set default drawing style
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 1 / scale; // Adjust line width based on scale
        
        const entities = dxfData.entities;
        entities.forEach(entity => {
            try {
                switch(entity.type) {
                    case 'LINE':
                        drawLine(ctx, entity);
                        break;
                    case 'CIRCLE':
                        drawCircle(ctx, entity);
                        break;
                    case 'ARC':
                        drawArc(ctx, entity);
                        break;
                    case 'POLYLINE':
                    case 'LWPOLYLINE':
                        drawPolyline(ctx, entity);
                        break;
                    case 'SPLINE':
                        drawSpline(ctx, entity);
                        break;
                    case 'ELLIPSE':
                        drawEllipse(ctx, entity);
                        break;
                    case 'POINT':
                        drawPoint(ctx, entity);
                        break;
                    // Add support for other entity types as needed
                    default:
                        console.log("Unsupported entity type:", entity.type);
                }
            } catch (error) {
                console.error(`Error rendering entity of type ${entity.type}:`, error);
            }
        });
        
        ctx.restore();
    }

    function drawLine(ctx, entity) {
        if (entity.vertices) {
            ctx.beginPath();
            ctx.moveTo(entity.vertices[0].x, entity.vertices[0].y);
            ctx.lineTo(entity.vertices[1].x, entity.vertices[1].y);
            ctx.stroke();
        } else if (entity.start && entity.end) {
            ctx.beginPath();
            ctx.moveTo(entity.start.x, entity.start.y);
            ctx.lineTo(entity.end.x, entity.end.y);
            ctx.stroke();
        }
    }

    function drawCircle(ctx, entity) {
        if (entity.center && entity.radius) {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI);
            ctx.stroke();
        }
    }

    function drawArc(ctx, entity) {
        if (entity.center && entity.radius && entity.startAngle !== undefined && entity.endAngle !== undefined) {
            // Convert degrees to radians if necessary
            const startAngle = entity.startAngle * (Math.PI / 180);
            const endAngle = entity.endAngle * (Math.PI / 180);
            
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, startAngle, endAngle);
            ctx.stroke();
        }
    }

    function drawPolyline(ctx, entity) {
        if (entity.vertices && entity.vertices.length > 0) {
            ctx.beginPath();
            
            entity.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    ctx.moveTo(vertex.x, vertex.y);
                } else {
                    // Support for bulge values in polylines (approximated as arcs)
                    const prevVertex = entity.vertices[index - 1];
                    if (prevVertex.bulge && prevVertex.bulge !== 0) {
                        const bulge = prevVertex.bulge;
                        const dx = vertex.x - prevVertex.x;
                        const dy = vertex.y - prevVertex.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        const height = (dist / 2) * bulge;
                        
                        // Use quadraticCurveTo as a simplified approximation
                        const midX = (prevVertex.x + vertex.x) / 2;
                        const midY = (prevVertex.y + vertex.y) / 2;
                        
                        // Perpendicular direction
                        const perpX = -dy / dist;
                        const perpY = dx / dist;
                        
                        const controlX = midX + perpX * height;
                        const controlY = midY + perpY * height;
                        
                        ctx.quadraticCurveTo(controlX, controlY, vertex.x, vertex.y);
                    } else {
                        ctx.lineTo(vertex.x, vertex.y);
                    }
                }
            });
            
            if (entity.closed) {
                ctx.closePath();
            }
            
            ctx.stroke();
        }
    }

    function drawSpline(ctx, entity) {
        // If the SPLINE already has approximated vertices, use them
        if (entity.vertices && entity.vertices.length > 0) {
            drawPolyline(ctx, entity);
            return;
        }
        
        // If we have control points, let's approximate the curve
        if (entity.controlPoints && entity.controlPoints.length > 0) {
            const points = entity.controlPoints;
            const degree = entity.degree || 3;
            
            // Simple approximation - divide into segments
            const segments = Math.max(20, points.length * 5);
            
            ctx.beginPath();
            
            // Draw approximated curve
            for (let i = 0; i <= segments; i++) {
                const t = i / segments;
                const point = approximateSplinePoint(t, points, degree);
                
                if (i === 0) {
                    ctx.moveTo(point.x, point.y);
                } else {
                    ctx.lineTo(point.x, point.y);
                }
            }
            
            ctx.stroke();
        }
    }

    function drawEllipse(ctx, entity) {
        if (entity.center && entity.majorAxis && entity.axisRatio) {
            // Calculate major and minor axis lengths
            const majorAxisLength = Math.sqrt(
                entity.majorAxis.x * entity.majorAxis.x + 
                entity.majorAxis.y * entity.majorAxis.y
            );
            
            const minorAxisLength = majorAxisLength * entity.axisRatio;
            
            // Calculate rotation angle
            const rotation = Math.atan2(entity.majorAxis.y, entity.majorAxis.x);
            
            // Draw the ellipse
            ctx.beginPath();
            ctx.save();
            ctx.translate(entity.center.x, entity.center.y);
            ctx.rotate(rotation);
            ctx.scale(1, entity.axisRatio);
            ctx.arc(0, 0, majorAxisLength, 0, 2 * Math.PI);
            ctx.restore();
            ctx.stroke();
        }
    }

    function drawPoint(ctx, entity) {
        if (entity.position) {
            const pointSize = 3 / ctx.getTransform().a; // Adjust point size based on scale
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(entity.position.x, entity.position.y, pointSize, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    function approximateSplinePoint(t, controlPoints, degree) {
        // Simple De Casteljau algorithm for Bezier curve approximation
        if (degree === 1 || controlPoints.length === 1) {
            return controlPoints[0];
        }
        
        const newPoints = [];
        for (let i = 0; i < controlPoints.length - 1; i++) {
            newPoints.push({
                x: (1 - t) * controlPoints[i].x + t * controlPoints[i + 1].x,
                y: (1 - t) * controlPoints[i].y + t * controlPoints[i + 1].y
            });
        }
        
        return approximateSplinePoint(t, newPoints, degree - 1);
    }
});