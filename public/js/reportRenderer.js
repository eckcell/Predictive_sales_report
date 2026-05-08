class ReportRenderer {
    constructor() {
        this.gauge = new ScoreGauge('score-gauge-container');
    }

    render(report) {
        // 1. Score & Summary
        this.gauge.render(report.score);
        document.getElementById('score-label').innerText = this.getScoreLabel(report.score);
        document.getElementById('score-label').style.color = this.gauge.getColor(report.score);
        document.getElementById('score-reasoning').innerText = report.executiveSummary.substring(0, 150) + '...';
        document.getElementById('exec-summary').innerText = report.executiveSummary;

        // 2. KPI Bar
        const summary = report.metadata.summary;
        document.getElementById('kpi-revenue').innerText = `$${this.formatLarge(summary.totalRevenue)}`;
        document.getElementById('kpi-profit').innerText = `$${this.formatLarge(summary.totalProfit)}`;
        document.getElementById('kpi-margin').innerText = `${summary.overallGrossMargin.toFixed(1)}%`;
        document.getElementById('kpi-count').innerText = summary.rowCount.toLocaleString();

        // 3. Score Breakdown
        const dimList = document.getElementById('dimensions-list');
        dimList.innerHTML = '';
        Object.entries(report.scoreBreakdown).forEach(([key, val]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            dimList.innerHTML += `
                <div class="dimension-item">
                    <div class="dimension-header">
                        <span>${label}</span>
                        <span>${val.score}/100</span>
                    </div>
                    <div class="progress-bg">
                        <div class="progress-fill" style="width: ${val.score}%; background: ${this.gauge.getColor(val.score)}"></div>
                    </div>
                </div>
            `;
        });

        // 4. Profitability Section
        const trendEl = document.getElementById('margin-trend-val');
        trendEl.innerText = report.profitability.marginTrend.toUpperCase();
        trendEl.className = `trend-indicator ${report.profitability.marginTrend}`;
        document.getElementById('cogs-efficiency-val').innerText = report.profitability.cogsEfficiency;

        const highList = document.getElementById('high-margin-list');
        highList.innerHTML = report.profitability.highestMarginProducts.map(p => `<li>${p.product} (${p.margin.toFixed(1)}%)</li>`).join('');

        const lowList = document.getElementById('low-margin-list');
        lowList.innerHTML = report.profitability.lowestMarginProducts.map(p => `<li>${p.product} (${p.margin.toFixed(1)}%)</li>`).join('');

        // 5. Findings & Forecast
        document.getElementById('findings-list').innerHTML = report.keyFindings.map(f => `<li>${f}</li>`).join('');
        
        const f = report.forecast.revenue[0];
        document.getElementById('forecast-summary').innerHTML = `
            <div class="forecast-box">
                <div class="forecast-main">Projected Revenue: <strong>$${this.formatLarge(f.projected)}</strong></div>
                <div class="forecast-meta">Confidence: ${Math.round(f.confidence * 100)}%</div>
            </div>
        `;

        // 6. Risks & Ops
        document.getElementById('risks-list').innerHTML = report.risks.map(r => `
            <div class="severity-item">
                <span class="severity ${r.severity}">${r.severity}</span>
                <strong>${r.risk}</strong>
                <p>${r.mitigation}</p>
            </div>
        `).join('');

        document.getElementById('ops-list').innerHTML = report.opportunities.map(o => `
            <div class="severity-item">
                <span class="severity ${o.impact}">${o.impact}</span>
                <strong>${o.opportunity}</strong>
                <p>${o.timeframe}</p>
            </div>
        `).join('');

        // 7. Recommendations
        document.getElementById('recs-list').innerHTML = report.recommendations.map(r => `
            <div class="recs-item">
                <span class="severity ${r.priority}">${r.priority} Priority</span>
                <h4>${r.action}</h4>
                <p>Expected Impact: ${r.expectedImpact}</p>
            </div>
        `).join('');
    }

    getScoreLabel(score) {
        if (score >= 90) return 'Exceptional';
        if (score >= 75) return 'Strong';
        if (score >= 60) return 'Moderate';
        if (score >= 40) return 'Needs Attention';
        return 'Critical';
    }

    formatLarge(num) {
        if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.round(num).toString();
    }
}

window.ReportRenderer = ReportRenderer;
