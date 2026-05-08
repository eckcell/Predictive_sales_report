class ForecastRenderer {
    constructor() {
        this.chart = null;
        this.report = null;
        this.currentMetric = 'revenue';
        this.currentHorizon = 6;
        this.selectedScenarioId = null;
        
        this.initEventListeners();
    }

    initEventListeners() {
        // Metric toggles
        document.querySelectorAll('.metric-toggles .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.metric-toggles .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentMetric = e.target.dataset.metric;
                this.updateChart();
            });
        });

        // Horizon toggles
        document.querySelectorAll('.horizon-toggles .toggle-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.horizon-toggles .toggle-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentHorizon = parseInt(e.target.dataset.horizon);
                this.updateChart();
            });
        });

        // Sliders
        const sliders = {
            'slider-rev-growth': 'val-rev-growth',
            'slider-cogs-change': 'val-cogs-change',
            'slider-margin-target': 'val-margin-target'
        };

        Object.entries(sliders).forEach(([id, valId]) => {
            const el = document.getElementById(id);
            el.addEventListener('input', (e) => {
                let suffix = '%';
                let prefix = e.target.value > 0 ? '+' : '';
                if (id === 'slider-margin-target') {
                    suffix = '%';
                    prefix = '';
                }
                document.getElementById(valId).innerText = `${prefix}${e.target.value}${suffix}`;
            });
        });

        // Run Scenario Button
        document.getElementById('run-scenario-btn').addEventListener('click', () => this.runCustomScenario());
    }

    render(report) {
        this.report = report;
        this.renderScenarios();
        this.updateChart();
    }

    renderScenarios() {
        const grid = document.getElementById('scenario-cards-grid');
        grid.innerHTML = '';

        if (!this.report.scenarios) return;

        this.report.scenarios.forEach(s => {
            const likelihood = this.report.scenarioAnalysis?.find(a => a.scenarioId === s.id)?.likelihood || 'medium';
            const card = document.createElement('div');
            card.className = `scenario-item ${this.selectedScenarioId === s.id ? 'active' : ''}`;
            card.innerHTML = `
                <h4>${s.label}</h4>
                <div class="impact-val">${s.impactSummary.revenueChange.split(' ')[1]}</div>
                <div class="impact-sub">Margin: ${s.impactSummary.marginShift}</div>
                <span class="likelihood-badge ${likelihood}">${likelihood}</span>
            `;
            card.onclick = () => {
                document.querySelectorAll('.scenario-item').forEach(i => i.classList.remove('active'));
                card.classList.add('active');
                this.selectedScenarioId = s.id;
                this.updateChart();
            };
            grid.appendChild(card);
        });
    }

    updateChart() {
        const ctx = document.getElementById('forecast-chart').getContext('2d');
        const historical = this.report.metadata.metrics.byPeriod;
        const projections = this.report.forecast.monthlyProjections.slice(0, this.currentHorizon);
        
        let scenarioProjections = null;
        if (this.selectedScenarioId) {
            const scenario = this.report.scenarios.find(s => s.id === this.selectedScenarioId);
            if (scenario) scenarioProjections = scenario.monthlyProjections.slice(0, this.currentHorizon);
        }

        const labels = [
            ...historical.slice(-6).map(h => h.id),
            ...projections.map(p => p.month)
        ];

        const histData = historical.slice(-6).map(h => h[this.currentMetric]);
        
        let projMid, projLow, projHigh;
        if (this.currentMetric === 'margin') {
            projMid = projections.map(p => {
                const profit = p.profit.mid;
                const rev = p.revenue.mid;
                return (profit / (rev || 1)) * 100;
            });
            projLow = projMid; // No bands for margin in this simplified version
            projHigh = projMid;
        } else {
            projMid = projections.map(p => p[this.currentMetric].mid);
            projLow = projections.map(p => p[this.currentMetric].low);
            projHigh = projections.map(p => p[this.currentMetric].high);
        }

        // Add nulls to offset projections
        const histLine = [...histData, ...new Array(projections.length).fill(null)];
        const projLine = [...new Array(histData.length - 1).fill(null), histData[histData.length - 1], ...projMid];
        const lowLine = [...new Array(histData.length - 1).fill(null), histData[histData.length - 1], ...projLow];
        const highLine = [...new Array(histData.length - 1).fill(null), histData[histData.length - 1], ...projHigh];

        const datasets = [
            {
                label: 'Historical',
                data: histLine,
                borderColor: '#ffffff',
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.3,
                fill: false
            },
            {
                label: 'Projected',
                data: projLine,
                borderColor: '#00e599',
                borderDash: [5, 5],
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
                fill: false
            }
        ];

        if (this.currentMetric !== 'margin') {
            datasets.push({
                label: 'Confidence Band',
                data: highLine,
                borderColor: 'transparent',
                pointRadius: 0,
                tension: 0.3,
                fill: false
            }, {
                label: 'Confidence Band',
                data: lowLine,
                borderColor: 'transparent',
                backgroundColor: 'rgba(0, 229, 153, 0.05)',
                pointRadius: 0,
                tension: 0.3,
                fill: '-1' // Fill to previous dataset (highLine)
            });
        }

        if (scenarioProjections) {
            const scenarioData = [...new Array(histData.length - 1).fill(null), histData[histData.length - 1], ...scenarioProjections.map(p => p[this.currentMetric === 'margin' ? 'margin' : this.currentMetric].mid)];
            datasets.push({
                label: 'Scenario',
                data: scenarioData,
                borderColor: '#ffd60a',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.3,
                fill: false
            });
        }

        if (this.chart) this.chart.destroy();

        this.chart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: '#1c1c1c',
                        titleColor: '#8e8e93',
                        bodyColor: '#ffffff',
                        borderColor: '#222',
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: (context) => {
                                let val = context.parsed.y;
                                if (this.currentMetric === 'margin') return `Margin: ${val.toFixed(1)}%`;
                                return `${context.dataset.label}: $${val.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        grid: { color: '#1a1a1a' },
                        ticks: {
                            color: '#8e8e93',
                            callback: (val) => this.currentMetric === 'margin' ? val + '%' : '$' + this.formatLarge(val)
                        }
                    },
                    x: {
                        grid: { display: false },
                        ticks: { color: '#8e8e93' }
                    }
                }
            }
        });
    }

    async runCustomScenario() {
        const btn = document.getElementById('run-scenario-btn');
        const resultBox = document.getElementById('scenario-result-box');
        
        const params = {
            analysisId: this.report.analysisId,
            revenueGrowth: parseInt(document.getElementById('slider-rev-growth').value) / 100,
            cogsChange: parseInt(document.getElementById('slider-cogs-change').value) / 100,
            marginTarget: parseInt(document.getElementById('slider-margin-target').value),
            horizon: this.currentHorizon
        };

        btn.disabled = true;
        btn.innerText = 'Running...';
        resultBox.innerHTML = '<div class="loader-sm"></div>'; // Need a small loader CSS

        try {
            const response = await fetch('/api/scenario', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(params)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            this.renderCustomResult(data);
        } catch (err) {
            resultBox.innerHTML = `<div class="error-msg">${err.message}</div>`;
        } finally {
            btn.disabled = false;
            btn.innerText = 'Run Scenario';
        }
    }

    renderCustomResult(data) {
        const box = document.getElementById('scenario-result-box');
        box.innerHTML = `
            <div class="result-content">
                <h4>Custom Scenario Impact</h4>
                <div class="result-metrics">
                    <div class="result-kpi">
                        <label>Revenue Impact</label>
                        <span>${data.impactSummary.revenueChange}</span>
                    </div>
                    <div class="result-kpi">
                        <label>Margin Shift</label>
                        <span>${data.impactSummary.marginShift}</span>
                    </div>
                </div>
                <div class="ai-narrative">
                    <p>${data.aiNarrative}</p>
                </div>
            </div>
        `;
    }

    formatLarge(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toString();
    }
}

window.ForecastRenderer = ForecastRenderer;
