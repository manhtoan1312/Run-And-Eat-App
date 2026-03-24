import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, ViewStyle } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { pointsToPolyline, RunPoint } from '../../utils/map';
import { Ionicons } from '@expo/vector-icons';

interface RunMapProps {
  points: RunPoint[];
  isLive?: boolean;
  style?: ViewStyle;
}

const DEFAULT_REGION = {
  latitude: 10.762622, 
  longitude: 106.660172,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function RunMap({ points, isLive = true, style }: RunMapProps) {
  const mapRef = useRef<MapView>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Effect to handle camera updates
  useEffect(() => {
    if (points.length === 0 || !mapRef.current) return;

    if (isLive) {
      // In live mode, follow the last point
      const lastPoint = points[points.length - 1];
      mapRef.current.animateToRegion({
        latitude: lastPoint.lat,
        longitude: lastPoint.lng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    } else if (points.length > 1) {
      // In review mode, fit all points
      const coordinates = pointsToPolyline(points);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [points.length, isLive]);

  if (hasPermission === false) {
    return (
      <View style={[styles.container, styles.center, style]}>
        <Ionicons name="navigate-outline" size={48} color="#CCC" />
        <Text style={styles.errorText}>Không có quyền truy cập vị trí</Text>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={[styles.container, styles.center, style]}>
        <ActivityIndicator size="small" color="#FF6F61" />
      </View>
    );
  }

  const polylineCoords = pointsToPolyline(points);
  const lastPoint = points.length > 0 ? points[points.length - 1] : null;
  const startPoint = points.length > 0 ? points[0] : null;

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={lastPoint ? {
          latitude: lastPoint.lat,
          longitude: lastPoint.lng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : DEFAULT_REGION}
        showsUserLocation={isLive}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        {points.length > 1 && (
          <Polyline
            coordinates={polylineCoords}
            strokeColor="#FF6F61"
            strokeWidth={5}
            lineJoin="round"
          />
        )}

        {/* Start Point Marker */}
        {startPoint && !isLive && (
          <Marker
             coordinate={{ latitude: startPoint.lat, longitude: startPoint.lng }}
             title="Bắt đầu"
          >
             <View style={styles.startBadge}>
                <View style={styles.startDot} />
             </View>
          </Marker>
        )}

        {/* Current/End Point Marker */}
        {lastPoint && (
          <Marker
            coordinate={{ latitude: lastPoint.lat, longitude: lastPoint.lng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.currentPointHalo}>
              <View style={styles.currentPoint} />
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    overflow: 'hidden',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  errorText: {
    marginTop: 10,
    color: '#999',
    fontSize: 14,
  },
  currentPointHalo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255, 111, 97, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPoint: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF6F61',
    borderWidth: 2,
    borderColor: '#fff',
  },
  startBadge: {
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: '#fff',
     justifyContent: 'center',
     alignItems: 'center',
     shadowColor: '#000',
     shadowOffset: { width: 0, height: 2 },
     shadowOpacity: 0.2,
     shadowRadius: 2,
     elevation: 2,
  },
  startDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: '#4CAF50',
  }
});
