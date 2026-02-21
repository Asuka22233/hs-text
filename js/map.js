import { locateControler } from "./locateControl.js";

const map = L.map("map", {
  minZoom: 4,
  maxBounds: [
    [90, 180],
    [-90, -180],
  ],
  attributionControl: false,
});

L.control
  .attribution({
    prefix:
      '<a href="https://leafletjs.com" title="A JavaScript library for interactive maps">Leaflet</a>',
  })
  .addTo(map);

L.tileLayer(
  "https://webrd01.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}",
  {
    attribution: '地图数据 &copy; <a href="https://www.amap.com/">高德地图</a>',
    coordType: "gcj02",
  },
).addTo(map);

map.zoomControl.setPosition("bottomright");
map.addControl(locateControler);

document.querySelector(".leaflet-control-zoom-in").title = "放大";
document.querySelector(".leaflet-control-zoom-out").title = "缩小";

// 鼠标事件返回的已经是 WGS-84 坐标，直接显示（添加节流减少频繁DOM更新）
let lastMoveUpdate = 0;
map.on("mousemove", function (e) {
  const now = Date.now();
  if (now - lastMoveUpdate < 50) return; // 50ms节流
  lastMoveUpdate = now;

  let lat = e.latlng.lat.toFixed(6);
  let lng = e.latlng.lng.toFixed(6);

  document.getElementById("coordinates").textContent = lat + ", " + lng;
});

map.on("mouseout", function () {
  document.getElementById("coordinates").textContent = "-";
});

export { map };
