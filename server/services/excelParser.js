const ExcelJS = require('exceljs');
const path = require('path');

/**
 * Maps Excel columns to our internal schema based on header names
 * @param {Array} headers - List of header strings from Excel
 * @returns {Object} Mapping of header name to index
 */
const getHeaderMapping = (headers) => {
    const mapping = {};
    const lowerHeaders = headers.map(h => String(h).toLowerCase().trim());

    const aliasMap = {
        date: ['date', 'time', 'period', 'transaction date'],
        product: ['product', 'service', 'item', 'product/service', 'sku'],
        revenue: ['revenue', 'total revenue', 'sales', 'total sales', 'amount'],
        unitsSold: ['units sold', 'quantity', 'units', 'qty', 'count'],
        cogs: ['cogs', 'cost', 'cost of goods', 'expense', 'unit cost'],
        profit: ['profit', 'gross profit', 'net profit', 'earnings', 'margin amount'],
        region: ['region', 'territory', 'location', 'country', 'city'],
        salesRep: ['sales rep', 'salesperson', 'rep', 'owner'],
        customerSegment: ['segment', 'customer segment', 'category'],
        leadSource: ['lead source', 'source', 'channel'],
        dealStage: ['stage', 'deal stage', 'status'],
        discount: ['discount', 'discount %', 'reduction'],
        customerName: ['customer', 'customer name', 'client', 'account']
    };

    Object.entries(aliasMap).forEach(([field, aliases]) => {
        const index = lowerHeaders.findIndex(header => aliases.includes(header));
        if (index !== -1) {
            mapping[field] = index + 1; // ExcelJS columns are 1-indexed
        }
    });

    return mapping;
};

/**
 * Parses an Excel file and returns an array of row objects
 * @param {string} filePath - Path to the .xlsx file
 * @returns {Promise<Array>} List of objects
 */
const parseExcel = async (filePath) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    
    // Default to the first visible worksheet
    const worksheet = workbook.worksheets.find(s => s.state === 'visible') || workbook.worksheets[0];
    if (!worksheet) throw new Error('No worksheets found in Excel file');

    const headers = worksheet.getRow(1).values.slice(1); // slice(1) because 0 is empty
    const mapping = getHeaderMapping(headers);

    // Validate mandatory fields
    const required = ['date', 'product', 'revenue', 'unitsSold', 'cogs'];
    const missing = required.filter(field => !mapping[field]);
    if (missing.length > 0) {
        throw new Error(`Missing required columns: ${missing.join(', ')}`);
    }

    const rows = [];
    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip headers

        const rowData = {};
        Object.entries(mapping).forEach(([field, colIndex]) => {
            let value = row.getCell(colIndex).value;
            
            // Handle Excel formulas
            if (value && typeof value === 'object' && value.result !== undefined) {
                value = value.result;
            }
            
            rowData[field] = value;
        });

        // Auto-compute Profit if missing but Revenue and COGS exist
        if (rowData.profit === undefined && rowData.revenue !== undefined && rowData.cogs !== undefined) {
            rowData.profit = Number(rowData.revenue) - Number(rowData.cogs);
        }

        rows.push(rowData);
    });

    return rows;
};

module.exports = {
    parseExcel
};
