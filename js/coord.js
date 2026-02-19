function toWgs84FromGcj02(lat, lng) {
    if (window.L && L.coordConvertor) {
        const corrected = L.coordConvertor().gcj02_To_gps84(lng, lat);
        return { lat: corrected.lat, lng: corrected.lng };
    }
    return { lat, lng };
}

function toGcj02FromWgs84(lat, lng) {
    if (window.L && L.coordConvertor) {
        const corrected = L.coordConvertor().gps84_To_gcj02(lng, lat);
        return { lat: corrected.lat, lng: corrected.lng };
    }
    return { lat, lng };
}

export { toWgs84FromGcj02, toGcj02FromWgs84 };
