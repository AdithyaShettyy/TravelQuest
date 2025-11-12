import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import L from 'leaflet';

// Fix default marker icons in React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function Map() {
  const [pois, setPois] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserLocation();
  }, []);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ lat: latitude, lng: longitude });
          fetchNearbyPOIs(latitude, longitude);
        },
        (error) => {
          console.error('Location error:', error);
          // Default to New York
          const defaultLat = 40.7128;
          const defaultLng = -74.0060;
          setUserLocation({ lat: defaultLat, lng: defaultLng });
          fetchNearbyPOIs(defaultLat, defaultLng);
        }
      );
    }
  };

  const fetchNearbyPOIs = async (lat, lng) => {
    try {
      const response = await api.get('/pois/nearby', {
        params: { lat, lng, radius: 5000 }
      });
      setPois(response.data);
    } catch (error) {
      console.error('Failed to fetch POIs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !userLocation) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-600">Loading map...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Explore</h1>
        <Link
          to="/quests"
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          View All Quests
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
        <MapContainer
          center={[userLocation.lat, userLocation.lng]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {pois.map((poi) => (
            <Marker
              key={poi.id}
              position={[poi.location.coordinates[1], poi.location.coordinates[0]]}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-lg">{poi.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{poi.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {poi.quests?.length || 0} quest(s) available
                  </div>
                  <Link
                    to={`/pois/${poi.id}`}
                    className="mt-2 inline-block text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pois.slice(0, 6).map((poi) => (
          <div key={poi.id} className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition">
            <h3 className="font-semibold text-lg mb-2">{poi.name}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{poi.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-1 rounded">
                {poi.category}
              </span>
              <span className="text-xs text-gray-500">
                {poi.distance ? `${(poi.distance / 1000).toFixed(1)}km away` : ''}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
