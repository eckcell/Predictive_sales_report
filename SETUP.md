# ⚙️ Setup Guide

Follow these steps to get your Predictive Sales App running.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Gemini API Key** (Get one for free at [aistudio.google.com](https://aistudio.google.com/))

### 2. Installation
\`\`\`bash
# Install dependencies
npm install
\`\`\`

### 3. Configuration
Create a \`.env\` file in the root directory:
\`\`\`env
GEMINI_API_KEY=your_actual_key_here
PORT=3000
\`\`\`

### 4. Running the App
\`\`\`bash
# Start the server
npm start
\`\`\`
Visit **http://localhost:3000** in your browser.

### 5. Using the App
1. Download the **Sample Template** from the dashboard.
2. Fill it with your sales data (ensure Revenue and COGS are present).
3. Drag and drop the file onto the dashboard.
4. Wait for the AI analysis to complete.
5. Export your results to PDF.
