import { citiesData } from '../data/cities.js';
import { provincesData } from '../data/provinces.js';

const chart = echarts.init(document.getElementById('main'));
const geoJsonUrl = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';

const activeState = { cities: new Set(), provinces: new Set(), lastClicked: null };

function refreshPanelContent() {
    const panel = document.getElementById('details-panel');
    if (!panel.classList.contains('open')) return;
    
    const item = activeState.lastClicked;
    const content = document.getElementById('details-content');
    
    // Récupération des données selon le type
    const data = item.type === 'city' 
        ? citiesData.find(c => c.name === item.name)
        : provincesData[item.name];

    if (!data) return;

    let html = `
        <div class="pinyin-header">${data.pinyin || ''}</div>
        <h2>${item.name}</h2>
        <div class="stat-grid">
            <div class="stat-item"><span class="stat-label">Pop.</span>${data.pop || 'N/A'}</div>
            <div class="stat-item"><span class="stat-label">Climat</span>${data.temp || data.climat}</div>
        </div>
        <div class="info-box">
            <p><strong>Présentation :</strong> ${data.desc}</p>
        </div>
    `;

    // Section Spécialités (pour les villes)
    if (data.specialties) {
        html += `<h3>Gastronomie & Spécialités</h3>`;
        data.specialties.forEach(s => {
            html += `
                <div class="specialty-card">
                    <div class="spec-name">${s.item}</div>
                    <div class="spec-trans">${s.trans}</div>
                    <div class="spec-desc">${s.desc}</div>
                </div>`;
        });
    }

    // Section Détails (Économie / Culture)
    if (data.details || data.economy) {
        const eco = data.details?.economy || data.economy;
        const cult = data.details?.culture || data.culture;
        html += `
            <h3>Informations Clés</h3>
            <div class="detail-section">
                <p><strong>Économie :</strong> ${eco}</p>
                <p><strong>Culture :</strong> ${cult}</p>
            </div>
        `;
    }

    content.innerHTML = html;
}

// --- Le reste de la logique renderChart et Click reste identique ---
// (S'assurer que renderChart() et l'init Echarts utilisent les objets citiesData mis à jour)

function renderChart() {
    const regionsConfig = Array.from(activeState.provinces).map(name => ({
        name: name,
        itemStyle: { areaColor: '#55b1f7ff' },
        label: { show: true, formatter: name, color: '#fff', backgroundColor: '#1971C2', padding: [4, 8], borderRadius: 4 }
    }));

    chart.setOption({
        geo: { regions: regionsConfig },
        series: [{
            data: citiesData.map(city => ({
                ...city,
                label: { show: activeState.cities.has(city.name), backgroundColor: '#e74c3c' }
            }))
        }]
    });
}

fetch(geoJsonUrl).then(res => res.json()).then(chinaJson => {
    echarts.registerMap('Chine', chinaJson);
    chart.setOption({
        geo: { map: 'Chine', roam: true, zoom: 1.2, itemStyle: { areaColor: '#fff', borderColor: '#ccc' } },
        series: [{
            name: 'Villes',
            type: 'scatter',
            coordinateSystem: 'geo',
            symbolSize: 15,
            itemStyle: { color: '#e74c3c' },
            label: { show: false, formatter: '{b}', position: 'top', backgroundColor: '#e74c3c', color: '#fff', padding: [4, 8], borderRadius: 4 },
            data: citiesData
        }]
    });

    chart.on('click', (params) => {
        const labelType = document.getElementById('label-type');
        activeState.lastClicked = params.data ? { ...params.data, type: 'city' } : { name: params.name, type: 'province' };
        
        document.getElementById('display-name').innerText = activeState.lastClicked.name;
        document.getElementById('speak-btn').style.display = 'flex';
        document.getElementById('more-btn').style.display = 'block';

        if (activeState.lastClicked.type === 'city') {
            labelType.innerText = "Ville";
            labelType.style.color = "#e74c3c";
            activeState.cities.has(params.name) ? activeState.cities.delete(params.name) : activeState.cities.add(params.name);
        } else {
            labelType.innerText = "Province";
            labelType.style.color = "#3498db";
            activeState.provinces.has(params.name) ? activeState.provinces.delete(params.name) : activeState.provinces.add(params.name);
        }
        renderChart();
        refreshPanelContent();
    });
});

document.getElementById('more-btn').onclick = () => {
    document.getElementById('details-panel').classList.add('open');
    refreshPanelContent();
};
document.querySelector('.close-btn').onclick = () => document.getElementById('details-panel').classList.remove('open');
document.getElementById('reset-btn').onclick = () => {
    activeState.cities.clear(); activeState.provinces.clear();
    renderChart();
    document.getElementById('display-name').innerText = "Sélectionnez un lieu";
    document.getElementById('more-btn').style.display = 'none';
    document.getElementById('speak-btn').style.display = 'none';
};
document.getElementById('speak-btn').onclick = () => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(activeState.lastClicked.name);
    u.lang = 'zh-CN'; u.rate = 0.8; window.speechSynthesis.speak(u);
};
window.onresize = () => chart.resize();