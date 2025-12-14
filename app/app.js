const express = require("express");
const axios = require("axios");

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

// Environment variables for Elasticsearch cluster URLs and index name
const ES_CLUSTER = process.env.ES_CLUSTER || "http://es-cluster:9200";
const INDEX_NAME = process.env.INDEX_NAME || "wordsearch";

// Health Check Endpoint
app.get("/health", async (req, res) => {
  try {
    const response = await axios.get(`${ES_CLUSTER}/_cluster/health`);
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Error fetching cluster health",
      details: error.message,
    });
  }
});

// Create Document (POST)
// Expects a JSON payload with "word" and "definition" fields.
app.post("/documents", async (req, res) => {
  try {
    const response = await axios.post(
      `${ES_CLUSTER}/${INDEX_NAME}/_doc`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Error creating document",
      details: error.message,
    });
  }
});

// Update Document (PUT)
// Update an existing word definition document by its ID.
app.put("/documents/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.put(
      `${ES_CLUSTER}/${INDEX_NAME}/_doc/${id}`,
      req.body
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Error updating document",
      details: error.message,
    });
  }
});

// Search Endpoint (GET)
// Query the index for matching word definitions.
app.get("/search", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const response = await axios.post(`${ES_CLUSTER}/${INDEX_NAME}/_search`, {
      query: {
        match: {
          word: query,
        },
      },
    });

    res.json(response.data.hits.hits);
  } catch (error) {
    res.status(500).json({
      error: "Error searching documents",
      details: error.message,
    });
  }
});

// Search Endpoint (GET)
// READ: Get document by ID (fallback from cluster1 → cluster2)
app.get("/documents/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await axios.get(`${ES_CLUSTER}/${INDEX_NAME}/_doc/${id}`);
    res.json(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ error: "Document not found" });
    }
    res.status(500).json({
      error: "Error fetching document",
      details: error.message,
    });
  }
});

// Delete endpoint (DELETE)
// Delete entry by query.
app.delete("/documents", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const response = await axios.post(
      `${ES_CLUSTER}/${INDEX_NAME}/_delete_by_query`,
      {
        query: {
          match: {
            word: query,
          },
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Error deleting documents",
      details: error.message,
    });
  }
});

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
