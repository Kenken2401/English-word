export default function SearchBar({ query, pos, onQueryChange, onPosChange }) {
  return (
    <div className="search-bar">
      <input
        className="search-input"
        type="text"
        placeholder="Search words or definitions…"
        value={query}
        onChange={e => onQueryChange(e.target.value)}
      />
      <select className="search-select" value={pos} onChange={e => onPosChange(e.target.value)}>
        <option value="">All parts of speech</option>
        <option value="noun">Noun</option>
        <option value="verb">Verb</option>
        <option value="adjective">Adjective</option>
        <option value="adverb">Adverb</option>
      </select>
    </div>
  );
}
