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

1. Server sends `GET` request to `<ES_CLUSTER>/_cluster/health`.
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
2. Server sends POST requests to both Elasticsearch nodes at:
   - `<ES_CLUSTER>/<INDEX_NAME>/_doc`
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
   - `<ES_CLUSTER>/<INDEX_NAME>/_doc/:id`
3. Both clusters update the document.
4. Server returns both cluster responses.
5. If either update fails, API returns an error.

---

### Use Case 4 — Search for Word Entries

**Actor:** User  
**Goal:** Retrieve dictionary entries whose `"word"` field matches a search term.  
**Trigger:** `GET /search?q=<term>&t=<type>`  
**Main Flow:**

1. Server extracts the search query from `req.query.q` and `req.query.t`.
2. Server sends a POST request to `<ES_CLUSTER>/<INDEX_NAME>/_search` with a `match` query on `"word"`.
3. Elasticsearch returns matching documents.
4. API responds with the list of hits from `response.data.hits.hits`.
5. If search request fails, an error is returned.
6. If no parameter is sent, the search outputs all entries.

---

### Use Case 5 — Delete for Word

**Actor:** User  
**Goal:** Retrieve dictionary entries whose `"word"` field matches a search term.  
**Trigger:** `DELETE /document?q=<term>`  
**Main Flow:**

1. Server extracts the search query from `req.query.q`.
2. Server sends a DELETE request to `<ES_CLUSTER>/<INDEX_NAME>/_delete_by_query` with a `match` query on `"word"`.
3. Elasticsearch returns delete response JSON.
4. API responds with the `response.data`.
5. If delete request fails, an error is returned.

---

### Use Case 6 — Run Backend Server

**Actor:** Developer / System  
**Goal:** Start the API server to serve requests.  
**Trigger:** Running the Node.js application.  
**Main Flow:**

1. Express.js server starts and listens on port `5000`.
2. Console logs the server URL.

## Swagger API Implementation - Milestone 3

### API Documentation with Swagger

This project exposes interactive API documentation using **Swagger UI** and an auto-generated **OpenAPI 3.0** specification. The implementation is defined in `app.js` using the `swagger-jsdoc` and `swagger-ui-express` libraries, which generate the spec from annotated JSDoc comments and serve it under dedicated routes.:contentReference[oaicite:0]{index=0}

### Swagger Setup

The Swagger configuration is initialized in `app.js` using `swaggerJSDoc` with the following options:​:contentReference[oaicite:1]{index=1}

- `openapi: "3.0.0"` – OpenAPI version.
- `info.title: "WordSearch API"` – API name.
- `info.version: "1.0.0"` – API version.
- `servers: [{ url: "http://localhost:5000" }]` – Base server URL.
- `apis: ["./app.js"]` – Source file scanned for `@openapi` JSDoc comments.

The generated specification (`swaggerSpec`) is:

- Exposed as an interactive UI at `GET /docs` using `swaggerUi.serve` and `swaggerUi.setup(swaggerSpec)`.
- Available as raw JSON at `GET /openapi.json` by returning `swaggerSpec` from an Express route.:contentReference[oaicite:2]{index=2}

### OpenAPI Schemas

The core data models are documented in `app.js` under the `components.schemas` section of the OpenAPI configuration:​:contentReference[oaicite:3]{index=3}

- **`Definition`**

  - `type` (string) – grammatical type, e.g. `"noun"`.
  - `meaning` (string) – textual meaning, e.g. `"Round, edible fruit of an apple tree"`.

- **`WordDoc`**
  - `word` (string) – the dictionary word, e.g. `"apple"`.
  - `definitions` (array of `Definition`) – all definitions associated with the word.

These schemas are reused across the routes (e.g., `POST /documents`, `PUT /documents/{id}`, and `GET /search`) via `$ref: '#/components/schemas/WordDoc'` to keep the API contract consistent.:contentReference[oaicite:4]{index=4}

### Swagger-Documented Routes

Each Express route in `app.js` is documented with an `@openapi` JSDoc block directly above the handler implementation. These blocks declare HTTP methods, paths, request parameters, bodies, and responses. The main documented endpoints include:​:contentReference[oaicite:5]{index=5}

- **`GET /health`** – Returns the Elasticsearch cluster health.
- **`POST /documents`** – Creates a new word document using the `WordDoc` schema as the request body.
- **`PUT /documents/{id}`** – Updates an existing document by its Elasticsearch `_id`.
- **`GET /search`** – Searches words and definitions with optional query (`q`) and type (`t`) parameters.
- **`DELETE /document`** – Deletes documents by exact `word` via the query parameter `q`.

When the application starts, `swagger-jsdoc` reads these annotations, merges them with the base configuration, and generates a complete OpenAPI 3.0 definition that is consumed by Swagger UI.:contentReference[oaicite:6]{index=6}

### Using Swagger UI

Once the server is running (either via Docker or `node app.js`), the Swagger integration provides two main entry points:​:contentReference[oaicite:7]{index=7}

- **Interactive documentation:**  
  Open `http://localhost:5000/docs` in a browser to access the Swagger UI. From here, you can inspect all endpoints, view request/response schemas, and execute test calls directly against the running API.

- **OpenAPI JSON specification:**  
  Access `http://localhost:5000/openapi.json` to retrieve the underlying OpenAPI 3.0 document. This JSON can be used with tools such as API clients, documentation generators, or code generators to integrate with the **WordSearch API**.:contentReference[oaicite:8]{index=8}

