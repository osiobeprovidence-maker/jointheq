import React from 'react';
import { motion } from 'motion/react';

export const FloatingQ: React.FC = () => {
  return (
    <motion.div
      className="relative flex items-center justify-center p-8"
      animate={{
        y: [0, -40, 0],
        rotate: [0, 8, -8, 0],
        scale: [1, 1.05, 0.95, 1],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
        times: [0, 0.5, 0.75, 1]
      }}
    >
      {/* Premium Glow/Aura */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-400/30 to-rose-400/20 rounded-full blur-[80px] -z-10"
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* 3D Asset */}
      <img
        src="/q-3d.png"
        alt="Q 3D Logo"
        className="w-64 h-64 md:w-80 md:h-80 lg:w-[450px] lg:h-[450px] object-contain drop-shadow-[0_20px_50px_rgba(242,101,34,0.3)] filter contrast-[1.05] saturate-[1.1]"
      />
    </motion.div>
  );
};
