// Add DXFUnits class before the DXFOptimizer class
class DXFUnits {
    static UNSPECIFIED = 0;
    static INCHES = 1;
    static FEET = 2;
    static MILLIMETERS = 3;
    static CENTIMETERS = 4;
    static METERS = 5;

    static getScaleFactor(sourceUnits, targetUnits = DXFUnits.MILLIMETERS) {
        const toMM = {
            [DXFUnits.INCHES]: 25.4,
            [DXFUnits.FEET]: 304.8,
            [DXFUnits.MILLIMETERS]: 1,
            [DXFUnits.CENTIMETERS]: 10,
            [DXFUnits.METERS]: 1000,
            [DXFUnits.UNSPECIFIED]: 1
        };

        return toMM[sourceUnits] / toMM[targetUnits];
    }

    static getUnitByHeaderValue(insunits) {
        switch(insunits) {
            case 1: return DXFUnits.INCHES;
            case 2: return DXFUnits.FEET;
            case 4: return DXFUnits.MILLIMETERS;
            case 5: return DXFUnits.CENTIMETERS;
            case 6: return DXFUnits.METERS;
            default: return DXFUnits.UNSPECIFIED;
        }
    }

    static detectFromHeader(header = {}) {
        let units = DXFUnits.UNSPECIFIED;

        if (header.$INSUNITS !== undefined) {
            units = DXFUnits.getUnitByHeaderValue(header.$INSUNITS);
        }
        else if (header.$MEASUREMENT !== undefined) {
            units = header.$MEASUREMENT === 0 ? DXFUnits.INCHES : DXFUnits.MILLIMETERS;
        }

        return units;
    }

    static detectFromDimensions(width, height) {
        const maxDim = Math.max(Math.abs(width), Math.abs(height));
        
        if (maxDim < 1) {
            return DXFUnits.INCHES;
        } else if (maxDim > 1000) {
            return DXFUnits.METERS;
        } else if (maxDim < 10) {
            return DXFUnits.CENTIMETERS;
        } else {
            return DXFUnits.MILLIMETERS;
        }
    }
}

class DXFOptimizer {
    constructor() {
        this.dxfData = null;
        this.originalEntities = [];
        this.optimizedLayouts = [];
        this.itemBoundingBox = null;
        this.originalUnits = DXFUnits.UNSPECIFIED;
        this.scaleFactor = 1;
    }

    async parseDXF(dxfContent) {
        console.log("DXFOptimizer: Parsing DXF content");
        try {
            const parser = new DXFParser();
            this.dxfData = parser.parseSync(dxfContent);
            this.originalEntities = this.dxfData.entities || [];
            console.log("DXFOptimizer: Parsed DXF data", this.dxfData);

            // Detect units and scale factor
            this.originalUnits = DXFUnits.detectFromHeader(this.dxfData.header);
            
            // If units couldn't be detected from header, try to detect from dimensions
            if (this.originalUnits === DXFUnits.UNSPECIFIED) {
                // Calculate rough dimensions before scaling
                const bbox = this.calculateRawBoundingBox();
                this.originalUnits = DXFUnits.detectFromDimensions(
                    bbox.width,
                    bbox.height
                );
            }

            // Calculate scale factor based on detected units
            this.scaleFactor = DXFUnits.getScaleFactor(this.originalUnits);
            
            // Scale entities to working units (mm)
            this.scaleEntities();
            
            // Calculate final bounding box in working units
            this.calculateBoundingBox();

            return {
                success: true,
                dimensions: this.itemBoundingBox,
                units: this.getUnitName(),
                scaleFactor: this.scaleFactor,
                originalUnits: this.originalUnits,
                entities: this.originalEntities // Add entities for rendering
            };
        } catch (error) {
            console.error("DXFOptimizer: Error parsing DXF", error);
            return {
                success: false,
                error: "Failed to parse DXF file. Make sure it's a valid DXF format."
            };
        }
    }

    calculateRawBoundingBox() {
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        this.originalEntities.forEach(entity => {
            if (entity.vertices) {
                entity.vertices.forEach(v => {
                    minX = Math.min(minX, v.x);
                    minY = Math.min(minY, v.y);
                    maxX = Math.max(maxX, v.x);
                    maxY = Math.max(maxY, v.y);
                });
            } else if (entity.center) {
                const r = entity.radius || 0;
                minX = Math.min(minX, entity.center.x - r);
                minY = Math.min(minY, entity.center.y - r);
                maxX = Math.max(maxX, entity.center.x + r);
                maxY = Math.max(maxY, entity.center.y + r);
            }
        });

        return {
            width: Math.abs(maxX - minX),
            height: Math.abs(maxY - minY),
            minX: minX,
            minY: minY,
            maxX: maxX,
            maxY: maxY
        };
    }

    /**
     * Get the original DXF entities for rendering
     */
    getOriginalEntities() {
        return this.originalEntities;
    }

