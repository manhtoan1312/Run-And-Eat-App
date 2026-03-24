import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { runningApi } from '../../../api/running';
import { RunningLog } from '../../../types/running';
import { Ionicons } from '@expo/vector-icons';

export default function RunningListScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<RunningLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await runningApi.getAll();
      setLogs(data);
    } catch (err: any) {
      console.error('Fetch running logs error:', err);
      setError('Không thể tải danh sách. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchLogs(false);
  };

  const renderItem = ({ item }: { item: RunningLog }) => (
    <TouchableOpacity
      style={styles.logCard}
      onPress={() => router.push(`/(tabs)/running/${item.id}` as any)}
    >
      <View style={styles.logInfo}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
          <Text style={styles.dateMonth}>T{new Date(item.date).getMonth() + 1}</Text>
        </View>
        <View style={styles.mainInfo}>
          <Text style={styles.distanceText}>{item.distanceKm.toFixed(2)} km</Text>
          <Text style={styles.durationText}>
            <Ionicons name="time-outline" size={14} color="#777" /> {item.durationMinutes} phút
          </Text>
        </View>
      </View>
      <View style={styles.paceInfo}>
        <Text style={styles.paceValue}>{item.pace.toFixed(2)}</Text>
        <Text style={styles.paceUnit}>{item.paceUnit}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </View>
    );
  }

  if (error && logs.length === 0) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={60} color="#CCC" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchLogs()}>
          <Text style={styles.retryText}>Thử lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="footsteps-outline" size={80} color="#EEE" />
            <Text style={styles.emptyTitle}>Chưa có buổi chạy nào</Text>
            <Text style={styles.emptySubtitle}>Bắt đầu hành trình của bạn ngay hôm nay!</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/running/create')}
      >
        <Ionicons name="add" size={30} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  listContent: {
    padding: 20,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  dateBadge: {
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    width: 55,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  dateMonth: {
    fontSize: 12,
    color: '#777',
    fontWeight: '600',
  },
  mainInfo: {
    marginLeft: 15,
    flex: 1,
  },
  distanceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  durationText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  paceInfo: {
    alignItems: 'flex-end',
    marginRight: 10,
  },
  paceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6F61',
  },
  paceUnit: {
    fontSize: 12,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#FF6F61',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#CCC',
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#AAA',
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#777',
    marginTop: 15,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 25,
    paddingVertical: 12,
    backgroundColor: '#FF6F61',
    borderRadius: 20,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
