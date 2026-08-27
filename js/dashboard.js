/**
 * ONI Intelligence - Dashboard Logic
 * Conteúdo: Plugins Chart.js, Configuração de Gráficos e Relógio Real-time.
 */

// ==========================================================================
// 1. ESTRUTURA DE DADOS (DADOS SIMULADOS / API)
// ==========================================================================

const dadosDashboard = {
  slaSemanal: [
    { dia: "Seg", valor: 99.4 },
    { dia: "Ter", valor: 98.7 },
    { dia: "Qua", valor: 99.1 },
    { dia: "Qui", valor: 97.8 },
    { dia: "Sex", valor: 99.5 },
    { dia: "Sáb", valor: 99.9 },
    { dia: "Dom", valor: 98.2 }
  ],
  telemetriaRede: {
    labels: ["09:35", "10:05", "10:35", "11:05", "11:35", "12:05", "12:35", "13:05", "13:35", "14:05", "14:35", "15:05", "15:35"],
    latenciaICMP: [7.8, 8.5, 8.0, 6.1, 16.4, 8.0, 9.2, 8.0, 6.2, 7.8, 8.5, 6.0, 8.1], // ms
    downloadMbps: [30, 38, 32, 38, 22, 18, 24, 32, 95.7, 38, 26, 28, 33.4],          // Mbps
    uploadMbps: [8, 9, 8, 10, 8, 6, 8, 7, 22.4, 5, 7, 8, 8.7]                     // Mbps
  },
  topFalhas: [
    { servidor: "SRV-VMS-PROD-02", erro: "VSS Snapshot Failure", impacto: "Crítico", horario: "15:42" },
    { servidor: "SRV-BKP-CORE-01", erro: "Repository Disk Full", impacto: "Crítico", horario: "16:10" },
    { servidor: "SRV-SQL-FIN-03", erro: "Network Timeout (Proxy)", impacto: "Alto", horario: "16:55" }
  ]
};

// ==========================================================================
// 2. PLUGINS CUSTOMIZADOS PARA CHART.JS
// ==========================================================================

/**
 * Plugin: thresholdLine
 * Desenha uma linha de limite (threshold) horizontal tracejada no gráfico.
 */
const thresholdLinePlugin = {
    id: 'thresholdLine',
    beforeDraw(chart) {
        if (chart.config.options.plugins.thresholdValue) {
            const ctx = chart.ctx;
            const yAxis = chart.scales.y;
            const yValue = yAxis.getPixelForValue(chart.config.options.plugins.thresholdValue);
            
            ctx.save();
            ctx.beginPath();
            ctx.setLineDash([4, 4]); // Define o estilo tracejado
            ctx.strokeStyle = '#FF3D00'; // Cor do alerta (Status Red)
            ctx.lineWidth = 1.5;
            ctx.moveTo(chart.chartArea.left, yValue);
            ctx.lineTo(chart.chartArea.right, yValue);
            ctx.stroke();
            ctx.restore();
        }
    }
};

/**
 * Plugin: peakHighlight
 * Destaca uma área vertical no gráfico (ex: período de pico ou manutenção).
 */
const peakHighlightPlugin = {
    id: 'peakHighlight',
    beforeDraw(chart) {
        if (chart.config.options.plugins.peakHighlightRange) {
            const ctx = chart.ctx;
            const xAxis = chart.scales.x;
            const yAxis = chart.scales.y;
            const range = chart.config.options.plugins.peakHighlightRange;

            const xStart = xAxis.getPixelForValue(range.start);
            const xEnd = xAxis.getPixelForValue(range.end);

            ctx.save();
            // Preenchimento de fundo da área de pico
            ctx.fillStyle = 'rgba(255, 179, 0, 0.08)';
            ctx.fillRect(xStart, yAxis.top, xEnd - xStart, yAxis.bottom - yAxis.top);

            // Linhas delimitadoras laterais
            ctx.beginPath();
            ctx.setLineDash([3, 3]);
            ctx.strokeStyle = 'rgba(255, 179, 0, 0.4)';
            ctx.lineWidth = 1.5;
            
            ctx.moveTo(xStart, yAxis.top);
            ctx.lineTo(xStart, yAxis.bottom);
            ctx.moveTo(xEnd, yAxis.top);
            ctx.lineTo(xEnd, yAxis.bottom);
            ctx.stroke();

            ctx.restore();
        }
    }
};

