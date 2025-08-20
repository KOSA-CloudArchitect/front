const express = require('express');
const app = express();
const PORT = 8080;

app.get('/', (req, res) => {
  res.send('Hello from the CI/CD Test App!');
});

app.listen(PORT, () => {
  console.log(`Test app listening on port ${PORT}`);
});
