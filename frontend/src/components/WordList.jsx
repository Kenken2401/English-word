import WordCard from './WordCard.jsx';

export default function WordList({ words, loading, onSelect }) {
  if (loading) return <p className="status-msg">Loading…</p>;
  if (!words.length) return <p className="status-msg">No words found.</p>;
  return (
    <div className="word-grid">
      {words.map(w => (
        <WordCard key={w.id} word={w} onClick={() => onSelect(w)} />
      ))}
    </div>
  );
}
