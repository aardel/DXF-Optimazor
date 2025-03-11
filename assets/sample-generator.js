/**
 * DXF Sample Generator
 * This script creates sample DXF files for testing the DXF Optimizer application
 * 
 * Usage: Open the HTML file in a browser and click on the buttons to download sample DXF files
 */

// Simple DXF Writer class (same as in the optimizer.js)
class DXFWriter {
    constructor() {
        this.content = [];
        this.initHeader();
    }
    
    initHeader() {
        // Simplified DXF header
        this.content.push('0');
        this.content.push('SECTION');
        this.content.push('2');
        this.content.push('HEADER');
        this.content.push('0');
        this.content.push('ENDSEC');
        this.content.push('0');
        this.content.push('SECTION');
        this.content.push('2');
        this.content.push('ENTITIES');
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
        // Finalize the DXF
        let finalContent = [...this.content];
        finalContent.push('0');
        finalContent.push('ENDSEC');
        finalContent.push('0');
        finalContent.push('EOF');
        
        return finalContent.join('\n');
    }
}

// Sample Creators
function createRectangle(width, height) {
    const writer = new DXFWriter();
    writer.addRect(0, 0, width, height);
    return writer.toDXFString();
}

function createCircle(radius) {
    const writer = new DXFWriter();
    writer.addCircle(radius, radius, radius);
    return writer.toDXFString();
}

function createLShape(width, height, thickness) {
    const writer = new DXFWriter();
    
    // Outer L shape
    const vertices = [
        { x: 0, y: 0 },
        { x: width, y: 0 },
        { x: width, y: thickness },
        { x: thickness, y: thickness },
        { x: thickness, y: height },
        { x: 0, y: height },
        { x: 0, y: 0 }
    ];
    
    writer.addPolyline(vertices);
    return writer.toDXFString();
}

function createGearShape(centerX, centerY, outerRadius, numTeeth, innerRadius) {
    const writer = new DXFWriter();
    
    const toothAngle = (2 * Math.PI) / numTeeth;
    const vertices = [];
    
    for (let i = 0; i < numTeeth; i++) {
        const angle1 = i * toothAngle;
        const angle2 = angle1 + toothAngle / 2;
        const angle3 = angle1 + toothAngle;
        
        // Outer point of tooth
        const x1 = centerX + outerRadius * Math.cos(angle1);
        const y1 = centerY + outerRadius * Math.sin(angle1);
        
        // Inner point between teeth
        const x2 = centerX + innerRadius * Math.cos(angle2);
        const y2 = centerY + innerRadius * Math.sin(angle2);
        
        // Outer point of next tooth
        const x3 = centerX + outerRadius * Math.cos(angle3);
        const y3 = centerY + outerRadius * Math.sin(angle3);
        
        if (i === 0) {
            vertices.push({ x: x1, y: y1 });
        }
        
        vertices.push({ x: x2, y: y2 });
        vertices.push({ x: x3, y: y3 });
    }
    
    // Close the shape
    vertices.push(vertices[0]);
    
    writer.addPolyline(vertices);
    
    // Add center circle
    writer.addCircle(centerX, centerY, innerRadius / 3);
    
    return writer.toDXFString();
}

function downloadDXF(fileName, content) {
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

// Set up the buttons
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('createRectangle').addEventListener('click', function() {
        const dxf = createRectangle(100, 50);
        downloadDXF('rectangle.dxf', dxf);
    });
    
    document.getElementById('createCircle').addEventListener('click', function() {
        const dxf = createCircle(50);
        downloadDXF('circle.dxf', dxf);
    });
    
    document.getElementById('createLShape').addEventListener('click', function() {
        const dxf = createLShape(100, 150, 30);
        downloadDXF('l-shape.dxf', dxf);
    });
    
    document.getElementById('createGear').addEventListener('click', function() {
        const dxf = createGearShape(75, 75, 75, 12, 60);
        downloadDXF('gear.dxf', dxf);
    });
});