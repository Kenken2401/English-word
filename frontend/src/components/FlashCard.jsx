import { useState, useEffect, useCallback } from 'react';
import { fetchWords } from '../api.js';

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseJSON(str, fallback = []) {
  try { return JSON.parse(str || '[]'); } catch { return fallback; }
}

export default function FlashCard({ onBack }) {
  const [deck, setDeck] = useState([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [posFilter, setPosFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [side, setSide] = useState('definition'); // 'definition' | 'prepositions' | 'grammar' | 'examples'

  const loadDeck = useCallback(async (pos) => {
    setLoading(true);
    try {
      const data = await fetchWords('', pos);
      setDeck(shuffle(data));
      setIndex(0);
      setFlipped(false);
    } catch {
      setDeck([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDeck(posFilter); }, [posFilter, loadDeck]);

  function reshuffle() {
    setDeck(d => shuffle(d));
    setIndex(0);
    setFlipped(false);
  }

  function go(dir) {
    setFlipped(false);
    setIndex(i => Math.max(0, Math.min(deck.length - 1, i + dir)));
  }

  if (loading) return <div className="fc-shell"><p className="status-msg">Loading deck…</p></div>;
  if (!deck.length) return <div className="fc-shell"><p className="status-msg">No words found.</p></div>;

  const card = deck[index];
  const preps = parseJSON(card.prepositions);
  const examples = parseJSON(card.examples);
  const progress = Math.round(((index + 1) / deck.length) * 100);

  return (
    <div className="fc-shell">
      <div className="fc-toolbar">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <div className="fc-toolbar-right">
          <select className="search-select" value={posFilter} onChange={e => setPosFilter(e.target.value)}>
            <option value="">All parts of speech</option>
            <option value="noun">Noun</option>
            <option value="verb">Verb</option>
            <option value="adjective">Adjective</option>
            <option value="adverb">Adverb</option>
          </select>
          <button className="btn btn-secondary" onClick={reshuffle} title="Reshuffle deck">⇄ Shuffle</button>
        </div>
      </div>

      <div className="fc-progress-bar">
        <div className="fc-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="fc-counter">{index + 1} / {deck.length}</p>

      <div className={`fc-card-wrap${flipped ? ' flipped' : ''}`} onClick={() => setFlipped(f => !f)}>
        <div className="fc-card">
          {/* Front */}
          <div className="fc-face fc-front">
            <span className={`pos-badge pos-${card.part_of_speech}`}>{card.part_of_speech}</span>
            <div className="fc-word">{card.word}</div>
            <p className="fc-hint">tap to reveal</p>
          </div>

          {/* Back */}
          <div className="fc-face fc-back">
            <div className="fc-back-tabs">
              {['definition','prepositions','grammar','examples'].map(t => (
                <button
                  key={t}
                  className={`fc-tab${side === t ? ' active' : ''}`}
                  onClick={e => { e.stopPropagation(); setSide(t); }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
            <div className="fc-back-content">
              <div className="fc-word-sm">{card.word}</div>

              {side === 'definition' && (
                <p className="fc-def">{card.definition || 'No definition.'}</p>
              )}

              {side === 'prepositions' && (
                preps.length
                  ? <ul className="prep-list">
                      {preps.map((p, i) => (
                        <li key={i} className="prep-item">
                          <span className="prep-tag">"{p.prep}"</span>
                          <div className="prep-use">{p.use}</div>
                          <div className="prep-example">{p.example}</div>
                        </li>
                      ))}
                    </ul>
                  : <p className="fc-def">No preposition data.</p>
              )}

              {side === 'grammar' && (
                <p className="grammar-text">{card.grammar_notes || 'No grammar notes.'}</p>
              )}

              {side === 'examples' && (
                examples.length
                  ? <ul className="example-list">
                      {examples.map((ex, i) => <li key={i} className="example-item">{ex}</li>)}
                    </ul>
                  : <p className="fc-def">No examples.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="fc-nav">
        <button className="btn btn-secondary fc-nav-btn" onClick={() => go(-1)} disabled={index === 0}>← Prev</button>
        <button className="btn btn-secondary fc-nav-btn" onClick={() => { setFlipped(false); setSide('definition'); go(1); }} disabled={index === deck.length - 1}>Next →</button>
      </div>

      <p className="fc-flip-hint">{flipped ? 'Click card to flip back' : 'Click card to reveal answer'}</p>
    </div>
  );
}
