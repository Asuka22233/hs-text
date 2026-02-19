// 自定义定位按钮
let LocateControl = L.Control.extend({
    options: {
        position: 'bottomright'
    },

    setLatLng: function (latlng) {
        let container = document.querySelector('.leaflet-control-locate');
        container.setAttribute('target-lat', latlng[0]);
        container.setAttribute('target-lng', latlng[1]);
    },

    activate: function () {
        document.querySelector('.leaflet-control-locate').classList.add('active');
        document.querySelector('.leaflet-control-locate').title = '定位到我的位置';
        document.getElementById('locate-icon').style.stroke = '#0091ff';
    },

    onAdd: function (map) {
        let container = L.DomUtil.create('div', 'leaflet-control-locate');
        container.innerHTML = `
            <svg width="30" height="30" viewbox="-5 -5 40 40" id="locate-icon">

                <circle cx="15" cy="15" r="10" fill="transparent" />
                <circle cx="15" cy="15" r="1" fill="transparent" />

                <line x1="25" x2="30" y1="15" y2="15" />
                <line x1="5" x2="0" y1="15" y2="15" />
                <line y1="25" y2="30" x1="15" x2="15" />
                <line y1="5" y2="0" x1="15" x2="15" />

            </svg>
        `;
        container.title = '定位功能暂不可用';

        container.onclick = function () {
            if (this.classList.contains('active')) {
                let lat = parseFloat(container.getAttribute('target-lat'));
                let lng = parseFloat(container.getAttribute('target-lng'));
                map.closePopup();
                map.setView([lat, lng], DEFAULT_ZOOM);
            } else {
                console.log('无效的定位请求');
            }
        };

        return container;
    }
});

const locateControler = new LocateControl();

export { locateControler }