import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';

import './App.css';

function App() {
  const [inputText, setInputText] = useState('i am ***');
  const [fontSize, setFontSize] = useState(60); // Increased font size for better quality

  const loadFonts = async () => {
    await document.fonts.load('12px "OptiSpire"');
    await document.fonts.load('12px "Swiss 911 Compressed Bold"');
  };

  const generateImage = async () => {
    await loadFonts();

    const element = document.getElementById('image-container');

    html2canvas(element, { scale: 2 }).then((canvas) => {
      const dataURL = canvas.toDataURL();
      const link = document.createElement('a');
      link.href = dataURL;
      link.download = inputText.replace(/ /g, '_') + '.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  useEffect(() => {
    const calculateFontSize = () => {
      document.fonts.ready.then(() => {
        const container = document.getElementById('image-container');
        const maxWidth = container.clientWidth - 20;
        const textElement = document.getElementById('text-element');
        const backgroundTextElement = document.getElementById('background-text-element');

        let newFontSize = 60; // Increased starting font size
        textElement.style.fontSize = `${newFontSize}px`;
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

  return (
    <div className="App">
      <h1>  *  </h1>
      <h2>I AM MUSIC TEMPLATE</h2>
      <input
        maxLength={50}
        type="text"
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Enter text"
      />
      <div
        id="image-container"
        className="square-container"
        style={{
          position: 'relative',
          width: '400px',
          height: '400px',
        }}
      >
        <p
          id="background-text-element"
          style={{
            fontFamily: 'OptiSpire',
            fontSize: `${fontSize}px`,
            fontWeight: '300',
            whiteSpace: 'nowrap',
            color: 'black',
            textAlign: 'center',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50.6%, -50%) scaleY(2.7) scaleX(1)',
            margin: '0',
            zIndex: 0,
          }}
        >
          {inputText.toUpperCase()}
        </p>
        <p
          id="text-element"
          style={{
            fontFamily: 'Swiss 911 Compressed Bold',
            fontSize: `${fontSize}px`,
            fontWeight: '825',
            whiteSpace: 'nowrap',
            transform: 'scaleY(0.7) scaleX(1))',
            margin: '0 10px',
            zIndex: 1,
          }}
        >
          {inputText.toUpperCase()}
        </p>
      </div>
      <button onClick={generateImage}>Download Image</button>
    </div>
  );
}

export default App;
