import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { useRouter } from 'expo-router';
import { runApi } from '../../../api/run';
import { formatDuration } from '../../../utils/run';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RunningHistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchSessions = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    try {
      const data = await runApi.getSessions(pageNum, 10);
      if (isRefresh) {
        setSessions(data.items);
      } else {
        setSessions(prev => [...prev, ...data.items]);
      }
      setHasMore(data.meta.page < data.meta.totalPages);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions(1, true);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(1);
    fetchSessions(1, true);
  };

  const onLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchSessions(nextPage);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const date = new Date(item.startedAt);
    const dateStr = date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    });
    const timeStr = date.toLocaleTimeString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });

    return (
      <TouchableOpacity 
        style={styles.card} 
        onPress={() => router.push(`/(tabs)/running/${item.id}`)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>{dateStr} - {timeStr}</Text>
          </View>
          <Text style={[styles.statusBadge, item.status === 'COMPLETED' ? styles.statusOld : styles.statusCancelled]}>
            {item.status === 'COMPLETED' ? 'Hoàn thành' : 'Đã hủy'}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Distance</Text>
            <Text style={styles.statValue}>{(item.distanceMeters / 1000).toFixed(2)} km</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Time</Text>
            <Text style={styles.statValue}>{formatDuration(item.durationSeconds)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Avg Pace</Text>
            <Text style={styles.statValue}>{item.avgPace || '-:--'}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#CCC" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
           <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử hoạt động</Text>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF6F61']} />
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="footsteps-outline" size={64} color="#EEE" />
              <Text style={styles.emptyText}>Chưa có lịch sử chạy bộ</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator size="small" color="#FF6F61" style={{ marginVertical: 20 }} />
          ) : (
            <Text style={styles.footerText}>-- Đã hiển thị tất cả --</Text>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  backBtn: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    position: 'relative',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    fontSize: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '600',
  },
  statusOld: {
    backgroundColor: '#E8F5E9',
    color: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: '#FFEBEE',
    color: '#F44336',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  chevron: {
    position: 'absolute',
    right: 10,
    top: '50%',
    marginTop: 10,
  },
  emptyContainer: {
    marginTop: 100,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 10,
    color: '#AAA',
    fontSize: 16,
  },
  footerText: {
    textAlign: 'center',
    color: '#CCC',
    marginVertical: 20,
    fontSize: 12,
  }
});
