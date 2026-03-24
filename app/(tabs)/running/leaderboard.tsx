import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { runApi } from '../../../api/run';
import {
  LeaderboardPeriod,
  LeaderboardCategory,
  LeaderboardEntry,
  PERIOD_OPTIONS,
  CATEGORY_OPTIONS,
} from '../../../constants/leaderboard';
import Podium from '../../../components/run/leaderboard/Podium';
import LeaderboardRow from '../../../components/run/leaderboard/LeaderboardRow';

export default function LeaderboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardPeriod>(LeaderboardPeriod.WEEKLY);
  const [category, setCategory] = useState<LeaderboardCategory>(LeaderboardCategory.DISTANCE);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [list, me] = await Promise.all([
        runApi.getLeaderboard(period, category, 50),
        runApi.getMyRank(period, category),
      ]);
      setLeaderboard(list || []);
      setMyRank(me);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, category]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatValue = useCallback((value: number, cat: LeaderboardCategory) => {
    if (!value) return '0';
    switch (cat) {
      case LeaderboardCategory.DISTANCE:
        return (value / 1000).toFixed(2) + ' km';
      case LeaderboardCategory.RUNS:
        return value + ' buổi';
      case LeaderboardCategory.CALORIES:
        return Math.round(value) + ' kcal';
      case LeaderboardCategory.DURATION:
        const h = Math.floor(value / 3600);
        const m = Math.floor((value % 3600) / 60);
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
      default:
        return value.toString();
    }
  }, []);

  const top3 = useMemo(() => leaderboard.slice(0, 3), [leaderboard]);
  const rest = useMemo(() => leaderboard.slice(3), [leaderboard]);

  const isMyRankFloating = useMemo(() => {
    if (!myRank) return false;
    // Show floating if not in top 3 and not in current list view (if list is long)
    // Or simply if rank > 3
    return parseInt(myRank.rank) > 3;
  }, [myRank]);

  const renderHeader = () => (
    <View style={styles.listHeader}>
      <Podium 
        top3={top3} 
        category={category} 
        formatValue={formatValue} 
      />
      {rest.length > 0 && (
        <Text style={styles.sectionTitle}>Bảng xếp hạng</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Bảng xếp hạng</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Filters Section */}
      <View style={styles.filtersContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          contentContainerStyle={styles.periodScroll}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.periodTab, period === opt.value && styles.activePeriodTab]}
              onPress={() => setPeriod(opt.value as LeaderboardPeriod)}
            >
              <Text style={[styles.periodTabText, period === opt.value && styles.activePeriodTabText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.categoryRow}>
          {CATEGORY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.categoryBtn, category === opt.value && styles.activeCategoryBtn]}
              onPress={() => setCategory(opt.value as LeaderboardCategory)}
            >
              <Ionicons 
                name={opt.icon as any} 
                size={18} 
                color={category === opt.value ? '#fff' : '#666'} 
              />
              <Text style={[styles.categoryText, category === opt.value && styles.activeCategoryText]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#FF6F61" />
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      ) : (
        <FlatList
          data={rest}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <LeaderboardRow 
              member={item} 
              category={category} 
              isMe={myRank?.userId === item.userId}
              formatValue={formatValue}
            />
          )}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF6F61" />
          }
          ListEmptyComponent={
            top3.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="trophy-outline" size={80} color="#DDD" />
                <Text style={styles.emptyText}>Chưa có dữ liệu cho giai đoạn này</Text>
              </View>
            ) : null
          }
        />
      )}

      {/* My Rank Floating Card */}
      {isMyRankFloating && myRank && (
        <View style={styles.floatingRank}>
           <Text style={styles.floatingLabel}>Hạng của bạn</Text>
           <LeaderboardRow 
              member={myRank} 
              category={category} 
              isMe={true} 
              formatValue={formatValue}
           />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#333',
    letterSpacing: -0.5,
  },
  filtersContainer: {
    backgroundColor: '#fff',
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 5,
  },
  periodScroll: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  periodTab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#F0F2F5',
  },
  activePeriodTab: {
    backgroundColor: '#FF6F61',
  },
  periodTabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '700',
  },
  activePeriodTabText: {
    color: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 15,
    backgroundColor: '#F0F2F5',
    gap: 8,
  },
  activeCategoryBtn: {
    backgroundColor: '#333',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '800',
  },
  activeCategoryText: {
    color: '#fff',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 15,
    color: '#666',
    fontWeight: '600',
  },
  listContent: {
    padding: 20,
    paddingBottom: 140, // More padding for floating card
  },
  listHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#333',
    marginTop: 20,
    marginBottom: 15,
  },
  emptyContainer: {
    marginTop: 60,
    alignItems: 'center',
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 15,
    color: '#666',
    fontWeight: '600',
  },
  floatingRank: {
    position: 'absolute',
    bottom: 25,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  floatingLabel: {
    backgroundColor: '#FF6F61',
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    marginBottom: -10,
    zIndex: 11,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  }
});
