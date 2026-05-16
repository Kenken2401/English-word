import { useState } from 'react';
import { addWord } from '../api.js';

export default function AddWord({ onAdded, onCancel }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const word = input.trim();
    if (!word) return;
    setLoading(true);
    setError('');
    try {
      const result = await addWord(word);
      if (result.error) { setError(result.error); return; }
      onAdded(result);
    } catch (err) {
      if (err.status === 409 && err.data?.word) {
        onAdded(err.data.word);
        return;
      }
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="add-word">
      <h2>Add a New Word</h2>
      <p>Enter any English word. Claude AI will automatically fill in its definition, prepositions, grammar notes, and examples.</p>
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <input
            className="text-input"
            type="text"
            placeholder="e.g. sycophant"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
          />
          <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>
            {loading ? 'Enriching…' : 'Add'}
          </button>
          <button className="btn btn-secondary" type="button" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
        </div>
        {loading && <p className="loading-msg">Fetching word data from Claude AI…</p>}
        {error && <p className="error-msg">{error}</p>}
      </form>
    </div>
  );
}
