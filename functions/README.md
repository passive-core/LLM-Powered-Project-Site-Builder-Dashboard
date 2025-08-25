This folder contains Cloud Function scaffolds for modular AI services used by the dashboard.

Available functions:
- idea-classifier
- summarizer
- watcher-bot
- content-generator
- resource-linker
- ideas-onCreate (trigger endpoint)
- tasks-onUpdate (trigger endpoint)

Each function is a Deno deployable HTTP handler. Configure your deployment to expose them under /functions/{name}.

Firestore / Pub/Sub wiring
--------------------------
Below are example ways to wire Firestore events to these HTTP endpoints. You can use Eventarc, Cloud Pub/Sub, or Firebase Cloud Functions to forward events to the HTTP trigger endpoints below.

1) Using Eventarc (recommended for GCP projects):

- Create HTTP-deployed endpoints for the trigger handlers (ideas-onCreate, tasks-onUpdate) via Blink functions or Deno Deploy.
- Create Eventarc triggers so Firestore document change events are delivered to your endpoints. Example (gcloud):

  # Trigger on document create for ideas collection
  gcloud eventarc triggers create ideas-oncreate-trigger \
    --location=us-central1 \
    --destination-run-service=YOUR_SERVICE_NAME \
    --destination-run-region=us-central1 \
    --event-filters="type=google.cloud.firestore.document.v1.created" \
    --event-filters="resource=projects/YOUR_PROJECT/databases/(default)/documents/ideas/{documentId}"

  # Trigger on document update for tasks collection
  gcloud eventarc triggers create tasks-onupdate-trigger \
    --location=us-central1 \
    --destination-run-service=YOUR_SERVICE_NAME \
    --destination-run-region=us-central1 \
    --event-filters="type=google.cloud.firestore.document.v1.updated" \
    --event-filters="resource=projects/YOUR_PROJECT/databases/(default)/documents/tasks/{taskId}"

When Eventarc calls the endpoint it will POST a JSON payload containing the Firestore event. The trigger handlers in this folder accept that payload and will forward a normalized payload to the corresponding AI service endpoints.

2) Using Pub/Sub

- Configure Firestore to publish change events to a Pub/Sub topic (via Eventarc or native integrations).
- Create a push subscription that forwards messages to the trigger HTTP endpoints (ideas-onCreate, tasks-onUpdate).

3) Using Firebase Cloud Functions (Node)

If you prefer Firebase Functions, implement thin wrappers that call these trigger endpoints. Example (Node):

exports.onIdeaCreate = functions.firestore
  .document('ideas/{ideaId}')
  .onCreate(async (snap, ctx) => {
    const payload = { data: snap.data(), id: ctx.params.ideaId };
    await fetch(process.env.IDEA_CLASSIFIER_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  });

Secrets & endpoints
-------------------
- For security, store your AI service URLs in project secrets and reference them from environment variables inside deployed trigger functions: IDEA_CLASSIFIER_ENDPOINT, SUMMARIZER_ENDPOINT
- The trigger handlers forward sanitized payloads to the configured endpoints. Make sure those endpoints validate incoming requests (for production add auth / signature verification / rate limiting).

Notes
-----
- The trigger handlers provided here are lightweight forwarders: they normalize Firestore payloads and call the actual service endpoints.
- You can replace the HTTP-forwarding logic with direct imports/calls if you deploy all services inside the same runtime and prefer internal invocation.
- Always add authentication and validation before enabling public access to these endpoints.
