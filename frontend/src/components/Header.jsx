export default function Header({ wordCount, onAddWord }) {
  return (
    <header className="header">
      <div className="header-title">C2 <span>Vocabulary</span></div>
      <div className="header-right">
        <span className="badge">{wordCount} words</span>
        <button className="btn btn-primary" onClick={onAddWord}>+ Add Word</button>
      </div>
    </header>
  );
}
