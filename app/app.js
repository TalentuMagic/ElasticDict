const express = require("express");
const axios = require("axios");
const http = require("http");
const swaggerUi = require("swagger-ui-express");
const swaggerJSDoc = require("swagger-jsdoc");

const app = express();

/**
 * @openapi
 * components:
 *   schemas:
 *     Definition:
 *       type: object
 *       properties:
 *         type:
 *           type: string
 *           example: noun
 *         meaning:
 *           type: string
 *           example: Round, edible fruit of an apple tree
 *     WordDoc:
 *       type: object
 *       properties:
 *         word:
 *           type: string
 *           example: apple
 *         definitions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Definition'
 */

// SwaggerAPI definition
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "WordSearch API",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:5000" }],
  },
  apis: ["./app.js"],
});

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get("/openapi.json", (req, res) => res.json(swaggerSpec));

// Middleware to parse JSON request bodies
app.use(express.json());

// Environment variables for Elasticsearch cluster URLs and index name
const ES_CLUSTER = process.env.ES_CLUSTER || "http://es-cluster:9200";
const INDEX_NAME = process.env.INDEX_NAME || "wordsearch";
const es = axios.create({
  baseURL: ES_CLUSTER,
  timeout: 8000,
  httpAgent: new http.Agent({ keepAlive: true }),
  headers: { "Content-Type": "application/json" },
});

// Log crashes
process.on("unhandledRejection", (err) =>
  console.error("unhandledRejection:", err)
);
process.on("uncaughtException", (err) =>
  console.error("uncaughtException:", err)
);

// Health Check Endpoint
/**
 * @openapi
 * /health:
 *   get:
 *     summary: Elasticsearch cluster health
 *     responses:
 *       200:
 *         description: Cluster health response
 */
app.get("/health", async (req, res) => {
  try {
    const response = await es.get(`/_cluster/health`);
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
/**
 * @openapi
 * /documents:
 *   post:
 *     summary: Create a document
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WordDoc'
 *     responses:
 *       201:
 *         description: Created
 */
app.post("/documents", async (req, res) => {
  try {
    const response = await es.post(`/${INDEX_NAME}/_doc`, req.body);
    res.status(201).json(response.data);
  } catch (error) {
    res.status(500).json({
      error: "Error creating document",
      details: error.message,
    });
  }
});

// Update Document (PUT)
// Update an existing word definition document by its ID.
/**
 * @openapi
 * /documents/{id}:
 *   put:
 *     summary: Update a document by Elasticsearch ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/WordDoc'
 *     responses:
 *       200:
 *         description: Updated
 */
app.put("/documents/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const response = await es.put(`/${INDEX_NAME}/_doc/${id}`, req.body);
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
/**
 * @openapi
 * /search:
 *   get:
 *     summary: Search words and definitions
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Query text (word or meaning)
 *       - in: query
 *         name: t
 *         schema:
 *           type: string
 *         description: Definition type (e.g. noun, verb)
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/WordDoc'
 */
app.get("/search", async (req, res) => {
  // normalize input (trim + strip optional quotes)
  const normalize = (v) =>
    typeof v === "string" ? v.trim().replace(/^['"]|['"]$/g, "") : "";

  const query_param = normalize(req.query.q);
  const type_param = normalize(req.query.t);

  const hasQuery = query_param.length > 0;
  const hasType = type_param.length > 0;

  const should = [];
  const filter = [];
  const must = [];

  // If no params, everything
  if (!hasQuery && !hasType) {
    must.push({ match_all: {} });
  }

  // (0) exact word match
  if (hasQuery) {
    should.push({ term: { word: query_param } });
    should.push({ prefix: { word: query_param } });

    // (3) meaning match (nested) - for retrieval/scoring
    should.push({
      nested: {
        path: "definitions",
        query: { match: { "definitions.meaning": query_param } },
      },
    });
  }

  // inner_hits is used ONLY to "slice" definitions by type
  if (hasType) {
    filter.push({
      nested: {
        path: "definitions",
        query: { term: { "definitions.type": type_param } },
        inner_hits: { name: "defs_by_type" },
      },
    });
  }

  const query = {
    bool: {
      must,
      filter,
      should,
      minimum_should_match: hasQuery ? 1 : 0,
    },
  };

  try {
    const response = await es.post(`/${INDEX_NAME}/_search`, { query });

    const hits = response.data.hits.hits.map((hit) => {
      const defsByType =
        hit.inner_hits?.defs_by_type?.hits?.hits?.map((d) => d._source) ?? null;

      return {
        word: hit._source.word,
        // If t provided, return only that type's definitions
        definitions: hasType ? defsByType ?? [] : hit._source.definitions,
      };
    });

    res.json(hits);
  } catch (error) {
    res.status(500).json({
      error: "Error searching documents",
      details: error.response?.data || error.message,
    });
  }
});

// Delete endpoint (DELETE)
// Delete entry by query.
/**
 * @openapi
 * /document:
 *   delete:
 *     summary: Delete documents by exact word
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Exact word to delete
 *     responses:
 *       200:
 *         description: Delete by query response
 *       400:
 *         description: Missing query parameter
 */
app.delete("/document", async (req, res) => {
  const query = req.query.q;

  if (!query) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const response = await es.post(`/${INDEX_NAME}/_delete_by_query`, {
      query: {
        match: {
          word: query,
        },
      },
    });

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
