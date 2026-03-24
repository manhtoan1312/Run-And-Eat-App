import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { dashboardApi } from '../../api/dashboard';
import { DashboardSummary } from '../../types/dashboard';
import { StatCard } from '../../components/StatCard';
import { DashboardCharts } from '../../components/DashboardCharts';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function DashboardScreen() {
  const router = useRouter();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const resp = await dashboardApi.getSummary();
      setData(resp);
    } catch (err) {
      console.error('Fetch dashboard error:', err);
      setError('Không thể tải dữ liệu tổng quan.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboard(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  const today = data?.today;
  const weekly = data?.weekly;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.welcome}>Chào mừng trở lại!</Text>
          <Text style={styles.title}>Tổng quan sức khỏe</Text>
        </View>
        <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
          <Ionicons name="person-circle-outline" size={40} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboard()}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : !data ? (
        <View style={styles.emptyContainer}>
          <Text>Chưa có dữ liệu</Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Hôm nay</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Calo nạp"
              value={today?.caloriesIn || 0}
              unit="kcal"
              icon="restaurant"
              color="#4CAF50"
              style={styles.halfCard}
              subtitle={`Mục tiêu: ${today?.goalCalories}`}
            />
            <StatCard
              title="Calo tiêu thụ"
              value={today?.caloriesOut || 0}
              unit="kcal"
              icon="flame"
              color="#FF5722"
              style={styles.halfCard}
            />
          </View>

          <StatCard
            title="Calo ròng (Net)"
            value={today?.netCalories || 0}
            unit="kcal"
            icon="stats-chart"
            color="#2196F3"
            subtitle={
              (today?.calorieDeviation || 0) > 0 
                ? `Vượt mục tiêu ${today?.calorieDeviation} kcal` 
                : `Còn lại ${Math.abs(today?.calorieDeviation || 0)} kcal`
            }
          />

          <StatCard
            title="Quãng đường"
            value={today?.totalDistance || 0}
            unit="km"
            icon="walk"
            color="#9C27B0"
          />

          {data.dailyHistory && <DashboardCharts data={data.dailyHistory} />}

          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>7 ngày gần nhất</Text>
          <View style={styles.statsRow}>
            <StatCard
              title="Tổng Calo nạp"
              value={weekly?.totalCaloriesIn || 0}
              unit="kcal"
              icon="cart"
              color="#4CAF50"
              style={styles.halfCard}
            />
            <StatCard
              title="Tổng quãng đường"
              value={weekly?.totalDistance || 0}
              unit="km"
              icon="map"
              color="#3F51B5"
              style={styles.halfCard}
              subtitle={`Mục tiêu tuần: ${weekly?.goalWeeklyDistance} km`}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  content: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  welcome: {
    fontSize: 14,
    color: '#777',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  profileButton: {
    padding: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  halfCard: {
    flex: 0.48,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
  errorText: {
    color: '#EA4335',
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 50,
  },
});
