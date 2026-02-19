const INITIAL_LAT = 38;
const INITIAL_LNG = 109;
const DEFAULT_ZOOM = 15;

// 高德地图API Key（用于搜索红色景点）
// 请在高德开放平台申请：https://lbs.amap.com/
const AMAP_API_KEY = 'af56eeb73ee5277d3336aba94ee471a8';
window.AMAP_API_KEY = AMAP_API_KEY;
window._AMapSecurityConfig = {
	securityJsCode: '79a118cd248c2fd03b30c81416ccdbaa'
};