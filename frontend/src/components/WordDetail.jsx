import { useState } from 'react';
import { deleteWord, enrichWord } from '../api.js';

export default function WordDetail({ word, onBack, onDeleted, onUpdated }) {
  const [tab, setTab] = useState('definition');
  const [enriching, setEnriching] = useState(false);
  const [error, setError] = useState('');

  const preps = (() => { try { return JSON.parse(word.prepositions || '[]'); } catch { return []; } })();
  const examples = (() => { try { return JSON.parse(word.examples || '[]'); } catch { return []; } })();

  async function handleDelete() {
    if (!confirm(`Delete "${word.word}"?`)) return;
    try { await deleteWord(word.id); onDeleted(); }
    catch (e) { setError(e.message); }
  }

  async function handleEnrich() {
    setEnriching(true);
    setError('');
    try {
      const updated = await enrichWord(word.id);
      onUpdated(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnriching(false);
    }
  }

  return (
    <div className="detail">
      <div className="detail-header">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <h1 className="detail-word">{word.word}</h1>
        <div className="detail-meta">
          <span className={`pos-badge pos-${word.part_of_speech}`}>{word.part_of_speech}</span>
          {word.is_default === 1 && <span className="default-badge">Default word</span>}
        </div>
        <div className="detail-actions">
          <button className="btn btn-secondary" onClick={handleEnrich} disabled={enriching}>
            {enriching ? 'Re-enriching…' : '↺ Re-enrich with AI'}
          </button>
          {word.is_default !== 1 && (
            <button className="btn btn-danger" onClick={handleDelete}>Delete</button>
          )}
        </div>
        {error && <p className="error-msg">{error}</p>}
      </div>

      <div className="tabs">
        {['definition', 'prepositions', 'grammar', 'examples'].map(t => (
          <button key={t} className={`tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === 'definition' && (
          <p className="definition-text">{word.definition || 'No definition available.'}</p>
        )}
        {tab === 'prepositions' && (
          preps.length
            ? <ul className="prep-list">
                {preps.map((p, i) => (
                  <li key={i} className="prep-item">
                    <div className="prep-tag">"{p.prep}"</div>
                    <div className="prep-use">{p.use}</div>
                    <div className="prep-example">{p.example}</div>
                  </li>
                ))}
              </ul>
            : <p className="status-msg">No preposition data.</p>
        )}
        {tab === 'grammar' && (
          <p className="grammar-text">{word.grammar_notes || 'No grammar notes available.'}</p>
        )}
        {tab === 'examples' && (
          examples.length
            ? <ul className="example-list">
                {examples.map((ex, i) => <li key={i} className="example-item">{ex}</li>)}
              </ul>
            : <p className="status-msg">No examples available.</p>
        )}
      </div>
    </div>
  );
}
