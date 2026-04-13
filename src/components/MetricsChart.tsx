import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { Box, Typography } from '@mui/material';
import type { SimMetrics } from '../simulation/types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Props {
  metrics: SimMetrics[];
}

const METRIC_COLORS = ['#60a5fa', '#34d399', '#f472b6'];

export default function MetricsChart({ metrics }: Props) {
  if (metrics.length === 0) return null;

  const labels = metrics.map(m =>
    m.strategy
      .replace('window-middle-aisle', 'Win→Mid→Aisle')
      .replace('outside-in', 'Outside-In')
      .replace('back-to-front', 'Back→Front')
      .replace('front-to-back', 'Front→Back')
      .replace('random', 'Random')
      .replace('custom', 'Custom'),
  );

  const datasets = [
    {
      label: 'Total Time (ticks)',
      data: metrics.map(m => m.totalTicks),
      backgroundColor: METRIC_COLORS[0],
    },
    {
      label: 'Aisle Block Events',
      data: metrics.map(m => m.aisleBlockEvents),
      backgroundColor: METRIC_COLORS[1],
    },
    {
      label: 'Avg Wait (ticks)',
      data: metrics.map(m => m.avgWaitTicks),
      backgroundColor: METRIC_COLORS[2],
    },
  ];

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8' } },
      title: { display: false },
    },
    scales: {
      x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
      y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
    },
  };

  return (
    <Box sx={{ height: '100%' }}>
      <Typography variant="overline" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        Strategy Comparison
      </Typography>
      <Box sx={{ height: 'calc(100% - 28px)' }}>
        <Bar data={{ labels, datasets }} options={chartOptions} />
      </Box>
    </Box>
  );
}