    calculateBoundingBox() {
        if (!this.originalEntities.length) {
            return { width: 0, height: 0 };
        }

        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        // Iterate through all entities to find the bounding box
        this.originalEntities.forEach(entity => {
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

        this.itemBoundingBox = {
            width: Math.ceil(maxX - minX),
            height: Math.ceil(maxY - minY),
            minX: minX,
            minY: minY
        };

        return this.itemBoundingBox;
    }

    /**
     * Optimize layout for multiple different parts with various quantities
     */
    optimizeMultipleParts(parts, sheetWidth, sheetHeight, allowRotation, allowMirroring, edgeGap, partSpacing) {
        console.log("DXFOptimizer: Optimizing multiple parts", { parts, sheetWidth, sheetHeight, allowRotation, allowMirroring, edgeGap, partSpacing });
        this.sheetWidth = parseInt(sheetWidth);
        this.sheetHeight = parseInt(sheetHeight);
        this.allowRotation = allowRotation;
        this.allowMirroring = allowMirroring;
        this.edgeGap = parseInt(edgeGap) || 0;
        this.partSpacing = parseInt(partSpacing) || 0;
        
        // Reset results
        this.optimizedLayouts = [];
        this.parts = parts;
        
        // Count total items
        this.totalItems = parts.reduce((total, part) => total + part.quantity, 0);
        
        // Create flattened list of all part instances
        const allPartInstances = [];
        parts.forEach(part => {
            for (let i = 0; i < part.quantity; i++) {
                allPartInstances.push({
                    part: part,
                    width: part.dimensions.width,
                    height: part.dimensions.height,
                    placed: false
                });
            }
        });
        
        // Sort part instances by area (descending) to optimize packing
        allPartInstances.sort((a, b) => (b.width * b.height) - (a.width * a.height));
        
        // Keep placing parts until all are placed
        let remainingParts = [...allPartInstances];
        let sheetIndex = 0;
        
        while (remainingParts.length > 0) {
            // Create a new sheet
            const currentSheet = {
                sheetIndex: sheetIndex++,
                sheetWidth: this.sheetWidth,
                sheetHeight: this.sheetHeight,
                items: [],
                // Apply edge gap to the initial free rectangle
                freeRects: [{ 
                    x: this.edgeGap, 
                    y: this.edgeGap, 
                    width: this.sheetWidth - 2 * this.edgeGap, 
                    height: this.sheetHeight - 2 * this.edgeGap 
                }]
            };
            
            let partsPlaced = true;
            
            // Try to place remaining parts in the current sheet
            while (partsPlaced) {
                partsPlaced = false;
                
                for (let i = 0; i < remainingParts.length; i++) {
                    const partInstance = remainingParts[i];
                    
                    // Generate possible orientations, accounting for spacing between parts
                    const orientations = this.generatePossibleOrientations(
                        partInstance.width, 
                        partInstance.height, 
                        this.allowRotation, 
                        this.allowMirroring
                    );
                    
                    let bestFit = null;
                    let bestRect = null;
                    let bestOrientation = null;
                    
                    // Find the best fit for the part
                    for (const orientation of orientations) {
                        // Add part spacing to dimensions for placement calculations
                        const placementWidth = orientation.width + this.partSpacing;
                        const placementHeight = orientation.height + this.partSpacing;
                        
                        for (let rectIndex = 0; rectIndex < currentSheet.freeRects.length; rectIndex++) {
                            const rect = currentSheet.freeRects[rectIndex];
                            
                            if (placementWidth <= rect.width && placementHeight <= rect.height) {
                                // Check for collisions with already placed items
                                const collision = this.checkCollision(
                                    currentSheet.items, 
                                    rect.x, 
                                    rect.y, 
                                    placementWidth, 
                                    placementHeight,
                                    orientation.rotation
                                );
                                
                                if (!collision) {
                                    // Part can fit in this rectangle
                                    // Score by "best short side fit" - smaller leftover space is better
                                    const score = Math.min(rect.width - placementWidth, rect.height - placementHeight);
                                    
                                    if (bestFit === null || score < bestFit.score) {
                                        bestFit = {
                                            rectIndex: rectIndex,
                                            score: score
                                        };
                                        bestRect = rect;
                                        bestOrientation = orientation;
                                    }
                                }
                            }
                        }
                    }
                    
                    if (bestFit !== null) {
                        // Place the part - store the actual part dimensions (without spacing)
                        const placedItem = {
                            part: partInstance.part,
                            x: bestRect.x,
                            y: bestRect.y,
                            width: bestOrientation.width,
                            height: bestOrientation.height,
                            rotation: bestOrientation.rotation,
                            mirrored: bestOrientation.mirrored
                        };
                        
                        currentSheet.items.push(placedItem);
                        
                        // Split the rectangle with dimensions that include spacing
                        this.splitFreeRectangle(
                            currentSheet.freeRects,
                            bestFit.rectIndex,
                            bestOrientation.width + this.partSpacing,
                            bestOrientation.height + this.partSpacing
                        );
                        
                        // Remove the placed part from remaining parts
                        remainingParts.splice(i, 1);
                        
                        partsPlaced = true;
                        break;
                    }
                }
            }
            
            // Add the sheet to the layouts
            this.optimizedLayouts.push(currentSheet);
        }
        
        // Calculate utilization
        const totalSheetArea = this.sheetWidth * this.sheetHeight * this.optimizedLayouts.length;
        const usedArea = parts.reduce((area, part) => 
            area + (part.dimensions.width * part.dimensions.height * part.quantity), 0);
        const utilization = usedArea / totalSheetArea;
        
        console.log("DXFOptimizer: Optimization result", this.optimizedLayouts);
        return {
            totalItems: this.totalItems,
            totalSheets: this.optimizedLayouts.length,
            utilization: utilization,
            layouts: this.optimizedLayouts
        };
    }

    /**
     * Enhanced collision detection that considers rotation and part spacing
     */
    checkCollision(items, x, y, width, height, rotation) {
        if (items.length === 0) return false;
        
        for (const item of items) {
            // Basic AABB collision detection for aligned items
            if (rotation === 0 && item.rotation === 0 && !item.mirrored) {
                if (x < item.x + item.width + this.partSpacing && 
                    x + width > item.x && 
                    y < item.y + item.height + this.partSpacing && 
                    y + height > item.y) {
                    return true;
                }
            } else {
                // For rotated items, use a more conservative bounding box check
                // We add extra padding based on the part spacing
                const item1 = {
                    left: x,
                    top: y,
                    right: x + width,
                    bottom: y + height
                };
                
                const item2 = {
                    left: item.x,
                    top: item.y,
                    right: item.x + item.width + this.partSpacing,
                    bottom: item.y + item.height + this.partSpacing
                };
                
                // Add extra safety margin for rotated parts
                if (rotation !== 0 || item.rotation !== 0) {
                    const safetyMargin = Math.max(width, height) * 0.1;
                    item1.left -= safetyMargin;
                    item1.top -= safetyMargin;
                    item1.right += safetyMargin;
                    item1.bottom += safetyMargin;
                }
                
                // Check for AABB collision
                if (item1.left < item2.right && 
                    item1.right > item2.left && 
                    item1.top < item2.bottom && 
                    item1.bottom > item2.top) {
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Generate all possible orientations for a part based on allowed transformations
     */
    generatePossibleOrientations(width, height, allowRotation, allowMirroring) {
        // Start with unique orientations to avoid duplicates
        const uniqueOrientations = new Map();
        
        // Add original orientation
        uniqueOrientations.set('0:false', {
            width: width,
            height: height,
            rotation: 0,
            mirrored: false
        });
        
        // Add 90-degree rotation only (most practical for nesting)
        if (allowRotation) {
            uniqueOrientations.set('90:false', {
                width: height,
                height: width,
                rotation: 90,
                mirrored: false
            });
        }
        
        // Add mirrored versions
        if (allowMirroring) {
            if (uniqueOrientations.has('0:false')) {
                uniqueOrientations.set('0:true', {
                    width: width,
                    height: height,
                    rotation: 0,
                    mirrored: true
                });
            }
            
            if (allowRotation && uniqueOrientations.has('90:false')) {
                uniqueOrientations.set('90:true', {
                    width: height,
                    height: width,
                    rotation: 90,
                    mirrored: true
                });
            }
        }
        
        return Array.from(uniqueOrientations.values());
    }

    optimizeLayout(sheetWidth, sheetHeight, quantity, allowRotation, allowMirroring) {
        this.sheetWidth = parseInt(sheetWidth);
        this.sheetHeight = parseInt(sheetHeight);
        this.quantity = parseInt(quantity);
        this.allowRotation = allowRotation;
        this.allowMirroring = allowMirroring;
        
        // Reset results
        this.optimizedLayouts = [];

        // Calculate how many items can fit on a single sheet
        const itemsPerSheet = this.calculateItemsPerSheet();
        
        // Calculate total sheets needed
        const totalSheets = Math.ceil(this.quantity / itemsPerSheet.count);
        
        // Create layout for each sheet
        for (let i = 0; i < totalSheets; i++) {
            // For the last sheet, we might not need all positions
            const itemsOnThisSheet = (i === totalSheets - 1) 
                ? Math.min(itemsPerSheet.count, this.quantity - (i * itemsPerSheet.count))
                : itemsPerSheet.count;
            
            const layout = {
                sheetIndex: i,
                itemCount: itemsOnThisSheet,
                positions: itemsPerSheet.positions.slice(0, itemsOnThisSheet),
                sheetWidth: this.sheetWidth,
                sheetHeight: this.sheetHeight
            };
            
            this.optimizedLayouts.push(layout);
        }
        
        return {
            itemDimensions: this.itemBoundingBox,
            itemsPerSheet: itemsPerSheet.count,
            totalSheets: totalSheets,
            totalItems: this.quantity,
            layouts: this.optimizedLayouts
        };
    }

    calculateItemsPerSheet() {
        const itemWidth = this.itemBoundingBox.width;
        const itemHeight = this.itemBoundingBox.height;
        
        // Try different configurations to find the optimal layout
        const layouts = [];
        
        // If rotation is allowed, try multiple angles
        if (this.allowRotation) {
            // Try 0, 30, 45, 60, 90, 120, 135, 150 degree rotations
            const angles = [0, 30, 45, 60, 90, 120, 135, 150];
            
            angles.forEach(angle => {
                const rotatedDimensions = this.getRotatedDimensions(itemWidth, itemHeight, angle);
                layouts.push(this.calculateAdvancedLayout(rotatedDimensions.width, rotatedDimensions.height, angle));
            });
        } else {
            // Just try the default orientation
            layouts.push(this.calculateAdvancedLayout(itemWidth, itemHeight, 0));
        }
        
        // Sort layouts by number of items per sheet (descending)
        layouts.sort((a, b) => b.count - a.count);
        
        // If we have multiple layouts with the same item count, prefer the one with less waste space
        const bestCount = layouts[0].count;
        const bestLayouts = layouts.filter(layout => layout.count === bestCount);
        
        if (bestLayouts.length > 1) {
            // Calculate waste area for each layout
            bestLayouts.forEach(layout => {
                layout.wasteArea = this.calculateWasteArea(layout);
            });
            
            // Sort by waste area (ascending)
            bestLayouts.sort((a, b) => a.wasteArea - b.wasteArea);
        }
        
        return bestLayouts[0]; // Return the layout with the most items and least waste
    }

    /**
     * Calculate dimensions of a rotated rectangle
     */
    getRotatedDimensions(width, height, angle) {
        // Convert angle to radians
        const radians = (angle * Math.PI) / 180;
        
        // Calculate rotated width and height
        const newWidth = Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians));
        const newHeight = Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians));
        
        return {
            width: Math.ceil(newWidth),
            height: Math.ceil(newHeight)
        };
    }

    /**
     * Calculate waste area for a layout
     */
    calculateWasteArea(layout) {
        const totalSheetArea = this.sheetWidth * this.sheetHeight;
        const itemArea = this.itemBoundingBox.width * this.itemBoundingBox.height * layout.count;
        
        return totalSheetArea - itemArea;
    }

    calculateAdvancedLayout(width, height, rotation) {
        // First try the basic grid layout
        const gridResult = this.calculateGridLayout(width, height, rotation);
        
        // Then try a more advanced bin-packing algorithm (simplified version of guillotine cutting)
        const binPackingResult = this.calculateBinPackingLayout(width, height, rotation);
        
        // Return the better result
        return binPackingResult.count > gridResult.count ? binPackingResult : gridResult;
    }

    calculateGridLayout(width, height, rotation) {
        const itemsPerRow = Math.floor(this.sheetWidth / width);
        const itemsPerColumn = Math.floor(this.sheetHeight / height);
        const count = itemsPerRow * itemsPerColumn;
        
        // Calculate positions for each item
        const positions = [];
        
        for (let row = 0; row < itemsPerColumn; row++) {
            for (let col = 0; col < itemsPerRow; col++) {
                positions.push({
                    x: col * width,
                    y: row * height,
                    width: width,
                    height: height,
                    rotation: rotation,
                    mirrored: false
                });
                
                // If we've reached the quantity, stop adding positions
                if (positions.length >= this.quantity) {
                    break;
                }
            }
            
            if (positions.length >= this.quantity) {
                break;
            }
        }
        
        return {
            count: count,
            positions: positions,
            layout: 'grid'
        };
    }

    /**
     * Calculate bin-packing layout using a simplified guillotine algorithm
     */
    calculateBinPackingLayout(width, height, rotation) {
        // Initialize the free rectangles list with the entire sheet
        const freeRects = [
            { x: 0, y: 0, width: this.sheetWidth, height: this.sheetHeight }
        ];
        
        const positions = [];
        
        // Try to place as many items as possible
        while (freeRects.length > 0 && positions.length < this.quantity) {
            // Find the smallest free rectangle that can fit an item
            let bestRectIndex = -1;
            let bestScore = Infinity;
            
            for (let i = 0; i < freeRects.length; i++) {
                const rect = freeRects[i];
                
                if (rect.width >= width && rect.height >= height) {
                    // This rectangle can fit the item
                    // Use "best short side fit" heuristic
                    const score = Math.min(rect.width - width, rect.height - height);
                    
                    if (score < bestScore) {
                        bestScore = score;
                        bestRectIndex = i;
                    }
                }
            }
            
            if (bestRectIndex === -1) {
                // Cannot place more items
                break;
            }
            
            // Place the item
            const rect = freeRects[bestRectIndex];
            positions.push({
                x: rect.x,
                y: rect.y,
                width: width,
                height: height,
                rotation: rotation,
                mirrored: false
            });
            
            // Split the rectangle into two parts
            const remainingWidth = rect.width - width;
            const remainingHeight = rect.height - height;
            
            // Remove the used rectangle
            freeRects.splice(bestRectIndex, 1);
            
            // Split horizontally or vertically based on which gives larger free rectangles
            if (remainingWidth > 0) {
                freeRects.push({
                    x: rect.x + width,
                    y: rect.y,
                    width: remainingWidth,
                    height: height
                });
            }
            
            if (remainingHeight > 0) {
                freeRects.push({
                    x: rect.x,
                    y: rect.y + height,
                    width: rect.width,
                    height: remainingHeight
                });
            }
            
            // Merge adjacent free rectangles when possible (simplified)
            this.mergeAdjacentRectangles(freeRects);
        }
        
        return {
            count: positions.length,
            positions: positions,
            layout: 'bin-packing'
        };
    }

    /**
     * Merge adjacent rectangles when possible
     */
    mergeAdjacentRectangles(rectangles) {
        // This is a simplified implementation - in a real application, 
        // you might want a more sophisticated rectangle merging algorithm
        
        let merged = true;
        
        while (merged) {
            merged = false;
            
            for (let i = 0; i < rectangles.length; i++) {
                for (let j = i + 1; j < rectangles.length; j++) {
                    const rect1 = rectangles[i];
                    const rect2 = rectangles[j];
                    
                    // Try to merge horizontally
                    if (rect1.y === rect2.y && rect1.height === rect2.height) {
                        if (rect1.x + rect1.width === rect2.x) {
                            // Merge rect2 into rect1
                            rect1.width += rect2.width;
                            rectangles.splice(j, 1);
                            merged = true;
                            break;
                        }
                        else if (rect2.x + rect2.width === rect1.x) {
                            // Merge rect1 into rect2
                            rect2.width += rect1.width;
                            rectangles.splice(i, 1);
                            merged = true;
                            break;
                        }
                    }
                    
                    // Try to merge vertically
                    if (rect1.x === rect2.x && rect1.width === rect2.width) {
                        if (rect1.y + rect1.height === rect2.y) {
                            // Merge rect2 into rect1
                            rect1.height += rect2.height;
                            rectangles.splice(j, 1);
                            merged = true;
                            break;
                        }
                        else if (rect2.y + rect2.height === rect1.y) {
                            // Merge rect1 into rect2
                            rect2.height += rect1.height;
                            rectangles.splice(i, 1);
                            merged = true;
                            break;
                        }
                    }
                }
                
                if (merged) break;
            }
        }
    }

    /**
     * Split a free rectangle after placing a part
     * Uses the "guillotine" method which produces better sub-rectangles
     */
    splitFreeRectangle(freeRects, rectIndex, width, height) {
        const rect = freeRects[rectIndex];
        
        // Remove the original rectangle
        freeRects.splice(rectIndex, 1);
        
        // Calculate remaining spaces
        const remainingWidth = rect.width - width;
        const remainingHeight = rect.height - height;
        
        // Decide split orientation based on which remaining side is larger
        if (remainingWidth > 0 && remainingHeight > 0) {
            // Split both horizontally and vertically
            if (remainingWidth >= remainingHeight) {
                // Split horizontally first (larger right side)
                freeRects.push({
                    x: rect.x + width,
                    y: rect.y,
                    width: remainingWidth,
                    height: rect.height
                });
                
                // Then add rectangle below
                freeRects.push({
                    x: rect.x,
                    y: rect.y + height,
                    width: width,
                    height: remainingHeight
                });
            } else {
                // Split vertically first (larger bottom side)
                freeRects.push({
                    x: rect.x,
                    y: rect.y + height,
                    width: rect.width,
                    height: remainingHeight
                });
                
                // Then add rectangle to the right
                freeRects.push({
                    x: rect.x + width,
                    y: rect.y,
                    width: remainingWidth,
                    height: height
                });
            }
        } else if (remainingWidth > 0) {
            // Only split horizontally
            freeRects.push({
                x: rect.x + width,
                y: rect.y,
                width: remainingWidth,
                height: rect.height
            });
        } else if (remainingHeight > 0) {
            // Only split vertically
            freeRects.push({
                x: rect.x,
                y: rect.y + height,
                width: rect.width,
                height: remainingHeight
            });
        }
        
        // Merge adjacent free rectangles to reduce fragmentation
        this.mergeAdjacentRectangles(freeRects);
    }

    /**
     * Generate DXF for a specific sheet with multiple parts
     */
    generateDXFForSheet(sheetIndex) {
        if (this.optimizedLayouts.length <= sheetIndex) {
            return null;
        }
        
        const layout = this.optimizedLayouts[sheetIndex];
        const writer = new DXFWriter();
        
        // Set the units in the header
        writer.setUnits(this.originalUnits);
        
        // Scale the sheet dimensions back to original units
        const inverseFactor = 1 / this.scaleFactor;
        const originalWidth = layout.sheetWidth * inverseFactor;
        const originalHeight = layout.sheetHeight * inverseFactor;
        
        // Add sheet boundary in original units
        writer.addRect(0, 0, originalWidth, originalHeight);
        
        // Scale entities back to original units when adding to output
        if (layout.items) {
            layout.items.forEach(item => {
                const transformedEntities = this.transformEntities(
                    item.part.entities,
                    (item.x - item.part.dimensions.minX) * inverseFactor,
                    (item.y - item.part.dimensions.minY) * inverseFactor,
                    item.rotation,
                    item.mirrored
                ).map(entity => this.scaleEntityToOriginalUnits(entity));
                
                writer.addEntities(transformedEntities);
            });
        } else if (layout.positions) {
            layout.positions.forEach(position => {
                const transformedEntities = this.transformEntities(
                    this.originalEntities,
                    (position.x - this.itemBoundingBox.minX) * inverseFactor,
                    (position.y - this.itemBoundingBox.minY) * inverseFactor,
                    position.rotation,
                    position.mirrored
                ).map(entity => this.scaleEntityToOriginalUnits(entity));
                
                writer.addEntities(transformedEntities);
            });
        }
        
        return writer.toDXFString();
    }

    scaleEntityToOriginalUnits(entity) {
        const scaled = { ...entity };
        const factor = 1 / this.scaleFactor;
        
        // Apply inverse scaling with precision control
        if (entity.vertices) {
            scaled.vertices = entity.vertices.map(v => ({
                x: parseFloat((v.x * factor).toFixed(6)),
                y: parseFloat((v.y * factor).toFixed(6)),
                z: parseFloat(((v.z || 0) * factor).toFixed(6))
            }));
        }
        
        if (entity.center) {
            scaled.center = {
                x: parseFloat((entity.center.x * factor).toFixed(6)),
                y: parseFloat((entity.center.y * factor).toFixed(6)),
                z: parseFloat(((entity.center.z || 0) * factor).toFixed(6))
            };
        }
        
        if (entity.radius) {
            scaled.radius = parseFloat((entity.radius * factor).toFixed(6));
        }
        
        if (entity.position) {
            scaled.position = {
                x: parseFloat((entity.position.x * factor).toFixed(6)),
                y: parseFloat((entity.position.y * factor).toFixed(6)),
                z: parseFloat(((entity.position.z || 0) * factor).toFixed(6))
            };
        }

        // Handle special entity-specific inverse scaling
        if (entity.type === 'ELLIPSE') {
            if (entity.majorAxis) {
                scaled.majorAxis = {
                    x: parseFloat((entity.majorAxis.x * factor).toFixed(6)),
                    y: parseFloat((entity.majorAxis.y * factor).toFixed(6))
                };
            }
            scaled.axisRatio = entity.axisRatio;
        }

        if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
            if (entity.height) {
                scaled.height = parseFloat((entity.height * factor).toFixed(6));
            }
        }
        
        return scaled;
    }

    scaleEntities() {
        // Apply scaling to all entities while preserving precision
        this.originalEntities = this.originalEntities.map(entity => {
            const scaled = { ...entity };
            
            // Scale vertices with high precision
            if (entity.vertices) {
                scaled.vertices = entity.vertices.map(v => ({
                    x: parseFloat((v.x * this.scaleFactor).toFixed(6)),
                    y: parseFloat((v.y * this.scaleFactor).toFixed(6)),
                    z: parseFloat(((v.z || 0) * this.scaleFactor).toFixed(6))
                }));
            }
            
            // Scale center points
            if (entity.center) {
                scaled.center = {
                    x: parseFloat((entity.center.x * this.scaleFactor).toFixed(6)),
                    y: parseFloat((entity.center.y * this.scaleFactor).toFixed(6)),
                    z: parseFloat(((entity.center.z || 0) * this.scaleFactor).toFixed(6))
                };
            }
            
            // Scale radius values
            if (entity.radius) {
                scaled.radius = parseFloat((entity.radius * this.scaleFactor).toFixed(6));
            }
            
            // Scale position points
            if (entity.position) {
                scaled.position = {
                    x: parseFloat((entity.position.x * this.scaleFactor).toFixed(6)),
                    y: parseFloat((entity.position.y * this.scaleFactor).toFixed(6)),
                    z: parseFloat(((entity.position.z || 0) * this.scaleFactor).toFixed(6))
                };
            }

            // Handle special entity-specific scaling
            if (entity.type === 'ELLIPSE') {
                if (entity.majorAxis) {
                    scaled.majorAxis = {
                        x: parseFloat((entity.majorAxis.x * this.scaleFactor).toFixed(6)),
                        y: parseFloat((entity.majorAxis.y * this.scaleFactor).toFixed(6))
                    };
                }
                // Preserve axis ratio as it's dimensionless
                scaled.axisRatio = entity.axisRatio;
            }

            // Handle text height scaling
            if (entity.type === 'TEXT' || entity.type === 'MTEXT') {
                if (entity.height) {
                    scaled.height = parseFloat((entity.height * this.scaleFactor).toFixed(6));
                }
            }
            
            return scaled;
        });
    }

    getUnitName() {
        switch(this.originalUnits) {
            case 1: return 'inches';
            case 2: return 'feet';
            case 3: return 'millimeters';
            case 4: return 'centimeters';
            case 5: return 'meters';
            default: return 'unknown';
        }
    }

    transformEntities(entities, offsetX, offsetY, rotation, mirrored) {
        // Deep clone the entities to avoid modifying originals
        const clonedEntities = JSON.parse(JSON.stringify(entities));
        
        return clonedEntities.map(entity => {
            // Apply transformations based on entity type
            if (entity.vertices) {
                entity.vertices = entity.vertices.map(vertex => this.transformPoint(vertex, offsetX, offsetY, rotation, mirrored));
            }
            
            if (entity.center) {
                entity.center = this.transformPoint(entity.center, offsetX, offsetY, rotation, mirrored);
            }
            
            if (entity.position) {
                entity.position = this.transformPoint(entity.position, offsetX, offsetY, rotation, mirrored);
            }
            
            // For arcs and circles with rotation, we may need to adjust angles
            if (rotation && (entity.type === 'ARC' || entity.type === 'CIRCLE')) {
                if (entity.startAngle !== undefined) entity.startAngle = (entity.startAngle + rotation) % 360;
                if (entity.endAngle !== undefined) entity.endAngle = (entity.endAngle + rotation) % 360;
            }
            
            return entity;
        });
    }

    transformPoint(point, offsetX, offsetY, rotation, mirrored) {
        const result = { ...point };
        
        // Apply mirroring if needed
        if (mirrored) {
            result.x = -result.x;
        }
        
        // Apply rotation if needed
        if (rotation) {
            const radians = rotation * Math.PI / 180;
            const cosAngle = Math.cos(radians);
            const sinAngle = Math.sin(radians);
            const tempX = result.x;
            result.x = result.x * cosAngle - result.y * sinAngle;
            result.y = tempX * sinAngle + result.y * cosAngle;
        }
        
        // Apply offset
        result.x += offsetX;
        result.y += offsetY;
        
        return result;
    }
}

// Simple DXF Parser wrapper to handle the DXFParser library
class DXFParser {
    constructor() {
        this.parser = new window.DxfParser();
    }
    
