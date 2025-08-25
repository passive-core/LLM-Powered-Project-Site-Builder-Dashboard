export type AlertPayload = { title: string; message: string }

export const sendAlert = async (payload: AlertPayload) => {
  try {
    // Placeholder: integrate with email/Slack/webhook later
    console.warn('ALERT:', payload.title, payload.message)
    // Optionally send to server-side alerting endpoint
    // fetch('/api/alerts', { method: 'POST', body: JSON.stringify(payload) })
  } catch (err) {
    console.error('Failed to send alert', err)
  }
}
