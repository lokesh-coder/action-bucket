import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  RectangleStackIcon,
  ArrowUturnLeftIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/solid';
import {
  PowerIcon,
  FolderOpenIcon,
  EllipsisHorizontalCircleIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import './App.css';

function Hello() {
  const [currentItem, setCurrentItem] = useState<any>(null);
  const inputRef = useRef<any>();
  const [items, setItems] = useState([
    { title: 'close timesheet', id: crypto.randomUUID() },
    { title: 'fix uat issue', id: crypto.randomUUID() },
    { title: 'prepare chart details and send email', id: crypto.randomUUID() },
  ]);

  const colors = [
    '#c44569',
    '#546de5',
    '#f78fb3',
    '#3dc1d3',
    '#e66767',
    '#303952',
    '#2ABFAC',
    '#FEAC03',
    '#FBA5D9',
    '#f5cd79',
    '#e15f41',
    '#f19066',
    '#574b90',
  ];

  const handleChange = (e: any) => {
    setCurrentItem(e.target.value);
  };
  const handleKeyDown = (e: any) => {
    if (e.key !== 'Enter' || !currentItem.trim()) return;
    setItems([
      { title: currentItem, id: crypto.randomUUID() } as any,
      ...items,
    ]);
    setCurrentItem(null);
    (inputRef.current as any).value = null;
  };
  const removeItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
    setCurrentItem(null);
    (inputRef.current as any).value = null;
  };

  const clearAll = () => {
    setItems([]);
    setCurrentItem(null);
    (inputRef.current as any).value = null;
  };

  const quitApp = () => {
    window.electron.ipcRenderer.sendMessage('quit-app', []);
  };

  useEffect(() => {
    window.electron.ipcRenderer.sendMessage('update-count', [items.length]);
  }, [items.length]);

  return (
    <div className="App">
      <div className="heading">
        <RectangleStackIcon width={20} fill={'#63acda'} /> Action items
      </div>
      <div className="input-wrapper">
        <input
          type="text"
          placeholder="Type here..."
          ref={inputRef}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          maxLength={40}
        />
        <ArrowUturnLeftIcon width={20} style={{}} />
      </div>
      <div className="action-items-wrapper">
        <ul className="action-items">
          {items.length === 0 ? (
            <div className="no-action-items">
              <FolderOpenIcon width={30} /> <div>No items to display</div>
            </div>
          ) : null}
          {items.map((item, index) => {
            const col = colors[index % colors.length];
            return (
              <li onClick={() => removeItem(item.id)} key={item.id}>
                <EllipsisHorizontalCircleIcon
                  width={20}
                  className="active"
                  stroke={col}
                />
                <CheckCircleIcon width={20} className="hover" fill={col} />
                {item.title}
              </li>
            );
          })}
        </ul>
      </div>
      <hr />
      <footer>
        <button onClick={clearAll}>
          <TrashIcon width={16} style={{ marginRight: 5 }} /> Clear all
        </button>
        <button onClick={quitApp}>
          <PowerIcon width={16} />
        </button>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