    parseSync(dxfString) {
        try {
            const parsed = this.parser.parseSync(dxfString);
            
            // Normalize entities for consistent handling
            if (parsed.entities) {
                parsed.entities = parsed.entities.map(entity => this.normalizeEntity(entity));
            }
            
            return parsed;
        } catch (error) {
            console.error("Error parsing DXF:", error);
            throw error;
        }
    }

    normalizeEntity(entity) {
        // Clone to avoid modifying original
        const normalized = { ...entity };
        
        switch(entity.type) {
            case 'SPLINE':
                // Convert splines to polylines for simpler handling
                normalized.type = 'POLYLINE';
                normalized.vertices = this.approximateSpline(entity);
                break;
            case 'ELLIPSE':
                // Convert ellipses to polylines
                normalized.type = 'POLYLINE';
                normalized.vertices = this.approximateEllipse(entity);
                break;
            case 'INSERT':
                // Handle block insertions
                normalized.type = 'BLOCK';
                break;
            case 'DIMENSION':
                // Convert dimensions to their primitive entities
                normalized.type = 'POLYLINE';
                normalized.vertices = this.approximateDimension(entity);
                break;
        }
        
        return normalized;
    }

    approximateSpline(spline) {
        // Simple spline approximation - in real implementation would use proper spline interpolation
        if (!spline.controlPoints) return [];
        return spline.controlPoints.map(pt => ({
            x: pt.x,
            y: pt.y,
            z: pt.z || 0
        }));
    }

