import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { mealApi } from '../../../api/meal';
import { MealType } from '../../../types/meal';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const mealSchema = z.object({
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  mealType: z.string(),
  foodName: z.string().min(1, 'Vui lòng nhập tên món ăn'),
  calories: z.coerce.number().min(0, 'Calo không được âm'),
  protein: z.coerce.number().min(0).optional(),
  carbs: z.coerce.number().min(0).optional(),
  fat: z.coerce.number().min(0).optional(),
  quantity: z.coerce.number().min(0.1),
  note: z.string().default(''),
});

type FormData = z.infer<typeof mealSchema>;

const MEAL_TYPES = [
  { value: MealType.BREAKFAST, label: 'Bữa sáng', icon: 'sunny-outline' },
  { value: MealType.LUNCH, label: 'Bữa trưa', icon: 'restaurant-outline' },
  { value: MealType.DINNER, label: 'Bữa tối', icon: 'moon-outline' },
  { value: MealType.SNACK, label: 'Bữa phụ', icon: 'fast-food-outline' },
];

export default function EditMealLogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(mealSchema),
  });

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    try {
      const log = await mealApi.getById(id as string);
      reset({
        date: new Date(log.date).toISOString().split('T')[0],
        mealType: log.mealType,
        foodName: log.foodName,
        calories: log.calories,
        protein: log.protein,
        carbs: log.carbs,
        fat: log.fat,
        quantity: log.quantity,
        note: log.note || '',
      });
    } catch (error) {
      console.error('Fetch meal log error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin bữa ăn');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      await mealApi.update(id as string, data);
      Alert.alert('Thành công', 'Đã cập nhật bữa ăn');
      router.back();
    } catch (error: any) {
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('Xóa bữa ăn', 'Bạn có chắc chắn muốn xóa không?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        setDeleting(true);
        try {
          await mealApi.delete(id as string);
          router.back();
        } catch (error) {
          Alert.alert('Lỗi', 'Không thể xóa');
        } finally {
          setDeleting(false);
        }
      }}
    ]);
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4CAF50" /></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết bữa ăn</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete} disabled={deleting}>
          {deleting ? <ActivityIndicator size="small" color="#EA4335" /> : <Ionicons name="trash-outline" size={24} color="#EA4335" />}
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày</Text>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity style={styles.input} onPress={() => setShowDatePicker(true)}>
                  <Text>{value ? new Date(value).toLocaleDateString('vi-VN') : 'Chọn ngày'}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#777" />
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(e, d) => { setShowDatePicker(false); if(d) onChange(d.toISOString().split('T')[0]); }}
                  />
                )}
              </>
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bữa ăn</Text>
          <View style={styles.typeGrid}>
            <Controller
              control={control}
              name="mealType"
              render={({ field: { onChange, value } }) => (
                <>
                  {MEAL_TYPES.map((type) => {
                    const isSelected = value === type.value;
                    return (
                      <TouchableOpacity
                        key={type.value}
                        style={[styles.typeButton, isSelected && styles.typeButtonActive]}
                        onPress={() => onChange(type.value)}
                      >
                        <Ionicons name={type.icon as any} size={20} color={isSelected ? '#FFF' : '#777'} />
                        <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextActive]}>{type.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </>
              )}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Tên món ăn</Text>
          <Controller
            control={control}
            name="foodName"
            render={({ field: { onChange, value } }) => (
              <TextInput style={styles.input} onChangeText={onChange} value={value} />
            )}
          />
        </View>

        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Calo (kcal)</Text>
            <Controller
              control={control}
              name="calories"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value?.toString()} keyboardType="numeric" />
              )}
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.label}>Số lượng</Text>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, value } }) => (
                <TextInput style={styles.input} onChangeText={onChange} value={value?.toString()} keyboardType="numeric" />
              )}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving || deleting}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Cập nhật</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, justifyContent: 'space-between' },
  backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  deleteButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 3 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  input: { backgroundColor: '#F7F9FC', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E1E5EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  row: { flexDirection: 'row', gap: 16 },
  halfInput: { flex: 1 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: { flex: 1, minWidth: '45%', flexDirection: 'row', alignItems: 'center', backgroundColor: '#F7F9FC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E1E5EB' },
  typeButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeButtonText: { fontSize: 13, marginLeft: 8, color: '#555' },
  typeButtonTextActive: { color: '#FFF', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#4CAF50', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
});
