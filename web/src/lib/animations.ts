import { Variants, cubicBezier, easeInOut } from "motion/react";

// Create custom easing function using the specific bezier curve
const easeOutQuart = cubicBezier(0.25, 0.46, 0.45, 0.94);

// This file is just some starter animations, feel free to edit it as you like to fit the design of your website.

// Fade in animation variants
export const fadeInUp: Variants = {
  hidden: {
    opacity: 0,
    y: 60,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: easeOutQuart,
    },
  },
};

export const fadeIn: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.8,
      ease: easeOutQuart,
    },
  },
};

export const slideInLeft: Variants = {
  hidden: {
    opacity: 0,
    // To fix bug where elements are outside the viewport causing a white bar on the right side of the screen
    x: "clamp(-60px, -5vw, -20px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: easeOutQuart,
    },
  },
};

export const slideInRight: Variants = {
  hidden: {
    opacity: 0,
    // To fix bug where elements are outside the viewport causing a white bar on the right side of the screen
    x: "clamp(20px, 5vw, 60px)",
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.7,
      ease: easeOutQuart,
    },
  },
};

export const scaleIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: easeOutQuart,
    },
  },
};

// Stagger container for animating children
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem: Variants = {
  hidden: {
    opacity: 0,
    y: 30,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: easeOutQuart,
    },
  },
};

// Hover animations
export const hoverScale = {
  scale: 1.05,
  transition: {
    duration: 0.2,
    ease: easeOutQuart,
  },
};

export const hoverLift = {
  y: -8,
  transition: {
    duration: 0.2,
    ease: easeOutQuart,
  },
};

// Floating animation for decorative elements
export const floating: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: easeInOut,
    },
  },
};

// Gentle rotation for organic feel
export const gentleRotate: Variants = {
  animate: {
    rotate: [0, 2, -2, 0],
    transition: {
      duration: 8,
      repeat: Infinity,
      ease: easeInOut,
    },
  },
};
