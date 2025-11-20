import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Dimensions,
  FlatList,
  ScrollView,
  Animated,
  Platform,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker, Circle, Polyline, Callout } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../lib/api';

const { width, height } = Dimensions.get('window');

// Route cache to avoid repeated API calls
const routeCache = new Map();

// Strip HTML tags from text
const stripHtml = (html) => {
  try {
    if (html == null) return 'Continue';
    const str = String(html);
    const cleaned = str.replace(/<[^>]*>/g, '').trim();
    return cleaned || 'Continue';
  } catch (error) {
    console.log('Error in stripHtml:', error, 'input:', html);
    return 'Continue';
  }
};

// Multiple routing services with fallback
// 1. OSRM - Free, unlimited, no API key needed
// 2. Mappls - For India (requires API key, 200 requests/day free)

const MAPPLS_API_KEY = process.env.EXPO_PUBLIC_MAPPLS_API_KEY || '';

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return (R * c).toFixed(2); // Distance in km
};

// Simple route generation (straight line with waypoints) - fallback
const generateRoutePoints = (start, end, numPoints = 50) => {
  const points = [];
  for (let i = 0; i <= numPoints; i++) {
    const fraction = i / numPoints;
    points.push({
      latitude: start.latitude + (end.latitude - start.latitude) * fraction,
      longitude: start.longitude + (end.longitude - start.longitude) * fraction,
    });
  }
  return points;
};

// Decode polyline (used by Mappls and Google Maps)
const decodePolyline = (encoded) => {
  if (!encoded) return [];
  
  const points = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let b;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat / 1e5,
      longitude: lng / 1e5,
    });
  }

  return points;
};

