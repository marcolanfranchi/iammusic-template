import { inject } from '@vercel/analytics';
import { SpeedInsights } from "@vercel/speed-insights/react"
import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

inject();

function App() {
  const [inputText, setInputText] = useState('try somethin😂');
  const [fontSize, setFontSize] = useState(60);

  const loadFonts = async () => {
    await document.fonts.load('12px "OptiSpire"');
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

        let newFontSize = 60;
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
      <h1 className="spinning_dot"> * </h1>
      <h2 className="App-title">I AM MUSIC TEMPLATE</h2>
      <div
        id="image-container"
        className="square-container"
        style={{
          position: 'relative',
          width: '320x',
          height: '320px',
        }}
      >
        <p
          id="background-text-element"
          className="background-text"
        >
          {inputText.toUpperCase().replace(/ /g, '\u00A0\u00A0')}
        </p>
        <p
  id="text-element"
  className="main-text"
>
{inputText.toUpperCase().replace(/ /g, '\u00A0\u00A0')}
</p>

      </div>
      <div>
        <input
          maxLength={50}
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Enter text"
        />
        <SpeedInsights />
      </div>
      <button onClick={generateImage}>Download Image</button>
    </div>
  );
}

export default App;
