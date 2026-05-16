import { useState, useEffect, useCallback, useRef } from 'react';
import Header from './components/Header.jsx';
import SearchBar from './components/SearchBar.jsx';
import WordList from './components/WordList.jsx';
import WordDetail from './components/WordDetail.jsx';
import AddWord from './components/AddWord.jsx';
import { fetchWords } from './api.js';

export default function App() {
  const [view, setView] = useState('list'); // 'list' | 'detail' | 'add'
  const [selectedWord, setSelectedWord] = useState(null);
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [posFilter, setPosFilter] = useState('');
  const debounceRef = useRef(null);

  const loadWords = useCallback(async (search, pos) => {
    setLoading(true);
    try {
      const data = await fetchWords(search, pos);
      setWords(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadWords(searchQuery, posFilter);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchQuery, posFilter, loadWords]);

  function handleWordAdded(word) {
    setSelectedWord(word);
    setView('detail');
    loadWords(searchQuery, posFilter);
  }

  function handleWordDeleted() {
    setView('list');
    setSelectedWord(null);
    loadWords(searchQuery, posFilter);
  }

  function handleWordUpdated(word) {
    setSelectedWord(word);
    loadWords(searchQuery, posFilter);
  }

  if (view === 'add') {
    return (
      <div className="app">
        <Header wordCount={words.length} onAddWord={() => setView('add')} />
        <AddWord onAdded={handleWordAdded} onCancel={() => setView('list')} />
      </div>
    );
  }

  if (view === 'detail' && selectedWord) {
    return (
      <div className="app">
        <Header wordCount={words.length} onAddWord={() => setView('add')} />
        <WordDetail
          word={selectedWord}
          onBack={() => { setView('list'); setSelectedWord(null); }}
          onDeleted={handleWordDeleted}
          onUpdated={handleWordUpdated}
        />
      </div>
    );
  }

  return (
    <div className="app">
      <Header wordCount={words.length} onAddWord={() => setView('add')} />
      <SearchBar
        query={searchQuery}
        pos={posFilter}
        onQueryChange={setSearchQuery}
        onPosChange={setPosFilter}
      />
      <WordList
        words={words}
        loading={loading}
        onSelect={(w) => { setSelectedWord(w); setView('detail'); }}
      />
    </div>
  );
}
