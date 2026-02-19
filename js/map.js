import { locateControler } from "./locateControl.js";

const map = L.map('map', { minZoom: 4, maxBounds: [[90, 180], [-90, -180]], attributionControl: false });

L.control.attribution({ prefix: '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>' }).addTo(map);

L.tileLayer('https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    attribution: '地图数据 &copy; <a href="https://www.amap.com/">高德地图</a>',
    coordType: 'gcj02',

}).addTo(map);

map.zoomControl.setPosition('bottomright');
map.addControl(locateControler);

document.querySelector('.leaflet-control-zoom-in').title = '放大';
document.querySelector('.leaflet-control-zoom-out').title = '缩小';


map.on('mousemove', function (e) {
    let lat = (e.latlng.lat).toFixed(6);
    let lng = (e.latlng.lng).toFixed(6);

    document.getElementById('coordinates').textContent = lat + ', ' + lng;
});

map.on('mouseout', function () {
    document.getElementById('coordinates').textContent = '-';
});

export { map }