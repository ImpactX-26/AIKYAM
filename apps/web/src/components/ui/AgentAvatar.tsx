import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, BookOpen, Volume2, CheckCircle2 } from 'lucide-react';

interface AgentAvatarProps {
  state: 'idle' | 'thinking' | 'reading' | 'speaking' | 'done';
  size?: 'sm' | 'md' | 'lg';
}

export const AgentAvatar: React.FC<AgentAvatarProps> = ({ state, size = 'md' }) => {
  const sizeMap = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
  };

  const iconSizeMap = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-8 h-8',
  };

  return (
    <div className="relative inline-flex items-center justify-center">
      {/* Outer Pulse Ring */}
      <motion.div
        animate={
          state === 'thinking'
            ? { scale: [1, 1.25, 1], opacity: [0.5, 0.9, 0.5] }
            : state === 'speaking'
            ? { scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }
            : { scale: [1, 1.05, 1], opacity: [0.3, 0.5, 0.3] }
        }
        transition={{
          duration: state === 'thinking' ? 1.2 : 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute rounded-full -inset-1 ${
          state === 'thinking'
            ? 'bg-amber-500/30'
            : state === 'reading'
            ? 'bg-cyan-500/30'
            : state === 'speaking'
            ? 'bg-blue-500/30'
            : 'bg-amber-500/20'
        }`}
      />

      {/* Core Avatar Sphere */}
      <div
        className={`${sizeMap[size]} rounded-2xl bg-gradient-to-br from-slate-900 to-navy-900 border border-amber-500/40 flex items-center justify-center shadow-lg relative z-10`}
      >
        {state === 'thinking' && (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          >
            <Sparkles className={`${iconSizeMap[size]} text-amber-400`} />
          </motion.div>
        )}

        {state === 'reading' && (
          <motion.div animate={{ y: [-1, 1, -1] }} transition={{ duration: 1.5, repeat: Infinity }}>
            <BookOpen className={`${iconSizeMap[size]} text-cyan-400`} />
          </motion.div>
        )}

        {state === 'speaking' && (
          <motion.div animate={{ scale: [0.9, 1.1, 0.9] }} transition={{ duration: 0.8, repeat: Infinity }}>
            <Volume2 className={`${iconSizeMap[size]} text-blue-400`} />
          </motion.div>
        )}

        {state === 'done' && <CheckCircle2 className={`${iconSizeMap[size]} text-emerald-400`} />}

        {state === 'idle' && <Bot className={`${iconSizeMap[size]} text-amber-400`} />}
      </div>
    </div>
  );
};
