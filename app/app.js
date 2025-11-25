const express = require("express");
const axios = require("axios");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Environment variables for Elasticsearch cluster URLs and index name
const ES_CLUSTER1 = process.env.ES_CLUSTER1 || "http://es-cluster1:9200";
const ES_CLUSTER2 = process.env.ES_CLUSTER2 || "http://es-cluster2:9200";
const INDEX_NAME = process.env.INDEX_NAME || "wordsearch";

// Health Check Endpoint (for convenience)
app.get("/health", async (req, res) => {
  try {
    const [cluster1Status, cluster2Status] = await Promise.all([
      axios.get(`${ES_CLUSTER1}/_cluster/health`),
      axios.get(`${ES_CLUSTER2}/_cluster/health`)
    ]);
    res.json({
      Cluster1: cluster1Status.data,
      Cluster2: cluster2Status.data
    });
  } catch (error) {
    res.status(500).json({ error: "Error fetching cluster data", details: error.message });
  }
});

// Create Document (POST)
// Expects a JSON payload with "word" and "definition" fields.
app.post("/documents", async (req, res) => {
  const doc = req.body;
  try {
    // Write to both clusters to keep data replicated.
    const [response1, response2] = await Promise.all([
      axios.post(`${ES_CLUSTER1}/${INDEX_NAME}/_doc`, doc),
      axios.post(`${ES_CLUSTER2}/${INDEX_NAME}/_doc`, doc)
    ]);
    res.json({
      cluster1: response1.data,
      cluster2: response2.data
    });
  } catch (error) {
    res.status(500).json({ error: "Error posting document", details: error.message });
  }
});

// Update Document (PUT)
// Update an existing word definition document by its ID.
app.put("/documents/:id", async (req, res) => {
  const docId = req.params.id;
  const doc = req.body;
  try {
    const [response1, response2] = await Promise.all([
      axios.put(`${ES_CLUSTER1}/${INDEX_NAME}/_doc/${docId}`, doc),
      axios.put(`${ES_CLUSTER2}/${INDEX_NAME}/_doc/${docId}`, doc)
    ]);
    res.json({
      cluster1: response1.data,
      cluster2: response2.data
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating document", details: error.message });
  }
});

// Search Endpoint (GET)
// Query the index for matching word definitions.
app.get("/search", async (req, res) => {
  const query = req.query.q; // the search query string
  try {
    const response = await axios.post(`${ES_CLUSTER1}/${INDEX_NAME}/_search`, {
      query: {
        match: {
          word: query
        }
      }
    });
    res.json(response.data.hits.hits);
  } catch (error) {
    res.status(500).json({ error: "Error searching documents", details: error.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
