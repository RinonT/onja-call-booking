const axios = require('axios');

export default async function handler(req, res) {
  const { method, body } = req;

  try {
    const response = await axios({
      method,
      url: 'http://3.11.136.62:4000/graphql',
      data: body,
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(error.response.status || 500).json({ error: 'Request failed' });
  }
}