// Fetch detailed route with turn-by-turn directions from Mappls
const fetchDetailedRoute = async (start, end) => {
  try {
    // Create cache key
    const cacheKey = `detailed-${start.latitude.toFixed(4)},${start.longitude.toFixed(4)}-${end.latitude.toFixed(4)},${end.longitude.toFixed(4)}`;
    
    // Check cache first
    if (routeCache.has(cacheKey)) {
      console.log('✓ Using cached detailed route');
      return routeCache.get(cacheKey);
    }

    // Use Mappls for detailed turn-by-turn directions
    if (MAPPLS_API_KEY) {
      try {
        // Mappls Directions API with steps=true for turn-by-turn
        const mapplsUrl = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/route_adv/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&steps=true&geometries=polyline`;

        const response = await fetch(mapplsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();

          if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const polyline = route.geometry;
            
            // Decode polyline to coordinates
            const routePoints = decodePolyline(polyline);
            
            // Extract turn-by-turn steps
            const steps = [];
            if (route.legs && route.legs.length > 0) {
              route.legs[0].steps.forEach((step, index) => {
                const rawInstruction = step.maneuver?.instruction || step.name || 'Continue';
                const processedInstruction = stripHtml(String(rawInstruction || ''));
                console.log(`Step ${index} raw:`, rawInstruction, 'processed:', processedInstruction);
                steps.push({
                  instruction: processedInstruction,
                  distance: (step.distance / 1000).toFixed(2), // km
                  duration: Math.round(step.duration / 60), // minutes
                  type: step.maneuver?.type || 'straight',
                  modifier: step.maneuver?.modifier || '',
                });
              });
            }
            
            const routeData = {
              coordinates: routePoints,
              distance: (route.distance / 1000).toFixed(2),
              duration: Math.round(route.duration / 60),
              steps: steps,
            };
            
            // Cache the result
            routeCache.set(cacheKey, routeData);
            
            console.log(`✅ Got Mappls detailed route: ${routePoints.length} points, ${steps.length} steps, ${routeData.distance} km`);
            return routeData;
          }
        } else if (response.status === 401) {
          console.log('⚠️ Mappls quota exceeded (200/day limit reached)');
        }
      } catch (mapplsError) {
        console.log('⚠️ Mappls detailed route error:', mapplsError.message);
      }
    }

    // Fallback: simple route without turn-by-turn
    return {
      coordinates: generateRoutePoints(start, end),
      distance: calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude),
      duration: 'N/A',
      steps: [{
        instruction: stripHtml('Head straight to destination'),
        distance: calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude),
        duration: 'N/A',
        type: 'straight',
        modifier: '',
      }],
    };
    
  } catch (error) {
    console.warn('❌ Detailed route error:', error.message);
    return {
      coordinates: generateRoutePoints(start, end),
      distance: calculateDistance(start.latitude, start.longitude, end.latitude, end.longitude),
      duration: 'N/A',
      steps: [],
    };
  }
};

// Fetch real route using multiple services with automatic fallback
const fetchRealRoute = async (start, end) => {
  try {
    // Create cache key
    const cacheKey = `${start.latitude.toFixed(4)},${start.longitude.toFixed(4)}-${end.latitude.toFixed(4)},${end.longitude.toFixed(4)}`;
    
    // Check cache first
    if (routeCache.has(cacheKey)) {
      console.log('✓ Using cached route');
      return routeCache.get(cacheKey);
    }

    // Try OSRM first (free, unlimited, no API key)
    try {
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=geojson`;
      
      const osrmResponse = await fetch(osrmUrl);
      
      if (osrmResponse.ok) {
        const osrmData = await osrmResponse.json();
        
        if (osrmData.routes && osrmData.routes.length > 0) {
          const route = osrmData.routes[0];
          const coordinates = route.geometry.coordinates;
          
          // Convert from [lon, lat] to {latitude, longitude}
          const routePoints = coordinates.map(coord => ({
            latitude: coord[1],
            longitude: coord[0],
          }));
          
          // Cache the result
          routeCache.set(cacheKey, routePoints);
          
          const distance = (route.distance / 1000).toFixed(2);
          const duration = Math.round(route.duration / 60);
          console.log(`✅ Got OSRM route: ${routePoints.length} points, ${distance} km, ~${duration} min`);
          return routePoints;
        }
      }
    } catch (osrmError) {
      console.log('⚠️ OSRM unavailable, trying Mappls...');
    }

    // Fallback to Mappls if available
    if (MAPPLS_API_KEY) {
      try {
        const mapplsUrl = `https://apis.mappls.com/advancedmaps/v1/${MAPPLS_API_KEY}/route_adv/driving/${start.longitude},${start.latitude};${end.longitude},${end.latitude}?overview=full&geometries=polyline`;

        const mapplsResponse = await fetch(mapplsUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (mapplsResponse.ok) {
          const mapplsData = await mapplsResponse.json();

          if (mapplsData.routes && mapplsData.routes.length > 0) {
            const route = mapplsData.routes[0];
            const polyline = route.geometry;
            
            // Decode polyline to coordinates
            const routePoints = decodePolyline(polyline);
            
            // Cache the result
            routeCache.set(cacheKey, routePoints);
            
            const distance = (route.distance / 1000).toFixed(2);
            const duration = Math.round(route.duration / 60);
            console.log(`✅ Got Mappls route: ${routePoints.length} points, ${distance} km, ~${duration} min`);
            return routePoints;
          }
        } else if (mapplsResponse.status === 401) {
          console.log('⚠️ Mappls quota exceeded (200/day limit reached)');
        }
      } catch (mapplsError) {
        console.log('⚠️ Mappls error:', mapplsError.message);
      }
    }

    // Final fallback: straight line
    console.log('📍 Using straight-line route (all APIs unavailable)');
    return generateRoutePoints(start, end);
    
  } catch (error) {
    console.warn('❌ Route error:', error.message);
    return generateRoutePoints(start, end);
  }
};

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [pois, setPois] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activePOI, setActivePOI] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [showRoutes, setShowRoutes] = useState(false);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [showNavigationPreview, setShowNavigationPreview] = useState(false);
  const [detailedRoute, setDetailedRoute] = useState(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [heading, setHeading] = useState(0); // Device compass heading
  const [remainingDistance, setRemainingDistance] = useState(null);
  const [estimatedTimeArrival, setEstimatedTimeArrival] = useState(null);
  const [lastAnnouncedStep, setLastAnnouncedStep] = useState(-1);
  const mapRef = useRef(null);
  const locationSubscription = useRef(null);
  const headingSubscription = useRef(null);
  
  // Animation values for smooth premium UI
  const bottomSheetAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;
  const markerPulse = useRef(new Animated.Value(1)).current;
  const routeOpacity = useRef(new Animated.Value(0)).current;
  const navCardSlide = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    requestLocationPermission();
    // Start marker pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(markerPulse, {
          toValue: 1.3,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(markerPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    return () => {
      // Cleanup location tracking on unmount
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
    };
  }, []);

  useEffect(() => {
    if (location) {
      fetchNearbyPOIs();
    }
  }, [location]);

  useEffect(() => {
    // Calculate routes when POIs or location changes
    if (location && pois.length > 0) {
      calculateRoutes();
    }
  }, [pois, location]);

  useEffect(() => {
    // Update routes when user moves during tracking
    if (tracking && location && activePOI) {
      calculateRoutes();
    }
  }, [location, tracking]);

  const requestLocationPermission = async () => {
    try {
      // First check if location services are enabled
      const locationServicesEnabled = await Location.hasServicesEnabledAsync();
      if (!locationServicesEnabled) {
        Alert.alert(
          'Location Services Disabled',
          'Please enable location services in your device settings to use the map features.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setLoading(false);
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'Location permission is required to show nearby attractions and provide navigation. Please grant location access in your device settings.',
          [
            {
              text: 'Open Settings',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              }
            },
            {
              text: 'Cancel',
              style: 'cancel'
            }
          ]
        );
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 15000, // 15 second timeout
      });

      setLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
      setLoading(false);
    } catch (error) {
      console.error('Location error:', error);

      let errorMessage = 'Failed to get your location. ';
      if (error.message.includes('timeout')) {
        errorMessage += 'Location request timed out. Please try again.';
      } else if (error.message.includes('unavailable')) {
        errorMessage += 'Location services are currently unavailable.';
      } else {
        errorMessage += 'Please check your location settings and try again.';
      }

      Alert.alert(
        'Location Error',
        errorMessage,
        [
          {
            text: 'Try Again',
            onPress: () => requestLocationPermission()
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
      setLoading(false);
    }
  };

  const fetchNearbyPOIs = async () => {
    if (!location) {
      console.log('No location available for fetching POIs');
      return;
    }
    
    try {
      setRefreshing(true);
      console.log('Fetching POIs for location:', location.latitude, location.longitude);
      
      const response = await api.get('/pois/nearby', {
        params: {
          lat: location.latitude,
          lng: location.longitude,
          radius: 5000, // 5km radius
        },
      });
      
      console.log('Fetched POIs:', response.data?.length || 0);
      setPois(response.data || []);
      
      if (!response.data || response.data.length === 0) {
        Alert.alert(
          'No Places Found',
          'There are no nearby places within 5km. Try moving to a different location.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to fetch POIs:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      Alert.alert(
        'Connection Error',
        'Unable to load nearby places. Please check your internet connection and try again.',
        [
          { text: 'Retry', onPress: fetchNearbyPOIs },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    } finally {
      setRefreshing(false);
    }
  };

  const calculateRoutes = async () => {
    if (!location || !pois.length) return;

    const calculatedRoutes = await Promise.all(
      pois.map(async (poi) => {
        const poiCoords = {
          latitude: poi.location.coordinates[1],
          longitude: poi.location.coordinates[0],
        };
        const distance = calculateDistance(
          location.latitude,
          location.longitude,
          poiCoords.latitude,
          poiCoords.longitude
        );

        // Fetch real road route using OpenRouteService
        const routePoints = await fetchRealRoute(location, poiCoords);

        return {
          poi,
          distance,
          coordinates: routePoints,
          isActive: activePOI?.id === poi.id,
        };
      })
    );

    // Sort by distance
    calculatedRoutes.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    setRoutes(calculatedRoutes);
  };

  const startNavigation = async (poi) => {
    if (!poi || !poi.name) {
      console.error('Invalid POI passed to startNavigation:', poi);
      return;
    }
    console.log(`🚀 Preparing navigation to ${poi.name}`);
    setActivePOI(poi);
    setShowRoutes(true);
    setShowBottomSheet(false);
    
    const poiCoords = {
      latitude: poi.location.coordinates[1],
      longitude: poi.location.coordinates[0],
    };
    
    // Fetch detailed route with turn-by-turn directions
    const routeData = await fetchDetailedRoute(location, poiCoords);
    setDetailedRoute(routeData);
    setShowNavigationPreview(true);
    
    // Fit map to show both user and destination
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [location, poiCoords],
        {
          edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
          animated: true,
        }
      );
    }
  };

  const beginNavigation = () => {
    console.log(`📍 Starting turn-by-turn navigation`);
    setShowNavigationPreview(false);
    setIsNavigating(true);
    setTracking(true);
    setCurrentStepIndex(0);
    
    // Animate navigation card sliding in
    Animated.spring(navCardSlide, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();
    
    // Start real-time location tracking with compass
    startLocationTracking();
    startCompassTracking();
    
    // Zoom into navigation mode (Google Maps style)
    if (mapRef.current && location) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 60, // Tilted view like Google Maps
        heading: heading || 0, // Rotate based on direction
        zoom: 18, // Close zoom for navigation
        altitude: 500,
      }, { duration: 1000 });
    }
  };

  const stopNavigation = () => {
    setActivePOI(null);
    setShowRoutes(false);
    setShowBottomSheet(false);
    setTracking(false);
    setIsNavigating(false);
    setShowNavigationPreview(false);
    setDetailedRoute(null);
    setCurrentStepIndex(0);
    setRemainingDistance(null);
    setEstimatedTimeArrival(null);
    
    // Stop tracking
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }
    if (headingSubscription.current) {
      headingSubscription.current.remove();
      headingSubscription.current = null;
    }
    
    // Reset camera to normal view
    if (mapRef.current && location) {
      mapRef.current.animateCamera({
        center: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        pitch: 0,
        heading: 0,
        zoom: 14,
        altitude: 2000,
      }, { duration: 1000 });
    }
  };

  const openInMaps = (poi) => {
    const destination = `${poi.location.coordinates[1]},${poi.location.coordinates[0]}`;
    const origin = `${location.latitude},${location.longitude}`;
    const label = encodeURIComponent(poi.name);

    Alert.alert(
      'Open in Maps',
      'Choose your preferred navigation app',
      [
        {
          text: 'Google Maps',
          onPress: () => {
            const url = Platform.select({
              ios: `comgooglemaps://?saddr=${origin}&daddr=${destination}&directionsmode=driving`,
              android: `google.navigation:q=${destination}&mode=d`
            });
            const fallbackUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
            
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Linking.openURL(fallbackUrl);
              }
            }).catch(() => Linking.openURL(fallbackUrl));
          },
        },
        {
          text: 'Apple Maps',
          onPress: () => {
            const url = `http://maps.apple.com/?saddr=${origin}&daddr=${destination}&dirflg=d`;
            Linking.openURL(url).catch(() => {
              Alert.alert('Error', 'Unable to open Apple Maps');
            });
          },
        },
        {
          text: 'Waze',
          onPress: () => {
            const url = `waze://?ll=${destination}&navigate=yes`;
            const fallbackUrl = `https://waze.com/ul?ll=${destination}&navigate=yes`;
            
            Linking.canOpenURL(url).then((supported) => {
              if (supported) {
                Linking.openURL(url);
              } else {
                Linking.openURL(fallbackUrl);
              }
            }).catch(() => Linking.openURL(fallbackUrl));
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getTurnIcon = (type, modifier) => {
    try {
      const key = `${type}-${modifier}`.toLowerCase();
      console.log('🔄 getTurnIcon called with:', { type, modifier, key });
      
      // Return icon names compatible with Ionicons/MaterialCommunityIcons
      const iconMap = {
        'turn-left': { name: 'arrow-back', type: 'ion' },
        'turn-right': { name: 'arrow-forward', type: 'ion' },
        'turn-sharp left': { name: 'arrow-back', type: 'ion' },
        'turn-sharp right': { name: 'arrow-forward', type: 'ion' },
        'turn-slight left': { name: 'arrow-undo', type: 'mat' },
        'turn-slight right': { name: 'arrow-redo', type: 'mat' },
        'straight-': { name: 'arrow-up', type: 'ion' },
        'merge-': { name: 'arrow-up', type: 'ion' },
        'depart-': { name: 'navigate', type: 'ion' },
        'arrive-': { name: 'checkmark-circle', type: 'ion' },
        'roundabout-': { name: 'sync', type: 'ion' },
        'continue-': { name: 'arrow-up', type: 'ion' },
      };
      
      for (const [pattern, icon] of Object.entries(iconMap)) {
        if (key.includes(pattern.replace('-', ''))) {
          return icon;
        }
      }
      
      return { name: 'arrow-forward', type: 'ion' };
    } catch (error) {
      console.log('Error in getTurnIcon:', error, 'type:', type, 'modifier:', modifier);
      return { name: 'arrow-forward', type: 'ion' };
    }
  };

  const switchRoute = (poi) => {
    if (!poi || !poi.location || !poi.location.coordinates) {
      console.error('Invalid POI passed to switchRoute:', poi);
      return;
    }
    setActivePOI(poi);
    if (mapRef.current) {
      const poiCoords = {
        latitude: poi.location.coordinates[1],
        longitude: poi.location.coordinates[0],
      };
      mapRef.current.fitToCoordinates(
        [location, poiCoords],
        {
          edgePadding: { top: 100, right: 50, bottom: 300, left: 50 },
          animated: true,
        }
      );
    }
  };

  const startLocationTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      locationSubscription.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000, // Update every 1 second for smooth movement
          distanceInterval: 5, // Or every 5 meters
        },
        (newLocation) => {
          const newCoords = {
            latitude: newLocation.coords.latitude,
            longitude: newLocation.coords.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          };
          
          setLocation(newCoords);
          
          // Calculate heading from speed and direction
          if (newLocation.coords.heading !== -1 && newLocation.coords.heading !== undefined) {
            setHeading(newLocation.coords.heading);
          }
          
          // Auto-follow user in navigation mode (Google Maps style)
          if (isNavigating && mapRef.current) {
            mapRef.current.animateCamera({
              center: newCoords,
              pitch: 60,
              heading: newLocation.coords.heading || heading || 0,
              zoom: 18,
              altitude: 500,
            }, { duration: 1000 });
          }
          
          // Auto-advance to next step and calculate remaining distance
          if (isNavigating && detailedRoute && detailedRoute.steps.length > 0 && activePOI) {
            const poiCoords = {
              latitude: activePOI.location.coordinates[1],
              longitude: activePOI.location.coordinates[0],
            };
            
            // Calculate distance to destination
            const distanceToDestination = calculateDistance(
              newCoords.latitude,
              newCoords.longitude,
              poiCoords.latitude,
              poiCoords.longitude
            );
            setRemainingDistance(distanceToDestination);
            
            // Check if we should advance to next step
            // Find the closest upcoming step
            if (currentStepIndex < detailedRoute.steps.length - 1) {
              // Simple logic: advance when within 30 meters (0.03 km) of next maneuver
              const currentStep = detailedRoute.steps[currentStepIndex];
              const distanceToNextManeuver = parseFloat(currentStep.distance || 0);
              
              // Announce upcoming turn (Google Maps style)
              if (distanceToNextManeuver < 0.5 && distanceToNextManeuver > 0.02 && lastAnnouncedStep !== currentStepIndex) {
                // Show alert for upcoming turn
                const nextStep = detailedRoute.steps[currentStepIndex];
                console.log(`🔔 Upcoming: ${nextStep.instruction} in ${distanceToNextManeuver} km`);
                setLastAnnouncedStep(currentStepIndex);
              }
              
              if (distanceToNextManeuver < 0.03) {
                console.log(`✓ Advancing to step ${currentStepIndex + 2}`);
                setCurrentStepIndex(currentStepIndex + 1);
                setLastAnnouncedStep(-1); // Reset for next step
              }
            }
            
            // Check if arrived (within 20 meters)
            if (distanceToDestination < 0.02) {
              console.log('🎉 Arrived at destination!');
              Alert.alert(
                '🎉 Arrived!',
                `You have reached ${activePOI?.name || 'your destination'}`,
                [{ text: 'OK', onPress: stopNavigation }]
              );
            }
          }
        }
      );
    } catch (error) {
      console.error('Location tracking error:', error);
    }
  };

  const startCompassTracking = async () => {
    try {
      // Try to get device heading/compass
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Watch heading changes for smooth rotation
      headingSubscription.current = await Location.watchHeadingAsync((headingData) => {
        if (headingData.trueHeading !== -1) {
          setHeading(headingData.trueHeading);
          
          // Update camera rotation smoothly
          if (isNavigating && mapRef.current && location) {
            mapRef.current.animateCamera({
              heading: headingData.trueHeading,
            }, { duration: 500 });
          }
        }
      });
    } catch (error) {
      console.log('Compass not available:', error.message);
      // Not all devices have compass, use GPS heading instead
    }
  };

  const handleMarkerPress = (poi) => {
    navigation.navigate('POIDetail', { poi });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.errorContainer}>
        <LinearGradient
          colors={['#f8fafc', '#f1f5f9']}
          style={styles.errorGradient}
        >
          <View style={styles.errorContent}>
            <Ionicons name="location-outline" size={64} color="#94a3b8" />
            <Text style={styles.errorTitle}>Location Access Needed</Text>
            <Text style={styles.errorDescription}>
              We need your location to show nearby attractions and provide navigation.
              Please enable location services and grant permission.
            </Text>

            <View style={styles.errorActions}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={requestLocationPermission}
              >
                <LinearGradient
                  colors={['#2563eb', '#1d4ed8']}
                  style={styles.primaryButtonGradient}
                >
                  <Text style={styles.primaryButtonText}>Enable Location</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => {
                  if (Platform.OS === 'ios') {
                    Linking.openURL('app-settings:');
                  } else {
                    Linking.openSettings();
                  }
                }}
              >
                <Text style={styles.secondaryButtonText}>Open Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={location}
        showsUserLocation
        showsMyLocationButton={false}
        loadingEnabled
        followsUserLocation={isNavigating}
        showsCompass={false}
        showsTraffic={isNavigating}
        rotateEnabled={true}
        pitchEnabled={true}
        scrollEnabled={true}
        zoomEnabled={true}
        toolbarEnabled={false}
        mapType="standard"
      >
        {/* User location radius */}
        <Circle
          center={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          radius={100}
          fillColor="rgba(37, 99, 235, 0.1)"
          strokeColor="rgba(37, 99, 235, 0.5)"
          strokeWidth={1}
        />

        {/* Route Polylines with Premium Styling */}
        {showRoutes && routes.map((route, index) => (
          <React.Fragment key={`route-fragment-${route.poi.id}`}>
            {/* Shadow/Outline layer for depth */}
            <Polyline
              key={`route-shadow-${route.poi.id}`}
              coordinates={route.coordinates}
              strokeColor={route.isActive ? 'rgba(37, 99, 235, 0.3)' : 'rgba(148, 163, 184, 0.2)'}
              strokeWidth={route.isActive ? (isNavigating ? 12 : 9) : 4}
              zIndex={route.isActive ? 99 : 49}
              lineJoin="round"
              lineCap="round"
            />
            {/* Main route line */}
            <Polyline
              key={`route-main-${route.poi.id}`}
              coordinates={route.coordinates}
              strokeColor={route.isActive ? '#3b82f6' : '#cbd5e1'}
              strokeWidth={route.isActive ? (isNavigating ? 8 : 6) : 3}
              lineDashPattern={route.isActive ? null : [15, 10]}
              zIndex={route.isActive ? 100 : 50}
              lineJoin="round"
              lineCap="round"
            />
          </React.Fragment>
        ))}

        {/* User heading indicator during navigation */}
        {isNavigating && location && (
          <Marker
            coordinate={location}
            anchor={{ x: 0.5, y: 0.5 }}
            flat={true}
            rotation={heading}
          >
            <View style={styles.userMarker}>
              <View style={styles.userMarkerInner} />
              <View style={styles.userMarkerArrow} />
            </View>
          </Marker>
        )}

        {/* POI Markers */}
        {pois.map((poi) => {
          const distance = calculateDistance(
            location.latitude,
            location.longitude,
            poi.location.coordinates[1],
            poi.location.coordinates[0]
          );
          const isActive = activePOI?.id === poi.id;

          return (
            <Marker
              key={poi.id}
              coordinate={{
                latitude: poi.location.coordinates[1],
                longitude: poi.location.coordinates[0],
              }}
              title={poi.name}
              description={`${distance} km away`}
              onPress={() => handleMarkerPress(poi)}
              pinColor={isActive ? '#16a34a' : poi.isHidden ? '#f59e0b' : '#2563eb'}
            >
              <Callout onPress={() => startNavigation(poi)}>
                <View style={styles.calloutContainer}>
                  <Text style={styles.calloutTitle}>{poi.name}</Text>
                  <Text style={styles.calloutDistance}>{distance} km away</Text>
                  <Text style={styles.calloutCategory}>{poi.category}</Text>
                  <Text style={styles.calloutAction}>
                    {isActive ? '✓ Navigating' : 'Tap to navigate'}
                  </Text>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>

      {/* Search Bar / Places Header */}
      {!isNavigating && (
        <Animated.View style={[styles.searchBarContainer, { opacity: 1 }]}>
          <BlurView intensity={100} tint="light" style={styles.searchBarBlur}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                const newShowRoutes = !showRoutes;
                setShowRoutes(newShowRoutes);
                setShowBottomSheet(newShowRoutes);
                
                Animated.spring(bottomSheetAnim, {
                  toValue: newShowRoutes ? 1 : 0,
                  friction: 8,
                  tension: 40,
                  useNativeDriver: true,
                }).start();
              }}
              style={styles.searchBarContent}
            >
              <View style={styles.searchIconWrapper}>
                <Ionicons name="search" size={20} color="#3b82f6" />
              </View>
              <View style={styles.searchTextContainer}>
                <Text style={styles.searchPlaceholder}>
                  {showRoutes ? 'Showing nearby places' : 'Search nearby places'}
                </Text>
                <Text style={styles.searchSubtext}>
                  {pois.length} {pois.length === 1 ? 'place' : 'places'} found
                </Text>
              </View>
              <View style={styles.placesCountBadge}>
                <Text style={styles.placesCountText}>{pois.length}</Text>
              </View>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* Control Buttons - Right Side */}
      <View style={styles.controlButtonsContainer}>
        {/* Refresh POIs Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={fetchNearbyPOIs}
          disabled={refreshing}
          style={styles.modernControlButton}
        >
          <View style={styles.modernControlButtonInner}>
            <Ionicons 
              name={refreshing ? "reload" : "refresh"} 
              size={20} 
              color="#3b82f6" 
            />
          </View>
        </TouchableOpacity>

        {/* My Location Button */}
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            if (mapRef.current && location) {
              mapRef.current.animateCamera({
                center: location,
                zoom: 15,
                pitch: 0,
                heading: 0,
              }, { duration: 1000 });
            }
          }}
          style={styles.modernControlButton}
        >
          <View style={styles.modernControlButtonInner}>
            <Ionicons name="locate" size={20} color="#3b82f6" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Active Navigation Banner - Premium Glassmorphism Design */}
      {isNavigating && activePOI && activePOI.name && detailedRoute && detailedRoute.steps && detailedRoute.steps.length > 0 && (
        <Animated.View 
          style={[
            styles.turnByTurnContainer,
            {
              transform: [{
                translateY: navCardSlide.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-300, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.navCardBlur}>
            {/* Current Turn - Hero Card */}
            <View style={styles.currentTurnCard}>
              <View style={styles.currentTurnIconWrapper}>
                <View style={styles.currentTurnIconBg}>
                  {(() => {
                    const icon = getTurnIcon(
                      detailedRoute.steps[currentStepIndex]?.type,
                      detailedRoute.steps[currentStepIndex]?.modifier
                    );
                    return icon.type === 'mat' ? (
                      <MaterialCommunityIcons name={icon.name} size={32} color="#fff" />
                    ) : (
                      <Ionicons name={icon.name} size={32} color="#fff" />
                    );
                  })()}
                </View>
                <View style={styles.distanceBadge}>
                  <Text style={styles.distanceBadgeText}>
                    {String(detailedRoute.steps[currentStepIndex]?.distance || '0')} km
                  </Text>
                </View>
              </View>
              
              <View style={styles.currentTurnContent}>
                <Text style={styles.currentTurnLabel}>CONTINUE</Text>
                <Text style={styles.currentTurnInstruction} numberOfLines={2}>
                  {stripHtml(detailedRoute.steps[currentStepIndex]?.instruction) || 'Continue straight'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeNavButton}
                onPress={stopNavigation}
                activeOpacity={0.7}
              >
                <View style={styles.closeNavCircle}>
                  <Ionicons name="close" size={24} color="#fff" />
                </View>
              </TouchableOpacity>
            </View>
            
            {/* Trip Stats Row */}
            <View style={styles.tripStatsRow}>
              <View style={styles.tripStatBox}>
                <Ionicons name="navigate-circle-outline" size={18} color="#3b82f6" />
                <View style={styles.tripStatContent}>
                  <Text style={styles.tripStatValue}>
                    {String(remainingDistance || detailedRoute.distance)}
                  </Text>
                  <Text style={styles.tripStatUnit}>km</Text>
                </View>
              </View>

              <View style={styles.tripStatDivider} />

              <View style={styles.tripStatBox}>
                <Ionicons name="time-outline" size={18} color="#10b981" />
                <View style={styles.tripStatContent}>
                  <Text style={styles.tripStatValue}>{String(detailedRoute.duration)}</Text>
                  <Text style={styles.tripStatUnit}>min</Text>
                </View>
              </View>
            </View>

            {/* Next Turn Preview - Compact */}
            {currentStepIndex < detailedRoute.steps.length - 1 && (
              <View style={styles.nextTurnCompact}>
                <Text style={styles.nextTurnThen}>THEN</Text>
                <View style={styles.nextTurnIconSmall}>
                  {(() => {
                    const icon = getTurnIcon(
                      detailedRoute.steps[currentStepIndex + 1]?.type,
                      detailedRoute.steps[currentStepIndex + 1]?.modifier
                    );
                    return icon.type === 'mat' ? (
                      <MaterialCommunityIcons name={icon.name} size={20} color="#8b5cf6" />
                    ) : (
                      <Ionicons name={icon.name} size={20} color="#8b5cf6" />
                    );
                  })()}
                </View>
                <Text style={styles.nextTurnInstructionText} numberOfLines={1}>
                  {stripHtml(detailedRoute.steps[currentStepIndex + 1]?.instruction) || 'Continue'}
                </Text>
                <Text style={styles.nextTurnDistanceText}>
                  {String(detailedRoute.steps[currentStepIndex + 1]?.distance || '0')} km
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      )}

      {/* Recenter FAB during navigation */}
      {isNavigating && (
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.recenterButtonContainer}
          onPress={() => {
            if (mapRef.current && location) {
              mapRef.current.animateCamera({
                center: location,
                pitch: 60,
                heading: heading || 0,
                zoom: 18,
                altitude: 500,
              }, { duration: 500 });
            }
          }}
        >
          <View style={styles.recenterButtonBg}>
            <Ionicons name="navigate" size={24} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Compact Route Preview */}
      {showNavigationPreview && activePOI && activePOI.name && detailedRoute && (
        <Animated.View style={[styles.navigationPreview, {
          opacity: bottomSheetAnim,
        }]}>
          <View style={styles.previewBlur}>
            {/* Compact Header */}
            <View style={styles.previewCompactHeader}>
              <View style={styles.previewHeaderLeft}>
                <View style={styles.destinationIconWrapper}>
                  <Ionicons name="location-sharp" size={20} color="#fff" />
                </View>
                <View style={styles.previewHeaderInfo}>
                  <Text style={styles.previewDestinationName} numberOfLines={1}>
                    {String(activePOI?.name || 'Destination')}
                  </Text>
                  <Text style={styles.previewCategory}>{String(activePOI?.category || 'Place')}</Text>
                </View>
              </View>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => {
                  setShowNavigationPreview(false);
                  setActivePOI(null);
                  setShowRoutes(false);
                  setDetailedRoute(null);
                }}
                style={styles.compactCloseButton}
              >
                <Ionicons name="close-circle" size={28} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Route Stats Cards */}
            <View style={styles.statsCardsContainer}>
              <View style={styles.statCard}>
                <Ionicons name="navigate-circle" size={24} color="#3b82f6" />
                <View style={styles.statCardInfo}>
                  <Text style={styles.statCardValue}>{String(detailedRoute.distance)} km</Text>
                  <Text style={styles.statCardLabel}>Distance</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <Ionicons name="time" size={24} color="#8b5cf6" />
                <View style={styles.statCardInfo}>
                  <Text style={styles.statCardValue}>{String(detailedRoute.duration)} min</Text>
                  <Text style={styles.statCardLabel}>Duration</Text>
                </View>
              </View>
            </View>

            {/* Action Button - Full Width */}
            <View style={styles.previewActionsRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={beginNavigation}
                style={styles.primaryActionButtonFull}
              >
                <LinearGradient
                  colors={['#3b82f6', '#2563eb']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryActionGradient}
                >
                  <Ionicons name="navigate" size={20} color="#fff" />
                  <Text style={styles.primaryActionText}>Start Navigation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom Sheet - POI List with Premium Design */}
      {showBottomSheet && (
        <Animated.View 
          style={[
            styles.bottomSheet,
            {
              transform: [{
                translateY: bottomSheetAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [height * 0.5, 0],
                }),
              }],
            },
          ]}
        >
          <View style={styles.bottomSheetBlur}>
            <View style={styles.bottomSheetHandle} />
            <View style={styles.bottomSheetHeader}>
              <View style={styles.bottomSheetHeaderLeft}>
                <View style={styles.bottomSheetIconContainer}>
                  <Ionicons name="location" size={24} color="#3b82f6" />
                </View>
                <View>
                  <Text style={styles.bottomSheetTitle}>Nearby Places</Text>
                  <Text style={styles.bottomSheetSubtitle}>
                    Tap a place to view directions
                  </Text>
                </View>
              </View>
              <View style={styles.routesCount}>
                <Text style={styles.routesCountText}>{routes.length}</Text>
              </View>
            </View>
            
            {refreshing ? (
              <View style={styles.emptyStateContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.emptyStateText}>Loading nearby places...</Text>
              </View>
            ) : routes.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Ionicons name="location-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyStateTitle}>No Places Found</Text>
                <Text style={styles.emptyStateText}>
                  There are no places within 5km radius.{'\n'}
                  Try moving to a different location or tap refresh.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={fetchNearbyPOIs}
                  style={styles.emptyStateButton}
                >
                  <LinearGradient
                    colors={['#3b82f6', '#2563eb']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.emptyStateButtonGradient}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.emptyStateButtonText}>Refresh</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.routeList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.routeListContent}
              >
                {routes.map((route, index) => (
                <TouchableOpacity
                  key={route.poi.id}
                  activeOpacity={0.8}
                  onPress={() => switchRoute(route.poi)}
                  style={styles.routeItem}
                >
                  <View style={styles.routeItemLeft}>
                    <View style={[
                      styles.routeNumberContainer,
                      route.isActive && styles.routeNumberContainerActive
                    ]}>
                      <Text style={[
                        styles.routeNumber,
                        route.isActive && styles.routeNumberActive
                      ]}>
                        {index + 1}
                      </Text>
                    </View>
                    <View style={styles.routeItemInfo}>
                      <Text style={styles.routeItemName} numberOfLines={1}>
                        {route.poi.name}
                      </Text>
                      <View style={styles.routeCategoryRow}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.routeItemCategory}>
                            {route.poi.category}
                          </Text>
                        </View>
                        <Text style={styles.routeDistance}>
                          • {route.distance} km
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.routeItemRight}>
                    {route.isActive ? (
                      <View style={styles.activeIndicator}>
                        <Text style={styles.activeIndicatorText}>Active</Text>
                      </View>
                    ) : (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => startNavigation(route.poi)}
                        style={styles.goButtonContainer}
                      >
                        <Text style={styles.goButtonText}>Go</Text>
                        <Text style={styles.goButtonArrow}>→</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              </ScrollView>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width,
    height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  errorGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContent: {
    alignItems: 'center',
    maxWidth: 320,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDescription: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  errorActions: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  secondaryButtonText: {
    color: '#475569',
    fontSize: 16,
    fontWeight: '500',
  },
  // Modern Search Bar / Places Header
  searchBarContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 20,
    left: 20,
    right: 80,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  searchBarBlur: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  searchBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  searchIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  searchIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 18,
  },
  searchTextContainer: {
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  searchSubtext: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  placesCountBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  placesCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  searchActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchActionText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#3b82f6',
  },
  // Modern Control Buttons (Top Right)
  controlButtonsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    right: 16,
    gap: 10,
    zIndex: 10,
  },
  modernControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  modernControlButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  controlButtonBlur: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  controlButtonInner: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  controlButtonIconActive: {
    color: '#8b5cf6',
  },
  // Stats Container with Blur
  statsContainer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  statsBlur: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  statsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  statsIcon: {
    fontSize: 18,
  },
  statsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 30,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptyStateButton: {
    marginTop: 8,
  },
  emptyStateButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 14,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Bottom Sheet Premium Styles
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.5,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 15,
  },
  bottomSheetBlur: {
    height: '100%',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  bottomSheetHandle: {
    width: 45,
    height: 5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  bottomSheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  bottomSheetIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  bottomSheetSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  routesCount: {
    backgroundColor: '#3b82f6',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  routesCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  routeList: {
    maxHeight: height * 0.35,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  routeListContent: {
    paddingBottom: 30,
    paddingTop: 10,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  routeItemActive: {
    shadowColor: '#3b82f6',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  routeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 14,
  },
  routeNumberContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  routeNumber: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  routeItemInfo: {
    flex: 1,
  },
  routeItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
  },
  routeCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  routeItemCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  routeDistance: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  routeItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  activeIndicator: {
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  activeIndicatorText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
  },
  goButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 4,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  goButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  goButtonArrow: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  // Callout Styles
  calloutContainer: {
    width: 200,
    padding: 10,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  calloutDistance: {
    fontSize: 14,
    color: '#2563eb',
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  calloutAction: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
  },
  navigationBanner: {
    position: 'absolute',
    top: 120,
    left: 20,
    right: 20,
    backgroundColor: '#16a34a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  navigationInfo: {
    flex: 1,
  },
  navigationTitle: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.9,
  },
  navigationPOI: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 2,
  },
  navigationDistance: {
    color: '#fff',
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  stopButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  stopButtonText: {
    color: '#16a34a',
    fontWeight: 'bold',
    fontSize: 14,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    maxHeight: height * 0.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  bottomSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  bottomSheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1e293b',
  },
  routeList: {
    flex: 1,
  },
  routeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#e2e8f0',
  },
  routeItemActive: {
    backgroundColor: '#dbeafe',
    borderColor: '#2563eb',
  },
  routeItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  routeNumber: {
    width: 28,
    height: 28,
    backgroundColor: '#94a3b8',
    borderRadius: 14,
    textAlign: 'center',
    lineHeight: 28,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 12,
  },
  routeItemInfo: {
    flex: 1,
  },
  routeItemName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  routeItemNameActive: {
    color: '#2563eb',
    fontWeight: 'bold',
  },
  routeItemCategory: {
    fontSize: 12,
    color: '#64748b',
  },
  routeItemRight: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  routeDistance: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#475569',
    marginBottom: 4,
  },
  routeDistanceActive: {
    color: '#2563eb',
  },
  activeIndicator: {
    fontSize: 11,
    color: '#16a34a',
    fontWeight: 'bold',
  },
  goButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  goButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  // Compact Navigation Preview Styles
  navigationPreview: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.32,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  previewBlur: {
    flex: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  previewCompactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  destinationIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  previewHeaderInfo: {
    flex: 1,
  },
  previewDestinationName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  previewCategory: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
    textTransform: 'capitalize',
  },
  compactCloseButton: {
    padding: 4,
  },
  statsCardsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statCardInfo: {
    flex: 1,
  },
  statCardValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 2,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewActionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
  },
  secondaryActionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#3b82f6',
  },
  primaryActionButton: {
    flex: 1.3,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionButtonFull: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  previewHeader: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  previewHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  previewTitleIcon: {
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0f172a',
    letterSpacing: 0.3,
    flex: 1,
  },
  previewStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewStats: {
    fontSize: 16,
    color: '#475569',
    fontWeight: '700',
  },
  previewStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#cbd5e1',
  },
  closePreviewButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  previewContent: {
    flex: 1,
    paddingTop: 0,
    backgroundColor: 'transparent',
  },
  previewStepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 16,
    marginTop: 16,
    backgroundColor: 'transparent',
  },
  previewStepsTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: 0.3,
  },
  stepsCountBadge: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  stepsCountText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  previewStepsList: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  previewStep: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  previewStepFirst: {
    shadowColor: '#3b82f6',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  previewStepLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  previewStepNumberContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewStepNumber: {
    color: '#64748b',
    fontWeight: '800',
    fontSize: 14,
  },
  previewStepNumberFirst: {
    color: '#fff',
  },
  previewStepIconContainer: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewStepIcon: {
    fontSize: 26,
  },
  previewStepRight: {
    flex: 1,
    justifyContent: 'center',
  },
  previewStepInstruction: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    marginBottom: 6,
    lineHeight: 20,
  },
  previewStepMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewStepDistance: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  previewStepDot: {
    fontSize: 13,
    color: '#cbd5e1',
  },
  previewStepDuration: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  previewButtonsRow: {
    flexDirection: 'row',
    gap: 12,
    margin: 20,
  },
  openMapsButton: {
    flex: 1,
  },
  openMapsGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  openMapsText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  startNavButton: {
    flex: 1,
  },
  startNavGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  startNavigationButton: {
    margin: 20,
    paddingVertical: 18,
    borderRadius: 18,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startNavigationText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  // Modern Turn-by-Turn Navigation Styles
  turnByTurnContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 10,
    left: 0,
    right: 0,
  },
  navCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    marginHorizontal: 12,
    marginRight: 80,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  currentTurnCard: {
    backgroundColor: '#1e293b',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currentTurnIconWrapper: {
    alignItems: 'center',
  },
  currentTurnIconBg: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  distanceBadge: {
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  distanceBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1e293b',
  },
  currentTurnContent: {
    flex: 1,
  },
  currentTurnLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  currentTurnInstruction: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    lineHeight: 24,
  },
  closeNavButton: {
    padding: 4,
  },
  closeNavCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  tripStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#f8fafc',
  },
  tripStatBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tripStatContent: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  tripStatValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  tripStatUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  tripStatDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 4,
  },
  nextTurnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  nextTurnThen: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8b5cf6',
    letterSpacing: 1,
  },
  nextTurnIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ede9fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextTurnInstructionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  nextTurnDistanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b5cf6',
  },
  recenterButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    backgroundColor: '#fff',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  recenterButtonContainer: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recenterButtonBg: {
    width: 56,
    height: 56,
    backgroundColor: '#3b82f6',
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userMarkerInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  userMarkerArrow: {
    position: 'absolute',
    top: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#2563eb',
  },
  // Old styles removed
  turnByTurnHeader: {
    display: 'none',
  },
  turnByTurnMain: {
    display: 'none',
  },
  turnInfo: {
    display: 'none',
  },
  turnInstruction: {
    display: 'none',
  },
  turnDistance: {
    display: 'none',
  },
  tripSummary: {
    display: 'none',
  },
  tripText: {
    display: 'none',
  },
  upcomingSteps: {
    display: 'none',
  },
  upcomingStep: {
    display: 'none',
  },
  upcomingStepIcon: {
    display: 'none',
  },
  upcomingStepText: {
    display: 'none',
  },
  upcomingStepDistance: {
    display: 'none',
  },
  stepNavigation: {
    display: 'none',
  },
  stepButton: {
    display: 'none',
  },
  stepButtonDisabled: {
    display: 'none',
  },
  stepButtonText: {
    display: 'none',
  },
});
