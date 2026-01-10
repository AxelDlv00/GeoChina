import { citiesData } from '../data/cities.js';
import { provincesData } from '../data/provinces.js';

const chart = echarts.init(document.getElementById('main'));
const geoJsonUrl = './data/china.json';
const activeState = { cities: new Set(), provinces: new Set(), lastClicked: null };

// ╭────────────────────────────────────────────────────────╮
// │                 Details Panel Content                  │
// ╰────────────────────────────────────────────────────────╯

async function refreshPanelContent() {
    const panel = document.getElementById('details-panel');
    if (!panel.classList.contains('open')) return;
    
    const item = activeState.lastClicked;
    const content = document.getElementById('details-content');
    
    // Récupération des données selon le type
    let data;
    if (item.type === 'city') {
        data = citiesData.find(c => c.name === item.name);
    } else {
        data = provincesData[item.name];
    }

    if (!data) return;

    // --- 1. Préparation des variables unifiées ---
    // Les villes et provinces ont des structures légèrement différentes, on normalise ici.
    const isCity = item.type === 'city';
    
    // Description
    const description = data.desc || "Aucune description disponible.";
    
    // Données Éco / Culture / Sites
    const economy = isCity ? (data.details?.economy) : data.economy;
    const culture = isCity ? (data.details?.culture) : data.culture;
    
    // Les sites clés (String pour villes, Array pour provinces)
    let landmarks = isCity ? (data.details?.landmark) : (data.key_sites ? data.key_sites.join(', ') : '');

    // Climat / Pop (Spécifique)
    let statsHtml = '';
    if (isCity) {
        statsHtml = `
            <div class="stat-item">
                <span class="stat-label">Population</span>
                ${data.pop || 'N/A'}
            </div>
            <div class="stat-item">
                <span class="stat-label">Température</span>
                ${data.temp || 'N/A'}
            </div>`;
    } else {
        // Pour les provinces, on affiche le climat
        if (data.climat) {
            statsHtml = `
            <div class="stat-item" style="grid-column: span 2;">
                <span class="stat-label">Climat</span>
                ${data.climat}
            </div>`;
        }
    }

    // Spécialités culinaires
    let specialtiesHtml = '';
    if (data.specialties && data.specialties.length > 0) {
        specialtiesHtml = `<h3>Gastronomie</h3>`;
        specialtiesHtml += data.specialties.map(spec => `
            <div class="specialty-card">
                <div class="spec-name">${spec.item}</div>
                <div class="spec-trans">${spec.trans}</div>
                <div class="spec-desc">${spec.desc}</div>
            </div>
        `).join('');
    }

    // Le "Saviez-vous que ?"
    let factHtml = '';
    if (data.fact) {
        factHtml = `
            <div class="wiki-section" style="border-left-color: #f1c40f; background: #fffcf0;">
                <h3 style="color:#f39c12; margin-top:0; border:none;">Le Saviez-vous ?</h3>
                <p>${data.fact}</p>
            </div>
        `;
    }

    // --- 2. Construction du HTML ---
    content.innerHTML = `
        <div id="wiki-img"></div>
        
        <div class="pinyin-header">${data.pinyin || ''}</div>
        <h2>${item.name} <span style="font-size:0.6em; color:#7f8c8d;">${data.name_cn || ''}</span></h2>
        
        <div class="info-box">
            <p><strong>${description}</strong></p>
        </div>

        <div class="stat-grid">
            ${statsHtml}
        </div>

        ${economy ? `<h3>Économie</h3><p class="detail-section">${economy}</p>` : ''}
        ${culture ? `<h3>Culture</h3><p class="detail-section">${culture}</p>` : ''}
        ${landmarks ? `<h3>Lieux Incontournables</h3><p class="detail-section">${landmarks}</p>` : ''}

        ${specialtiesHtml}

        ${factHtml}

        <div id="wiki-resumé" class="wiki-section">
            <p><em>Chargement de Wikipédia...</em></p>
        </div>
    `;

    // --- 3. Appel API Wikipédia (inchangé mais vital) ---
    if (data.wiki_summary) {
        try {
            const res = await fetch(data.wiki_summary);
            const wiki = await res.json();
            
            const wikiContent = document.getElementById('wiki-resumé');
            if (wikiContent) {
                wikiContent.innerHTML = `
                    <h3>Résumé Wikipédia</h3>
                    <p>${wiki.extract || 'Résumé non disponible.'}</p>
                    <a href="${data.wiki_url}" target="_blank" style="font-size:0.85rem; color:#3498db;">Lire l'article complet</a>
                `;
            }
            
            if (wiki.thumbnail) {
                const imgContainer = document.getElementById('wiki-img');
                if (imgContainer) {
                    imgContainer.innerHTML = `<img src="${wiki.thumbnail.source}" class="wiki-thumb" alt="${item.name}">`;
                }
            }
        } catch (e) {
            const wikiContent = document.getElementById('wiki-resumé');
            if(wikiContent) wikiContent.style.display = 'none';
        }
    }
}

// ╭────────────────────────────────────────────────────────╮
// │                   Chart Rendering                      │
// ╰────────────────────────────────────────────────────────╯

function renderChart() {
    const regionsConfig = Array.from(activeState.provinces).map(name => ({
        name: name,
        itemStyle: { areaColor: '#55b1f7ff' },
        label: { 
            show: true,
            formatter: name,
            color: '#fff', 
            backgroundColor: '#1971C2', 
            padding: [4, 8], 
            borderRadius: 4 
        }
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

// ╭────────────────────────────────────────────────────────╮
// │                   Initialisation                       │
// ╰────────────────────────────────────────────────────────╯

fetch(geoJsonUrl).then(res => res.json()).then(chinaJson => {
    echarts.registerMap('Chine', chinaJson);
    chart.setOption({
        geo: { 
            map: 'Chine', 
            roam: 'move', // On autorise le déplacement mais on bloque le zoom libre tactile
            scaleLimit: { min: 1, max: 3}, 
            zoom: 2.2, 
            itemStyle: { 
                areaColor: '#ffffffff', 
                borderColor: '#c3c1c1ff' 
            },
            emphasis: {
            label: { show: false }, 
            itemStyle: {
                areaColor: null 
            }
        }
        },
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

chart.on('georoam', (params) => {
    if (window.innerWidth < 768) {
        document.getElementById('details-panel').classList.remove('open');
    }
});