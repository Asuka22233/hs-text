const userIcon = L.icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png', // 默认图标
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const pathPointIcon = L.icon({
    iconUrl: 'https://cdn.luogu.com.cn/upload/image_hosting/ulvs2stg.png', // 自定义图标
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

export { userIcon, pathPointIcon }