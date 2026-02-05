const express = require('express');
const fetch = require('node-fetch');
const app = express();
const cors = require('cors');
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
corsOptions = {
  origin: '*',
  optionsSuccessStatus: 200
};
// Proxy GET user data
app.get('/api/userdata/:flowid', async (req,res) => {
  const { flowid } = req.params;
  try{
    const response = await fetch(`https://loveofn8ncloud.app.n8n.cloud/webhook/e6bf03cc-c9e6-4727-91c5-375b420ac2ce/${flowid}/`);
    const data = await response.json();
    res.json(data);
  } catch(err){
    console.error(err);
    res.status(500).json({ error:'Failed to fetch data from n8n' });
  }
});
// Add to your server.js

// Update customers array
app.post('/api/updatecustomers', async (req, res) => {
  const { userId, customers } = req.body;
  
  try {
    // Send to n8n to update the customers field
    const response = await fetch(`https://loveofn8ncloud.app.n8n.cloud/webhook/updatecustomers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userid: userId,
        customers: JSON.stringify(customers)  // Send as JSON string
      })
    });
    
    const data = await response.json();
    res.json({ success: true, message: 'Customers updated' });
    
  } catch(err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customers' });
  }
});

// Proxy POST create table
app.post('/api/createtable', async (req,res) => {
  const { userid, name } = req.body;
  try{
    const response = await fetch(`https://loveofn8ncloud.app.n8n.cloud/webhook/createtable`, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ userid, name })
    });
    const data = await response.json();
    res.json(data);
  } catch(err){
    console.error(err);
    res.status(500).json({ error:'Failed to create table' });
  }
});

app.listen(PORT,()=>console.log(`Server running on port ${PORT}`));

