const express = require('express');

const app = express();
const port = 3000;

const usersMock = [
  { id: 1, name: 'Alice Johnson', email: 'alice.johnson@example.com' },
  { id: 2, name: 'Bruno Costa', email: 'bruno.costa@example.com' },
  { id: 3, name: 'Carla Souza', email: 'carla.souza@example.com' }
];

function getUsersInfo() {
  return usersMock;
}

app.get('/infos', (req, res) => {
  res.json(getUsersInfo());
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
