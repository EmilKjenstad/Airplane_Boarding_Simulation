import { useEffect, useRef, useState } from 'react';
import { Box, Typography } from '@mui/material';
import ControlPanel from './components/ControlPanel';
import SimCanvas from './components/SimCanvas';
import MetricsChart from './components/MetricsChart';
import type { SimConfig, SimMetrics, StrategyName } from './simulation/types';
import { runHeadless } from './simulation/engine';
import { DEFAULT_SIM_CONFIG } from './simulation/config';

const ALL_STRATEGIES: StrategyName[] = [
  'back-to-front',
  'front-to-back',
  'random',
  'window-middle-aisle',
  'outside-in',
  'custom',
];

export default function App() {
  const [rows, setRows] = useState(DEFAULT_SIM_CONFIG.plane.rows);
  const [seatsPerSide, setSeatsPerSide] = useState(DEFAULT_SIM_CONFIG.plane.seatsPerSide);
  const [strategy, setStrategy] = useState<StrategyName>(DEFAULT_SIM_CONFIG.strategy);
  const [ticksPerSecond, setTicksPerSecond] = useState(DEFAULT_SIM_CONFIG.ticksPerSecond);
  const [stowMean, setStowMean] = useState(DEFAULT_SIM_CONFIG.stowMean);
  const [stowStdDev, setStowStdDev] = useState(DEFAULT_SIM_CONFIG.stowStdDev);
  const [customZoneOrder, setCustomZoneOrder] = useState<number[]>([2, 1, 0]);
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [allMetrics, setAllMetrics] = useState<SimMetrics[]>([]);
  const [currentMetric, setCurrentMetric] = useState<SimMetrics | null>(null);

  // Auto-reset when critical sim params change
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setRunning(false);
    setDone(false);
    setCurrentMetric(null);
    setResetKey(k => k + 1);
  }, [rows, seatsPerSide, strategy, stowMean, stowStdDev, customZoneOrder]);

  const simConfig: SimConfig = {
    plane: { rows, seatsPerSide },
    strategy,
    ticksPerSecond,
    stowMean,
    stowStdDev,
    customZoneOrder,
  };

  const handleRunPause = () => setRunning(r => !r);

  const handleReset = () => {
    setRunning(false);
    setDone(false);
    setCurrentMetric(null);
    setResetKey(k => k + 1);
  };

  const handleComplete = (metrics: SimMetrics) => {
    setRunning(false);
    setCurrentMetric(metrics);
  };

  const handleCompareAll = () => {
    const results = ALL_STRATEGIES.map(s =>
      runHeadless({ ...simConfig, strategy: s }),
    );
    setAllMetrics(results);
  };

  const showChart = allMetrics.length > 0 || currentMetric !== null;
  const chartMetrics = allMetrics.length > 0 ? allMetrics : currentMetric ? [currentMetric] : [];

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#0f172a', color: 'white', overflow: 'hidden' }}>
      {/* Left sidebar */}
      <Box
        sx={{
          width: 300,
          flexShrink: 0,
          p: 2,
          borderRight: '1px solid #1e293b',
          overflowY: 'auto',
        }}
      >
        <ControlPanel
          rows={rows}
          seatsPerSide={seatsPerSide}
          strategy={strategy}
          ticksPerSecond={ticksPerSecond}
          stowMean={stowMean}
          stowStdDev={stowStdDev}
          customZoneOrder={customZoneOrder}
          running={running}
          done={done}
          onRowsChange={setRows}
          onSeatsPerSideChange={setSeatsPerSide}
          onStrategyChange={setStrategy}
          onTicksPerSecondChange={setTicksPerSecond}
          onStowMeanChange={setStowMean}
          onStowStdDevChange={setStowStdDev}
          onCustomZoneOrderChange={setCustomZoneOrder}
          onRunPause={handleRunPause}
          onReset={handleReset}
          onCompareAll={handleCompareAll}
        />
      </Box>

      {/* Main area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Canvas area */}
        <Box
          sx={{
            flex: showChart ? '0 0 auto' : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
            overflow: 'auto',
            minHeight: showChart ? 200 : 'auto',
            maxHeight: showChart ? '55vh' : '100%',
          }}
        >
          <SimCanvas
            simConfig={simConfig}
            running={running}
            resetKey={resetKey}
            onComplete={handleComplete}
            onDoneChange={setDone}
          />
        </Box>

        {/* Tick counter */}
        {currentMetric && (
          <Box sx={{ px: 3, py: 0.5, borderTop: '1px solid #1e293b' }}>
            <Typography variant="caption" color="text.secondary">
              Completed in {currentMetric.totalTicks} ticks &nbsp;·&nbsp;
              {currentMetric.aisleBlockEvents} block events &nbsp;·&nbsp;
              avg wait {currentMetric.avgWaitTicks} ticks
            </Typography>
          </Box>
        )}

        {/* Chart area */}
        {showChart && (
          <Box sx={{ flex: 1, p: 2, borderTop: '1px solid #1e293b', minHeight: 0 }}>
            <MetricsChart metrics={chartMetrics} />
          </Box>
        )}
      </Box>
    </Box>
  );
}
