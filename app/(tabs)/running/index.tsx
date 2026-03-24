import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Dimensions,
  SafeAreaView,
  RefreshControl,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRunTrackerStore } from '../../../store/useRunTrackerStore';
import { runApi } from '../../../api/run';
import { formatDuration } from '../../../utils/run';

const { width } = Dimensions.get('window');

export default function RunningDashboardScreen() {
  const router = useRouter();
  const { 
    sessionId, status, setSession, setStatus, updateMetrics, setHasInitialized,
    autoPauseEnabled, setAutoPause 
  } = useRunTrackerStore();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState({
    totalDistanceMeters: 0,
    totalDurationSeconds: 0,
    totalCaloriesBurned: 0,
    totalRuns: 0,
  });
  const [refreshing, setRefreshing] = useState(false);

  // Check current session on focus/mount
  const checkData = useCallback(async () => {
    try {
      const [activeSession, stats] = await Promise.all([
        runApi.getCurrentSession(),
        runApi.getStats()
      ]);
      
      if (activeSession) {
        setSession(activeSession.id);
        setStatus(activeSession.status);
        updateMetrics(
          activeSession.distanceMeters,
          activeSession.durationSeconds,
          activeSession.avgPace || '0:00',
          activeSession.avgSpeedKmh || 0,
          activeSession.caloriesBurned || 0
        );
        setHasInitialized(true);
      } else {
        setSession(null);
        setStatus('IDLE');
      }

      if (stats) {
        setUserStats(stats);
      }
    } catch (err) {
      console.error('Failed to fetch running data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [setSession, setStatus, updateMetrics, setHasInitialized]);

  useEffect(() => {
    checkData();
  }, [checkData]);

  const onRefresh = () => {
    setRefreshing(true);
    checkData();
  };

  const onStartPress = () => {
    router.push('/run/live');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.welcomeText}>Sẵn sàng chưa?</Text>
          <Text style={styles.titleText}>Chạy bộ ngay thôi!</Text>
        </View>

        <View style={styles.heroContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=1000' }} 
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
             <Ionicons name="location" size={24} color="#fff" />
             <Text style={styles.heroLocation}>TP. Hồ Chí Minh, Việt Nam</Text>
          </View>
        </View>

        {status !== 'IDLE' && sessionId && (
          <TouchableOpacity style={styles.activeSessionCard} onPress={onStartPress}>
             <View style={styles.activeSessionStatus}>
                <View style={[styles.statusDot, { backgroundColor: status === 'IN_PROGRESS' ? '#4CAF50' : '#FF9800' }]} />
                <Text style={styles.statusLabel}>{status === 'IN_PROGRESS' ? 'Đang hoạt động' : 'Đang tạm dừng'}</Text>
             </View>
             <Text style={styles.activeSessionTitle}>Tiếp tục buổi chạy đang dang dở</Text>
             <Ionicons name="arrow-forward-circle" size={40} color="#FF6F61" />
          </TouchableOpacity>
        )}

        <View style={styles.sectionHeader}>
           <Text style={styles.sectionTitle}>Thành tích cá nhân</Text>
           <View style={styles.sectionActions}>
             <TouchableOpacity style={styles.iconAction} onPress={() => router.push('/running/leaderboard')}>
                <Ionicons name="trophy-outline" size={20} color="#FF6F61" />
             </TouchableOpacity>
             <TouchableOpacity onPress={() => router.push('/running/history')}>
                <Text style={styles.seeAllText}>Xem lịch sử</Text>
             </TouchableOpacity>
           </View>
        </View>

        <View style={styles.statsPreview}>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{userStats.totalRuns}</Text>
              <Text style={styles.statLabel}>Buổi chạy</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{(userStats.totalDistanceMeters / 1000).toFixed(1)}</Text>
              <Text style={styles.statLabel}>Km tổng</Text>
           </View>
           <View style={styles.statBox}>
              <Text style={styles.statValue}>{Math.round(userStats.totalCaloriesBurned)}</Text>
              <Text style={styles.statLabel}>Kcal</Text>
           </View>
        </View>

        <View style={styles.settingsContainer}>
           <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                 <Ionicons name="pause-circle-outline" size={24} color="#666" />
                 <View style={styles.settingTexts}>
                    <Text style={styles.settingTitle}>Tự động tạm dừng</Text>
                    <Text style={styles.settingDesc}>Dừng đếm khi bạn đứng yên</Text>
                 </View>
              </View>
              <Switch 
                value={autoPauseEnabled} 
                onValueChange={setAutoPause}
                trackColor={{ false: '#EEE', true: '#FFD3D1' }}
                thumbColor={autoPauseEnabled ? '#FF6F61' : '#AAA'}
              />
           </View>
        </View>

        <View style={styles.goContainer}>
           <TouchableOpacity style={styles.goButton} onPress={onStartPress}>
              <Text style={styles.goText}>GO!</Text>
           </TouchableOpacity>
        </View>

        <Text style={styles.tipText}>Tip: Đừng quên mang theo nước và giày chạy phù hợp nhé!</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 16,
    color: '#999',
    fontWeight: '600',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginTop: 4,
  },
  heroContainer: {
    height: 200,
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  heroLocation: {
    color: '#fff',
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
  },
  activeSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF2F1',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FFD3D1',
    marginBottom: 24,
  },
  activeSessionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#fff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#666',
  },
  activeSessionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6F61',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  sectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconAction: {
    padding: 4,
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF6F61',
    fontWeight: '600',
  },
  statsPreview: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '600',
    marginTop: 4,
  },
  goContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  goButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 15,
    borderWidth: 8,
    borderColor: 'rgba(255, 111, 97, 0.2)',
  },
  goText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#fff',
  },
  tipText: {
    textAlign: 'center',
    fontSize: 13,
    color: '#AAA',
    fontStyle: 'italic',
  },
  settingsContainer: {
    backgroundColor: '#F8F9FE',
    borderRadius: 20,
    padding: 16,
    marginBottom: 30,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingTexts: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
  },
  settingDesc: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
