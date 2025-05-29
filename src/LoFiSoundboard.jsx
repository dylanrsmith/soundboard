// @ Code Written by Smitty
// @ This code is a React component for a Lo-Fi soundboard that plays various ambient sounds.
// @ It uses the Howler.js library for audio playback and includes features like volume control and stopping all sounds.
// @ The component is styled with Tailwind CSS for a modern and responsive design.
// @ The soundboard includes sounds like rain, fireplace, vinyl crackle, train, jazz loop, birds, wind, etc...
// @ The code is designed to be user-friendly and visually appealing, with a focus on accessibility and ease of use.
// @ The soundboard is intended for use in a web application, providing a relaxing and immersive audio experience.

import React, { useState, useEffect } from 'react';
import { Howl } from 'howler';

const sounds = [
  { name: 'Rain', emoji: '🌧️', url: '/sounds/rain_eq.mp3' },
  { name: 'Fireplace', emoji: '🔥', url: '/sounds/fire_trim.mp3' },
  // { name: 'Vinyl Crackle', emoji: '📻', url: '/sounds/vinyl.mp3' },
  { name: 'Train', emoji: '🚂', url: '/sounds/train.mp3' },
  { name: 'Birds', emoji: '🐦‍⬛', url: '/sounds/birds.mp3' },
  { name: 'Wind', emoji: '🌬️', url: '/sounds/wind_trimmed.mp3' },
  { name: 'Jazz Loop', emoji: '🎷', url: '/sounds/piano_trimmed.mp3' },
  { name: 'Chimes', emoji: '🔔', url: '/sounds/chimes.mp3' },
  { name: 'Angel Pad', emoji: '👼', url: '/sounds/angel_pad.mp3' },
];

const LoFiSoundboard = () => {
  const [playing, setPlaying] = useState({});

  // Unlock audio context on first user interaction - fix for iOS and some browsers
  useEffect(() => {
    const unlock = () => {
      console.log('unlocking');
      const silent = new Howl({
        src: ['/sounds/silence.mp3'],
        volume: 0,
      });
      silent.play();
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
  }, []);

  const toggleSound = (sound) => {
    const isPlaying = playing[sound.name];

    if (isPlaying) {
      isPlaying.howl.stop();
      setPlaying((prev) => ({ ...prev, [sound.name]: null }));
    } else {
      const howl = new Howl({
        src: [sound.url],
        loop: true,
        volume: 0.5,
      });
      howl.play();
      setPlaying((prev) => ({
        ...prev,
        [sound.name]: { howl, volume: 0.5 },
      }));
    }
  };

  // Function to stop all sounds
  const stopAll = () => {
    Object.values(playing).forEach((entry) => {
      if (entry?.howl) entry.howl.stop();
    });
    setPlaying({});
  };

  // Function to update volume of a specific sound
  const updateVolume = (soundName, volume) => {
    const entry = playing[soundName];
    if (entry && entry.howl) {
      entry.howl.volume(volume);
      setPlaying((prev) => ({
        ...prev,
        [soundName]: {
          ...entry,
          volume,
        },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-800 to-gray-900 text-white p-6">
      <h1 className="text-3xl font-bold mb-6 text-center">🎧 Smitty's Soundboard</h1>

      <div className="flex justify-center items-end gap-6 mb-10 flex-wrap">
        {sounds.map((sound) => (
          <div
            key={sound.name}
            className={`flex flex-col items-center p-4 rounded-2xl shadow-lg transition-all duration-200 ${
              playing[sound.name] ? 'bg-purple-600' : 'bg-gray-700 hover:bg-purple-500'
            }`}
          >
            {playing[sound.name] && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={playing[sound.name].volume}
                onChange={(e) =>
                  updateVolume(sound.name, parseFloat(e.target.value))
                }
                className="h-24 w-2 mb-4 accent-purple-300 rotate-180"
                style={{ writingMode: 'bt-lr' }}
              />
            )}
            <button
              onClick={() => toggleSound(sound)}
              className="flex flex-col items-center justify-center w-24"
            >
              <div className="text-4xl mb-1">{sound.emoji}</div>
              <div className="text-sm font-semibold text-center">{sound.name}</div>
            </button>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-4 flex-wrap mt-10">
        <button
          onClick={stopAll}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-semibold shadow-md"
        >
          Stop All Sounds ⛔
        </button>
      </div>
    </div>
  );
};

export default LoFiSoundboard;