    approximateEllipse(ellipse) {
        const segments = 32; // Number of segments to approximate ellipse
        const vertices = [];
        const center = ellipse.center;
        const majorAxis = ellipse.majorAxis;
        const minorAxis = {
            x: -majorAxis.y * ellipse.axisRatio,
            y: majorAxis.x * ellipse.axisRatio
        };
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const cos = Math.cos(angle);
            const sin = Math.sin(angle);
            
            vertices.push({
                x: center.x + majorAxis.x * cos - minorAxis.x * sin,
                y: center.y + majorAxis.y * cos - minorAxis.y * sin
            });
        }
        
        return vertices;
    }

    approximateDimension(dimension) {
        // Simplified dimension handling - just creates a line between definition points
        const vertices = [];
        if (dimension.defPoint) vertices.push(dimension.defPoint);
        if (dimension.textMidPoint) vertices.push(dimension.textMidPoint);
        if (dimension.defPoint2) vertices.push(dimension.defPoint2);
        return vertices;
    }
}

// Simple DXF Writer class to generate DXF files
class DXFWriter {
    constructor() {
        this.content = [];
        this.units = 1; // Default to inches
        this.initHeader();
    }

    setUnits(units) {
        this.units = units;
        // Update $INSUNITS in header
        const insunitsIndex = this.content.indexOf('$INSUNITS');
        if (insunitsIndex !== -1) {
            this.content[insunitsIndex + 2] = units.toString();
        }
    }
    
