export default function WordCard({ word, onClick }) {
  return (
    <div className="word-card" onClick={onClick}>
      <span className={`pos-badge pos-${word.part_of_speech}`}>{word.part_of_speech}</span>
      <div className="word-card-title">{word.word}</div>
      <div className="word-card-def">{word.definition}</div>
    </div>
  );
}
