const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function generateTemplate() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Data');

    worksheet.columns = [
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Product', key: 'product', width: 25 },
        { header: 'Revenue', key: 'revenue', width: 12 },
        { header: 'Units Sold', key: 'unitsSold', width: 12 },
        { header: 'COGS', key: 'cogs', width: 12 },
        { header: 'Profit', key: 'profit', width: 12 },
        { header: 'Region', key: 'region', width: 15 },
        { header: 'Sales Rep', key: 'salesRep', width: 15 },
        { header: 'Customer Name', key: 'customer', width: 20 }
    ];

    const products = ['Cloud ERP', 'CRM Suite', 'HR Portal', 'Cyber Security', 'Data Analytics'];
    const regions = ['North America', 'EMEA', 'APAC', 'LATAM'];
    const reps = ['Alice Smith', 'Bob Jones', 'Charlie Brown', 'Diana Prince'];

    const data = [];
    const startDate = new Date('2024-01-01');
    const daysToGenerate = 730; // 2 years

    for (let i = 0; i < daysToGenerate; i++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        const month = date.getMonth(); // 0-11
        const isDecember = month === 11;
        const isSummer = month >= 5 && month <= 7;
        
        // Base revenue with a slight upward growth trend over 2 years
        const growthFactor = 1 + (i / daysToGenerate) * 0.4; // 40% growth over 2 years
        let baseRev = (Math.floor(Math.random() * 3000) + 2000) * growthFactor;
        
        // Add seasonality
        if (isDecember) baseRev *= 1.5; // Holiday spike
        if (isSummer) baseRev *= 0.8;   // Summer slump
        
        // Margin logic: Costs slowly increasing (margin compression)
        const marginFactor = 0.6 - (i / daysToGenerate) * 0.1; // Margin drops from 60% to 50%
        const cogs = baseRev * (1 - marginFactor + (Math.random() * 0.1 - 0.05));
        
        data.push({
            date: date,
            product: products[Math.floor(Math.random() * products.length)],
            revenue: Math.round(baseRev),
            unitsSold: Math.floor((baseRev / 100) + Math.random() * 10),
            cogs: Math.round(cogs),
            profit: Math.round(baseRev - cogs),
            region: regions[Math.floor(Math.random() * regions.length)],
            salesRep: reps[Math.floor(Math.random() * reps.length)],
            customer: `Client ${Math.floor(Math.random() * 500) + 1}`
        });
    }

    worksheet.addRows(data);

    // Style the header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD3D3D3' }
    };

    const templateDir = path.join(__dirname, 'server', 'templates');
    if (!fs.existsSync(templateDir)) {
        fs.mkdirSync(templateDir, { recursive: true });
    }

    const filePath = path.join(templateDir, 'sample_sales.xlsx');
    await workbook.xlsx.writeFile(filePath);
    console.log('✅ Template generated at:', filePath);
}

generateTemplate();
