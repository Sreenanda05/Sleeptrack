// screens/StatsScreen.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { VictoryPie } from 'victory-native';
import { fetchSleepRange } from '../services/CloudService';

const COLORS = ['#E24A4A','#ECC93F','#8A4AE2','#4A8EE2'];
const PHASES: Array<'awake'|'light'|'rem'|'deep'> = ['awake','light','rem','deep'];
const RANGES: Array<'daily'|'weekly'|'monthly'> = ['daily','weekly','monthly'];

export default function StatsScreen({ route, navigation }) {
  const { range } = route.params as { range: 'daily'|'weekly'|'monthly' };
  const [stats, setStats] = useState<{ [k: string]: number } | null>(null);

  useEffect(() => {
    const end = new Date(), start = new Date();
    if (range === 'weekly')      start.setDate(end.getDate() - 6);
    else if (range === 'monthly') start.setMonth(end.getMonth() - 1);
    else                          start.setHours(0,0,0,0);

    const startKey = start.toISOString().slice(0,10);
    const endKey   = end.toISOString().slice(0,10);

    fetchSleepRange(startKey, endKey)
      .then(entries => {
        const cnt = { awake: 0, light: 0, rem: 0, deep: 0 };
        entries.forEach(e => cnt[e.phase] = (cnt[e.phase]||0) + 1);
        const total = entries.length || 1;
        setStats({
          awake: Math.round(cnt.awake  / total * 100),
          light: Math.round(cnt.light  / total * 100),
          rem:   Math.round(cnt.rem    / total * 100),
          deep:  Math.round(cnt.deep   / total * 100),
        });
      })
      .catch(err => {
        console.error('Failed to load sleep stats', err);
        setStats({ awake:0, light:0, rem:0, deep:0 });
      });
  }, [range]);

  if (!stats) {
    return (
      <View style={styles.center}>
        <Text>Loading…</Text>
      </View>
    );
  }

  const data = PHASES.map((p,i) => ({ x: p, y: stats[p] }));
  const tip =
    stats.awake > 30   ? 'Try winding down earlier.'
  : stats.deep < 20    ? 'Darken your room more.'
  :                      'Great job!';

  return (
    <View style={styles.container}>
      {/* ——— Range selector segmented control ——— */}
      <View style={styles.rangeRow}>
        {RANGES.map(r => (
          <TouchableOpacity
            key={r}
            onPress={() => navigation.replace('Stats', { range: r })}
            style={[
              styles.rangeTab,
              range === r && styles.rangeTabActive
            ]}
          >
            <Text
              style={[
                styles.rangeText,
                range === r && styles.rangeTextActive
              ]}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ——— Donut chart ——— */}
      <VictoryPie
        data={data}
        width={300} height={300}
        innerRadius={80} padAngle={2}
        colorScale={COLORS}
        labels={({ datum }) => `${datum.x}\n${datum.y}%`}
        labelRadius={({ radius }) => radius - 20}
        style={{
          labels: {
            fill: '#333',
            fontSize: 14,
            textAlign: 'center',
          }
        }}
      />

      {/* ——— Legend ——— */}
      <View style={styles.legendRow}>
        {PHASES.map((p,i) => (
          <View key={p} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS[i] }]} />
            <Text style={styles.legendLabel}>
              {p.charAt(0).toUpperCase() + p.slice(1)} {stats[p]}%
            </Text>
          </View>
        ))}
      </View>

      {/* ——— Tip ——— */}
      <Text style={styles.tip}>{tip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff'
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  rangeRow: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc'
  },
  rangeTab: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7'
  },
  rangeTabActive: {
    backgroundColor: '#4A8EE2'
  },
  rangeText: {
    color: '#333',
    fontWeight: '500'
  },
  rangeTextActive: {
    color: '#fff'
  },
  legendRow: {
    flexWrap: 'wrap',
    flexDirection: 'row',
    marginTop: 16,
    justifyContent: 'center'
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 6
  },
  legendDot: {
    width: 12, height: 12, borderRadius: 6, marginRight: 4
  },
  legendLabel: {
    fontSize: 14,
    color: '#333'
  },
  tip: {
    marginTop: 12,
    color: '#555',
    fontStyle: 'italic'
  }
});
