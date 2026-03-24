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
  Modal,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { runningApi } from '../../../api/running';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const runningSchema = z.object({
  date: z.string().min(1, 'Vui lòng chọn ngày'),
  distanceKm: z.coerce.number().min(0.01, 'Quãng đường phải lớn hơn 0'),
  durationMinutes: z.coerce.number().int().min(1, 'Thời gian phải lớn hơn 0'),
  caloriesBurned: z.coerce.number().min(0, 'Calo không được âm'),
  note: z.string().default(''),
});

type FormData = {
  date: string;
  distanceKm: number;
  durationMinutes: number;
  caloriesBurned: number;
  note: string;
};

export default function EditRunningLogScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(runningSchema),
  });

  useEffect(() => {
    fetchLog();
  }, [id]);

  const fetchLog = async () => {
    console.log('Fetching log details for ID:', id);
    try {
      const log = await runningApi.getById(id as string);
      console.log('Fetched log:', log);
      reset({
        date: new Date(log.date).toISOString().split('T')[0],
        distanceKm: log.distanceKm,
        durationMinutes: log.durationMinutes,
        caloriesBurned: log.caloriesBurned,
        note: log.note || '',
      });
    } catch (error) {
      console.error('Fetch log error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin buổi chạy');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    console.log('Updating log:', id, data);
    setSaving(true);
    try {
      await runningApi.update(id as string, data);
      Alert.alert('Thành công', 'Đã cập nhật buổi chạy bộ');
      router.back();
    } catch (error: any) {
      console.error('Update running log error:', error);
      Alert.alert('Lỗi', error.response?.data?.message || 'Không thể cập nhật bản ghi');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa buổi chạy',
      'Bạn có chắc chắn muốn xóa buổi chạy này không?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await runningApi.delete(id as string);
              Alert.alert('Thành công', 'Đã xóa buổi chạy');
              router.back();
            } catch (error) {
              console.error('Delete log error:', error);
              Alert.alert('Lỗi', 'Không thể xóa bản ghi');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6F61" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Chi tiết buổi chạy</Text>
        <TouchableOpacity 
          style={styles.deleteHeaderButton} 
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#EA4335" />
          ) : (
            <Ionicons name="trash-outline" size={24} color="#EA4335" />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày chạy</Text>
          <Controller
            control={control}
            name="date"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: value ? '#333' : '#999' }}>
                    {value ? new Date(value).toLocaleDateString('vi-VN') : 'Chọn ngày'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color="#777" />
                </TouchableOpacity>

                {showDatePicker && (
                  Platform.OS === 'ios' ? (
                    <Modal
                      transparent={true}
                      animationType="slide"
                      visible={showDatePicker}
                      onRequestClose={() => setShowDatePicker(false)}
                    >
                      <View style={styles.modalOverlay}>
                        <View style={styles.modalContainer}>
                          <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                              <Text style={styles.modalDoneText}>Xong</Text>
                            </TouchableOpacity>
                          </View>
                          <DateTimePicker
                            value={value ? new Date(value) : new Date()}
                            mode="date"
                            display="spinner"
                            onChange={(event, selectedDate) => {
                              if (selectedDate) {
                                onChange(selectedDate.toISOString().split('T')[0]);
                              }
                            }}
                          />
                        </View>
                      </View>
                    </Modal>
                  ) : (
                    <DateTimePicker
                      value={value ? new Date(value) : new Date()}
                      mode="date"
                      display="spinner"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(false);
                        if (selectedDate && event.type === 'set') {
                          onChange(selectedDate.toISOString().split('T')[0]);
                        }
                      }}
                    />
                  )
                )}
              </>
            )}
          />
          {errors.date && <Text style={styles.error}>{errors.date.message}</Text>}
        </View>

        <View style={styles.row}>
          <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
            <Text style={styles.label}>Quãng đường (km)</Text>
            <Controller
              control={control}
              name="distanceKm"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="5.0"
                />
              )}
            />
            {errors.distanceKm && <Text style={styles.error}>{errors.distanceKm.message}</Text>}
          </View>

          <View style={[styles.formGroup, { flex: 1, marginLeft: 10 }]}>
            <Text style={styles.label}>Thời gian (phút)</Text>
            <Controller
              control={control}
              name="durationMinutes"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="30"
                />
              )}
            />
            {errors.durationMinutes && <Text style={styles.error}>{errors.durationMinutes.message}</Text>}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Calo tiêu thụ</Text>
          <Controller
            control={control}
            name="caloriesBurned"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value?.toString()}
                keyboardType="numeric"
                placeholder="400"
              />
            )}
          />
          {errors.caloriesBurned && <Text style={styles.error}>{errors.caloriesBurned.message}</Text>}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ghi chú</Text>
          <Controller
            control={control}
            name="note"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={[styles.input, styles.textArea]}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                multiline
                numberOfLines={4}
                placeholder="Ghi chú thêm về buổi chạy..."
              />
            )}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, (saving || deleting) && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving || deleting}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Cập nhật bản ghi</Text>
          )}
        </TouchableOpacity>
      </View>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deleteHeaderButton: {
    padding: 8,
    backgroundColor: '#FFF',
    borderRadius: 12,
    marginLeft: 'auto',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  formGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F7F9FC',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E5EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  error: {
    color: '#EA4335',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    backgroundColor: 'white',
    paddingBottom: 40,
  },
  modalHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-end',
  },
  modalDoneText: {
    color: '#FF6F61',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
