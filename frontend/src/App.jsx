import { useState } from 'react'
import './App.css'

const sampleNotes = `Action Item: Prepare the release checklist before Friday
Action Item: Confirm the staging deployment owner`

function extractCandidates(notes) {
  return notes
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^action item\s*:/i.test(line))
    .map((line, index) => ({
      id: `${Date.now()}-${index}`,
      summary: line.replace(/^action item\s*:\s*/i, ''),
      extractionMethod: 'pattern',
      status: 'pending',
    }))
}

function App() {
  const [notes, setNotes] = useState('')
  const [candidates, setCandidates] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const loadSample = () => {
    setNotes(sampleNotes)
    setError('')
    setMessage('')
  }

  function handleSubmit(event) {
    event.preventDefault()
    setMessage('')
    setError('')

    if (!notes.trim()) {
      setError('Enter meeting notes before extracting action items.')
      return
    }

    const extracted = extractCandidates(notes)
    setCandidates(extracted)
    setMessage(
      extracted.length
        ? `Found ${extracted.length} action item${extracted.length === 1 ? '' : 's'}.`
        : 'No action items found. Add lines beginning with "Action Item:".',
    )
  }

  function updateStatus(id, status) {
    setCandidates((current) =>
      current.map((candidate) =>
        candidate.id === id ? { ...candidate, status } : candidate,
      ),
    )
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Sprint operations</p>
          <h1>Action Item Desk</h1>
        </div>
        <span className="status-dot">Local workspace</span>
      </header>

      <section className="intro">
        <p className="eyebrow">Meeting notes to review queue</p>
        <h2>Turn conversation into accountable next steps.</h2>
        <p>Paste notes, extract marked action items, and approve the candidates before they move downstream.</p>
      </section>

      <section className="workspace" aria-label="Action item extraction workspace">
        <form className="notes-panel" onSubmit={handleSubmit}>
          <div className="panel-heading">
            <div>
              <p className="eyebrow">01 / Input</p>
              <h3>Meeting notes</h3>
            </div>
            <button type="button" className="text-button" onClick={loadSample}>
              Use sample
            </button>
          </div>
          <label htmlFor="meeting-notes">Raw notes</label>
          <textarea
            id="meeting-notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Paste notes here. Use one Action Item: line per candidate."
            rows="12"
          />
          {error && <p className="feedback error" role="alert">{error}</p>}
          <button className="primary-button" type="submit">Extract action items</button>
        </form>

        <section className="review-panel" aria-live="polite">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">02 / Review</p>
              <h3>Candidate queue</h3>
            </div>
            <span className="count">{candidates.length} items</span>
          </div>
          {message && <p className="feedback success">{message}</p>}
          {!candidates.length ? (
            <div className="empty-state">
              <strong>No candidates yet</strong>
              <span>Extract notes to see proposed action items here.</span>
            </div>
          ) : (
            <ul className="candidate-list">
              {candidates.map((candidate) => (
                <li className={`candidate ${candidate.status}`} key={candidate.id}>
                  <div>
                    <strong>{candidate.summary}</strong>
                    <span>{candidate.extractionMethod} extraction · {candidate.status}</span>
                  </div>
                  <div className="candidate-actions">
                    <button type="button" onClick={() => updateStatus(candidate.id, 'approved')}>Approve</button>
                    <button type="button" onClick={() => updateStatus(candidate.id, 'removed')}>Remove</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </section>
    </main>
  )
}

export default App
