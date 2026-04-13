import {Box, TextField } from "@mui/material";
import {useState} from "react";

function App() {
  const [rows, setRows] = useState<number>(0)
  const [columns, setColumns] = useState<number>(0)

  // const [columns, setColumns] = useState<number>(0)

  return (
    <Box>
      <Box>
        <TextField
          type="number"
          label="Number of Rows"
          variant="outlined"
          value={rows}
          onChange={(e) => setRows(Number(e.target.value))}
        />

        <TextField
          type="number"
          label="Number of Columns"
          variant="outlined"
          value={columns}
          onChange={(e) => setColumns(Number(e.target.value))}
        />
 
      </Box>
      <Box>see plane</Box>

    </Box>
  )
}

export default App
