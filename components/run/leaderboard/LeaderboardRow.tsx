import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry, LeaderboardCategory } from '../../../constants/leaderboard';

interface LeaderboardRowProps {
  member: LeaderboardEntry;
  category: LeaderboardCategory;
  isMe: boolean;
  formatValue: (value: number, cat: LeaderboardCategory) => string;
}

export default function LeaderboardRow({ member, category, isMe, formatValue }: LeaderboardRowProps) {
  const rank = parseInt(member.rank);
  const isTop3 = rank <= 3;
  const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <View style={[styles.container, isMe && styles.meContainer]}>
      <View style={styles.left}>
        <View style={styles.rankContainer}>
          {isTop3 ? (
            <Ionicons name="trophy" size={20} color={rankColors[rank - 1]} />
          ) : (
            <Text style={styles.rankText}>{member.rank}</Text>
          )}
        </View>
        <Image
          source={{ uri: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random` }}
          style={styles.avatar}
        />
        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={1}>{member.fullName}</Text>
          {isMe && <View style={styles.meBadge}><Text style={styles.meText}>BẠN</Text></View>}
        </View>
      </View>
      
      <View style={styles.right}>
        <Text style={[styles.score, isMe && styles.meScore]}>
          {formatValue(member[category as keyof LeaderboardEntry] as number, category)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F0F2F5',
  },
  meContainer: {
    backgroundColor: '#333',
    borderColor: '#444',
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 8,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#999',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#eee',
    marginRight: 12,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginRight: 8,
  },
  meBadge: {
    backgroundColor: '#FF6F61',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  meText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
  },
  right: {
    alignItems: 'flex-end',
  },
  score: {
    fontSize: 15,
    fontWeight: '800',
    color: '#333',
  },
  meScore: {
    color: '#FF6F61',
  },
});
