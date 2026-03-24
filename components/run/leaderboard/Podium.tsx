import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LeaderboardEntry, LeaderboardCategory } from '../../../constants/leaderboard';

interface PodiumProps {
  top3: LeaderboardEntry[];
  category: LeaderboardCategory;
  formatValue: (value: number, cat: LeaderboardCategory) => string;
}

const { width } = Dimensions.get('window');
const PODIUM_WIDTH = width - 40;

export default function Podium({ top3, category, formatValue }: PodiumProps) {
  // Ensure we have 3 slots even if data is missing
  const second = top3[1];
  const first = top3[0];
  const third = top3[2];

  const renderMember = (member: LeaderboardEntry | undefined, rank: number) => {
    const isFirst = rank === 1;
    const rankColors = ['#FFD700', '#C0C0C0', '#CD7F32']; // Gold, Silver, Bronze
    const color = rankColors[rank - 1];
    const size = isFirst ? 80 : 65;
    const elevation = isFirst ? 20 : 0;

    if (!member) return <View style={[styles.memberContainer, { marginTop: elevation }]} />;

    return (
      <View style={[styles.memberContainer, { marginTop: elevation }]}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{ uri: member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=random` }}
            style={[styles.avatar, { width: size, height: size, borderRadius: size / 2, borderColor: color }]}
          />
          <View style={[styles.rankBadge, { backgroundColor: color }]}>
            <Text style={styles.rankText}>{rank}</Text>
          </View>
        </View>
        <Text style={styles.name} numberOfLines={1}>{member.fullName}</Text>
        <Text style={[styles.score, { color }]}>
          {formatValue(member[category as keyof LeaderboardEntry] as number, category)}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderMember(second, 2)}
      {renderMember(first, 1)}
      {renderMember(third, 3)}
      
      {/* Visual Podium Base */}
      <View style={styles.podiumBase}>
        <View style={[styles.step, styles.step2]} />
        <View style={[styles.step, styles.step1]} />
        <View style={[styles.step, styles.step3]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 30,
    width: PODIUM_WIDTH,
    alignSelf: 'center',
  },
  memberContainer: {
    alignItems: 'center',
    width: PODIUM_WIDTH / 3,
    zIndex: 2,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    borderWidth: 3,
    backgroundColor: '#eee',
  },
  rankBadge: {
    position: 'absolute',
    bottom: -5,
    right: -5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  rankText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
    paddingHorizontal: 4,
  },
  score: {
    fontSize: 12,
    fontWeight: '800',
  },
  podiumBase: {
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    width: '100%',
    height: 60,
    zIndex: 1,
  },
  step: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  step1: {
    flex: 1,
    height: 60,
    marginHorizontal: 5,
  },
  step2: {
    flex: 1,
    height: 40,
  },
  step3: {
    flex: 1,
    height: 30,
  },
});
