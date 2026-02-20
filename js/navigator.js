import { map } from "./map.js";
import { locateControler } from "./locateControl.js";
import { userIcon } from "./icon.js";
import { pathPoints } from "./pathPoints.js";

let userMarker = null;
// pathPoints 现在存储的是 WGS-84 坐标，直接使用
const displayPoints = pathPoints;

// 定位功能
if ("geolocation" in navigator) {
    navigator.geolocation.watchPosition(
        function (position) {
            let userLat = position.coords.latitude;
            let userLng = position.coords.longitude;
            console.log('用户在北纬 ' + userLat + '，东经 ' + userLng);

            if (!userMarker) {
                userMarker = L.marker([userLat, userLng], { icon: userIcon }).addTo(map)
                    .bindPopup('你在这里', { autoPan: false }).openPopup();
                map.setView([userLat, userLng], DEFAULT_ZOOM);
            } else {
                userMarker.setLatLng([userLat, userLng]);
            }

            locateControler.setLatLng([userLat, userLng]);
            locateControler.activate();

            document.getElementById('nearest-points').style.display = 'block';
            DisplayNearestPoints(userLat, userLng);
        },
        function (error) {
            console.error("Error Code = " + error.code + " - " + error.message);

            if (error.code === error.PERMISSION_DENIED) {
                alert("建议打开定位功能以体验本网站的全部功能\n本网站没有后端服务，位置信息仅用于本地服务");
            }
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
} else {
    alert("你的浏览器不支持地理定位功能。");
}

function calculateDistance(lat1, lng1, lat2, lng2) {
    let R = 6371000; // 地球半径，单位：米
    let dLat = (lat2 - lat1) * Math.PI / 180;
    let dLng = (lng2 - lng1) * Math.PI / 180;
    let a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function formatDistance(distance) {
    if (distance < 1000) {
        return `${Math.round(distance)} m`;
    } else {
        return `${(distance / 1000).toFixed(1)} km`;
    }
}

// 计算并显示最近的路径点
function DisplayNearestPoints(userLat, userLng) {
    let pointsWithDistance = displayPoints.map(point => {
        let distance = calculateDistance(userLat, userLng, point.lat, point.lng);
        return { ...point, distance };
    });

    pointsWithDistance.sort((a, b) => a.distance - b.distance);

    let nearestPoints = pointsWithDistance.slice(0, 2);

    let nearestPointsList = document.getElementById('nearest-points-list');
    nearestPointsList.innerHTML = nearestPoints.map(point => `
        <li data-lat="${point.lat}" data-lng="${point.lng}">
            ${point.title} - ${formatDistance(point.distance)}
        </li>
    `).join('');

    nearestPointsList.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', function () {
            let lat = parseFloat(this.getAttribute('data-lat'));
            let lng = parseFloat(this.getAttribute('data-lng'));
            map.closePopup();
            map.setView([lat, lng], DEFAULT_ZOOM);
        });
    });
}
