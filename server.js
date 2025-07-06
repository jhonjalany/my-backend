// server.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

let residentData = [];
let sheetFormulas = {};
let editedCells = {};

app.get('/api/data', (req, res) => {
  return res.json({ residentData, sheetFormulas, editedCells });
});

app.post('/api/load', (req, res) => {
  const { data } = req.body;
  residentData = [...data];
  return res.json({ success: true });
});

app.post('/api/save-edits', (req, res) => {
  const { updatedRows } = req.body;
  updatedRows.forEach(row => {
    const id = row.ID;
    const index = residentData.findIndex(r => r.ID === id);
    if (index !== -1) {
      Object.assign(residentData[index], row);
    }
    // Track manual edits
    if (!editedCells[id]) editedCells[id] = {};
    Object.entries(row).forEach(([col, val]) => {
      editedCells[id][col] = val;
    });
  });
  return res.json({ success: true });
});

app.post('/api/add-row', (req, res) => {
  const newRow = req.body;
  residentData.push(newRow);
  return res.json({ success: true, id: newRow.ID });
});

app.post('/api/delete-row', (req, res) => {
  const { id } = req.body;
  residentData = residentData.filter(r => r.ID !== id);
  delete editedCells[id];
  return res.json({ success: true });
});

// server.js

app.get('/health', (req, res) => {
  // You can add more checks here later if needed (e.g., DB connection)
  return res.status(200).json({
    status: 'ok',
    message: 'Backend is healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
