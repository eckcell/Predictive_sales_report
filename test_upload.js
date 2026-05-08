const fs = require('fs');

async function testUpload() {
    const file = fs.createReadStream('./server/templates/sample_sales.xlsx');
    const formData = new FormData();
    formData.append('file', new Blob([fs.readFileSync('./server/templates/sample_sales.xlsx')]), 'sample_sales.xlsx');

    try {
        const fetch = (await import('node-fetch')).default;
        // Or wait, Node 18+ has native fetch and FormData!
    } catch(e) {}
}

// using node 18+ native fetch
async function test() {
    const blob = new Blob([fs.readFileSync('./server/templates/sample_sales.xlsx')]);
    const formData = new FormData();
    formData.append('file', blob, 'sample_sales.xlsx');
    
    console.log("Sending request...");
    const res = await fetch('http://localhost:3000/api/analyze', {
        method: 'POST',
        body: formData
    });
    
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Response text length:", text.length);
    if (res.status !== 200) {
        console.log("Error response:", text);
    } else {
        fs.writeFileSync('response_test.json', text);
        console.log("Wrote response_test.json");
    }
}

test();
