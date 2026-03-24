import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { historyApi } from '../../api/history';
import { HistoryDayGroup, HistoryItem } from '../../types/history';
import { Ionicons } from '@expo/vector-icons';
import { format, subDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';

const FilterChip = ({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) => (
  <TouchableOpacity
    style={[styles.chip, active && styles.chipActive]}
    onPress={onPress}
  >
    <Text style={[styles.chipText, active && styles.chipActiveText]}>{label}</Text>
  </TouchableOpacity>
);

export default function HistoryScreen() {
  const router = useRouter();
  const [groups, setGroups] = useState<HistoryDayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('all');

  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const fetchHistory = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const data = await historyApi.getHistory({ 
        type: filterType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      setGroups(data);
    } catch (err) {
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filterType, startDate, endDate]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(false);
  };

  const renderSectionHeader = ({ section: { date, summary } }: { section: HistoryDayGroup }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.dateRow}>
        <Text style={styles.dateText}>
          {format(new Date(date), 'EEEE, d MMMM', { locale: vi })}
        </Text>
      </View>
      <View style={styles.summaryRow}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.caloriesIn}</Text>
          <Text style={styles.summaryLabel}>Nạp (kcal)</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.caloriesOut}</Text>
          <Text style={styles.summaryLabel}>Tiêu (kcal)</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: summary.netCalories > 0 ? '#FF5722' : '#4CAF50' }]}>
            {summary.netCalories > 0 ? `+${summary.netCalories}` : summary.netCalories}
          </Text>
          <Text style={styles.summaryLabel}>Net</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{summary.distance}</Text>
          <Text style={styles.summaryLabel}>Chạy (km)</Text>
        </View>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: HistoryItem }) => {
    const isMeal = item.type === 'MEAL';
    const onPress = () => {
      if (isMeal) {
        router.push(`/(tabs)/meal/${item.id}`);
      } else {
        router.push(`/(tabs)/running/${item.id}`);
      }
    };

    return (
      <TouchableOpacity style={styles.itemCard} onPress={onPress}>
        <View style={[styles.itemIcon, { backgroundColor: isMeal ? '#4CAF5015' : '#3F51B515' }]}>
          <Ionicons 
            name={isMeal ? 'restaurant' : 'walk'} 
            size={20} 
            color={isMeal ? '#4CAF50' : '#3F51B5'} 
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={styles.itemTitle}>{isMeal ? item.foodName : `Chạy bộ ${item.distanceKm} km`}</Text>
          <Text style={styles.itemSubtitle}>
            {format(new Date(item.date), 'HH:mm')} • {isMeal ? `${item.mealType} • ${item.calories! * item.quantity!} kcal` : `${item.durationMinutes} phút • Pace: ${item.pace}`}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color="#DDD" />
      </TouchableOpacity>
    );
  };

  const onDateChange = (event: any, selectedDate?: Date, isStart = true) => {
    if (isStart) {
      setShowStartPicker(false);
      if (selectedDate) setStartDate(selectedDate);
    } else {
      setShowEndPicker(false);
      if (selectedDate) setEndDate(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lịch sử hoạt động</Text>
        
        <View style={styles.dateFilterRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateBtnLabel}>Từ:</Text>
            <Text style={styles.dateBtnValue}>{format(startDate, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={16} color="#999" style={{ marginHorizontal: 10 }} />
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateBtnLabel}>Đến:</Text>
            <Text style={styles.dateBtnValue}>{format(endDate, 'dd/MM/yyyy')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <FilterChip label="Tất cả" active={filterType === 'all'} onPress={() => setFilterType('all')} />
          <FilterChip label="Chạy bộ" active={filterType === 'running'} onPress={() => setFilterType('running')} />
          <FilterChip label="Ăn uống" active={filterType === 'meals'} onPress={() => setFilterType('meals')} />
        </View>
      </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={(e, d) => onDateChange(e, d, true)}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={(e, d) => onDateChange(e, d, false)}
        />
      )}

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : (
        <SectionList
          sections={groups}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled={true}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4CAF50" />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={64} color="#EEE" />
              <Text style={styles.emptyText}>Chưa có hoạt động nào trong khoảng thời gian này.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: '#F7F7F7',
    padding: 10,
    borderRadius: 12,
  },
  dateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateBtnLabel: {
    fontSize: 12,
    color: '#888',
    marginRight: 8,
  },
  dateBtnValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#4CAF50',
  },
  chipText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  chipActiveText: {
    color: '#FFF',
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    backgroundColor: '#F8F9FE',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  dateRow: {
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    textTransform: 'capitalize',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#BBB',
    marginTop: 16,
    fontSize: 15,
  },
});
