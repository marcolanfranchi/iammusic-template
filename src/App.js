import { inject } from '@vercel/analytics';
import { SpeedInsights } from "@vercel/speed-insights/react";
import React, { useState, useEffect } from 'react';
import Draggable from 'react-draggable';
import { collection, addDoc, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebaseConfig';
import html2canvas from 'html2canvas';
import axios from 'axios';
import DOMPurify from 'dompurify';

import './App.css';

inject();

function App() {
  const [inputText, setInputText] = useState('type something');
  const [fontSize, setFontSize] = useState(60);
  const [userData, setUserData] = useState({});

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
  }, [inputText]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const apiKey = process.env.REACT_APP_IPINFO_API_KEY;
        const response = await axios.get(`https://ipinfo.io/json?token=${apiKey}`);
        setUserData(response.data);
      } catch (error) {
        console.error('Error fetching user data: ', error);
      }
    };

    fetchUserData();
  }, []);

  const fetchMostRecentEntry = async () => {
    const textsCollection = collection(db, 'texts');
    const q = query(textsCollection, orderBy('timestamp', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data();
    }
    return null;
  };

  const handleSave = async () => {
    try {
      const sanitizedInputText = DOMPurify.sanitize(inputText);

      const os = navigator.platform;
      const { ip, country, region, city, loc } = userData;
      const newEntry = {
        timestamp: new Date(),
        text: sanitizedInputText,
        ip,
        country,
        region,
        city,
        location: loc,
        os,
      };

      const recentEntry = await fetchMostRecentEntry();

      if (recentEntry) {
        const recentTimestamp = recentEntry.timestamp.toDate();
        const now = new Date();
        const timeDiff = Math.abs(now - recentTimestamp);
        const tenMinutes = 10 * 60 * 1000;

        if (
          timeDiff < tenMinutes &&
          recentEntry.text.lower === newEntry.text.lower &&
          recentEntry.ip === newEntry.ip &&
          recentEntry.os === newEntry.os
        ) {
          console.log('Duplicate entry, not saving to the database');
          return;
        }
      }

      await addDoc(collection(db, 'texts'), newEntry);
      console.log('Text saved successfully');

      const imageContainer = document.getElementById('image-container');

      html2canvas(imageContainer).then(canvas => {
        canvas.toBlob(blob => {
          const file = new File([blob], 'image.png', { type: 'image/png' });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            navigator.share({
              files: [file],
              title: 'I AM MUSIC TEMPLATE',
              // text: 'Check out this image!'
            })
              .then(() => console.log('Share successful'))
              .catch(error => console.error('Share failed', error));
          } else {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'image.png';
            link.click();
          }
        }, 'image/png');
      });

    } catch (e) {
      console.error('Error adding document: ', e);
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
        <button className="save-button" onClick={handleSave}>Save Image</button>
        <SpeedInsights />
      </div>
      <p className="bottom-text">you can move the bold text around</p>
      <p className="bottom-text">if it still looks bad, some words just work better than others</p>
    </div>
  );
}

export default App;