// ==========================================================================
// 3. INICIALIZAÇÃO DOS GRÁFICOS E INTERFACE
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // --- Gráfico 1: LATÊNCIA ICMP ---
    const ctxIcmp = document.getElementById('icmpChart').getContext('2d');
    new Chart(ctxIcmp, {
        type: 'line',
        data: {
            labels: dadosDashboard.telemetriaRede.labels, // Conectado aos dados da variável
            datasets: [{
                data: dadosDashboard.telemetriaRede.latenciaICMP, // Conectado aos dados da variável
                borderColor: '#00ff66',
                borderWidth: 2,
                fill: false,
                tension: 0.35,
                // Destaca os pontos de pico e o valor atual dinamicamente
                pointRadius: (ctx) => (ctx.dataIndex === 4 || ctx.dataIndex === dadosDashboard.telemetriaRede.latenciaICMP.length - 1 ? 4 : 0),
                pointBackgroundColor: (ctx) => (ctx.dataIndex === 4 ? '#ffb300' : '#00ff66'),
                pointBorderColor: (ctx) => (ctx.dataIndex === 4 ? '#ffb300' : '#00ff66'),
                pointBorderWidth: 2
            }]
        },
        plugins: [thresholdLinePlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                thresholdValue: 15 // Linha de alerta em 15 ms
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#7b8c9d', font: { family: 'Barlow Condensed', size: 12, weight: '700' } }
                },
                y: {
                    min: 0,
                    max: 20,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#7b8c9d', font: { family: 'Barlow Condensed', size: 12, weight: '700' }, stepSize: 5 }
                }
            }
        }
    });

    // --- Gráfico 2: TRÁFEGO WAN ---
    const ctxWan = document.getElementById('wanChart').getContext('2d');
    
    // Gradiente de fundo para Download
    const wanGradient = ctxWan.createLinearGradient(0, 0, 0, 120);
    wanGradient.addColorStop(0, 'rgba(0, 255, 102, 0.25)');
    wanGradient.addColorStop(1, 'rgba(0, 255, 102, 0.00)');

    new Chart(ctxWan, {
        type: 'line',
        data: {
            labels: dadosDashboard.telemetriaRede.labels, // Conectado aos dados da variável
            datasets: [
                {
                    label: 'Download',
                    data: dadosDashboard.telemetriaRede.downloadMbps, // Conectado aos dados da variável
                    borderColor: '#00ff66',
                    borderWidth: 2,
                    fill: true,
                    backgroundColor: wanGradient,
                    tension: 0.35,
                    pointRadius: (ctx) => (ctx.dataIndex === 8 ? 4 : 0),
                    pointBackgroundColor: '#00ff66'
                },
                {
                    label: 'Upload',
                    data: dadosDashboard.telemetriaRede.uploadMbps, // Conectado aos dados da variável
                    borderColor: '#637599',
                    borderWidth: 1.5,
                    borderDash: [4, 4],
                    fill: false,
                    tension: 0.35,
                    pointRadius: (ctx) => (ctx.dataIndex === 8 ? 3 : 0),
                    pointBackgroundColor: '#637599'
                }
            ]
        },
        plugins: [peakHighlightPlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                peakHighlightRange: { start: 7, end: 9 }
            },
            scales: {
                x: {
                    grid: { color: 'rgba(255, 255, 255, 0.03)' },
                    ticks: { color: '#7b8c9d', font: { family: 'Barlow Condensed', size: 12, weight: '700' } }
                },
                y: {
                    min: 0,
                    max: 120,
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: { color: '#7b8c9d', font: { family: 'Barlow Condensed', size: 12, weight: '700' }, stepSize: 30 }
                }
            }
        }
    });

    // Renderizar componentes da interface
    renderTopFalhas();
    updateClock();
});

// ==========================================================================
// 4. LÓGICA DE INTERFACE E RENDERIZAÇÃO
// ==========================================================================

/**
 * Função para renderizar a lista de Top Falhas no HTML
 */
function renderTopFalhas() {
    const containerFalhas = document.querySelector('.top-falhas-list');
    if (!containerFalhas) return;

    containerFalhas.innerHTML = ''; // Limpa elementos estáticos

    dadosDashboard.topFalhas.forEach(falha => {
        const classeBadge = falha.impacto.toLowerCase() === 'crítico' ? 'critico' : 'alto';
        
        containerFalhas.innerHTML += `
            <div class="falha-item">
                <span class="servidor-nome">${falha.servidor}</span>
                <span class="badge ${classeBadge}">■ ${falha.impacto.toUpperCase()}</span>
            </div>
        `;
    });
}

/**
 * Função para atualizar o relógio digital no cabeçalho
 */
function updateClock() {
    const clockElement = document.getElementById('liveClock');
    if (!clockElement) return;

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    clockElement.textContent = `${hours}:${minutes}`;
}

// Atualiza o relógio a cada 1 segundo
setInterval(updateClock, 1000);