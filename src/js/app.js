/**
 * DXF Optimizer - Main Application
 * Handles user interactions, file operations, and visualization
 * @module DXFOptimizer
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables but don't create optimizer instance yet
function updateFileInfoDisplay(fileName, dimensions) {
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo && dimensions) {
        // Show filename with dimensions and unit (default 'mm')
        fileInfo.textContent = `${fileName} (${dimensions.width} x ${dimensions.height} mm)`;
    }
}

// Function to populate optimization strategy dropdown
function populateOptimizationStrategies() {
    const strategySelect = document.getElementById('optimizationStrategy');
    if (strategySelect) {
        // Clear current options
        strategySelect.innerHTML = '';
        // Add options for different optimization strategies
        const strategies = [
            { value: 'interlocking', text: 'Interlocking (Parts fit together)' },
            { value: 'sideBySide', text: 'Side-by-Side (Grid arrangement)' },
            { value: 'stacked', text: 'Top-of-Each-Other (Stacked)' },
            { value: 'periodic', text: 'Periodical (Repeating pattern)' },
            { value: 'bestFit', text: 'Best Fit (Automatic)' }
        ];
        strategies.forEach(strategy => {
            const option = document.createElement('option');
            option.value = strategy.value;
            option.textContent = strategy.text;
            strategySelect.appendChild(option);
        });
    }
}

// Function to populate the units dropdown
function populateUnitsSelect() {
    const unitsContainer = document.querySelector('.sheet-settings') || 
                          document.querySelector('.optimization-controls');
    
    if (!unitsContainer) {
        console.warn("Could not find appropriate container for units selector");
        return;
    }
    
    // Check if units select already exists
    let unitsSelect = document.getElementById('unitsSelect');
    if (!unitsSelect) {
        // Create the units selection UI
        const unitsGroup = document.createElement('div');
        unitsGroup.className = 'form-group';
        
        const unitsLabel = document.createElement('label');
        unitsLabel.setAttribute('for', 'unitsSelect');
        unitsLabel.textContent = 'DXF Units:';
        
        unitsSelect = document.createElement('select');
        unitsSelect.id = 'unitsSelect';
        unitsSelect.className = 'form-control';
        
        unitsGroup.appendChild(unitsLabel);
        unitsGroup.appendChild(unitsSelect);
        
        // Create a fileInfo display element if it doesn't exist
        if (!document.getElementById('fileInfo')) {
            const fileInfo = document.createElement('div');
            fileInfo.id = 'fileInfo';
            fileInfo.className = 'file-info';
            unitsGroup.appendChild(fileInfo);
        }
        
        unitsContainer.appendChild(unitsGroup);
    } else {
        // Clear existing options
        unitsSelect.innerHTML = '';
    }
    
    // Add unit options
    const units = ['mm', 'cm', 'in', 'ft'];
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitsSelect.appendChild(option);
    });
}

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
    const unitsSelect = document.getElementById('unitsSelect');
    
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
            if (!parseResult.success) {
                showError(parseResult.error);
                resetAddPartForm();
                return;
            }
            const newPart = await createNewPart(parseResult.dimensions, dxfContent);
            partsList.push(newPart);
            updatePartsList();
            resetAddPartForm();
            showMessage(`Added ${quantity}x ${newPart.name} successfully.`);
        } catch (error) {
            showError('Error processing DXF file: ' + error.message);
        } finally {
            resetAddPartForm();
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    /**
     * Parse DXF file content
     * @param {string} dxfContent - The raw DXF file content
     * @returns {Promise<Object>} Parse result containing success status and dimensions
     * @throws {Error} If parsing fails
     */
    async function parseDXFFile(dxfContent) {
        const partOptimizer = new DXFOptimizer();
        return await partOptimizer.parseDXF(dxfContent);
    }

    /**
     * Create a new part object from DXF data
     * @param {Object} dimensions - Part dimensions {width, height, minX, minY}
     * @param {string} dxfContent - Raw DXF file content
     * @returns {Object} New part object with all required properties
     */
    async function createNewPart(dimensions, dxfContent) {
        const partOptimizer = new DXFOptimizer();
        await partOptimizer.parseDXF(dxfContent);
        return {
            id: 'part_' + (++partIdCounter),
            name: currentFile.name,
            file: currentFile,
            quantity: parseInt(partQuantityInput.value),
            content: dxfContent,
            dimensions: dimensions,
            entities: partOptimizer.getOriginalEntities()
        };
    }

    /**
     * Reset the add part form
     */
    function resetAddPartForm() {
        dxfFileInput.value = '';
        partQuantityInput.value = 1;
        currentFile = null;
        addPartButton.disabled = false;
        addPartButton.textContent = 'Add Part';
    }

    /**
     * Update the parts list UI
     */
    function updatePartsList() {
        // Clear the list
        partsListElement.innerHTML = '';
        if (partsList.length === 0) {
            partsListElement.innerHTML = '<div class="empty-state">No parts added yet. Add a DXF file below.</div>';
            return;
        }
        
        // Add each part to the list
        partsList.forEach(part => {
            const partElement = document.createElement('div');
            partElement.className = 'part-item';
            partElement.id = part.id;
            
            // Create part info section with preview
            const partInfo = document.createElement('div');
            partInfo.className = 'part-info';
            
            // Create part preview
            const partPreview = document.createElement('div');
            partPreview.className = 'part-preview';
            const previewCanvas = document.createElement('canvas');
            previewCanvas.width = 50;
            previewCanvas.height = 50;
            partPreview.appendChild(previewCanvas);
            partInfo.appendChild(partPreview);
            // Render part preview
            renderDXFPreview(previewCanvas, part.entities, part.dimensions);
            
            // Create part details
            const partDetails = document.createElement('div');
            partDetails.className = 'part-details';
            partDetails.innerHTML = `
                <div class="part-name">${part.name}</div>
                <div class="part-dimensions">${part.dimensions.width}mm × ${part.dimensions.height}mm</div>
            `;
            partInfo.appendChild(partDetails);
            
            // Create quantity control
            const partQuantity = document.createElement('div');
            partQuantity.className = 'part-quantity';
            const quantityControl = document.createElement('div');
            quantityControl.className = 'quantity-control';
            const decreaseBtn = document.createElement('button');
            decreaseBtn.textContent = '-';
            decreaseBtn.addEventListener('click', () => updatePartQuantity(part.id, -1));
            const quantityInput = document.createElement('input');
            quantityInput.type = 'number';
            quantityInput.min = '1';
            quantityInput.value = part.quantity;
            quantityInput.addEventListener('change', (e) => {
                const newQty = parseInt(e.target.value);
                if (!isNaN(newQty) && newQty > 0) {
                    updatePartQuantity(part.id, newQty, true);
                } else {
                    e.target.value = part.quantity;
                }
            });
            const increaseBtn = document.createElement('button');
            increaseBtn.textContent = '+';
            increaseBtn.addEventListener('click', () => updatePartQuantity(part.id, 1));
            quantityControl.appendChild(decreaseBtn);
            quantityControl.appendChild(quantityInput);
            quantityControl.appendChild(increaseBtn);
            partQuantity.appendChild(quantityControl);
            
            // Create delete button
            const partActions = document.createElement('div');
            partActions.className = 'part-actions';
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-button';
            deleteBtn.textContent = '×';
            deleteBtn.title = 'Remove part';
            deleteBtn.addEventListener('click', () => removePart(part.id));
            partActions.appendChild(deleteBtn);
            
            // Assemble part item
            partElement.appendChild(partInfo);
            partElement.appendChild(partQuantity);
            partElement.appendChild(partActions);
            
            partsListElement.appendChild(partElement);
        });
    }

    /**
     * Update a part's quantity
     */
    function updatePartQuantity(partId, change, absolute = false) {
        const partIndex = partsList.findIndex(p => p.id === partId);
        if (partIndex === -1) return;
        
        if (absolute) {
            partsList[partIndex].quantity = change;
        } else {
            const newQty = partsList[partIndex].quantity + change;
            if (newQty < 1) return;
            partsList[partIndex].quantity = newQty;
        }
        updatePartsList();
    }

    /**
     * Remove a part from the list
     */
    function removePart(partId) {
        partsList = partsList.filter(p => p.id !== partId);
        updatePartsList();
    }

    /**
     * Handle optimize button click
     */
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
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    /**
     * Validate sheet settings
     * @param {number} sheetWidth - Width of the sheet in mm
     * @param {number} sheetHeight - Height of the sheet in mm
     * @param {number} edgeGap - Edge gap in mm
     * @param {number} partSpacing - Spacing between parts in mm
     * @returns {boolean} True if settings are valid, false otherwise
     */
    function validateSheetSettings(sheetWidth, sheetHeight, edgeGap, partSpacing) {
        if (isNaN(sheetWidth) || sheetWidth <= 0) {
            showError('Sheet width must be a positive number.');
            return false;
        }
        if (isNaN(sheetHeight) || sheetHeight <= 0) {
            showError('Sheet height must be a positive number.');
            return false;
        }
        if (isNaN(edgeGap) || edgeGap < 0) {
            showError('Edge gap must be a non-negative number.');
            return false;
        }
        if (isNaN(partSpacing) || partSpacing < 0) {
            showError('Part spacing must be a non-negative number.');
            return false;
        }
        return true;
    }

    /**
     * Prepare parts for optimization
     */
    function preparePartsForOptimization() {
        return partsList.map(part => ({
            id: part.id,
            name: part.name,
            quantity: part.quantity,
            entities: part.entities,
            dimensions: part.dimensions,
            content: part.content
        }));
    }

    /**
     * Display optimization results
     */
    function displayResults(results) {
        // Hide loading overlay
        document.getElementById('loadingOverlay').style.display = 'none';
        
        // Clear previous results
        summaryResultsDiv.innerHTML = '';
        visualResultsDiv.innerHTML = '';
        
        // Display summary
        const summary = document.createElement('div');
        summary.innerHTML = `
            <h2>Optimization Results</h2>
            <p>Total parts: ${results.totalItems}</p>
            <p>Total sheets needed: ${results.totalSheets}</p>
            <p>Sheet utilization: ${Math.round(results.utilization * 100)}%</p>
        `;
        summaryResultsDiv.appendChild(summary);
        
        // Create parts breakdown table
        const breakdownTable = document.createElement('div');
        breakdownTable.className = 'parts-breakdown';
        
        // Create a map to count parts per sheet
        const partsPerSheet = {};
        
        // Count parts per sheet
        results.layouts.forEach((layout, sheetIndex) => {
            layout.items.forEach(item => {
                const partId = item.part.id;
                const partName = item.part.name;
                
                if (!partsPerSheet[partId]) {
                    partsPerSheet[partId] = {
                        id: partId,
                        name: partName,
                        total: 0,
                        sheets: {}
                    };
                }
                if (!partsPerSheet[partId].sheets[sheetIndex]) {
                    partsPerSheet[partId].sheets[sheetIndex] = 0;
                }
                partsPerSheet[partId].sheets[sheetIndex]++;
                partsPerSheet[partId].total++;
            });
        });
        
        // Create table HTML
        let tableHtml = `
            <h3>Parts Breakdown</h3>
            <table class="breakdown-table">
                <thead>
                    <tr>
                        <th>Part</th>
                        <th>Total</th>
                        <th>Distribution</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        // Add rows for each part
        Object.values(partsPerSheet).forEach(part => {
            let distribution = '';
            
            Object.entries(part.sheets).forEach(([sheetIndex, count]) => {
                distribution += `<span class="sheet-tag">Sheet ${parseInt(sheetIndex) + 1}: ${count}</span>`;
            });
            tableHtml += `
                <tr>
                    <td>${part.name}</td>
                    <td>${part.total}</td>
                    <td>${distribution}</td>
                </tr>
            `;
        });
        
        tableHtml += `
                </tbody>
            </table>
        `;
        
        breakdownTable.innerHTML = tableHtml;
        summaryResultsDiv.appendChild(breakdownTable);
        
        // Display visual representation of each sheet
        results.layouts.forEach((layout, index) => {
            const sheetContainer = document.createElement('div');
            sheetContainer.className = 'sheet-container';
            
            const sheetTitle = document.createElement('div');
            sheetTitle.className = 'sheet-title';
            sheetTitle.textContent = `Sheet ${index + 1} (${layout.items.length} items)`;
            sheetContainer.appendChild(sheetTitle);
            
            // Calculate scale factor to fit in the visualization area
            const maxDisplayWidth = 400; // max width for visualization
            const scaleFactor = maxDisplayWidth / layout.sheetWidth;
            
            // Create canvas for sheet visualization
            const sheetCanvas = document.createElement('canvas');
            sheetCanvas.className = 'sheet-visualization';
            sheetCanvas.width = layout.sheetWidth * scaleFactor;
            sheetCanvas.height = layout.sheetHeight * scaleFactor;
            sheetContainer.appendChild(sheetCanvas);
            visualResultsDiv.appendChild(sheetContainer);
            
            // Render the sheet with all DXF items
            renderSheet(sheetCanvas, layout, scaleFactor);
        });
        
        // Show download buttons
        downloadButtonsContainer.style.display = 'block';
        
        // Clear previous individual download buttons
        individualDownloadsDiv.innerHTML = '';
        
        // Add individual download buttons for each sheet
        results.layouts.forEach((layout, index) => {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-sheet-btn';
            downloadBtn.textContent = `Sheet ${index + 1}`;
            downloadBtn.addEventListener('click', () => handleDownloadSheet(index));
            individualDownloadsDiv.appendChild(downloadBtn);
        });
    }

    /**
     * Render a DXF preview on canvas
     * @param {HTMLCanvasElement} canvas - The canvas element
     * @param {Array} entities - Array of DXF entities to render
     * @param {Object} dimensions - Part dimensions {width, height, minX, minY}
     */
    function renderDXFPreview(canvas, entities, dimensions) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Check if high resolution preview is enabled
        const highResEnabled = document.getElementById('highResolutionPreview')?.checked;
        
        // Store original dimensions to restore later if needed
        const originalWidth = canvas.width;
        const originalHeight = canvas.height;
        
        // Apply higher resolution if enabled
        if (highResEnabled) {
            canvas.width = originalWidth * 2;
            canvas.height = originalHeight * 2;
            canvas.style.width = originalWidth + 'px';
            canvas.style.height = originalHeight + 'px';
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
        });
    }

    /**
     * Render a sheet with all DXF items
     */
    function renderSheet(canvas, layout, scaleFactor) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw the sheet border
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        // Apply scaling to fit the sheet visualization
        ctx.scale(scaleFactor, scaleFactor);
        
        // Use requestAnimationFrame for rendering
        requestAnimationFrame(() => {
            layout.items.forEach((item, index) => {
                const part = item.part;
                
                ctx.save();
                
                // Position the item
                ctx.translate(item.x, item.y);
                
                // Apply rotation if needed
                if (item.rotation !== 0) {
                    // Rotate around the center of the item
                    ctx.translate(item.width / 2, item.height / 2);
                    ctx.rotate((item.rotation * Math.PI) / 180);
                    ctx.translate(-item.width / 2, -item.height / 2);
                }
                
                // Apply mirroring if needed
                if (item.mirrored) {
                    ctx.scale(-1, 1);
                    ctx.translate(-item.width, 0);
                }
                
                // Use consistent color based on part ID (create a color hash)
                const colorIndex = hashString(part.id) % colorPalette.length;
                ctx.strokeStyle = colorPalette[colorIndex];
                
                // Draw the DXF entities for this item
                drawEntities(ctx, part.entities, -part.dimensions.minX, -part.dimensions.minY);
                
                ctx.restore();
            });
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
        });
    }

    // Color palette for different parts
    const colorPalette = [
        '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099', '#0099C6',
        '#DD4477', '#66AA00', '#B82E2E', '#316395', '#994499', '#22AA99',
        '#AAAA11', '#6633CC', '#E67300', '#8B0707', '#329262', '#5574A6'
    ];

    /**
     * Simple string hash function to get consistent colors
     */
    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return Math.abs(hash);
    }

    /**
     * Draw DXF entities on a canvas context
     * @param {CanvasRenderingContext2D} ctx - The canvas 2D context
     * @param {Array} entities - Array of DXF entities to draw
     * @param {number} offsetX - X offset for drawing
     * @param {number} offsetY - Y offset for drawing
     */
    function drawEntities(ctx, entities, offsetX = 0, offsetY = 0) {
        ctx.lineWidth = 1;
        entities.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    drawLine(ctx, entity, offsetX, offsetY);
                    break;
                case 'CIRCLE':
                    drawCircle(ctx, entity, offsetX, offsetY);
                    break;
                case 'ARC':
                    drawArc(ctx, entity, offsetX, offsetY);
                    break;
                case 'POLYLINE':
                case 'LWPOLYLINE':
                    drawPolyline(ctx, entity, offsetX, offsetY);
                    break;
                case 'SPLINE':
                    if (entity.vertices) {
                        drawSpline(ctx, entity, offsetX, offsetY);
                    }
                    break;
            }
        });
    }

    /**
     * Draw a line on canvas
     */
    function drawLine(ctx, entity, offsetX, offsetY) {
        ctx.beginPath();
        ctx.moveTo(entity.start.x + offsetX, entity.start.y + offsetY);
        ctx.lineTo(entity.end.x + offsetX, entity.end.y + offsetY);
        ctx.stroke();
    }

    /**
     * Draw a circle on canvas
     */
    function drawCircle(ctx, entity, offsetX, offsetY) {
        ctx.beginPath();
        ctx.arc(
            entity.center.x + offsetX,
            entity.center.y + offsetY,
            entity.radius,
            0,
            2 * Math.PI
        );
        ctx.stroke();
    }

    /**
     * Draw an arc on canvas
     */
    function drawArc(ctx, entity, offsetX, offsetY) {
        ctx.beginPath();
        ctx.arc(
            entity.center.x + offsetX,
            entity.center.y + offsetY,
            entity.radius,
            (entity.startAngle * Math.PI) / 180,
            (entity.endAngle * Math.PI) / 180,
            false
        );
        ctx.stroke();
    }

    /**
     * Draw a polyline on canvas
     */
    function drawPolyline(ctx, entity, offsetX, offsetY) {
        if (!entity.vertices || entity.vertices.length === 0) return;
        
        ctx.beginPath();
        ctx.moveTo(entity.vertices[0].x + offsetX, entity.vertices[0].y + offsetY);
        for (let i = 1; i < entity.vertices.length; i++) {
            ctx.lineTo(entity.vertices[i].x + offsetX, entity.vertices[i].y + offsetY);
        }
        // Close the path if it's a closed polyline
        if (entity.closed) {
            ctx.closePath();
        }
        
        ctx.stroke();
    }

    /**
     * Draw a spline curve on canvas
     */
    function drawSpline(ctx, entity, offsetX, offsetY) {
        if (!entity.vertices || entity.vertices.length < 2) return;
        
        ctx.beginPath();
        ctx.moveTo(entity.vertices[0].x + offsetX, entity.vertices[0].y + offsetY);
        if (entity.vertices.length === 2) {
            // For 2 points, just draw a line
            ctx.lineTo(entity.vertices[1].x + offsetX, entity.vertices[1].y + offsetY);
        } else {
            // For 3 or more points, use quadratic curves through the vertices
            for (let i = 1; i < entity.vertices.length - 2; i++) {
                const xc = (entity.vertices[i].x + entity.vertices[i + 1].x) / 2;
                const yc = (entity.vertices[i].y + entity.vertices[i + 1].y) / 2;
                ctx.quadraticCurveTo(
                    entity.vertices[i].x + offsetX,
                    entity.vertices[i].y + offsetY,
                    xc + offsetX,
                    yc + offsetY
                );
            }
            // For the last two points
            ctx.quadraticCurveTo(
                entity.vertices[entity.vertices.length - 2].x + offsetX,
                entity.vertices[entity.vertices.length - 2].y + offsetY,
                entity.vertices[entity.vertices.length - 1].x + offsetX,
                entity.vertices[entity.vertices.length - 1].y + offsetY
            );
        }
        ctx.stroke();
    }

    /**
     * Handle download of all optimized sheets as a ZIP
     */
    function handleDownloadAll() {
        if (!optimizationResults) {
            showError('No optimization results to download.');
            return;
        }
        // Create DXF files for each sheet
        const files = optimizationResults.layouts.map((layout, index) => {
            const dxfContent = optimizer.generateDXFForSheet(index);
            return {
                name: `optimized_sheet_${index + 1}.dxf`,
                content: dxfContent
            };
        });
        // For simplicity, we'll just download the first file if there's only one
        if (files.length === 1) {
            downloadDXFFile(files[0].name, files[0].content);
            return;
        }
        // In a real application, you might want to use a library like JSZip to create a zip file
        alert('Multiple sheets generated. In a production app, this would create a ZIP file with all sheets. For now, please use the individual sheet download buttons.');
    }

    /**
     * Handle download of a single sheet
     */
    function handleDownloadSheet(sheetIndex) {
        if (!optimizationResults) {
            showError('No optimization results to download.');
            return;
        }
        const dxfContent = optimizer.generateDXFForSheet(sheetIndex);
        const fileName = `optimized_sheet_${sheetIndex + 1}.dxf`;
        downloadDXFFile(fileName, dxfContent);
    }

    /**
     * Utility function to read a file as text
     */
    function readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = event => resolve(event.target.result);
            reader.onerror = error => reject(error);
            reader.readAsText(file);
        });
    }

    /**
     * Utility function to download a DXF file
     */
    function downloadDXFFile(fileName, content) {
        const blob = new Blob([content], { type: 'application/dxf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Show a toast notification
     * @param {string} message - Message to display
     * @param {string} [type='success'] - Type of notification ('success' or 'error')
     */
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

    /**
     * Show an error message
     */
    function showError(message) {
        showToast(message, 'error');
    }

    /**
     * Show a message
     */
    function showMessage(message) {
        showToast(message, 'success');
    }

    /**
     * Handle preview file button click
     */
    async function handlePreviewFile() {
        if (!currentFile) {
            showError('Please select a DXF file first.');
            return;
        }
        try {
            // Show loading overlay
            document.getElementById('loadingOverlay').style.display = 'flex';
            // Read and parse the DXF file
            const dxfContent = await readFile(currentFile);
            const partOptimizer = new DXFOptimizer();
            const parseResult = await partOptimizer.parseDXF(dxfContent);

            if (!parseResult.success) {
                showError(parseResult.error);
                return;
            }

            // Update file information with dimensions detected and let user know about the units
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
            // Hide loading overlay
            document.getElementById('loadingOverlay').style.display = 'none';
        }
    }

    /**
     * Toggle dark mode
     */
    function toggleDarkMode() {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode);
    }

    /**
     * Save current sheet settings as a new material
     */
    function saveCurrentMaterial() {
        // Get current sheet settings
        const materialWidth = parseFloat(document.getElementById('sheetWidth').value);
        const materialHeight = parseFloat(document.getElementById('sheetHeight').value);
        const materialCost = parseFloat(document.getElementById('materialCost').value);
        const materialType = document.getElementById('materialType').value.trim();
        
        // Open material modal and populate fields
        const materialModal = document.getElementById('materialModal');
        materialModal.style.display = 'block';
        
        // Pre-fill the fields with current values
        document.getElementById('materialName').value = materialType || 'New Material';
        document.getElementById('materialWidth').value = materialWidth;
        document.getElementById('materialHeight').value = materialHeight;
        document.getElementById('materialCostInput').value = materialCost;
        document.getElementById('materialDescription').value = materialType;
        
        // Reset the save button to its original state
        const saveButton = document.getElementById('saveMaterialFormBtn');
        saveButton.textContent = 'Save Material';
        saveButton.removeEventListener('click', updateMaterial);
        saveButton.addEventListener('click', saveMaterial);
    }

    /**
     * Apply selected material settings
     */
    function applyMaterialSelection() {
        const materialSelect = document.getElementById('materialSelect');
        const selectedValue = materialSelect.value;
        
        if (selectedValue === 'custom') {
            return;
        }
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        const selectedMaterial = materials[parseInt(selectedValue)];
        
        if (selectedMaterial) {
            document.getElementById('sheetWidth').value = selectedMaterial.width;
            document.getElementById('sheetHeight').value = selectedMaterial.height;
            document.getElementById('materialCost').value = selectedMaterial.cost;
            document.getElementById('materialType').value = selectedMaterial.name;
        }
    }

    /**
     * Update material select dropdown with saved materials
     */
    function updateMaterialSelect() {
        const materialSelect = document.getElementById('materialSelect');
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        
        // Clear existing options except 'Custom Size'
        while (materialSelect.options.length > 1) {
            materialSelect.remove(1);
        }

        // Add saved materials
        materials.forEach((material, index) => {
            const option = document.createElement('option');
            option.value = index;
            option.textContent = `${material.name} (${material.width}x${material.height}mm)`;
            materialSelect.appendChild(option);
        });
    }

    /**
     * Save material settings
     */
    function saveMaterial() {
        const materialName = document.getElementById('materialName').value.trim();
        const materialWidth = parseFloat(document.getElementById('materialWidth').value);
        const materialHeight = parseFloat(document.getElementById('materialHeight').value);
        const materialDescription = document.getElementById('materialDescription').value.trim();
        const materialCost = parseFloat(document.getElementById('materialCostInput').value);
        
        if (!materialName) {
            showError('Material name is required.');
            return;
        }
        if (isNaN(materialWidth) || materialWidth <= 0) {
            showError('Material width must be a positive number.');
            return;
        }
        if (isNaN(materialHeight) || materialHeight <= 0) {
            showError('Material height must be a positive number.');
            return;
        }
        if (isNaN(materialCost) || materialCost < 0) {
            showError('Material cost must be a non-negative number.');
            return;
        }
        
        // Save material to local storage or send to server
        const material = {
            name: materialName,
            width: materialWidth,
            height: materialHeight,
            description: materialDescription,
            cost: materialCost
        };
        
        // For simplicity, we'll use local storage
        let materials = JSON.parse(localStorage.getItem('materials')) || [];
        materials.push(material);
        localStorage.setItem('materials', JSON.stringify(materials));

        showMessage('Material saved successfully.');
        document.getElementById('materialModal').style.display = 'none';
        
        // Update material select dropdown
        updateMaterialSelect();
    }

    /**
     * Show manage materials modal
     */
    function showManageMaterialsModal() {
        const manageMaterialsModal = document.getElementById('manageMaterialsModal');
        manageMaterialsModal.style.display = 'block';
        loadMaterialsList();
    }

    /**
     * Load and display the list of saved materials
     * Updates the materials list in the manage materials modal
     */
    function loadMaterialsList() {
        const materialsList = document.getElementById('materialsList');
        materialsList.innerHTML = '';
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        
        materials.forEach((material, index) => {
            const materialItem = document.createElement('div');
            materialItem.className = 'material-item';
            
            const materialInfo = document.createElement('div');
            materialInfo.className = 'material-info';
            materialInfo.innerHTML = `
                <div><strong>Name:</strong> ${material.name}</div>
                <div><strong>Width:</strong> ${material.width} mm</div>
                <div><strong>Height:</strong> ${material.height} mm</div>
                <div><strong>Cost:</strong> $${material.cost}</div>
            `;
            
            const materialActions = document.createElement('div');
            materialActions.className = 'material-actions';
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.addEventListener('click', () => editMaterial(index));
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteMaterial(index));
            materialActions.appendChild(editButton);
            materialActions.appendChild(deleteButton);
            
            materialItem.appendChild(materialInfo);
            materialItem.appendChild(materialActions);
            materialsList.appendChild(materialItem);
        });
    }

    /**
     * Edit an existing material
     * @param {number} index - Index of the material in the materials array
     */
    function editMaterial(index) {
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        const material = materials[index];
        
        document.getElementById('materialName').value = material.name;
        document.getElementById('materialWidth').value = material.width;
        document.getElementById('materialHeight').value = material.height;
        document.getElementById('materialDescription').value = material.description;
        document.getElementById('materialCostInput').value = material.cost;
        
        // Show material modal
        document.getElementById('materialModal').style.display = 'block';
        
        // Update save button to handle update
        const saveButton = document.getElementById('saveMaterialFormBtn');
        saveButton.textContent = 'Update Material';
        saveButton.removeEventListener('click', saveMaterial);
        saveButton.addEventListener('click', () => updateMaterial(index));
    }

    /**
     * Update an existing material with new values
     * @param {number} index - Index of the material to update
     * @throws {Error} If validation fails
     */
    function updateMaterial(index) {
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        const materialName = document.getElementById('materialName').value.trim();
        const materialWidth = parseFloat(document.getElementById('materialWidth').value);
        const materialHeight = parseFloat(document.getElementById('materialHeight').value);
        const materialDescription = document.getElementById('materialDescription').value.trim();
        const materialCost = parseFloat(document.getElementById('materialCostInput').value);
        
        if (!materialName) {
            showError('Material name is required.');
            return;
        }
        if (isNaN(materialWidth) || materialWidth <= 0) {
            showError('Material width must be a positive number.');
            return;
        }
        if (isNaN(materialHeight) || materialHeight <= 0) {
            showError('Material height must be a positive number.');
            return;
        }
        if (isNaN(materialCost) || materialCost < 0) {
            showError('Material cost must be a non-negative number.');
            return;
        }
        
        materials[index] = {
            name: materialName,
            width: materialWidth,
            height: materialHeight,
            description: materialDescription,
            cost: materialCost
        };
        
        localStorage.setItem('materials', JSON.stringify(materials));
        showMessage('Material updated successfully.');
        document.getElementById('materialModal').style.display = 'none';
        loadMaterialsList();
        
        // Update material select dropdown
        updateMaterialSelect();
    }

    /**
     * Delete material
     */
    function deleteMaterial(index) {
        const materials = JSON.parse(localStorage.getItem('materials')) || [];
        materials.splice(index, 1);
        localStorage.setItem('materials', JSON.stringify(materials));
        showMessage('Material deleted successfully.');
        loadMaterialsList();
        
        // Update material select dropdown
        updateMaterialSelect();
    }

    /**
     * Compare layouts
     */
    function compareLayouts() {
        const comparisonModal = document.getElementById('comparisonModal');
        comparisonModal.style.display = 'block';
        
        // Render current and previous layouts
        const currentLayout = optimizationResults.layouts[optimizationResults.layouts.length - 1];
        const previousLayout = optimizationResults.layouts[optimizationResults.layouts.length - 2];
        
        if (currentLayout) {
            renderSheet(document.getElementById('comparisonLayout1').querySelector('.comparison-visual canvas'), currentLayout, 1);
        }
        if (previousLayout) {
            renderSheet(document.getElementById('comparisonLayout2').querySelector('.comparison-visual canvas'), previousLayout, 1);
        }
    }

    // Initialize material select on page load
    updateMaterialSelect();
    populateOptimizationStrategies();
    populateUnitsSelect();
});

// Function to populate the units dropdown
function populateUnitsSelect() {
    let unitsSelect = document.getElementById('unitsSelect');
    
    // If the units select doesn't exist, create it dynamically
    if (!unitsSelect) {
        console.log('Creating units select dropdown dynamically');
        
        // Find an appropriate container for the units dropdown
        const container = document.querySelector('.optimization-controls') || 
                         document.getElementById('optimizationControls') ||
                         document.body;
                         
        // Create the select element with label
        const label = document.createElement('label');
        label.setAttribute('for', 'unitsSelect');
        label.textContent = 'Units: ';
        
        unitsSelect = document.createElement('select');
        unitsSelect.id = 'unitsSelect';
        unitsSelect.className = 'form-control';
        
        // Add event listener for unit changes
        unitsSelect.addEventListener('change', function() {
            console.log('Units changed to: ' + this.value);
            // Additional logic for unit conversion can be added here
        });
        
        // Append to the container
        container.appendChild(label);
        container.appendChild(unitsSelect);
    }
    
    // Clear any existing options
    unitsSelect.innerHTML = '';
    
    const units = ['mm', 'cm', 'in', 'ft']; // Add more if needed
    units.forEach(unit => {
        const option = document.createElement('option');
        option.value = unit;
        option.textContent = unit;
        unitsSelect.appendChild(option);
    });
}

// Ensure populateUnitsSelect is called after DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    
    // Call populateUnitsSelect after DOM is loaded
    populateUnitsSelect();
    
    // ...existing code...
});

// Add helper function to update file info display with detected dimensions
function updateFileInfoDisplay(fileName, dimensions) {
    const fileInfo = document.getElementById('fileInfo');
    if (fileInfo && dimensions) {
        // Show filename with dimensions and unit (default 'mm')
        fileInfo.textContent = `${fileName} (${dimensions.width} x ${dimensions.height} mm)`;
    }
}

// Add function to populate optimization strategy dropdown with several options
function populateOptimizationStrategies() {
    const strategySelect = document.getElementById('optimizationStrategy');
    if (strategySelect) {
        // Clear current options
        strategySelect.innerHTML = '';
        // Add new options
        const options = [
            {value: 'interlocking', text: 'Interlocking'},
            {value: 'side-by-side', text: 'Side-by-Side'},
            {value: 'top-of-each-other', text: 'Top of Each Other'},
            {value: 'periodical', text: 'Periodical'}
        ];
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            strategySelect.appendChild(option);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize variables but don't create optimizer instance yet
    let optimizer = null;
    
    // DOM Elements - fix the corrupted variable definitions
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
    const unitsSelect = document.getElementById('unitsSelect');
    
    // State variables
    let currentFile = null;
    let partsList = [];
    let partIdCounter = 0;
    let optimizationResults = null;
    
    // Event Listeners
    // ...existing code...
    
    // Initialize UI components
    initUIComponents();
    
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
    
    // Add helper function to update file info display
    function updateFileInfoDisplay(fileName, dimensions) {
        const fileInfo = document.getElementById('fileInfo');
        if (fileInfo && dimensions) {
            const units = unitsSelect ? unitsSelect.value : 'mm';
            fileInfo.innerHTML = `<strong>File:</strong> ${fileName} <br>` +
                               `<strong>Dimensions:</strong> ${dimensions.width.toFixed(2)} × ${dimensions.height.toFixed(2)} ${units}`;
            fileInfo.style.display = 'block';
        }
    }
    
    // Original functions that need to be modified
    
    // Override renderDXFPreview to handle high resolution
    const originalRenderDXFPreview = renderDXFPreview;
    renderDXFPreview = function(canvas, entities, dimensions) {
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
    };
    
    // Override handleFileChange to show dimensions
    const originalHandleFileChange = handleFileChange;
    handleFileChange = async function(event) {
        // Call original function
        originalHandleFileChange(event);
        
        // If file selected, try to parse it for dimensions
        if (currentFile) {
            try {
                const dxfContent = await readFile(currentFile);
                const partOptimizer = new DXFOptimizer();
                const parseResult = await partOptimizer.parseDXF(dxfContent);
                if (parseResult.success) {
                    updateFileInfoDisplay(currentFile.name, parseResult.dimensions);
                }
            } catch (error) {
                console.error("Error parsing file dimensions:", error);
            }
        }
    };
    
    // Override handlePreviewFile to update file info display
    const originalHandlePreviewFile = handlePreviewFile;
    handlePreviewFile = async function() {
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
    };
    
    // Override handleOptimize to use the selected optimization strategy
    const originalHandleOptimize = handleOptimize;
    handleOptimize = function() {
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
    };
});