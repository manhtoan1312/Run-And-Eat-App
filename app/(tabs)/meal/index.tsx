import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { mealApi } from '../../../api/meal';
import { MealLog, MealType } from '../../../types/meal';
import { Ionicons } from '@expo/vector-icons';

interface MealSection {
  title: string;
  totalCalories: number;
  data: MealLog[];
}

const MEAL_TYPE_LABELS: Record<MealType, { label: string; color: string; icon: string }> = {
  [MealType.BREAKFAST]: { label: 'Sáng', color: '#4CAF50', icon: 'sunny-outline' },
  [MealType.LUNCH]: { label: 'Trưa', color: '#FF9800', icon: 'restaurant-outline' },
  [MealType.DINNER]: { label: 'Tối', color: '#3F51B5', icon: 'moon-outline' },
  [MealType.SNACK]: { label: 'Phụ', color: '#9C27B0', icon: 'fast-food-outline' },
};

export default function MealListScreen() {
  const router = useRouter();
  const [logs, setLogs] = useState<MealLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async (showLoading = true) => {
    console.log('Fetching meal logs...');
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await mealApi.getAll();
      console.log('Fetched meal logs count:', data.length);
      console.log('First log (if any):', data[0]);
      setLogs(data);
    } catch (err: any) {
      console.error('Fetch meal logs error:', err);
      setError('Không thể tải nhật ký ăn uống.');
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

  const sections = useMemo(() => {
    console.log('Transforming logs to sections, count:', logs.length);
    const grouped: Record<string, { total: number; logs: MealLog[] }> = {};

    logs.forEach((log) => {
      const dateKey = new Date(log.date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = { total: 0, logs: [] };
      }
      grouped[dateKey].logs.push(log);
      grouped[dateKey].total += log.calories * log.quantity;
    });

    const result = Object.keys(grouped).map((key) => ({
      title: key,
      totalCalories: grouped[key].total,
      data: grouped[key].logs,
    }));
    console.log('Transformed sections count:', result.length);
    return result;
  }, [logs]);

  const renderItem = ({ item }: { item: MealLog }) => {
    const typeInfo = MEAL_TYPE_LABELS[item.mealType as MealType] || MEAL_TYPE_LABELS[MealType.SNACK];
    return (
      <TouchableOpacity
        style={styles.mealCard}
        onPress={() => router.push(`/(tabs)/meal/${item.id}` as any)}
      >
        <View style={[styles.typeBadge, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
          <Text style={[styles.typeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
        </View>
        <View style={styles.mainInfo}>
          <Text style={styles.foodName}>{item.foodName}</Text>
          {item.note && <Text style={styles.note} numberOfLines={1}>{item.note}</Text>}
        </View>
        <View style={styles.calInfo}>
          <Text style={styles.calValue}>{Math.round(item.calories * item.quantity)}</Text>
          <Text style={styles.calUnit}>kcal</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: MealSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <View style={styles.totalBadge}>
        <Text style={styles.totalLabel}>Tổng:</Text>
        <Text style={styles.totalValue}>{Math.round(section.totalCalories)} kcal</Text>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={80} color="#EEE" />
            <Text style={styles.emptyTitle}>Chưa có nhật ký ăn uống</Text>
            <Text style={styles.emptySubtitle}>Hãy ghi lại bữa ăn đầu tiên của bạn!</Text>
          </View>
        }
      />
      
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/meal/create')}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
    backgroundColor: '#F8F9FE',
    paddingVertical: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textTransform: 'capitalize',
  },
  totalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 12,
    color: '#4CAF50',
    marginRight: 4,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  mealCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  typeBadge: {
    width: 65,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeText: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  mainInfo: {
    marginLeft: 15,
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  note: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  calInfo: {
    alignItems: 'flex-end',
  },
  calValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  calUnit: {
    fontSize: 10,
    color: '#999',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    backgroundColor: '#4CAF50',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
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
});
