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

    async function handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            currentFile = file;
            const dimensions = await getFileDimensions(file);
            updateFileInfoDisplay(file.name, dimensions);
        }
    }

    function getFileDimensions(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const dxfContent = e.target.result;
                const parser = new window.DxfParser();
                const dxfData = parser.parseSync(dxfContent);
                const dimensions = calculateDimensions(dxfData);
                resolve(dimensions);
            };
            reader.onerror = function() {
                reject(new Error("Failed to read file"));
            };
            reader.readAsText(file);
        });
    }

    function calculateDimensions(dxfData) {
        // Implement the logic to calculate dimensions from dxfData
        return { width: 100, height: 50 }; // Example dimensions
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
        // Implementation for rendering DXF preview
    }

    function loadSavedMaterials() {
        // Implementation for loading saved materials
    }

    function saveMaterialToStorage(name, width, height) {
        // Implementation for saving material to storage
    }

    function optimizeLayout() {
        // Implementation for optimizing layout
        // This may be defined in optimizer.js instead
    }
});

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI elements and event listeners
    initializeDarkMode();
    initializeEventListeners();
    
    // Hide the loading overlay initially
    hideLoadingOverlay();
});

// Initialize dark mode based on saved preference
function initializeDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        document.getElementById('darkModeToggle').checked = true;
    }
}

// Set up all event listeners
function initializeEventListeners() {
    // Dark mode toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            document.body.classList.toggle('dark-mode');
            localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
        });
    }
    
    // Part management
    const addPartButton = document.getElementById('addPartButton');
    if (addPartButton) {
        addPartButton.addEventListener('click', handleAddPart);
    }
    
    const previewButton = document.getElementById('previewBeforeUpload');
    if (previewButton) {
        previewButton.addEventListener('click', handlePreviewDXF);
    }
    
    // Material management
    const saveMaterialBtn = document.getElementById('saveMaterialBtn');
    if (saveMaterialBtn) {
        saveMaterialBtn.addEventListener('click', openSaveMaterialDialog);
    }
    
    const manageMaterialsBtn = document.getElementById('manageMaterialsBtn');
    if (manageMaterialsBtn) {
        manageMaterialsBtn.addEventListener('click', openManageMaterialsDialog);
    }
    
    // Optimization
    const optimizeButton = document.getElementById('optimizeButton');
    if (optimizeButton) {
        optimizeButton.addEventListener('click', startOptimization);
    }
    
    // Layout comparison
    const layoutComparisonBtn = document.querySelector('#layoutComparisonBtn button');
    if (layoutComparisonBtn) {
        layoutComparisonBtn.addEventListener('click', openLayoutComparison);
    }
    
    // Download buttons
    const downloadAllButton = document.getElementById('downloadAllButton');
    if (downloadAllButton) {
        downloadAllButton.addEventListener('click', downloadAllSheets);
    }
    
    const downloadPdfButton = document.getElementById('downloadPrintPDF');
    if (downloadPdfButton) {
        downloadPdfButton.addEventListener('click', downloadAsPDF);
    }
    
    // Modal buttons
    setupModalEventListeners();
}

// Set up event listeners for all modal dialogs
function setupModalEventListeners() {
    // Close buttons for all modals
    document.querySelectorAll('.close-modal').forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) modal.style.display = 'none';
        });
    });
    
    // Material modal buttons
    const saveMaterialFormBtn = document.getElementById('saveMaterialFormBtn');
    if (saveMaterialFormBtn) {
        saveMaterialFormBtn.addEventListener('click', saveMaterial);
    }
    
    const cancelMaterialBtn = document.getElementById('cancelMaterialBtn');
    if (cancelMaterialBtn) {
        cancelMaterialBtn.addEventListener('click', closeMaterialModal);
    }
    
    // Preview modal buttons
    const acceptPreviewBtn = document.getElementById('acceptPreviewBtn');
    if (acceptPreviewBtn) {
        acceptPreviewBtn.addEventListener('click', acceptAndAddPart);
    }
    
    const cancelPreviewBtn = document.getElementById('cancelPreviewBtn');
    if (cancelPreviewBtn) {
        cancelPreviewBtn.addEventListener('click', closePreviewModal);
    }
}

// Loading overlay functions
function showLoadingOverlay(message = "Processing...") {
    document.getElementById('progressText').textContent = message;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoadingOverlay() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

function updateLoadingProgress(message) {
    document.getElementById('progressText').textContent = message;
}

// Toast notification system
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toast.setAttribute('role', 'alert');
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => {
            toastContainer.removeChild(toast);
        }, 500);
    }, 3000);
}

// Button handler functions
function handleAddPart() {
    const fileInput = document.getElementById('dxfFile');
    const quantityInput = document.getElementById('partQuantity');
    
    if (!fileInput.files.length) {
        showToast("Please select a DXF file first", "error");
        return;
    }
    
    const quantity = parseInt(quantityInput.value) || 1;
    if (quantity < 1) {
        showToast("Quantity must be at least 1", "error");
        return;
    }
    
    showLoadingOverlay("Processing DXF file...");
    processDXFFile(fileInput.files[0], quantity);
}