    initHeader() {
        this.content.push('0');
        this.content.push('SECTION');
        this.content.push('2');
        this.content.push('HEADER');
        
        // Add AutoCAD drawing version
        this.content.push('9');
        this.content.push('$ACADVER');
        this.content.push('1');
        this.content.push('AC1032');  // AutoCAD 2018

        // Unit system variables
        this.content.push('9');
        this.content.push('$INSUNITS');
        this.content.push('70');
        this.content.push(this.units.toString());

        // Measurement variable (0=English, 1=Metric)
        this.content.push('9');
        this.content.push('$MEASUREMENT');
        this.content.push('70');
        this.content.push(this.units >= 3 ? '1' : '0');

        // Linear units format
        this.content.push('9');
        this.content.push('$LUNITS');
        this.content.push('70');
        this.content.push('2');  // Decimal format

        // Linear units precision
        this.content.push('9');
        this.content.push('$LUPREC');
        this.content.push('70');
        this.content.push('4');  // 4 decimal places

        // Drawing scale denominators
        this.content.push('9');
        this.content.push('$DIMSCALE');
        this.content.push('40');
        this.content.push('1.0');
        
        // Drawing limits and extents
        this.content.push('9');
        this.content.push('$LIMMIN');
        this.content.push('10');
        this.content.push('0.0');
        this.content.push('20');
        this.content.push('0.0');
        
        this.content.push('9');
        this.content.push('$LIMMAX');
        this.content.push('10');
        this.content.push('1000.0');
        this.content.push('20');
        this.content.push('1000.0');

        // Additional scaling variables
        this.content.push('9');
        this.content.push('$DIMLFAC');
        this.content.push('40');
        this.content.push('1.0');

        this.content.push('9');
        this.content.push('$DIMALTF');
        this.content.push('40');
        this.content.push('25.4');  // mm to inch conversion
        
        this.content.push('0');
        this.content.push('ENDSEC');
        
        // Tables section for layers, linetypes, styles
        this.content.push('0');
        this.content.push('SECTION');
        this.content.push('2');
        this.content.push('TABLES');
        
        // Add default layer
        this.content.push('0');
        this.content.push('TABLE');
        this.content.push('2');
        this.content.push('LAYER');
        this.content.push('70');
        this.content.push('1');
        this.content.push('0');
        this.content.push('LAYER');
        this.content.push('2');
        this.content.push('0');  // Layer name
        this.content.push('70');
        this.content.push('0');  // Layer flags
        this.content.push('62');
        this.content.push('7');  // Layer color
        this.content.push('6');
        this.content.push('CONTINUOUS');  // Linetype
        this.content.push('0');
        this.content.push('ENDTAB');
        
        this.content.push('0');
        this.content.push('ENDSEC');
        
        // Start entities section
        this.content.push('0');
        this.content.push('SECTION');
        this.content.push('2');
        this.content.push('ENTITIES');
    }

