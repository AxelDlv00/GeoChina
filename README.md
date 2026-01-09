# GeoChina - Exploration Map

[![License](https://img.shields.io/badge/License-CC%20BY%204.0-blue.svg)](./LICENSE)
[![GitHub Repo](https://img.shields.io/badge/Repo-GeoChina-brightgreen.svg)](https://github.com/AxelDlv00/GeoChina)

Une application interactive pour explorer la géographie, la culture et la gastronomie de la Chine. Ce projet permet de visualiser les provinces et les grandes villes chinoises grâce à une interface cartographique dynamique.

## Fonctionnalités

- **Carte Interactive** : Visualisation dynamique de la Chine avec zoom et déplacement (via ECharts).
- **Données Riches** : Informations détaillées sur plus de 40 villes et toutes les provinces chinoises.
- **Immersion Linguistique** : Noms en caractères chinois (Hanzi) et Pinyin avec tons.
- **Guide Culturel** : Spécialités culinaires, faits historiques, données économiques et climatiques.
- **Synthèse Vocale** : Écoutez la prononciation correcte des noms de lieux en mandarin.

## Aperçu Technique

L'application est construite en pur JavaScript, garantissant une légèreté et une rapidité d'exécution optimales.

* **Moteur de Cartographie** : [Apache ECharts](https://echarts.apache.org/)
* **Données Géo** : GeoJSON haute résolution.
* **Interface** : HTML5 / CSS3 moderne (Flexbox, Grid, Glassmorphism).
* **Mobile Ready** : Compatible avec Capacitor pour une conversion native.

## Structure du Projet

```text
├── css/
│   └── style.css        # Styles de l'interface et du panneau de détails
├── data/
│   ├── cities.js        # Base de données des villes
│   └── provinces.js     # Base de données des provinces
├── js/
│   └── app.js           # Logique applicative et gestion de la carte
├── index.html           # Point d'entrée de l'application
└── README.md            # Documentation
```

## Licence

Ce projet est sous licence CC Attribution 4.0 International. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

## Auteur

Axel Delaval