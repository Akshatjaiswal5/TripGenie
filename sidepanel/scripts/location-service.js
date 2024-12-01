const CONFIG = {
    GEOCODE_API_URL: 'https://google-maps-proxy-api.onrender.com/maps/api/geocode/json',
    PLACES_API_URL: 'https://google-maps-proxy-api.onrender.com/maps/api/place/nearbysearch/json',
};
export class LocationService {
static extractCoordinates(url) {
    const match = url.match(/@([-\d.]+),([-\d.]+)/);
    if (!match) throw new Error('No coordinates found in URL');
    return { latitude: match[1], longitude: match[2] };
}
static async fetchGeocode(latitude, longitude) {
    const url = `${CONFIG.GEOCODE_API_URL}?latlng=${latitude},${longitude}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
        return response.json();
    }

static async fetchAttractions(latitude, longitude) {
    const url = `${CONFIG.PLACES_API_URL}?location=${latitude},${longitude}&radius=50000`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);
        return response.json();
    }
static async fetchPlaceName(latitude, longitude) {
    const geocode = await this.fetchGeocode(latitude, longitude);
    return geocode.plus_code?.compound_code.replace(/^[A-Za-z0-9+]+ /, '');
}

static async fetchPopularNearByLocation(latitude, longitude) {
    let attractions = await this.fetchAttractions(latitude, longitude);
    return attractions.results
        .filter((attraction) => attraction.user_ratings_total > 50)
        .sort((a, b) => b.user_ratings_total - a.user_ratings_total)
        .slice(0, 14);
}
}

