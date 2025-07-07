// components/SleepChart.tsx
import React from 'react';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

type SleepChartProps = {
  dataPoints: number[]; // e.g., [7, 6.5, 8, 5.5, 7, 6, 8]
};

export default function SleepChart({ dataPoints }: SleepChartProps) {
  const screenWidth = Dimensions.get('window').width;

  return (
    <LineChart
      data={{
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [
          {
            data: dataPoints,
          },
        ],
      }}
      width={screenWidth - 32} // add some margin
      height={220}
      yAxisSuffix="h"
      chartConfig={{
        backgroundColor: '#ffffff',
        backgroundGradientFrom: '#f0f0f0',
        backgroundGradientTo: '#ffffff',
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(75, 156, 211, ${opacity})`,
        labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        style: {
          borderRadius: 16,
        },
        propsForDots: {
          r: '5',
          strokeWidth: '2',
          stroke: '#4B9CD3',
        },
      }}
      bezier
      style={{
        marginVertical: 16,
        borderRadius: 16,
      }}
    />
  );
}
