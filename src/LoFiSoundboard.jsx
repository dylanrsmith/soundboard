import React, { useState } from 'react';
import { Howl } from 'howler';

const sounds = [
  {
    name: 'Rain',
    emoji: '🌧️',
    url: '/sounds/rain.mp3',
  },
  {
    name: 'Fireplace',
    emoji: '🔥',
    url: '/sounds/fire.mp3',
  },
  {
    name: 'Vinyl Crackle',
    emoji: '📻',
    url: '/sounds/vinyl.mp3',
  },
  {
    name: 'Train',
    emoji: '🚂',
    url: '/sounds/train.mp3',
  },
  {
    name: 'Jazz Loop',
    emoji: '🎷',
    url: '/sounds/jazz.mp3',
  },
  {
    name: 'Birds',
    emoji: '🐦‍⬛',
    url: '/sounds/birds.mp3',
  },
];

const LoFiSoundboard = () => {
  const [playing, setPlaying] = useState({});

  const toggleSound = (sound) => {
    const isPlaying = playing[sound.name];

    if (isPlaying) {
      console.log(`Stopping ${sound.name}`);
      isPlaying.howl.stop();
      setPlaying((prev) => ({ ...prev, [sound.name]: null }));
    } else {
      console.log(`Playing ${sound.name}`);
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

  const stopAll = () => {
    Object.values(playing).forEach((entry) => {
      if (entry?.howl) entry.howl.stop();
    });
    setPlaying({});
  };

  const playChillCombo = () => {
    const combo = ['Rain', 'Vinyl Crackle', 'Jazz Loop'];
    combo.forEach((name) => {
      const sound = sounds.find((s) => s.name === name);
      if (!playing[name]) {
        const howl = new Howl({
          src: [sound.url],
          loop: true,
          volume: 0.5,
        });
        howl.play();
        setPlaying((prev) => ({
          ...prev,
          [name]: { howl, volume: 0.5 },
        }));
      }
    });
  };

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

      <div className="flex justify-center gap-4 mb-6 flex-wrap">
        <button
          onClick={stopAll}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded text-white font-semibold shadow-md"
        >
          Stop All Sounds ⛔
        </button>
        <button
          onClick={playChillCombo}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white font-semibold shadow-md"
        >
          Chill Rain Combo 🌧️📻🎷
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {sounds.map((sound) => (
          <div
            key={sound.name}
            className={`p-6 rounded-2xl shadow-lg transition-all duration-200 ${
              playing[sound.name] ? 'bg-purple-600' : 'bg-gray-700 hover:bg-purple-500'
            }`}
          >
            <button
              onClick={() => toggleSound(sound)}
              className="w-full text-left"
            >
              <div className="text-4xl mb-2">{sound.emoji}</div>
              <div className="text-lg font-semibold">{sound.name}</div>
            </button>
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
                className="w-full mt-4 accent-purple-400"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LoFiSoundboard;
