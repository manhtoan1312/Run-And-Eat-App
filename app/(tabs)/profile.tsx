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
  Modal,
  Platform,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import DateTimePicker from '@react-native-community/datetimepicker';
import { profileApi } from '../../api/profile';
import { Profile } from '../../types/profile';
import { useAuthStore } from '../../store/useAuthStore';

const profileSchema = z.object({
  fullName: z.string().min(1, 'Họ tên không được để trống'),
  gender: z.string().min(1, 'Vui lòng nhập giới tính'),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không đúng định dạng YYYY-MM-DD'),
  heightCm: z.coerce.number().min(0.1, 'Chiều cao phải lớn hơn 0'),
  weightKg: z.coerce.number().min(0.1, 'Cân nặng phải lớn hơn 0'),
});

type FormData = {
  fullName: string;
  gender: string;
  birthDate: string;
  heightCm: number;
  weightKg: number;
};

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const { logout } = useAuthStore();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      reset({
        fullName: data.fullName,
        gender: data.gender || '',
        birthDate: data.birthDate || '',
        heightCm: data.heightCm || 0,
        weightKg: data.weightKg || 0,
      });
    } catch (error) {
      console.error('Fetch profile error:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cá nhân');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      // Clean data before sending
      const cleanData = {
        ...data,
        birthDate: data.birthDate === '' ? undefined : data.birthDate,
      };
      const updatedProfile = await profileApi.updateProfile(cleanData);
      setProfile(updatedProfile);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân');
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Lỗi', 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Đăng xuất',
      'Bạn có chắc chắn muốn đăng xuất?',
      [
        { text: 'Hủy', style: 'cancel' },
        { text: 'Đăng xuất', style: 'destructive', onPress: async () => await logout() },
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
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{profile?.fullName?.substring(0, 1).toUpperCase() || 'U'}</Text>
        </View>
        <Text style={styles.headerName}>{profile?.fullName || 'Người dùng'}</Text>
        <Text style={styles.headerStatus}>Sẵn sàng luyện tập!</Text>
      </View>

      <View style={styles.bmiCard}>
        <View style={styles.bmiSection}>
          <Text style={styles.bmiLabel}>BMI</Text>
          <Text style={styles.bmiValue}>{profile?.bmi?.toFixed(1) || '--'}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.bmiSection}>
          <Text style={styles.bmiLabel}>Phân loại</Text>
          <Text style={[styles.bmiCategory, { color: getCategoryColor(profile?.bmiCategory) }]}>
            {profile?.bmiCategory || 'Cần dữ liệu'}
          </Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
        
        <View style={styles.formGroup}>
          <Text style={styles.label}>Họ và tên</Text>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value}
                placeholder="Nhập họ tên"
              />
            )}
          />
          {errors.fullName && <Text style={styles.error}>{errors.fullName.message}</Text>}
        </View>

        <View style={styles.row}>
          <View style={styles.col}>
            <Text style={styles.label}>Chiều cao (cm)</Text>
            <Controller
              control={control}
              name="heightCm"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="170"
                />
              )}
            />
            {errors.heightCm && <Text style={styles.error}>{errors.heightCm.message}</Text>}
          </View>

          <View style={styles.col}>
            <Text style={styles.label}>Cân nặng (kg)</Text>
            <Controller
              control={control}
              name="weightKg"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value?.toString()}
                  keyboardType="numeric"
                  placeholder="60"
                />
              )}
            />
            {errors.weightKg && <Text style={styles.error}>{errors.weightKg.message}</Text>}
          </View>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Giới tính</Text>
          <Controller
            control={control}
            name="gender"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextInput
                style={styles.input}
                onBlur={onBlur}
                onChangeText={onChange}
                value={value || ''}
                placeholder="Nam / Nữ"
              />
            )}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Ngày sinh</Text>
          <Controller
            control={control}
            name="birthDate"
            render={({ field: { onChange, value } }) => (
              <>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={{ color: value ? '#333' : '#999' }}>
                    {value ? new Date(value).toLocaleDateString('vi-VN') : 'Chọn ngày sinh'}
                  </Text>
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
          {errors.birthDate && <Text style={styles.error}>{errors.birthDate.message}</Text>}
        </View>

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.buttonDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Cập nhật thông tin</Text>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getCategoryColor(category: string | undefined) {
  switch (category) {
    case 'Gầy': return '#4285F4';
    case 'Bình thường': return '#34A853';
    case 'Thừa cân': return '#FBBC05';
    case 'Béo phì': return '#EA4335';
    default: return '#777';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FE',
  },
  content: {
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    backgroundColor: '#FF6F61',
    paddingTop: 60,
    paddingBottom: 100,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerStatus: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  bmiCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -50,
    flexDirection: 'row',
    padding: 25,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  bmiSection: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#EEE',
  },
  bmiLabel: {
    fontSize: 14,
    color: '#777',
    marginBottom: 8,
  },
  bmiValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  bmiCategory: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 25,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 18,
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
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E5EB',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  col: {
    width: '48%',
  },
  saveButton: {
    backgroundColor: '#FF6F61',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FF6F61',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  error: {
    color: '#EA4335',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  logoutButton: {
    marginTop: 30,
    marginHorizontal: 40,
    padding: 15,
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  logoutButtonText: {
    color: '#777',
    fontSize: 15,
    fontWeight: 'bold',
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
