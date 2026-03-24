import React, { useState } from 'react';
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
  Modal,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'expo-router';
import { mealApi } from '../../../api/meal';
import { MealType } from '../../../types/meal';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const mealSchema = z.object({
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  mealType: z.string().min(1, 'Vui lòng chọn loại bữa ăn'),
  foodName: z.string().min(1, 'Vui lòng nhập tên món ăn'),
  calories: z.coerce.number().min(0, 'Calo không được âm'),
  protein: z.coerce.number().min(0, 'Protein không được âm').optional(),
  carbs: z.coerce.number().min(0, 'Carbs không được âm').optional(),
  fat: z.coerce.number().min(0, 'Fat không được âm').optional(),
  quantity: z.coerce.number().min(0.1, 'Số lượng phải lớn hơn 0'),
  note: z.string().default(''),
});

type FormData = z.infer<typeof mealSchema>;

const MEAL_TYPES = [
  { value: MealType.BREAKFAST, label: 'Bữa sáng', icon: 'sunny-outline' },
  { value: MealType.LUNCH, label: 'Bữa trưa', icon: 'restaurant-outline' },
  { value: MealType.DINNER, label: 'Bữa tối', icon: 'moon-outline' },
  { value: MealType.SNACK, label: 'Bữa phụ', icon: 'fast-food-outline' },
];

export default function CreateMealLogScreen() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(mealSchema),
    defaultValues: {
      date: new Date().toISOString().split('T')[0],
      mealType: MealType.BREAKFAST,
      quantity: 1,
      note: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    console.log('Submitting meal log:', data);
    setSaving(true);
    try {
      const resp = await mealApi.create(data);
      console.log('Meal create response:', resp);
      Alert.alert('Thành công', 'Đã lưu bữa ăn');
      router.back();
    } catch (error: any) {
      console.error('Create meal log error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể lưu bản ghi');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Thêm bữa ăn</Text>
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
                  <Text style={{ color: value ? '#333' : '#999' }}>
                    {value ? new Date(value).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#777" />
                </TouchableOpacity>

                {showDatePicker && (
                  <DateTimePicker
                    value={value ? new Date(value) : new Date()}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) onChange(selectedDate.toISOString().split('T')[0]);
                    }}
                  />
                )}
              </>
            )}
          />
          {errors.date && <Text style={styles.error}>{errors.date.message}</Text>}
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
                        <Ionicons 
                          name={type.icon as any} 
                          size={20} 
                          color={isSelected ? '#FFF' : '#777'} 
                        />
                        <Text style={[styles.typeButtonText, isSelected && styles.typeButtonTextActive]}>
                          {type.label}
                        </Text>
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
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Ví dụ: Phở Bò, Cơm Tấm..."
              />
            )}
          />
          {errors.foodName && <Text style={styles.error}>{errors.foodName.message}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>Calories (kcal)</Text>
            <Controller
              control={control}
              name="calories"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
              )}
            />
          </View>
          <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
            <Text style={styles.label}>Số lượng</Text>
            <Controller
              control={control}
              name="quantity"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="1"
                />
              )}
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.nutritionInput}>
            <Text style={styles.labelSmall}>Prot (g)</Text>
            <Controller
              control={control}
              name="protein"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.inputSmall}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
              )}
            />
          </View>
          <View style={styles.nutritionInput}>
            <Text style={styles.labelSmall}>Carb (g)</Text>
            <Controller
              control={control}
              name="carbs"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.inputSmall}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
              )}
            />
          </View>
          <View style={styles.nutritionInput}>
            <Text style={styles.labelSmall}>Fat (g)</Text>
            <Controller
              control={control}
              name="fat"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={styles.inputSmall}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="0"
                />
              )}
            />
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={3}
                placeholder="Thêm ghi chú..."
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveButtonText}>Lưu bữa ăn</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FE' },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, backgroundColor: '#FFF', borderRadius: 12, marginRight: 15, elevation: 2 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  formCard: { backgroundColor: '#FFF', borderRadius: 24, padding: 20, elevation: 3 },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 8 },
  labelSmall: { fontSize: 12, color: '#777', marginBottom: 4, textAlign: 'center' },
  input: {
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E1E5EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputSmall: {
    backgroundColor: '#F7F9FC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E1E5EB',
    textAlign: 'center',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  nutritionInput: { flex: 1, paddingHorizontal: 4 },
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F9FC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  typeButtonActive: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  typeButtonText: { fontSize: 13, marginLeft: 8, color: '#555' },
  typeButtonTextActive: { color: '#FFF', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#4CAF50', borderRadius: 16, padding: 16, alignItems: 'center', marginTop: 10 },
  disabled: { opacity: 0.7 },
  saveButtonText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  error: { color: '#EA4335', fontSize: 12, marginTop: 4 },
});
