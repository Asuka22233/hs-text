import { map } from "./map.js";
import { toGcj02FromWgs84, toWgs84FromGcj02 } from "./coord.js";
import { pathPoints } from "./pathPoints.js";

// 用于存储当前显示的红色景点标记
let redSiteMarkers = [];
let lastSearchBounds = null;
let isSearching = false;
let AMap = null;
let placeSearch = null;
let bannerTimer = null;

// 计算两点之间的距离（米）
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // 地球半径（米）
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// 检查景点是否与 pathPoints 重复
function isDuplicatePoint(name, lat, lng) {
    // 检查名称是否相似或距离是否很近
    for (const point of pathPoints) {
        // 名称包含关系检查
        if (point.title.includes(name) || name.includes(point.title)) {
            return true;
        }
        // 距离检查（如果两个景点距离小于200米，认为是重复的）
        const distance = calculateDistance(lat, lng, point.lat, point.lng);
        if (distance < 200) {
            return true;
        }
    }
    return false;
}

// 创建联网搜索景点的图标（使用红色圆形图标以示区分）
const redSiteIcon = L.icon({
    iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0Ij48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIgZmlsbD0iI2RkMzMzMyIgc3Ryb2tlPSIjZmZmZmZmIiBzdHJva2Utd2lkdGg9IjIiLz48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21]
});

// 清除之前搜索的标记
function clearRedSiteMarkers() {
    redSiteMarkers.forEach(marker => {
        map.removeLayer(marker);
    });
    redSiteMarkers = [];
}

function ensureSearchBanner() {
    let banner = document.getElementById('red-sites-banner');
    if (banner) return banner;

    banner = document.createElement('div');
    banner.id = 'red-sites-banner';
    banner.style.position = 'fixed';
    banner.style.top = '12px';
    banner.style.left = '50%';
    banner.style.transform = 'translateX(-50%)';
    banner.style.background = 'rgba(221, 51, 51, 0.92)';
    banner.style.color = '#fff';
    banner.style.padding = '8px 12px';
    banner.style.borderRadius = '8px';
    banner.style.fontSize = '13px';
    banner.style.zIndex = '9999';
    banner.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';
    banner.style.display = 'none';
    banner.style.maxWidth = '90vw';
    banner.style.textAlign = 'center';
    document.body.appendChild(banner);
    return banner;
}

function showSearchBanner(message) {
    const banner = ensureSearchBanner();
    banner.textContent = message;
    banner.style.display = 'block';

    if (bannerTimer) {
        clearTimeout(bannerTimer);
    }
    bannerTimer = setTimeout(() => {
        banner.style.display = 'none';
    }, 2000);
}

// 检查是否需要搜索（边界是否变化足够大）
function shouldSearch(currentBounds) {
    if (!lastSearchBounds) return true;
    
    const currentCenter = currentBounds.getCenter();
    const lastCenter = lastSearchBounds.getCenter();
    
    // 如果中心点移动距离超过一定范围，则重新搜索
    const distance = currentCenter.distanceTo(lastCenter);
    return distance > 5000; // 5公里
}

// 初始化高德地图API
function initAMap() {
    return new Promise((resolve, reject) => {
        const apiKey = window.AMAP_API_KEY || 'YOUR_AMAP_API_KEY';
        
        // 检查API Key是否已配置
        if (apiKey === 'YOUR_AMAP_API_KEY') {
            console.warn('⚠️ 请先配置高德地图API Key才能使用搜索功能');
            console.warn('📝 请访问 https://console.amap.com/ 申请API Key');
            console.warn('📝 然后在 config/config.js 中配置 AMAP_API_KEY');
            reject(new Error('API Key未配置'));
            return;
        }
        
        if (window.AMap && window.AMap.PlaceSearch) {
            AMap = window.AMap;
            console.log('✅ 高德地图API已就绪');
            resolve();
            return;
        }
        
        console.log('正在加载高德地图API...');
        const script = document.createElement('script');
        script.src = `https://webapi.amap.com/maps?v=2.0&key=${apiKey}&plugin=AMap.PlaceSearch`;
        script.onload = () => {
            if (window.AMap && window.AMap.PlaceSearch) {
                AMap = window.AMap;
                console.log('✅ 高德地图API加载成功');
                resolve();
            } else {
                console.error('❌ AMap.PlaceSearch未加载');
                reject(new Error('PlaceSearch plugin not loaded'));
            }
        };
        script.onerror = () => {
            console.error('❌ 高德地图API加载失败，请检查网络或API Key');
            reject(new Error('Failed to load AMap'));
        };
        document.head.appendChild(script);
    });
}

