import { inject } from '@vercel/analytics';
import { SpeedInsights } from "@vercel/speed-insights/react"
import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { db } from './firebase'; // Import Firestore instance
import { collection, addDoc, serverTimestamp } from "firebase/firestore"; // Import Firestore functions

import './App.css';

inject();

function App() {
  const [inputText, setInputText] = useState('type something');
  const [fontSize, setFontSize] = useState(60);
  const [successMessage, setSuccessMessage] = useState(''); // State for success message

  useEffect(() => {
    const calculateFontSize = () => {
      document.fonts.ready.then(() => {
        const container = document.getElementById('image-container');
        const maxWidth = container.clientWidth - 20;
        const textElement = document.getElementById('text-element');
        const backgroundTextElement = document.getElementById('background-text-element');

        let newFontSize = 50;
        textElement.style.fontSize = `${newFontSize*1.0125}px`;
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
  }, [inputText]);

  const saveText = async () => {
    try {
      await addDoc(collection(db, "userSubmissions"), {
        text: inputText,
        timestamp: serverTimestamp()
      });
      setSuccessMessage('Done'); // Set success message
      setTimeout(() => setSuccessMessage(''), 3000); // Clear message after 3 seconds
    } catch (e) {
      console.error("Error adding document: ", e);
      alert("Error saving text. Please try again.");
    }
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
          {inputText.toUpperCase()}
        </p>
        <Draggable>
          <p
            id="text-element"
            className="main-text"
          >
            {inputText.toUpperCase()}
          </p>
        </Draggable>
      </div>
      <div>
        <input
          className="text-input"
          maxLength={25}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder=""
        />
        <button onClick={saveText} className="save-button">Save</button>
        <span className="success-message">{successMessage}</span> {/* Success message */}
        <SpeedInsights />
      </div>
      <p className="bottom-text">you can move the bold text around</p>
      <p className="bottom-text">if it still looks bad, some words just work better than others</p>
    </div>
  );
}

export default App;
