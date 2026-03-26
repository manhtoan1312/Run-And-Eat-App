import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Dimensions, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useRunTracking } from '../../hooks/useRunTracking';
import { useRunTrackerStore } from '../../store/useRunTrackerStore';
import RunMap from '../../components/run/RunMap';
import { formatDuration } from '../../utils/run';
import { notifyWeakGpsDebounced } from '../../utils/notifications';

const { width } = Dimensions.get('window');

export default function LiveTrackingScreen() {
  const router = useRouter();
  const { startRun, pauseRun, resumeRun, finishRun, cancelRun, isLoading } = useRunTracking();
  const { status, distanceMeters, durationSeconds, avgPace, currentSpeed, points, currentAccuracy, caloriesBurned } = useRunTrackerStore();

  const [isLocked, setIsLocked] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const { autoPauseEnabled, setAutoPause } = useRunTrackerStore();

  // Notify user when GPS is weak while running
  useEffect(() => {
    if (status === 'IN_PROGRESS' && currentAccuracy !== null && currentAccuracy > 45) {
      notifyWeakGpsDebounced(120_000); // max 1 notification per 2 minutes
    }
  }, [currentAccuracy, status]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#FF6F61" />
        <Text style={styles.loadingText}>Đang tải dữ liệu chạy bộ...</Text>
      </SafeAreaView>
    );
  }

  const isLowGps = currentAccuracy === null || currentAccuracy > 45;

  const onToggleLock = () => {
    setIsLocked(!isLocked);
  };

  const onFinish = () => {
    if (isLocked) return;
    Alert.alert(
      'Hoàn thành',
      'Bạn có chắc chắn muốn kết thúc buổi chạy này?',
      [
        { text: 'Hủy', style: 'cancel' },
        { 
          text: 'Kết thúc', 
          onPress: async () => {
            await finishRun();
            router.replace('/(tabs)/history');
          } 
        },
      ]
    );
  };

  const onCancel = () => {
    if (isLocked) return;
    Alert.alert(
      'Hủy buổi chạy',
      'Mọi dữ liệu của buổi chạy này sẽ bị xóa. Bạn có chắc chắn?',
      [
        { text: 'Tiếp tục chạy', style: 'cancel' },
        { 
          text: 'Xóa', 
          style: 'destructive',
          onPress: async () => {
            await cancelRun();
            router.back();
          } 
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <RunMap points={points} isLive={true} />

        {/* Header Overlay */}
        <SafeAreaView style={styles.headerOverlay}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => !isLocked && router.back()} style={styles.headerIconBtn} disabled={isLocked}>
              <Ionicons name="close" size={24} color={isLocked ? "#CCC" : "#333"} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Chạy bộ</Text>
            <TouchableOpacity 
              style={styles.headerIconBtn} 
              onPress={() => !isLocked && setShowSettings(true)}
              disabled={isLocked}
            >
              <Ionicons name="settings-outline" size={22} color={isLocked ? "#CCC" : "#333"} />
            </TouchableOpacity>
          </View>
          
          {isLowGps && (
            <View style={styles.gpsWarningBar}>
              <Text style={styles.gpsWarningText}>Chất lượng GPS thấp.</Text>
            </View>
          )}
        </SafeAreaView>

        {/* Floating Components */}
        <View style={styles.floatingControls}>
            <TouchableOpacity style={styles.floatingBtn} disabled={isLocked}>
              <Ionicons name="navigate-outline" size={24} color={isLocked ? "#CCC" : "#333"} />
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsOverlay}>
        <View style={styles.statsMainRow}>
          <View style={styles.statLarge}>
            <Text style={styles.statValueLarge}>{formatDuration(durationSeconds)}</Text>
            <Text style={styles.statLabelSmall}>THỜI GIAN</Text>
          </View>
          <View style={styles.statLarge}>
            <Text style={styles.statValueLarge}>{(distanceMeters / 1000).toFixed(2)}</Text>
            <Text style={styles.statLabelSmall}>KM</Text>
          </View>
        </View>

        <View style={styles.statsSecondaryRow}>
          <View style={styles.statSmall}>
            <Text style={styles.statLabelTiny}>PACE</Text>
            <Text style={styles.statValueSmall}>{avgPace}</Text>
          </View>
          <View style={styles.statSmall}>
            <Text style={styles.statLabelTiny}>KM/H</Text>
            <Text style={styles.statValueSmall}>{(currentSpeed * 3.6).toFixed(1)}</Text>
          </View>
          <View style={styles.statSmall}>
            <Text style={styles.statLabelTiny}>KCAL</Text>
            <Text style={styles.statValueSmall}>{Math.round(caloriesBurned)}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.secondaryActionBtn, isLocked && styles.lockedBtn]} 
            onLongPress={onToggleLock}
            delayLongPress={2000}
            activeOpacity={0.7}
          >
            <Ionicons name={isLocked ? "lock-closed" : "lock-open-outline"} size={24} color={isLocked ? "#FF6F61" : "#333"} />
            {isLocked && <Text style={styles.lockHint}>Nhấn giữ để mở</Text>}
          </TouchableOpacity>

          <View style={{ opacity: isLocked ? 0.3 : 1 }} pointerEvents={isLocked ? 'none' : 'auto'}>
            {status === 'IN_PROGRESS' ? (
              <TouchableOpacity style={styles.mainActionBtnPause} onPress={pauseRun}>
                <Ionicons name="pause" size={32} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.mainActionBtnPlay} onPress={status === 'PAUSED' ? resumeRun : startRun}>
                <Ionicons name="play" size={32} color="#fff" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity 
            style={[styles.secondaryActionBtn, { opacity: isLocked ? 0.3 : 1 }]} 
            onPress={onFinish}
            disabled={isLocked}
          >
            <Ionicons name="stop" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cài đặt buổi chạy</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingTextContent}>
                <Text style={styles.settingMainText}>Tự động tạm dừng</Text>
                <Text style={styles.settingSubText}>
                  Tự động dừng đồng hồ khi tốc độ dưới 0.8m/s (khoảng 3km/h).
                </Text>
              </View>
              <Switch
                value={autoPauseEnabled}
                onValueChange={setAutoPause}
                trackColor={{ false: '#EEE', true: '#FFD3D1' }}
                thumbColor={autoPauseEnabled ? '#FF6F61' : '#AAA'}
              />
            </View>

            <TouchableOpacity 
              style={styles.closeModalBtn} 
              onPress={() => setShowSettings(false)}
            >
              <Text style={styles.closeModalBtnText}>Xong</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  headerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  headerIconBtn: {
    padding: 8,
  },
  gpsWarningBar: {
    backgroundColor: '#FF5252',
    paddingVertical: 8,
    alignItems: 'center',
  },
  gpsWarningText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  currentPointHalo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(66, 133, 244, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currentPoint: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: '#fff',
  },
  floatingControls: {
    position: 'absolute',
    right: 20,
    top: 150,
    gap: 12,
  },
  floatingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsOverlay: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  statsMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  statLarge: {
    alignItems: 'center',
    flex: 1,
  },
  statValueLarge: {
    fontSize: 42,
    fontWeight: '800',
    color: '#333',
    fontVariant: ['tabular-nums'],
  },
  statLabelSmall: {
    fontSize: 12,
    fontWeight: '700',
    color: '#999',
    marginTop: 4,
  },
  statsSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  statSmall: {
    alignItems: 'center',
  },
  statLabelTiny: {
    fontSize: 10,
    color: '#BBB',
    fontWeight: '700',
    marginBottom: 2,
  },
  statValueSmall: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
  },
  mainActionBtnPlay: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FF6F61',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  mainActionBtnPause: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#FFA000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FFA000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  secondaryActionBtn: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#F7F7F7',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
  },
  lockedBtn: {
    backgroundColor: '#FFF2F1',
    borderColor: '#FF6F61',
    borderWidth: 1,
  },
  lockHint: {
    fontSize: 8,
    color: '#FF6F61',
    fontWeight: '700',
    marginTop: 2,
    textAlign: 'center',
    position: 'absolute',
    bottom: -15,
    width: 80,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  settingTextContent: {
    flex: 1,
    marginRight: 20,
  },
  settingMainText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingSubText: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
    lineHeight: 18,
  },
  closeModalBtn: {
    backgroundColor: '#FF6F61',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
