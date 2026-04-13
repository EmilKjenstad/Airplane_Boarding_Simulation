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
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import type { StrategyName } from '../simulation/types';
import { NUM_ZONES } from '../simulation/config';
import { getZoneLabel } from '../simulation/strategies';
import { PLANE_PRESETS } from '../simulation/helpers';

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
  seatGroups: number[];
  strategy: StrategyName;
  ticksPerSecond: number;
  stowMean: number;
  stowStdDev: number;
  customZoneOrder: number[];
  running: boolean;
  done: boolean;
  onRowsChange: (v: number) => void;
  onSeatGroupsChange: (v: number[]) => void;
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
  seatGroups,
  strategy,
  ticksPerSecond,
  stowMean,
  stowStdDev,
  customZoneOrder,
  running,
  done,
  onRowsChange,
  onSeatGroupsChange,
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

  const updateGroup = (idx: number, value: number) => {
    const next = [...seatGroups];
    next[idx] = Math.max(1, Math.min(8, value));
    onSeatGroupsChange(next);
  };

  const addGroup = () => onSeatGroupsChange([...seatGroups, 2]);
  const removeGroup = (idx: number) => {
    if (seatGroups.length <= 1) return;
    const next = seatGroups.filter((_, i) => i !== idx);
    onSeatGroupsChange(next);
  };

  const totalSeats = seatGroups.reduce((a, b) => a + b, 0) * rows;

  // Detect which preset matches current groups
  const presetIndex = PLANE_PRESETS.findIndex(
    p => p.groups.length === seatGroups.length && p.groups.every((g, i) => g === seatGroups[i]),
  );
  const presetValue = presetIndex >= 0 ? presetIndex : PLANE_PRESETS.length - 1; // last = Custom

  const handlePresetChange = (idx: number) => {
    const preset = PLANE_PRESETS[idx];
    if (preset.groups.length > 0) onSeatGroupsChange(preset.groups);
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

      {/* Preset picker */}
      <FormControl size="small" fullWidth>
        <InputLabel>Preset layout</InputLabel>
        <Select
          label="Preset layout"
          value={presetValue}
          onChange={e => handlePresetChange(Number(e.target.value))}
        >
          {PLANE_PRESETS.map((p, i) => (
            <MenuItem key={i} value={i}>
              {p.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Seat group editor */}
      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Seat groups — aisles between each group
        </Typography>
        <Stack spacing={0.75}>
          {seatGroups.map((count, gi) => (
            <Box key={gi} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography variant="caption" color="text.disabled" sx={{ width: 18 }}>
                {gi + 1}
              </Typography>
              <IconButton size="small" onClick={() => updateGroup(gi, count - 1)} disabled={count <= 1}>
                <RemoveIcon fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 0.5, minWidth: 16, textAlign: 'center' }}>
                {count}
              </Typography>
              <IconButton size="small" onClick={() => updateGroup(gi, count + 1)} disabled={count >= 8}>
                <AddIcon fontSize="small" />
              </IconButton>
              <Typography variant="caption" color="text.disabled" sx={{ flex: 1, ml: 0.5 }}>
                seat{count > 1 ? 's' : ''}
              </Typography>
              <IconButton
                size="small"
                onClick={() => removeGroup(gi)}
                disabled={seatGroups.length <= 1}
                color="error"
              >
                <RemoveIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={addGroup}
            disabled={seatGroups.length >= 5}
            variant="outlined"
            sx={{ mt: 0.5 }}
          >
            Add group
          </Button>
        </Stack>
        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          {seatGroups.join('–')} layout · {seatGroups.reduce((a, b) => a + b, 0)} seats/row ·{' '}
          {totalSeats} total
        </Typography>
      </Box>

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
            Reorder zones — top boards first
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
                <Chip label={orderIdx + 1} size="small" color="primary" sx={{ minWidth: 28 }} />
                <Typography variant="body2" sx={{ flex: 1, fontSize: 12 }}>
                  {getZoneLabel(zoneIdx, rows)}
                </Typography>
                <IconButton size="small" disabled={orderIdx === 0} onClick={() => swapZones(orderIdx, orderIdx - 1)}>
                  <KeyboardArrowUpIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" disabled={orderIdx === NUM_ZONES - 1} onClick={() => swapZones(orderIdx, orderIdx + 1)}>
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
        <Typography variant="caption" color="text.disabled">Mean</Typography>
        <Slider value={stowMean} min={3} max={40} step={1} onChange={(_, v) => onStowMeanChange(v as number)} size="small" />
        <Typography variant="caption" color="text.disabled">Std Dev</Typography>
        <Slider value={stowStdDev} min={0} max={15} step={1} onChange={(_, v) => onStowStdDevChange(v as number)} size="small" />
      </Box>

      <Divider />

      {/* Legend */}
      <Typography variant="overline" color="text.secondary">Legend</Typography>
      <Stack spacing={0.5}>
        {[
          { color: '#60a5fa', label: 'Moving in aisle' },
          { color: '#fb923c', label: 'Stowing luggage' },
          { color: '#22c55e', label: 'Seated' },
          { color: '#1e3a5f', label: 'Empty seat' },
        ].map(({ color, label }) => (
          <Box key={label} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
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
          <Button variant="outlined" startIcon={<RestartAltIcon />} onClick={onReset} fullWidth>
            Reset
          </Button>
        </Stack>
        <Button variant="outlined" color="secondary" startIcon={<BarChartIcon />} onClick={onCompareAll} fullWidth>
          Compare All
        </Button>
      </Stack>
    </Stack>
  );
}