// 搜索红色景点
async function searchRedSites(bounds, options = {}) {
    if (isSearching) return;
    if (!bounds) return;

    const { force = false } = options;
    
    const zoom = map.getZoom();
    
    console.log('当前缩放级别:', zoom);
    
    // 只在缩放级别大于等于10时搜索（降低阈值）
    if (zoom < 10) {
        clearRedSiteMarkers();
        console.log('缩放级别太小，需要放大到10级以上');
        return;
    }
    
    if (!force && !shouldSearch(bounds)) return;
    
    isSearching = true;
    
    try {
        // 确保高德API已加载
        if (!AMap) {
            try {
                await initAMap();
            } catch (error) {
                console.error('无法初始化高德地图API:', error.message);
                isSearching = false;
                return;
            }
        }
        
        const center = bounds.getCenter();
        const searchCenter = toGcj02FromWgs84(center.lat, center.lng);
        
        // 使用JSONP方式避免跨域问题
        const keywords = ['纪念馆', '革命遗址', '烈士陵园', '红色景点', '抗战'];
        const keyword = keywords[Math.floor(Math.random() * keywords.length)];
        
        console.log(`🔍 正在搜索关键词: ${keyword}，中心点: ${searchCenter.lat}, ${searchCenter.lng}`);
        
        // 创建PlaceSearch实例
        if (!placeSearch && AMap && AMap.PlaceSearch) {
            placeSearch = new AMap.PlaceSearch({
                pageSize: 5,
                pageIndex: 1,
                extensions: 'all'
            });
        }
        
        if (!placeSearch) {
            console.error('❌ PlaceSearch实例创建失败');
            isSearching = false;
            return;
        }
        
        // 搜索周边
        placeSearch.searchNearBy(keyword, [searchCenter.lng, searchCenter.lat], 10000, (status, result) => {
            console.log('📊 搜索状态:', status);
            console.log('📊 搜索结果:', result);
            
            if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
                clearRedSiteMarkers();
                
                // 过滤掉与 pathPoints 重复的景点
                const allPois = result.poiList.pois;
                const filteredPois = allPois.filter(poi => {
                    const lat = poi.location.lat;
                    const lng = poi.location.lng;
                    const corrected = toWgs84FromGcj02(lat, lng);
                    return !isDuplicatePoint(poi.name, corrected.lat, corrected.lng);
                });
                
                // 进一步过滤，确保搜索结果之间至少相距50米
                const selectedPois = [];
                for (const poi of filteredPois) {
                    if (selectedPois.length >= 5) break; // 最多5个
                    
                    const lat = poi.location.lat;
                    const lng = poi.location.lng;
                    const corrected = toWgs84FromGcj02(lat, lng);
                    
                    // 检查与已选景点的距离
                    let tooClose = false;
                    for (const selected of selectedPois) {
                        const distance = calculateDistance(
                            corrected.lat, corrected.lng,
                            selected.corrected.lat, selected.corrected.lng
                        );
                        if (distance < 50) {
                            tooClose = true;
                            break;
                        }
                    }
                    
                    if (!tooClose) {
                        selectedPois.push({ poi, corrected });
                    }
                }
                
                console.log(`✅ 找到 ${selectedPois.length} 个红色景点（已排除重复和过近景点）`);
                
                selectedPois.forEach(({ poi, corrected }) => {
                    const marker = L.marker([corrected.lat, corrected.lng], { icon: redSiteIcon }).addTo(map);

                    marker.bindTooltip(poi.name, {
                        permanent: true,
                        direction: 'top',
                        offset: [0, -18],
                        className: 'red-site-label'
                    });
                    
                    redSiteMarkers.push(marker);
                });
                
                // 在屏幕上方显示提示，避免遮挡地图
                if (selectedPois.length > 0) {
                    showSearchBanner(`找到 ${selectedPois.length} 个红色景点`);
                }
            } else {
                console.log('ℹ️ 未找到相关红色景点，尝试移动地图或换个区域');
                clearRedSiteMarkers();
                showSearchBanner('未找到相关红色景点');
            }
            lastSearchBounds = bounds;
            isSearching = false;
        });
        
    } catch (error) {
        console.error('❌ 搜索红色景点时出错:', error);
        isSearching = false;
    }
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 监听地图缩放和移动事件
const debouncedSearch = debounce((e) => {
    const bounds = map.getBounds();
    searchRedSites(bounds);
}, 500);

map.on('zoomend', debouncedSearch);
map.on('moveend', debouncedSearch);

function searchRedSitesNow() {
    showSearchBanner('正在搜索...');
    lastSearchBounds = null;
    searchRedSites(map.getBounds(), { force: true });
}

export { searchRedSites, clearRedSiteMarkers, searchRedSitesNow };

