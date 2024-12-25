import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import html2canvas from 'html2canvas';
import axios from 'axios';
import DOMPurify from 'dompurify';

import './App.css';

function App() {
  const [inputText, setInputText] = useState('type something');
  const [fontSize, setFontSize] = useState(60);
  const [isSpaced, setIsSpaced] = useState(false); // New state for spaced letters
  const [userData, setUserData] = useState({});

  const formatText = (text) => {
    return isSpaced ? text.split('').join(' ') : text;
  };

  useEffect(() => {
    const calculateFontSize = () => {
      document.fonts.ready.then(() => {
        const container = document.getElementById('image-container');
        const maxWidth = container.clientWidth - 20;
        const textElement = document.getElementById('text-element');
        const backgroundTextElement = document.getElementById('background-text-element');

        let newFontSize = 50;
        textElement.style.fontSize = `${newFontSize * 1.0125}px`;
        backgroundTextElement.style.fontSize = `${newFontSize}px`;

        while (textElement.clientWidth > maxWidth) {
          newFontSize -= 1;
          textElement.style.fontSize = `${newFontSize}px`;
          backgroundTextElement.style.fontSize = `${newFontSize}px`;
        }

        setFontSize(newFontSize);
      });
    };

    calculateFontSize();
    window.addEventListener('resize', calculateFontSize);

    return () => {
      window.removeEventListener('resize', calculateFontSize);
    };
  }, [inputText, isSpaced]);

  const handleSpacedToggle = () => {
    setIsSpaced((prev) => !prev);
  };

  const handleSave = async (transparentBackground) => {
    // Your save logic remains unchanged
  };

  return (
    <div className="App">
      <h1 className="spinning_dot"> * </h1>
      <h2 className="App-title">I AM MUSIC TEMPLATE</h2>
      <div
        id="image-container"
        className="square-container"
        style={{
          position: 'relative',
          width: '320px',
          height: '320px',
        }}
      >
        <p
          id="background-text-element"
          className="background-text"
        >
          {formatText(inputText.toUpperCase())}
        </p>
        <Draggable>
          <p
            id="text-element"
            className="main-text"
          >
            {formatText(inputText.toUpperCase())}
          </p>
        </Draggable>
      </div>
      <div>
        <input
          className="text-input"
          maxLength={50}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder=""
        />
        <div className="action-buttons">
        <div className="checkbox-container">
            <input
              type="checkbox"
              id="spacedLettersCheckbox"
              checked={isSpaced}
              onChange={handleSpacedToggle}
              style={{ marginRight: "8px" }}
            />
            <label htmlFor="spacedLettersCheckbox">
              spaced letters
            </label>
          </div>
          <div className="checkbox-container">
            <input
              type="checkbox"
              id="transparentBackgroundCheckbox"
              style={{ marginRight: "8px" }}
            />
            <label htmlFor="transparentBackgroundCheckbox">
              transparent background
            </label>
          </div>
          <button className="save-button" onClick={() => handleSave(document.getElementById('transparentBackgroundCheckbox').checked)}>
            Save Image
          </button>
        </div>
      </div>
      <div style={{ margin: "4rem 0" }}>
        <p className="bottom-text">if your text looks bad try spacing the letters or moving the bold text around.</p>
      </div>
    </div>
  );
}

export default App;
