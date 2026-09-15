import React from 'react';
import { X, Eye, Zap, BookOpen, Brain, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

interface TrainingTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TrainingTipsModal: React.FC<TrainingTipsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const techniques = [
    {
      title: '1. The Retinal After-Image Snapshot',
      badge: 'Sensory Physics',
      icon: <Eye className="w-5 h-5 text-cyan-400" />,
      tagColor: 'text-cyan-400 bg-cyan-950 border-cyan-800',
      summary:
        'When a high-contrast tile flashes, photoreceptor rhodopsin in your retina bleaches briefly, creating an "iconic memory trace" lasting 800ms to 2.5 seconds.',
      actionTip:
        'Immediately after the flash, blink once softly. Rather than searching your internal memory, look directly at the blank canvas: you will notice the translucent after-glow of the tiles lingering on your retina.',
    },
    {
      title: '2. Constellation Chunking (Geometric Enclosure)',
      badge: 'Visual Gestalt',
      icon: <Sparkles className="w-5 h-5 text-purple-400" />,
      tagColor: 'text-purple-400 bg-purple-950 border-purple-800',
      summary:
        'Human working memory can only hold 4–5 individual coordinates. However, if those coordinates are connected into a single geometric polygon, the visual cortex encodes it as 1 shape.',
      actionTip:
        'When 6–8 tiles illuminate, do NOT count them. Draw an imaginary continuous line connecting them—a lightning bolt, a kite, an "L" shape, or triangle clusters. You only need to remember 1 or 2 shapes instead of 8 coordinates.',
    },
    {
      title: '3. The Chimpanzee Panoramic Gaze (Foveal Stillness)',
      badge: 'Primates & Ayumu',
      icon: <Zap className="w-5 h-5 text-amber-400" />,
      tagColor: 'text-amber-400 bg-amber-950 border-amber-800',
      summary:
        'Each saccadic eye movement takes 180ms. If you move your eyes across 5 numbers, you spend almost a full second just relocating your lens, losing the flash entirely.',
      actionTip:
        'Fixate your eyes strictly on the geometric dead-center of the board. Defocus slightly to engage your peripheral rods. Take in all numbers at once without darting your eyes.',
    },
    {
      title: '4. Subvocal Suppression (Mute the Inner Voice)',
      badge: 'Cognitive Speed',
      icon: <Brain className="w-5 h-5 text-emerald-400" />,
      tagColor: 'text-emerald-400 bg-emerald-950 border-emerald-800',
      summary:
        'Saying numbers in your mind ("one, three, six...") forces optic data into the slow phonological loop, which tops out at 2–3 items per second.',
      actionTip:
        'Keep your tongue resting lightly against the roof of your mouth. Forbid internal speech during the flash. Let your finger instinctively navigate to the lingering visual coordinates.',
    },
    {
      title: '5. Dual N-Back Working Memory Expansion',
      badge: 'Neuroplasticity',
      icon: <Brain className="w-5 h-5 text-sky-400" />,
      tagColor: 'text-sky-400 bg-sky-950 border-sky-800',
      summary:
        'Tracking a spatial position and an auditory letter simultaneously isolates executive attention, forcing the brain to discard old items and maintain new items continuously.',
      actionTip:
        'Use keyboard hotkeys (A for Position, L for Sound). Keep a rolling queue in your mind: as the new item arrives, drop the oldest one and mentally bump the rest.',
    },
    {
      title: '6. The Major System & Spatial Memory Palace',
      badge: 'Mnemonic Pegs',
      icon: <Sparkles className="w-5 h-5 text-amber-400" />,
      tagColor: 'text-amber-400 bg-amber-950 border-amber-800',
      summary:
        'The human brain evolved to remember physical locations and vivid objects, not abstract digits. The Major System phonetically translates digits to nouns (1=T/D, 4=R -> TIRE).',
      actionTip:
        'When anchoring an item at a palace locus (e.g. Sofa or Bookshelf), visualize the object interacting bizarrely with the furniture (e.g. flaming tire burning the velvet). Emotion and weirdness lock it into long-term recall.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-300">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Photographic Memory Master Techniques</h2>
              <p className="text-xs text-slate-400">Scientific methods for developing eidetic retention</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {techniques.map((tech, idx) => (
            <div
              key={idx}
              className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  {tech.icon}
                  <span>{tech.title}</span>
                </div>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${tech.tagColor}`}>
                  {tech.badge}
                </span>
              </div>

              <p className="text-xs text-slate-400 mb-3 leading-relaxed">{tech.summary}</p>

              <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 flex items-start gap-2">
                <span className="text-cyan-400 font-bold shrink-0">How to execute:</span>
                <span className="leading-relaxed">{tech.actionTip}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 text-right">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="py-2.5 px-5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Got It, Back to Training
          </button>
        </div>
      </div>
    </div>
  );
};