## Elasticsearch Mapping Overview - Milestone 4

The `wordsearch` index stores dictionary entries shaped exactly like the `WordDoc` schema used in the API. Each document contains:

- A top-level `word` field.
- A `definitions` field modeled as a **nested** array of `Definition` objects, each with:
  - `type` – used for exact filtering (e.g. `proper-noun`).
  - `meaning` – used for full-text search.

This structure matches how the `/search` endpoint queries `word`, `definitions.type` and `definitions.meaning` using `term`, `prefix`, and nested `match` queries in `app.js`.:contentReference[oaicite:0]{index=0}

### Elasticsearch Index Creation

Create the `wordsearch` index with a mapping aligned to the API queries in `app.js` as follows:​:contentReference[oaicite:1]{index=1}

```json
PUT wordsearch
{
  "mappings": {
    "properties": {
      "word": {
        "type": "keyword"
      },
      "definitions": {
        "type": "nested",
        "properties": {
          "type": {
            "type": "keyword"
          },
          "meaning": {
            "type": "text"
          }
        }
      }
    }
  }
}
```

### Mapping for `word` Field

The `word` field is used for:

- Exact matches via `term` queries.
- Prefix matches via `prefix` queries (e.g. partial word search).
- Match queries in delete operations (`_delete_by_query` on `word`).:contentReference[oaicite:3]{index=3}

Recommended mapping:

```json
"word": {
  "type": "keyword"
}
```

### Mapping for `definitions` Nested Field

The `definitions` field is modeled as a nested array to match the query behaviour in `/search`, which:

- Filters by `definitions.type` using a nested `term` query and `inner_hits` (when the `t` query parameter is provided).
- Searches inside `definitions.meaning` using a nested `match` query (when the `q` query parameter is provided).:contentReference[oaicite:5]{index=5}

Recommended nested mapping:

```json
"definitions": {
  "type": "nested",
  "properties": {
    "type": {
      "type": "keyword"
    },
    "meaning": {
      "type": "text"
    }
  }
}
```

### Example Indexed Document

The following example shows how a single word entry is stored in the `wordsearch` index, matching the `WordDoc` + `Definition` schemas and the mapping described above:​:contentReference[oaicite:7]{index=7}

```json
{
  "word": "elasticsearch",
  "definitions": [
    {
      "type": "proper-noun",
      "meaning": "A distributed search and analytics engine."
    }
  ]
}
```

## Implementation/TL;DR - Milestone 5

### TL;DR – Overview

- **What:** A Node.js + Express API that stores and searches dictionary-style entries in Elasticsearch.
- **Data model:** Each document uses a `WordDoc` schema with:
  - `word` (string)
  - `definitions` (array of `Definition` objects with `type` and `meaning`).:contentReference[oaicite:0]{index=0}
- **Swagger/OpenAPI:** Schemas (`Definition`, `WordDoc`) and routes are documented via `@openapi` JSDoc comments directly in `app.js`.:contentReference[oaicite:1]{index=1}

### TL;DR – Running & Configuration

- **Server port:** Express app listens on **port 5000** and logs `Backend server is running on http://localhost:5000`. :contentReference[oaicite:2]{index=2}
- **Elasticsearch client:** Axios instance with:
  - `baseURL` from `ES_CLUSTER` env var or default `http://es-cluster:9200`.
  - `timeout: 8000`, keep-alive HTTP agent, JSON headers.:contentReference[oaicite:3]{index=3}
- **Index name:** `INDEX_NAME` env var or default `wordsearch`; all CRUD/search operations target this index (`/${INDEX_NAME}/_doc`, `/${INDEX_NAME}/_search`, `/${INDEX_NAME}/_delete_by_query`).:contentReference[oaicite:4]{index=4}

### Kibana Dev Tools – Create `wordsearch` Index

Run the following requests in **Kibana -> Dev Tools -> Console**:

```http
# (Optional) Clean up any existing index with the same name
DELETE wordsearch

PUT wordsearch
{
  "mappings": {
    "properties": {
      "word": {
        "type": "keyword"
      },
      "definitions": {
        "type": "nested",
        "properties": {
          "type": {
            "type": "keyword"
          },
          "meaning": {
            "type": "text"
          }
        }
      }
    }
  }
}

# Verify the mapping
GET wordsearch/_mapping
```

### TL;DR – API & Swagger

- **Docs:**
  - `GET /docs` – Swagger UI served via `swagger-ui-express`.
  - `GET /openapi.json` – Raw OpenAPI 3.0 spec generated by `swagger-jsdoc` scanning `./app.js`.:contentReference[oaicite:5]{index=5}
- **Core endpoints:**
  - `GET /health` – Proxies `/_cluster/health` on the configured Elasticsearch cluster.
  - `POST /documents` – Creates a document (`WordDoc`) in `/{INDEX_NAME}/_doc`.
  - `PUT /documents/{id}` – Replaces a document by Elasticsearch `_id`.
  - `GET /search` – Searches on `word` and nested `definitions` with `q` (query) and `t` (type) parameters using `bool` + nested queries and `inner_hits`.
  - `DELETE /document` – Deletes documents by exact `word` via `_delete_by_query`.:contentReference[oaicite:6]{index=6}
- **Reliability:** Global listeners log `unhandledRejection` and `uncaughtException`, and each route wraps Elasticsearch calls in `try/catch` returning HTTP 500 on errors.:contentReference[oaicite:7]{index=7}
