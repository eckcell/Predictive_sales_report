class ScoreGauge {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.size = 200;
        this.strokeWidth = 15;
        this.radius = (this.size - this.strokeWidth) / 2;
        this.circumference = 2 * Math.PI * this.radius;
    }

    render(score) {
        const color = this.getColor(score);
        this.container.innerHTML = `
            <svg width="${this.size}" height="${this.size}" viewBox="0 0 ${this.size} ${this.size}">
                <circle 
                    cx="${this.size / 2}" 
                    cy="${this.size / 2}" 
                    r="${this.radius}" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.05)" 
                    stroke-width="${this.strokeWidth}"
                />
                <circle 
                    id="gauge-fill"
                    cx="${this.size / 2}" 
                    cy="${this.size / 2}" 
                    r="${this.radius}" 
                    fill="none" 
                    stroke="${color}" 
                    stroke-width="${this.strokeWidth}"
                    stroke-dasharray="${this.circumference}"
                    stroke-dashoffset="${this.circumference}"
                    stroke-linecap="round"
                    transform="rotate(-90 ${this.size / 2} ${this.size / 2})"
                />
                <text 
                    x="50%" 
                    y="50%" 
                    text-anchor="middle" 
                    dy=".3em" 
                    font-size="48px" 
                    font-weight="800" 
                    fill="white"
                >${score}</text>
            </svg>
        `;

        // Animate the fill
        setTimeout(() => {
            const fill = document.getElementById('gauge-fill');
            const offset = this.circumference - (score / 100) * this.circumference;
            fill.style.transition = 'stroke-dashoffset 1.5s ease-out';
            fill.style.strokeDashoffset = offset;
        }, 100);
    }

    getColor(score) {
        if (score >= 75) return '#00e599'; // Fintech Neon Green
        if (score >= 50) return '#ffd60a'; // Warning Yellow
        return '#ff453a'; // Danger Red
    }
}

window.ScoreGauge = ScoreGauge;
