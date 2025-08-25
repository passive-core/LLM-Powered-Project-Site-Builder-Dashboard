import React, { useState } from 'react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card } from './ui/Card'

interface Props {
  projectId?: string
}

export function AIIdeaClassifier({ projectId }: Props) {
  const [idea, setIdea] = useState('')
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleClassify = async () => {
    if (!idea.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/functions/idea-classifier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, projectId })
      })
      const json = await res.json()
      setResult(json.result)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <div className="space-y-4">
        <Input value={idea} onChange={(e:any) => setIdea(e.target.value)} placeholder="Paste or type a high-level idea..." />
        <div className="flex gap-2">
          <Button onClick={handleClassify} disabled={loading}>{loading ? 'Classifying...' : 'Classify Idea'}</Button>
        </div>
        {result && (
          <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        )}
      </div>
    </Card>
  )
}
