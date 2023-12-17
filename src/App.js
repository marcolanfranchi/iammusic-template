import { inject } from '@vercel/analytics';
import React, { useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import './App.css';

inject();

function App() {
  const [inputText, setInputText] = useState('i am ***');
  const [fontSize, setFontSize] = useState(60);

  const loadFonts = async () => {
    await document.fonts.load('12px "OptiSpire"');
    await document.fonts.load('12px "Swiss 911 Compressed Bold"');
    await document.fonts.load('12px "Swiss 721 Black Extended"');
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
      <h1>  *  </h1>
      <h2>I AM MUSIC TEMPLATE</h2>
      <div
        id="image-container"
        className="square-container"
        style={{
          position: 'relative',
          width: '300x',
          height: '300px',
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
            transform: 'translate(-54%, -52%) scaleY(2.75) scaleX(0.99)',
            margin: '0 10px',
            zIndex: 0,
          }}
        >
          {inputText.toUpperCase()}
        </p>
        <p
          id="text-element"
          style={{
            fontFamily: 'Swiss 721 Black Extended',
            fontSize: `${fontSize}px`,
            fontWeight: '800',
            whiteSpace: 'nowrap',
            transform: 'scaleY(1) scaleX(1))',
            margin: '0 10px',
            zIndex: 1,
          }}
        >
          {inputText.toUpperCase()}
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
      </div>
      <button onClick={generateImage}>Download Image</button>
    </div>
  );
}

export default App;
