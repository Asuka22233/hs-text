import { map } from "./map.js";
import { locateControler } from "./locateControl.js";
import { userIcon } from "./icon.js";
import { initAMap } from "./redSites.js";
import { toGcj02FromWgs84 } from "./coord.js";

let userMarker = null;
let nearestSearching = false;
let nearestSearched = false; // 标记是否已搜索过最近景点

// 定位功能
if ("geolocation" in navigator) {
  navigator.geolocation.watchPosition(
    function (position) {
      let userLat = position.coords.latitude;
      let userLng = position.coords.longitude;
      console.log("用户在北纬 " + userLat + "，东经 " + userLng);

      if (!userMarker) {
        userMarker = L.marker([userLat, userLng], { icon: userIcon })
          .addTo(map)
          .bindPopup("你在这里", { autoPan: false })
          .openPopup();
        map.setView([userLat, userLng], DEFAULT_ZOOM);
      } else {
        userMarker.setLatLng([userLat, userLng]);
      }

      locateControler.setLatLng([userLat, userLng]);
      locateControler.activate();

      // 只在首次定位时搜索最近景点，避免反复刷新
      if (!nearestSearched) {
        nearestSearched = true;
        document.getElementById("nearest-points").style.display = "block";
        searchNearestRedSites(userLat, userLng);
      }
    },
    function (error) {
      console.error("Error Code = " + error.code + " - " + error.message);

      if (error.code === error.PERMISSION_DENIED) {
        alert(
          "建议打开定位功能以体验本网站的全部功能\n本网站没有后端服务，位置信息仅用于本地服务",
        );
      }
    },
    {
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 0,
    },
  );
} else {
  alert("你的浏览器不支持地理定位功能。");
}

function formatDistance(distance) {
  if (distance < 1000) {
    return `${Math.round(distance)} m`;
  } else {
    return `${(distance / 1000).toFixed(1)} km`;
  }
}

// 通过高德API联网搜索离用户最近的红色景点
async function searchNearestRedSites(userLat, userLng) {
  if (nearestSearching) return;
  nearestSearching = true;

  const nearestPointsList = document.getElementById("nearest-points-list");
  nearestPointsList.innerHTML = "<li>正在搜索附近红色景点...</li>";

  try {
    await initAMap();

    const searchCenter = toGcj02FromWgs84(userLat, userLng);
    const keyword = "纪念馆|革命遗址|烈士陵园|红色景点|抗战";

    const placeSearch = new window.AMap.PlaceSearch({
      pageSize: 5,
      pageIndex: 1,
      extensions: "all",
    });

    // 使用 50000 米（50公里）搜索范围，不做距离限制
    placeSearch.searchNearBy(
      keyword,
      [searchCenter.lng, searchCenter.lat],
      50000,
      (status, result) => {
        if (
          status === "complete" &&
          result.poiList &&
          result.poiList.pois &&
          result.poiList.pois.length > 0
        ) {
          const pois = result.poiList.pois.slice(0, 5);
          nearestPointsList.innerHTML = pois
            .map((poi) => {
              const dist = poi.distance ? formatDistance(poi.distance) : "";
              const distText = dist ? ` - ${dist}` : "";
              return `<li>${poi.name}${distText}</li>`;
            })
            .join("");
        } else {
          nearestPointsList.innerHTML = "<li>未找到附近的红色景点</li>";
        }
        nearestSearching = false;
      },
    );
  } catch (error) {
    console.error("搜索最近红色景点失败:", error);
    nearestPointsList.innerHTML = "<li>搜索失败，请检查网络</li>";
    nearestSearching = false;
  }
}
