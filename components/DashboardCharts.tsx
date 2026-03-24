import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Polyline, Circle, G, Line } from 'react-native-svg';

interface DashboardChartsProps {
  data: Array<{
    label: string;
    caloriesIn: number;
    distance: number;
  }>;
}

const screenWidth = Dimensions.get('window').width - 40;
const chartHeight = 150;
const padding = 30;

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ data }) => {
  if (!data || data.length === 0) return null;

  // Max values for scaling
  const maxCalories = Math.max(...data.map((d) => d.caloriesIn), 1000);
  const maxDistance = Math.max(...data.map((d) => d.distance), 5);

  const barWidth = (screenWidth - padding * 2) / data.length - 10;

  return (
    <View style={styles.container}>
      {/* Calories Bar Chart */}
      <Text style={styles.chartTitle}>Calo nạp (7 ngày)</Text>
      <View style={styles.chartCard}>
        <Svg width={screenWidth - 30} height={chartHeight + 20}>
          {data.map((d, i) => {
            const h = (d.caloriesIn / maxCalories) * chartHeight;
            const x = padding + i * ((screenWidth - padding * 2) / data.length);
            return (
              <G key={`cal-${i}`}>
                <Rect
                  x={x}
                  y={chartHeight - h}
                  width={barWidth}
                  height={h}
                  fill="#4CAF50"
                  rx={4}
                />
                <Text
                  key={`lbl-${i}`}
                  style={[styles.axisLabel, { position: 'absolute', left: x, top: chartHeight + 5 }]}
                >
                  {d.label}
                </Text>
              </G>
            );
          })}
          {/* Y Axis Labels (Simple) */}
          <Line x1={padding} y1={0} x2={padding} y2={chartHeight} stroke="#EEE" />
          <Line x1={padding} y1={chartHeight} x2={screenWidth - padding} y2={chartHeight} stroke="#EEE" />
        </Svg>
        <View style={styles.labelRow}>
          {data.map((d, i) => (
            <Text key={i} style={styles.axisLabel}>{d.label}</Text>
          ))}
        </View>
      </View>

      {/* Distance Line Chart */}
      <Text style={[styles.chartTitle, { marginTop: 24 }]}>Quãng đường (7 ngày)</Text>
      <View style={styles.chartCard}>
        <Svg width={screenWidth - 30} height={chartHeight + 20}>
          {/* Grid lines */}
          <Line x1={padding} y1={0} x2={padding} y2={chartHeight} stroke="#EEE" />
          <Line x1={padding} y1={chartHeight} x2={screenWidth - padding} y2={chartHeight} stroke="#EEE" />
          
          {/* Line Path */}
          <Polyline
            points={data
              .map((d, i) => {
                const x = padding + i * ((screenWidth - padding * 2) / (data.length - 1));
                const y = chartHeight - (d.distance / maxDistance) * chartHeight;
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3F51B5"
            strokeWidth="3"
          />
          
          {/* Data Points */}
          {data.map((d, i) => {
            const x = padding + i * ((screenWidth - padding * 2) / (data.length - 1));
            const y = chartHeight - (d.distance / maxDistance) * chartHeight;
            return (
              <Circle key={`p-${i}`} cx={x} cy={y} r="4" fill="#3F51B5" />
            );
          })}
        </Svg>
        <View style={styles.labelRow}>
          {data.map((d, i) => (
            <Text key={i} style={styles.axisLabel}>{d.label}</Text>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    marginLeft: 5,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 15,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  axisLabel: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: padding - 10,
    marginTop: 5,
  },
});
