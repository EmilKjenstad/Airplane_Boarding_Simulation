import {
  Box,
  Button,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  TextField,
  Typography,
  IconButton,
  Stack,
  Chip,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BarChartIcon from '@mui/icons-material/BarChart';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import type { StrategyName } from '../simulation/types';
import { NUM_ZONES } from '../simulation/config';
import { getZoneLabel } from '../simulation/strategies';

const STRATEGIES: { value: StrategyName; label: string }[] = [
  { value: 'back-to-front', label: 'Back to Front (Zones)' },
  { value: 'front-to-back', label: 'Front to Back' },
  { value: 'random', label: 'Random / Free-for-all' },
  { value: 'window-middle-aisle', label: 'Window → Middle → Aisle' },
  { value: 'outside-in', label: 'Outside-In (+ Back to Front)' },
  { value: 'custom', label: 'Custom Zone Order' },
];

interface Props {
  rows: number;
  seatsPerSide: number;
  strategy: StrategyName;
  ticksPerSecond: number;
  stowMean: number;
  stowStdDev: number;
  customZoneOrder: number[];
  running: boolean;
  done: boolean;
  onRowsChange: (v: number) => void;
  onSeatsPerSideChange: (v: number) => void;
  onStrategyChange: (v: StrategyName) => void;
  onTicksPerSecondChange: (v: number) => void;
  onStowMeanChange: (v: number) => void;
  onStowStdDevChange: (v: number) => void;
  onCustomZoneOrderChange: (v: number[]) => void;
  onRunPause: () => void;
  onReset: () => void;
  onCompareAll: () => void;
}

export default function ControlPanel({
  rows,
  seatsPerSide,
  strategy,
  ticksPerSecond,
  stowMean,
  stowStdDev,
  customZoneOrder,
  running,
  done,
  onRowsChange,
  onSeatsPerSideChange,
  onStrategyChange,
  onTicksPerSecondChange,
  onStowMeanChange,
  onStowStdDevChange,
  onCustomZoneOrderChange,
  onRunPause,
  onReset,
  onCompareAll,
}: Props) {
  const swapZones = (i: number, j: number) => {
    const next = [...customZoneOrder];
    [next[i], next[j]] = [next[j], next[i]];
    onCustomZoneOrderChange(next);
  };

  return (
    <Stack spacing={2.5} sx={{ height: '100%', overflowY: 'auto', pr: 0.5 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
        ✈ Boarding Simulator
      </Typography>

      <Divider />

      {/* Plane configuration */}
      <Typography variant="overline" color="text.secondary">
        Plane Configuration
      </Typography>

      <TextField
        label="Rows"
        type="number"
        size="small"
        value={rows}
        onChange={e => onRowsChange(Math.max(5, Math.min(60, Number(e.target.value))))}
        slotProps={{ htmlInput: { min: 5, max: 60 } }}
        fullWidth
      />

      <TextField
        label="Seats per side"
        type="number"
        size="small"
        value={seatsPerSide}
        onChange={e =>
          onSeatsPerSideChange(Math.max(1, Math.min(5, Number(e.target.value))))
        }
        slotProps={{ htmlInput: { min: 1, max: 5 } }}
        fullWidth
        helperText={`${seatsPerSide * 2} seats per row`}
      />

      <Divider />

      {/* Strategy */}
      <Typography variant="overline" color="text.secondary">
        Boarding Strategy
      </Typography>

      <FormControl size="small" fullWidth>
        <InputLabel>Strategy</InputLabel>
        <Select
          label="Strategy"
          value={strategy}
          onChange={e => onStrategyChange(e.target.value as StrategyName)}
        >
          {STRATEGIES.map(s => (
            <MenuItem key={s.value} value={s.value}>
              {s.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {strategy === 'custom' && (
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Drag zones to set boarding order (top = first to board)
          </Typography>
          <Stack spacing={0.5}>
            {customZoneOrder.map((zoneIdx, orderIdx) => (
              <Box
                key={zoneIdx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  px: 1,
                  py: 0.5,
                }}
              >
                <Chip
                  label={orderIdx + 1}
                  size="small"
                  color="primary"
                  sx={{ minWidth: 28 }}
                />
                <Typography variant="body2" sx={{ flex: 1, fontSize: 12 }}>
                  {getZoneLabel(zoneIdx, rows)}
                </Typography>
                <IconButton
                  size="small"
                  disabled={orderIdx === 0}
                  onClick={() => swapZones(orderIdx, orderIdx - 1)}
                >
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  disabled={orderIdx === NUM_ZONES - 1}
                  onClick={() => swapZones(orderIdx, orderIdx + 1)}
                >
                  <KeyboardArrowDownIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </Box>
      )}

      <Divider />

      {/* Sim settings */}
      <Typography variant="overline" color="text.secondary">
        Simulation Settings
      </Typography>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Speed: {ticksPerSecond} ticks/s
        </Typography>
        <Slider
          value={ticksPerSecond}
          min={1}
          max={60}
          step={1}
          onChange={(_, v) => onTicksPerSecondChange(v as number)}
          size="small"
        />
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Luggage stow time: {stowMean} ± {stowStdDev} ticks
        </Typography>
        <Typography variant="caption" color="text.disabled">
          Mean
        </Typography>
        <Slider
          value={stowMean}
          min={3}
          max={40}
          step={1}
          onChange={(_, v) => onStowMeanChange(v as number)}
          size="small"
        />
        <Typography variant="caption" color="text.disabled">
          Std Dev
        </Typography>
        <Slider
          value={stowStdDev}
          min={0}
          max={15}
          step={1}
          onChange={(_, v) => onStowStdDevChange(v as number)}
          size="small"
        />
      </Box>

      <Divider />

      {/* Legend */}
      <Typography variant="overline" color="text.secondary">
        Legend
      </Typography>
      <Stack spacing={0.5}>
        {[
          { color: '#60a5fa', label: 'Moving in aisle' },
          { color: '#fb923c', label: 'Stowing luggage' },
          { color: '#22c55e', label: 'Seated' },
          { color: '#1e3a5f', label: 'Empty seat' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color, flexShrink: 0 }}
            />
            <Typography variant="caption">{label}</Typography>
          </Box>
        ))}
      </Stack>

      <Divider />

      {/* Controls */}
      <Stack spacing={1}>
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={running ? <PauseIcon /> : <PlayArrowIcon />}
            onClick={onRunPause}
            disabled={done && !running}
            fullWidth
          >
            {running ? 'Pause' : done ? 'Done' : 'Run'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RestartAltIcon />}
            onClick={onReset}
            fullWidth
          >
            Reset
          </Button>
        </Stack>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<BarChartIcon />}
          onClick={onCompareAll}
          fullWidth
        >
          Compare All
        </Button>
      </Stack>
    </Stack>
  );
}
