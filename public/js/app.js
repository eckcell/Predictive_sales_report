document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        upload: document.getElementById('upload-screen'),
        loading: document.getElementById('loading-screen'),
        results: document.getElementById('results-screen')
    };

    const renderer = new ReportRenderer();
    
    const uploader = new Uploader(
        (data) => {
            // Success callback
            try {
                showScreen('results');
                renderer.render(data);
            } catch (err) {
                console.error(err);
                document.getElementById('results-screen').innerHTML = `
                    <div style="color: red; padding: 50px;">
                        <h2>Frontend Rendering Error</h2>
                        <pre>${err.stack}</pre>
                        <p>Data received: ${JSON.stringify(data).substring(0, 500)}...</p>
                    </div>
                `;
            }
        },
        (error) => {
            // Error callback
            alert(error);
            showScreen('upload');
        }
    );

    // Screen switching logic
    function showScreen(name) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[name].classList.add('active');
        window.scrollTo(0, 0);
    }

    // Event listeners
    window.addEventListener('upload-started', () => {
        showScreen('loading');
        simulateSteps();
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        showScreen('upload');
    });

    document.getElementById('export-btn').addEventListener('click', () => {
        const element = document.querySelector('.report-grid');
        const opt = {
            margin: 10,
            filename: 'Sales_Analysis_Report.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, backgroundColor: '#0f172a' },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
        };
        html2pdf().set(opt).from(element).save();
    });

    // Loading steps animation
    function simulateSteps() {
        const steps = ['step-1', 'step-2', 'step-3', 'step-4'];
        steps.forEach(id => document.getElementById(id).className = 'step');
        
        let current = 0;
        const interval = setInterval(() => {
            if (current > 0) {
                document.getElementById(steps[current - 1]).className = 'step completed';
            }
            if (current < steps.length) {
                document.getElementById(steps[current]).className = 'step active';
                current++;
            } else {
                clearInterval(interval);
            }
        }, 2000);
    }
});
