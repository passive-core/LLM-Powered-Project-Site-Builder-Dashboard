import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

function parseFirestoreValue(field: any): any {
  if (!field) return null;
  if (field.stringValue !== undefined) return field.stringValue;
  if (field.integerValue !== undefined) return Number(field.integerValue);
  if (field.doubleValue !== undefined) return Number(field.doubleValue);
  if (field.booleanValue !== undefined) return field.booleanValue === true || field.booleanValue === 'true';
  if (field.timestampValue !== undefined) return field.timestampValue;
  if (field.mapValue && field.mapValue.fields) {
    const obj: any = {};
    for (const k of Object.keys(field.mapValue.fields)) {
      obj[k] = parseFirestoreValue(field.mapValue.fields[k]);
    }
    return obj;
  }
  if (field.arrayValue && field.arrayValue.values) {
    return field.arrayValue.values.map((v: any) => parseFirestoreValue(v));
  }
  if (field.value) return field.value;
  return null;
}

function fieldsToObject(fields: any) {
  if (!fields) return {};
  const out: any = {};
  for (const k of Object.keys(fields)) {
    out[k] = parseFirestoreValue(fields[k]);
  }
  return out;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const event = body || {};

    // Expecting Firestore "update" style payloads with oldValue and value/newValue
    const oldVal = event.oldValue || event.data?.oldValue || event.previous || {};
    const newVal = event.value || event.data?.value || event.newValue || event.document || event || {};

    const oldFields = oldVal.fields || oldVal.data?.fields || null;
    const newFields = newVal.fields || newVal.data?.fields || null;

    const oldObj = oldFields ? fieldsToObject(oldFields) : (oldVal?.data || oldVal);
    const newObj = newFields ? fieldsToObject(newFields) : (newVal?.data || newVal);

    const oldStatus = (oldObj?.status || '').toString().toLowerCase();
    const newStatus = (newObj?.status || '').toString().toLowerCase();

    const id = event?.id || newVal?.name || newVal?.document || newObj?.id || null;

    // Only trigger summarizer when status changed and new status is in target set
    const triggerStatuses = ['testing', 'qa', 'staging', 'review'];

    if (oldStatus !== newStatus && triggerStatuses.includes(newStatus)) {
      const payload = {
        sourceEvent: 'firestore:tasks.onUpdate',
        id,
        old: oldObj,
        new: newObj,
        rawEvent: event,
      };

      const endpoint = Deno.env.get('SUMMARIZER_ENDPOINT') || Deno.env.get('SUMMARIZER_URL') || 'https://example.com/functions/summarizer';

      if (!endpoint) {
        return new Response(JSON.stringify({ error: 'SUMMARIZER_ENDPOINT not configured' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        });
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const text = await res.text();

      return new Response(JSON.stringify({ ok: true, forwardedTo: endpoint, responseText: text }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    return new Response(JSON.stringify({ ok: false, reason: 'no-status-change-or-not-target-status' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('tasks-onUpdate error', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
