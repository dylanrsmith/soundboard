import React, { useState, useEffect, useRef } from 'react';
import { Howl } from 'howler';

// Individual sounds for live mixing
const sounds = [
  { name: 'Rain', emoji: '🌧️', url: '/sounds/rain_eq.mp3' },
  { name: 'Fireplace', emoji: '🔥', url: '/sounds/fire_trim.mp3' },
  { name: 'Train', emoji: '🚂', url: '/sounds/train.mp3' },
  { name: 'Birds', emoji: '🐦‍⬛', url: '/sounds/birds.mp3' },
  { name: 'Wind', emoji: '🌬️', url: '/sounds/wind_trimmed.mp3' },
  { name: 'Jazz Loop', emoji: '🎷', url: '/sounds/piano_trimmed.mp3' },
  { name: 'Chimes', emoji: '🔔', url: '/sounds/chimes.mp3' },
  { name: 'Angel Pad', emoji: '👼', url: '/sounds/angel_pad.mp3' },
];

// Utility to encode AudioBuffer to WAV
function audioBufferToWav(buffer) {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataLength = buffer.length * blockAlign;
  const bufferLength = 44 + dataLength;
  const wav = new ArrayBuffer(bufferLength);
  const view = new DataView(wav);

  /* RIFF identifier */ writeString(view, 0, 'RIFF');
  /* file length */ view.setUint32(4, 36 + dataLength, true);
  /* RIFF type */ writeString(view, 8, 'WAVE');
  /* format chunk identifier */ writeString(view, 12, 'fmt ');
  /* format chunk length */ view.setUint32(16, 16, true);
  /* sample format (raw) */ view.setUint16(20, format, true);
  /* channel count */ view.setUint16(22, numChannels, true);
  /* sample rate */ view.setUint32(24, sampleRate, true);
  /* byte rate (sample rate * block align) */ view.setUint32(28, byteRate, true);
  /* block align (channel count * bytes per sample) */ view.setUint16(32, blockAlign, true);
  /* bits per sample */ view.setUint16(34, bitDepth, true);
  /* data chunk identifier */ writeString(view, 36, 'data');
  /* data chunk length */ view.setUint32(40, dataLength, true);

  // write interleaved PCM samples
  let offset = 44;
  const channels = [];
  for (let i = 0; i < numChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }
  for (let i = 0; i < buffer.length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      let sample = Math.max(-1, Math.min(1, channels[ch][i]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(offset, sample, true);
      offset += 2;
    }
  }
  return wav;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

const LoFiSoundboard = () => {
  const [playing, setPlaying] = useState({});
  const [presets, setPresets] = useState([]);
  const [currentPreset, setCurrentPreset] = useState(null);
  const audioRef = useRef(null);

  // iOS audio unlock
  useEffect(() => {
    const unlock = () => {
      const silent = new Howl({ src: ['/sounds/silence.mp3'], volume: 0 });
      silent.play();
      document.removeEventListener('click', unlock);
    };
    document.addEventListener('click', unlock, { once: true });
  }, []);

  // Toggle live sound
  const toggleSound = (sound) => {
    setCurrentPreset(null);
    const entry = playing[sound.name];
    if (entry) {
      entry.howl.stop();
      setPlaying(prev => ({ ...prev, [sound.name]: null }));
    } else {
      const howl = new Howl({ src: [sound.url], loop: true, volume: 0.5 });
      howl.play();
      setPlaying(prev => ({ ...prev, [sound.name]: { howl, volume: 0.5 } }));
    }
  };

  // Stop all live sounds
  const stopAll = () => {
    Object.values(playing).forEach(e => e?.howl?.stop());
    setPlaying({});
    setCurrentPreset(null);
    if (audioRef.current) audioRef.current.pause();
  };

  // Update volume
  const updateVolume = (name, vol) => {
    setPlaying(prev => {
      const entry = prev[name]; if (!entry) return prev;
      entry.howl.volume(vol);
      return { ...prev, [name]: { ...entry, volume: vol } };
    });
  };

  // Save preset capturing live mix
  const savePreset = () => {
    const mix = Object.entries(playing)
      .filter(([, e]) => e)
      .map(([name, e]) => ({ name, volume: e.volume }));
    if (!mix.length) return;
    const label = prompt('Name your preset:', `My Mix ${presets.length + 1}`);
    if (!label) return;
    setPresets(prev => [...prev, { label, mix }]);
  };

  // Generate audio blob for preset mix
  const generateMix = async (mix) => {
    const duration = 44;
    const sampleRate = 44100;
    const offlineCtx = new OfflineAudioContext(2, duration * sampleRate, sampleRate);
    for (const item of mix) {
      const snd = sounds.find(s => s.name === item.name);
      if (!snd) continue;
      const resp = await fetch(snd.url);
      const arrayBuffer = await resp.arrayBuffer();
      const decoded = await offlineCtx.decodeAudioData(arrayBuffer);
      const source = offlineCtx.createBufferSource();
      source.buffer = decoded;
      source.loop = true;
      source.connect(offlineCtx.destination);
      source.start(0);
    }
    const rendered = await offlineCtx.startRendering();
    const wavBuffer = audioBufferToWav(rendered);
    const blob = new Blob([wavBuffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  };

  // Play preset via <audio> fallback
  const playPreset = async (preset) => {
    stopAll();
    setCurrentPreset(preset.label);
    const blobUrl = await generateMix(preset.mix);
    if (audioRef.current) {
      audioRef.current.src = blobUrl;
      audioRef.current.loop = true;
      audioRef.current.play();
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-blue-800 to-red-900 text-white p-6">
      {/* Background image or GIF */}
      <div
        className="absolute inset-0 -z-10 bg-cover bg-center"
        style={{ backgroundImage: "url('images/vfv9n2yg.png')" }}
      />

      <h1 className="text-3xl font-bold mb-6 text-center relative z-10">Smitty's Soundboard</h1>

      {/* Live mixing grid */}
      <div className="relative z-10 flex justify-center items-end gap-6 mb-6 flex-wrap">
        {sounds.map(sound => (
          <div key={sound.name} className={`flex flex-col items-center p-4 rounded-2xl shadow-lg ${playing[sound.name] ? 'bg-purple-600' : 'bg-gray-700 hover:bg-purple-500'}`}>
            {playing[sound.name] && (
              <input type="range" min={0} max={1} step={0.01} value={playing[sound.name].volume}
                onChange={e => updateVolume(sound.name, parseFloat(e.target.value))}
                className="h-24 w-2 mb-4 accent-purple-300 rotate-180" style={{ writingMode: 'bt-lr' }} />
            )}
            <button onClick={() => toggleSound(sound)} className="flex flex-col items-center w-24">
              <div className="text-4xl mb-1">{sound.emoji}</div>
              <div className="text-sm font-semibold text-center">{sound.name}</div>
            </button>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="relative z-10 flex justify-center gap-4 mb-6">
        <button onClick={savePreset} className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded font-semibold shadow-md">Save Preset 💾</button>
        <button onClick={stopAll} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-semibold shadow-md">Stop All ⛔</button>
      </div>

      {/* Saved Presets */}
      {presets.length > 0 && (
        <div className="relative z-10 max-w-md mx-auto mb-6">
          <h2 className="text-xl mb-2">Your Presets</h2>
          <div className="flex flex-wrap gap-4">
            {presets.map((p, idx) => (
              <button key={idx} onClick={() => playPreset(p)} className={`px-3 py-1 rounded-md shadow ${currentPreset === p.label ? 'bg-green-600' : 'bg-gray-700 hover:bg-green-500'} font-medium`}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {/* Hidden audio element for background playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
};

export default LoFiSoundboard;