    addEntities(entities) {
        entities.forEach(entity => {
            switch(entity.type) {
                case 'LINE':
                    this.addLine(entity.start.x, entity.start.y, entity.end.x, entity.end.y);
                    break;
                case 'CIRCLE':
                    this.addCircle(entity.center.x, entity.center.y, entity.radius);
                    break;
                case 'ARC':
                    this.addArc(entity.center.x, entity.center.y, entity.radius, entity.startAngle, entity.endAngle);
                    break;
                case 'POLYLINE':
                case 'LWPOLYLINE':
                    this.addPolyline(entity.vertices, entity.closed);
                    break;
                case 'SPLINE':
                    if (entity.vertices) {
                        this.addPolyline(entity.vertices, entity.closed);
                    } else if (entity.controlPoints) {
                        this.addSpline(entity);
                    }
                    break;
                case 'POINT':
                    this.addPoint(entity.position.x, entity.position.y);
                    break;
                case 'TEXT':
                    this.addText(entity.text, entity.position.x, entity.position.y, entity.height || 2.5);
                    break;
                case 'MTEXT':
                    this.addMText(entity.text, entity.position.x, entity.position.y, entity.height || 2.5);
                    break;
                case 'ELLIPSE':
                    this.addEllipse(entity);
                    break;
            }
        });
    }
    
