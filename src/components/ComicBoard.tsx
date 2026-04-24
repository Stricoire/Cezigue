"use client";

import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import NextLink from 'next/link';

interface ComicPanel {
  imageSrc: string;
  alt: string;
  caption: string;
}

interface ComicBoardProps {
  title: string;
  subtitle: string;
  panels: ComicPanel[];
  ctaText?: string;
  ctaHref?: string;
}

export function ComicBoard({ title, subtitle, panels, ctaText = "Soumettre une idée", ctaHref = "/incubator/pitch" }: ComicBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Animations pour le panel 1
  const panel1Y = useTransform(scrollYProgress, [0, 0.3], [50, 0]);
  const panel1Opacity = useTransform(scrollYProgress, [0, 0.2, 0.8], [0, 1, 0.7]);

  // Animations pour le panel 2
  const panel2Y = useTransform(scrollYProgress, [0.2, 0.5], [100, 0]);
  const panel2Opacity = useTransform(scrollYProgress, [0.2, 0.4, 0.8], [0, 1, 0.8]);

  // Animations pour le panel 3
  const panel3Y = useTransform(scrollYProgress, [0.4, 0.7], [100, 0]);
  const panel3Opacity = useTransform(scrollYProgress, [0.4, 0.6, 1], [0, 1, 1]);
  const panel3Scale = useTransform(scrollYProgress, [0.4, 0.7], [0.95, 1.05]);

  // Animation pour le bouton
  const btnOpacity = useTransform(scrollYProgress, [0.7, 0.9], [0, 1]);
  const btnY = useTransform(scrollYProgress, [0.7, 0.9], [50, 0]);

  return (
    <div ref={containerRef} className="relative h-[180vh] bg-background">
      {/* Header Sticky */}
      <div className="sticky top-0 h-screen flex flex-col items-center justify-start pt-24 px-4 overflow-hidden">
        <div className="text-center mb-4 z-20 bg-background/80 backdrop-blur-md px-8 py-4 rounded-3xl">
          <h1 className="text-5xl md:text-7xl font-black tracking-tight text-zinc-900 mb-4">{title}</h1>
          <p className="text-xl text-zinc-600 max-w-2xl mx-auto font-medium">{subtitle}</p>
        </div>

        {/* Comic Container */}
        <div className="relative w-full max-w-full px-2 md:px-8 flex-1 mt-2">
          
          {/* Panel 1 : Le Problème */}
          <motion.div 
            style={{ y: panel1Y, opacity: panel1Opacity }}
            whileHover={{ zIndex: 50, scale: 1.05, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-[5vh] md:top-[15vh] left-[5%] md:left-[2%] w-[85%] md:w-[30%] rounded-2xl shadow-xl border-[8px] border-red-400 bg-white overflow-hidden transform -rotate-2 z-10 cursor-pointer"
          >
            <div className="relative aspect-[16/9] max-h-[35vh]">
              <Image src={panels[0].imageSrc} alt={panels[0].alt} fill className="object-cover" />
            </div>
            <div className="p-4 bg-red-50 border-t-2 border-red-100 flex flex-col items-center justify-center min-h-[100px]">
              <span className="bg-red-200 text-red-900 text-[10px] md:text-xs font-black px-3 py-1 rounded-full mb-1 md:mb-2 uppercase tracking-wider">1. LE PROBLÈME</span>
              <p className="font-bold text-red-900 text-sm md:text-base text-center leading-tight">{panels[0].caption}</p>
            </div>
          </motion.div>

          {/* Panel 2 : La Solution */}
          <motion.div 
            style={{ y: panel2Y, opacity: panel2Opacity }}
            whileHover={{ zIndex: 50, scale: 1.05, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-[30vh] md:top-[15vh] right-[5%] md:left-[35%] w-[85%] md:w-[30%] rounded-2xl shadow-2xl border-[8px] border-blue-400 bg-white overflow-hidden transform rotate-2 z-20 cursor-pointer"
          >
            <div className="relative aspect-[16/9] max-h-[35vh]">
              <Image src={panels[1].imageSrc} alt={panels[1].alt} fill className="object-cover" />
            </div>
            <div className="p-4 bg-blue-50 border-t-2 border-blue-100 flex flex-col items-center justify-center min-h-[100px]">
              <span className="bg-blue-200 text-blue-900 text-[10px] md:text-xs font-black px-3 py-1 rounded-full mb-1 md:mb-2 uppercase tracking-wider">2. LA SOLUTION</span>
              <p className="font-bold text-blue-900 text-sm md:text-base text-center leading-tight">{panels[1].caption}</p>
            </div>
          </motion.div>

          {/* Panel 3 : Le Bénéfice */}
          <motion.div 
            style={{ y: panel3Y, opacity: panel3Opacity, scale: panel3Scale }}
            whileHover={{ zIndex: 50, scale: 1.05, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute top-[55vh] md:top-[15vh] left-[8%] md:left-[68%] w-[84%] md:w-[30%] rounded-2xl shadow-2xl border-[8px] border-emerald-400 bg-white overflow-hidden z-30 cursor-pointer"
          >
            <div className="relative aspect-[16/9] max-h-[35vh]">
              <Image src={panels[2].imageSrc} alt={panels[2].alt} fill className="object-cover" />
            </div>
            <div className="p-4 bg-emerald-50 border-t-2 border-emerald-100 flex flex-col items-center justify-center min-h-[100px]">
              <span className="bg-emerald-200 text-emerald-900 text-[10px] md:text-xs font-black px-3 py-1 rounded-full mb-1 md:mb-2 uppercase tracking-wider">3. LE RÉSULTAT</span>
              <p className="font-bold text-emerald-900 text-sm md:text-base text-center leading-tight">{panels[2].caption}</p>
            </div>
          </motion.div>

        </div>

        {/* CTA Flottant qui apparait à la fin */}
        <motion.div 
          style={{ opacity: btnOpacity, y: btnY }}
          className="absolute bottom-12 z-50 pointer-events-auto"
        >
          <NextLink 
            href={ctaHref === "/incubator/pitch" ? "mailto:contact@cezigue.fr" : ctaHref}
            className="bg-primary text-primary-foreground px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:bg-primary/90 hover:scale-105 transition-all flex items-center space-x-2"
          >
            <span>{ctaText}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </NextLink>
        </motion.div>

      </div>
    </div>
  );
}
