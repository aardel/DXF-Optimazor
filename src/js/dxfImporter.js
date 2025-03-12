import DxfParser from 'dxf-parser';

class DXFImporter {
    constructor() {
        this.parser = new DxfParser();
    }

    async importDXF(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const dxfContent = e.target.result;
                    const dxfData = this.parser.parseSync(dxfContent);
                    resolve(dxfData);
                } catch (error) {
                    reject(new Error('Failed to parse DXF file. Make sure it\'s a valid DXF format.'));
                }
            };
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            reader.readAsText(file);
        });
    }

    getEntities(dxfData) {
        return dxfData.entities || [];
    }

    getHeader(dxfData) {
        return dxfData.header || {};
    }

    getBlocks(dxfData) {
        return dxfData.blocks || [];
    }

    getTables(dxfData) {
        return dxfData.tables || {};
    }

    getLayers(dxfData) {
        return dxfData.tables.layers || [];
    }

    getLinetypes(dxfData) {
        return dxfData.tables.linetypes || [];
    }

    getStyles(dxfData) {
        return dxfData.tables.styles || [];
    }

    getViews(dxfData) {
        return dxfData.tables.views || [];
    }

    getUCS(dxfData) {
        return dxfData.tables.ucs || [];
    }

    getAppID(dxfData) {
        return dxfData.tables.appid || [];
    }

    getDimStyles(dxfData) {
        return dxfData.tables.dimstyles || [];
    }

    getBlockRecords(dxfData) {
        return dxfData.tables.block_records || [];
    }

    getViewport(dxfData) {
        return dxfData.tables.viewport || [];
    }

    getEntitiesByType(dxfData, type) {
        return this.getEntities(dxfData).filter(entity => entity.type === type);
    }
}

export default DXFImporter;