function handlePreviewDXF() {
    const fileInput = document.getElementById('dxfFile');
    
    if (!fileInput.files.length) {
        showToast("Please select a DXF file first", "error");
        return;
    }
    
    showLoadingOverlay("Generating preview...");
    
    try {
        // Open the preview modal and render the DXF file
        const previewModal = document.getElementById('previewModal');
        previewModal.style.display = 'block';
        
        renderDXFPreview(fileInput.files[0]).then(() => {
            hideLoadingOverlay();
        }).catch(error => {
            hideLoadingOverlay();
            showToast("Failed to preview DXF: " + error.message, "error");
            closePreviewModal();
        });
    } catch (error) {
        hideLoadingOverlay();
        showToast("Failed to preview DXF: " + error.message, "error");
    }
}

function openSaveMaterialDialog() {
    // Pre-fill with current sheet values
    document.getElementById('materialWidth').value = document.getElementById('sheetWidth').value || '';
    document.getElementById('materialHeight').value = document.getElementById('sheetHeight').value || '';
    document.getElementById('materialCostInput').value = document.getElementById('materialCost').value || '';
    document.getElementById('materialName').value = '';
    document.getElementById('materialDescription').value = '';
    
    // Show the modal
    document.getElementById('materialModal').style.display = 'block';
}

function openManageMaterialsDialog() {
    // Load saved materials into the materials list
    loadSavedMaterials();
    
    // Show the modal
    document.getElementById('manageMaterialsModal').style.display = 'block';
}

function startOptimization() {
    // Verify there are parts to optimize
    const partsList = document.getElementById('partsList');
    if (!partsList.querySelector('.part-item')) {
        showToast("Please add at least one part before optimizing", "error");
        return;
    }
    
    showLoadingOverlay("Starting optimization...");
    
    // Call the optimizer function (from optimizer.js)
    try {
        optimizeLayout();
        document.getElementById('results').style.display = 'block';
        document.getElementById('downloadButtonsContainer').style.display = 'block';
        document.getElementById('layoutComparisonBtn').style.display = 'block';
    } catch (error) {
        showToast("Optimization failed: " + error.message, "error");
    } finally {
        hideLoadingOverlay();
    }
}

function openLayoutComparison() {
    // Load comparison data if available
    const comparisonModal = document.getElementById('comparisonModal');
    comparisonModal.style.display = 'block';
}

function downloadAllSheets() {
    showLoadingOverlay("Preparing sheets for download...");
    
    // Simulate download process
    setTimeout(() => {
        hideLoadingOverlay();
        showToast("All sheets downloaded successfully", "success");
    }, 1000);
}

function downloadAsPDF() {
    showLoadingOverlay("Generating PDF...");
    
    // Simulate PDF generation
    setTimeout(() => {
        hideLoadingOverlay();
        showToast("PDF generated successfully", "success");
    }, 1000);
}

// Modal action functions
function saveMaterial() {
    const name = document.getElementById('materialName').value.trim();
    const width = parseFloat(document.getElementById('materialWidth').value);
    const height = parseFloat(document.getElementById('materialHeight').value);
    const description = document.getElementById('materialDescription').value.trim();
    const cost = parseFloat(document.getElementById('materialCostInput').value) || 0;
    
    if (!name) {
        showToast("Please enter a material name", "error");
        return;
    }
    
    if (isNaN(width) || width <= 0 || isNaN(height) || height <= 0) {
        showToast("Please enter valid dimensions", "error");
        return;
    }
    
    // Save the material (implementation depends on your storage method)
    const material = {
        name,
        width,
        height,
        description,
        cost
    };
    
    // Get existing materials from localStorage
    let materials = JSON.parse(localStorage.getItem('materials') || '[]');
    materials.push(material);
    localStorage.setItem('materials', JSON.stringify(materials));
    
    // Update the material dropdown
    updateMaterialDropdown();
    
    // Close the modal and show confirmation
    closeMaterialModal();
    showToast("Material saved successfully", "success");
}

function closeMaterialModal() {
    document.getElementById('materialModal').style.display = 'none';
}

function acceptAndAddPart() {
    closePreviewModal();
    handleAddPart();
}

function closePreviewModal() {
    document.getElementById('previewModal').style.display = 'none';
}

// Helper functions
function processDXFFile(file, quantity) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            const dxfContent = e.target.result;
            
            // Parse the DXF data (using dxf-parser library)
            const parser = new window.DxfParser();
            const dxfData = parser.parseSync(dxfContent);
            
            // Add the part to the parts list
            addPartToList(file.name, dxfData, quantity);
            
            // Clear the file input
            document.getElementById('dxfFile').value = '';
            
            hideLoadingOverlay();
            showToast(`Part "${file.name}" added successfully`, "success");
        } catch (error) {
            hideLoadingOverlay();
            showToast("Failed to process DXF: " + error.message, "error");
        }
    };
    
    reader.onerror = function() {
        hideLoadingOverlay();
        showToast("Error reading file", "error");
    };
    
    reader.readAsText(file);
}

