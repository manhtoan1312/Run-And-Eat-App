import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  ActivityIndicator, 
  TouchableOpacity,
  Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { runApi } from '../../../api/run';
import { formatDuration } from '../../../utils/run';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import RunMap from '../../../components/run/RunMap';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [points, setPoints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDetail();
    }
  }, [id]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const [sessionData, pointsData] = await Promise.all([
        runApi.getSession(id as string),
        runApi.getSessionPoints(id as string)
      ]);
      setSession(sessionData);
      setPoints(pointsData);
    } catch (err) {
      console.error('Failed to fetch session detail:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text>Không tìm thấy dữ liệu buổi chạy</Text>
      </View>
    );
  }

  const date = new Date(session.startedAt);
  const dateStr = date.toLocaleDateString('vi-VN', { 
    weekday: 'long',
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <RunMap 
          points={points} 
          isLive={false} 
        />
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.noteText}>{session.note || 'Buổi chạy bộ buổi sáng'}</Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{(session.distanceMeters / 1000).toFixed(2)}</Text>
            <Text style={styles.statLabel}>Kilometers</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDuration(session.durationSeconds)}</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBoxSmall}>
             <Ionicons name="speedometer-outline" size={20} color="#FF6F61" />
             <View>
                <Text style={styles.smallStatValue}>{session.avgPace || '-:--'}</Text>
                <Text style={styles.smallStatLabel}>Avg Pace</Text>
             </View>
          </View>
          <View style={styles.statBoxSmall}>
             <Ionicons name="flame-outline" size={20} color="#FF6F61" />
             <View>
                <Text style={styles.smallStatValue}>{Math.round(session.caloriesBurned || 0)}</Text>
                <Text style={styles.smallStatLabel}>Calories</Text>
             </View>
          </View>
          <View style={styles.statBoxSmall}>
             <Ionicons name="trending-up-outline" size={20} color="#FF6F61" />
             <View>
                <Text style={styles.smallStatValue}>{session.avgSpeedKmh?.toFixed(1) || '0.0'}</Text>
                <Text style={styles.smallStatLabel}>Speed km/h</Text>
             </View>
          </View>
        </View>

        <View style={styles.infoCard}>
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Bắt đầu</Text>
                <Text style={styles.infoValue}>{new Date(session.startedAt).toLocaleTimeString('vi-VN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Kết thúc</Text>
                <Text style={styles.infoValue}>{session.endedAt ? new Date(session.endedAt).toLocaleTimeString('vi-VN') : '--:--'}</Text>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    height: SCREEN_HEIGHT * 0.45,
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    paddingTop: 20,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 25,
    marginBottom: 25,
  },
  dateText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  noteText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 15,
    marginBottom: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
  },
  statBoxSmall: {
    flex: 1,
    backgroundColor: '#F8F9FE',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  smallStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  smallStatLabel: {
    fontSize: 11,
    color: '#999',
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#F8F9FE',
    borderRadius: 20,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#EEE',
    marginVertical: 12,
  }
});
