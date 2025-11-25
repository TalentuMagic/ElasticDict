# ElasticDict

Elasticsearch dictionary using Express.js

## Project Description - Milestone 1

My project is aimed at combining both frameworks in a robust, high-performance personal dictionary application, using Elasticsearch’s powerful search engine alongside the flexibility and simplicity of Express.js in a JavaScript environment. The API will allow users to dynamically search for words and their corresponding definitions, create new
dictionary entries by posting JSON documents, and update existing entries using PUT HTTP requests to ensure the dictionary remains up-to-date and accurate. The application
architecture is inherently compatible with Elasticsearch’s API actions and JSON data format, by using native capabilities of Node.js, and therefore Express.js, simplifying the integration between the frameworks: Elasticsearch for its distributed, scalable, flexible search
capabilities, and Express.js for rapid, efficient, and native integration with the JSON format for creating the API.

## List of Use Cases - Milestone 2

### Use Case 1 — Check Elasticsearch Cluster Health

**Actor:** Developer / Monitoring System  
**Goal:** Verify that both Elasticsearch clusters are reachable and healthy.  
**Trigger:** `GET /health`  
**Main Flow:**

1. Server sends parallel `GET` requests to `<ES_CLUSTER1>/_cluster/health` and `<ES_CLUSTER2>/_cluster/health`.
2. Each cluster returns its health status.
3. API responds with a JSON object containing both cluster health results.
4. If either request fails, the API returns an error.

---

### Use Case 2 — Create a New Dictionary Document

**Actor:** User / Contributor  
**Goal:** Add a new word entry to the dictionary index.  
**Trigger:** `POST /documents` with JSON body containing `"word"` and `"definition"`.  
**Main Flow:**

1. Request body is parsed as JSON.
2. Server sends POST requests to both Elasticsearch clusters at:
   - `<ES_CLUSTER1>/<INDEX_NAME>/_doc`
   - `<ES_CLUSTER2>/<INDEX_NAME>/_doc`
3. Both clusters index the document.
4. Server returns both cluster responses in a single JSON object.
5. If either POST fails, an error response is returned.

---

### Use Case 3 — Update an Existing Dictionary Document by ID

**Actor:** User / Contributor  
**Goal:** Modify an existing dictionary entry.  
**Trigger:** `PUT /documents/:id` with updated fields in JSON body.  
**Main Flow:**

1. Server extracts document ID from the URL.
2. Server sends PUT requests to both clusters at:
   - `<ES_CLUSTER1>/<INDEX_NAME>/_doc/:id`
   - `<ES_CLUSTER2>/<INDEX_NAME>/_doc/:id`
3. Both clusters update the document.
4. Server returns both cluster responses.
5. If either update fails, API returns an error.

---

### Use Case 4 — Search for Word Entries

**Actor:** User  
**Goal:** Retrieve dictionary entries whose `"word"` field matches a search term.  
**Trigger:** `GET /search?q=<term>`  
**Main Flow:**

1. Server extracts the search query from `req.query.q`.
2. Server sends a POST request to `<ES_CLUSTER1>/<INDEX_NAME>/_search` with a `match` query on `"word"`.
3. Elasticsearch returns matching documents.
4. API responds with the list of hits from `response.data.hits.hits`.
5. If search request fails, an error is returned.

---

### Use Case 5 — Run Backend Server

**Actor:** Developer / System  
**Goal:** Start the API server to serve requests.  
**Trigger:** Running the Node.js application.  
**Main Flow:**

1. Express.js server starts and listens on port `5000`.
2. Console logs the server URL.