    addPoint(x, y) {
        this.content.push('0');
        this.content.push('POINT');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x.toString());
        this.content.push('20');
        this.content.push(y.toString());
    }
    
    addText(text, x, y, height) {
        this.content.push('0');
        this.content.push('TEXT');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x.toString());
        this.content.push('20');
        this.content.push(y.toString());
        this.content.push('40');
        this.content.push(height.toString());
        this.content.push('1');
        this.content.push(text);
    }
    
    addMText(text, x, y, height) {
        this.content.push('0');
        this.content.push('MTEXT');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x.toString());
        this.content.push('20');
        this.content.push(y.toString());
        this.content.push('40');
        this.content.push(height.toString());
        this.content.push('1');
        this.content.push(text);
    }

    addSpline(spline) {
        this.content.push('0');
        this.content.push('SPLINE');
        this.content.push('8');
        this.content.push('0');
        this.content.push('70');
        this.content.push('8'); // Rational spline
        this.content.push('71');
        this.content.push('3'); // Cubic spline
        this.content.push('72');
        this.content.push(spline.controlPoints.length.toString());
        this.content.push('73');
        this.content.push((spline.controlPoints.length + 4).toString());
        
        // Write knots
        spline.knots?.forEach((knot, i) => {
            this.content.push('40');
            this.content.push(knot.toString());
        });
        
        // Write control points
        spline.controlPoints.forEach(pt => {
            this.content.push('10');
            this.content.push(pt.x.toString());
            this.content.push('20');
            this.content.push(pt.y.toString());
            this.content.push('30');
            this.content.push((pt.z || 0).toString());
        });
    }
    
    addEllipse(ellipse) {
        this.content.push('0');
        this.content.push('ELLIPSE');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(ellipse.center.x.toString());
        this.content.push('20');
        this.content.push(ellipse.center.y.toString());
        this.content.push('11');
        this.content.push(ellipse.majorAxis.x.toString());
        this.content.push('21');
        this.content.push(ellipse.majorAxis.y.toString());
        this.content.push('40');
        this.content.push(ellipse.axisRatio.toString());
        this.content.push('41');
        this.content.push('0.0'); // Start parameter
        this.content.push('42');
        this.content.push('6.283185307179586'); // End parameter (2π)
    }

    addLine(x1, y1, x2, y2) {
        this.content.push('0');
        this.content.push('LINE');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x1.toString());
        this.content.push('20');
        this.content.push(y1.toString());
        this.content.push('11');
        this.content.push(x2.toString());
        this.content.push('21');
        this.content.push(y2.toString());
    }
    
    addCircle(x, y, radius) {
        this.content.push('0');
        this.content.push('CIRCLE');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x.toString());
        this.content.push('20');
        this.content.push(y.toString());
        this.content.push('40');
        this.content.push(radius.toString());
    }
    
    addArc(x, y, radius, startAngle, endAngle) {
        this.content.push('0');
        this.content.push('ARC');
        this.content.push('8');
        this.content.push('0');
        this.content.push('10');
        this.content.push(x.toString());
        this.content.push('20');
        this.content.push(y.toString());
        this.content.push('40');
        this.content.push(radius.toString());
        this.content.push('50');
        this.content.push(startAngle.toString());
        this.content.push('51');
        this.content.push(endAngle.toString());
    }
    
    addPolyline(vertices) {
        this.content.push('0');
        this.content.push('POLYLINE');
        this.content.push('8');
        this.content.push('0');
        this.content.push('66');
        this.content.push('1');
        this.content.push('70');
        this.content.push('1');
        
        vertices.forEach(vertex => {
            this.content.push('0');
            this.content.push('VERTEX');
            this.content.push('8');
            this.content.push('0');
            this.content.push('10');
            this.content.push(vertex.x.toString());
            this.content.push('20');
            this.content.push(vertex.y.toString());
        });
        
        this.content.push('0');
        this.content.push('SEQEND');
    }
    
    addRect(x, y, width, height) {
        const vertices = [
            { x: x, y: y },
            { x: x + width, y: y },
            { x: x + width, y: y + height },
            { x: x, y: y + height },
            { x: x, y: y }
        ];
        
        this.addPolyline(vertices);
    }
    
    toDXFString() {
        // Add blocks section
        let finalContent = [...this.content];
        finalContent.push('0');
        finalContent.push('ENDSEC');
        
        // Add blocks section (even if empty, for compatibility)
        finalContent.push('0');
        finalContent.push('SECTION');
        finalContent.push('2');
        finalContent.push('BLOCKS');
        finalContent.push('0');
        finalContent.push('ENDSEC');
        
        // Add objects section with unit system info
        finalContent.push('0');
        finalContent.push('SECTION');
        finalContent.push('2');
        finalContent.push('OBJECTS');
        finalContent.push('0');
        finalContent.push('DICTIONARY');
        finalContent.push('5');
        finalContent.push('C');
        finalContent.push('100');
        finalContent.push('AcDbDictionary');
        finalContent.push('3');
        finalContent.push('ACAD_GROUP');
        finalContent.push('350');
        finalContent.push('D');
        finalContent.push('0');
        finalContent.push('ENDSEC');
        
        finalContent.push('0');
        finalContent.push('EOF');
        
        return finalContent.join('\n');
    }
}

// Add the optimizeLayout function
function optimizeLayout() {
    console.log("optimizeLayout: Optimization started");
    startProcessing();
    // ...existing code...
    setTimeout(() => {
        console.log("optimizeLayout: Optimization completed");
        stopProcessing();
    }, 5000); // Adjust this timeout as needed
}