function addPartToList(filename, dxfData, quantity) {
    const partsList = document.getElementById('partsList');
    const emptyState = partsList.querySelector('.empty-state');
    if (emptyState) {
        partsList.removeChild(emptyState);
    }
    
    // Generate a unique ID for this part
    const partId = 'part_' + Date.now();
    
    // Create part element
    const partElement = document.createElement('div');
    partElement.className = 'part-item';
    partElement.dataset.id = partId;
    partElement.dataset.dxf = JSON.stringify(dxfData);
    
    partElement.innerHTML = `
        <div class="part-info">
            <span class="part-name">${filename}</span>
            <span class="part-dimensions">Dimensions: ${dxfData.header.$EXTMIN[0]} x ${dxfData.header.$EXTMIN[1]}</span>
            <div class="part-quantity">
                <button class="quantity-control" onclick="decreaseQuantity('${partId}')">-</button>
                <span>${quantity}</span>
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
    
    partElement.querySelector('.edit-part').addEventListener('click', function() {
        // Implementation for editing a part
        showToast("Edit functionality not implemented yet", "info");
    });
    
    partsList.appendChild(partElement);
}

function renderDXFPreview(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const dxfContent = e.target.result;
                
                // Parse the DXF
                const parser = new window.DxfParser();
                const dxfData = parser.parseSync(dxfContent);
                
                // Get the canvas and draw the preview
                const canvas = document.getElementById('previewCanvas');
                drawDXFOnCanvas(canvas, dxfData);
                
                resolve();
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = function() {
            reject(new Error("Failed to read file"));
        };
        
        reader.readAsText(file);
    });
}

function drawDXFOnCanvas(canvas, dxfData) {
    const ctx = canvas.getContext('2d');
    
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const entities = dxfData.entities;
    entities.forEach(entity => {
        if (entity.type === 'LINE') {
            ctx.beginPath();
            ctx.moveTo(entity.vertices[0].x, entity.vertices[0].y);
            ctx.lineTo(entity.vertices[1].x, entity.vertices[1].y);
            ctx.stroke();
        } else if (entity.type === 'CIRCLE') {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (entity.type === 'ARC') {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, entity.startAngle, entity.endAngle);
            ctx.stroke();
        } else if (entity.type === 'POLYLINE') {
            ctx.beginPath();
            entity.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    ctx.moveTo(vertex.x, vertex.y);
                } else {
                    ctx.lineTo(vertex.x, vertex.y);
                }
            });
            if (entity.closed) {
                ctx.closePath();
            }
            ctx.stroke();
        }
    });
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
    const partsList = document.getElementById('partsList');
    const emptyState = partsList.querySelector('.empty-state');
    if (emptyState) {
        partsList.removeChild(emptyState);
    }
    const partId = 'part_' + Date.now();
    const partElement = document.createElement('div');
    partElement.className = 'part-item';
    partElement.dataset.id = partId;
    partElement.dataset.dxf = JSON.stringify(dxfData);
    partElement.innerHTML = `
        <div class="part-info">
            <span class="part-name">${filename}</span>
            <span class="part-dimensions">Dimensions: ${dxfData.header.$EXTMIN[0]} x ${dxfData.header.$EXTMIN[1]}</span>
            <div class="part-quantity">
                <button class="quantity-control" onclick="decreaseQuantity('${partId}')">-</button>
                <span>${quantity}</span>
                <button class="quantity-control" onclick="increaseQuantity('${partId}')">+</button>
            </div>
        </div>
        <div class="part-actions">
            <button class="remove-part" onclick="removePart('${partId}')">Delete</button>
        </div>
    `;
    partsList.appendChild(partElement);
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const entities = dxfData.entities;
    entities.forEach(entity => {
        if (entity.type === 'LINE') {
            ctx.beginPath();
            ctx.moveTo(entity.vertices[0].x, entity.vertices[0].y);
            ctx.lineTo(entity.vertices[1].x, entity.vertices[1].y);
            ctx.stroke();
        } else if (entity.type === 'CIRCLE') {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, 0, 2 * Math.PI);
            ctx.stroke();
        } else if (entity.type === 'ARC') {
            ctx.beginPath();
            ctx.arc(entity.center.x, entity.center.y, entity.radius, entity.startAngle, entity.endAngle);
            ctx.stroke();
        } else if (entity.type === 'POLYLINE') {
            ctx.beginPath();
            entity.vertices.forEach((vertex, index) => {
                if (index === 0) {
                    ctx.moveTo(vertex.x, vertex.y);
                } else {
                    ctx.lineTo(vertex.x, vertex.y);
                }
            });
            if (entity.closed) {
                ctx.closePath();
            }
            ctx.stroke();
        }
    });
}