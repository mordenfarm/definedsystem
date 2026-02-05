
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { Header } from './Header';
import { Hero } from './Hero';
import { Services } from './Services';
import { Footer } from './Footer';
import { UniformShop } from '../UniformShop';
import { SchoolTour } from './SchoolTour';

const TeamCarousel = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const team = [
    { name: "Ingvary Sibanda", role: "Inclusive Education Coodinator", image: "https://i.ibb.co/M5pcJ62x/IMG-20260204-WA0055.jpg" },
    { name: "Abgirl", role: "Sign Language facilitator", image: "https://i.ibb.co/zHWJVV5H/IMG-20260204-WA0051.jpg" },
    { name: "Doctor Dhliwayo", role: "Counselor and Consultant", image: "https://i.ibb.co/fYYqx68K/IMG-20260204-WA0050.jpg" },
    { name: "Trish Mangare", role: "Speacial Needs Facilitator", image: "https://i.ibb.co/6cVYrRFz/IMG-20260205-WA0025.jpg" },
    { name: "Sylvia Chisasa", role: "Speacial NEeds Facilitator", image: "https://i.ibb.co/MkgLPprC/IMG-20260204-WA0052.jpg" },
    { name: "Simangaliso Matshakaire", role: "Office Administrator", image: "https://i.ibb.co/hxDJ6pP2/IMG-20260204-WA0067.jpg" },
    { name: "Nyasha Lorain", role: "Inclusive Education Advocate", image: "https://i.ibb.co/67yg8Cbc/IMG-20260204-WA0054.jpg" },
    { name: "Lamelia", role: "Support Worker", image: "https://i.ibb.co/fGKfyh1s/IMG-20260204-WA0049.jpg" },
    { name: "Leon", role: "Support Worker", image: "https://i.ibb.co/yn2GkzR3/IMG-20260204-WA0048.jpg" },
  ];

  // Automatic scrolling logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (!scrollRef.current) return;
      const nextIndex = (activeIndex + 1) % team.length;
      const cardWidth = 320; 
      const gap = 32;
      const scrollAmount = nextIndex * (cardWidth + gap);
      
      scrollRef.current.scrollTo({
        left: scrollAmount,
        behavior: 'smooth'
      });
      setActiveIndex(nextIndex);
    }, 4500);

    return () => clearInterval(interval);
  }, [activeIndex, team.length]);

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const scrollLeft = scrollRef.current.scrollLeft;
    const cardWidth = 320;
    const gap = 32;
    const index = Math.round(scrollLeft / (cardWidth + gap));
    if (index !== activeIndex && index >= 0 && index < team.length) {
      setActiveIndex(index);
    }
  };

  return (
    <div className="relative py-32 bg-white dark:bg-slate-950 overflow-hidden border-t border-slate-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-6 mb-20 text-center space-y-4">
         <p className="text-blue-600 font-black uppercase tracking-[0.5em] text-[11px] font-mono">Registry :: Personnel</p>
         <h3 className="text-4xl md:text-7xl font-black uppercase tracking-tighter dark:text-white leading-none">The Specialist Team</h3>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-hidden gap-8 px-[10vw] md:px-[35vw] pb-24 no-scrollbar snap-x snap-mandatory scroll-smooth items-center h-[550px]"
      >
        {team.map((member, idx) => (
          <div 
            key={idx}
            className={`flex-shrink-0 w-[280px] md:w-[320px] snap-center transition-all duration-1000 cubic-bezier(0.16, 1, 0.3, 1) relative h-[400px]
              ${activeIndex === idx ? 'scale-110 opacity-100 z-10 translate-y-[-20px]' : 'scale-90 opacity-20 blur-[1px] z-0'}
            `}
          >
            <div className="relative w-full h-full overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 bg-slate-100 rounded-none">
               <img 
                 src={member.image} 
                 className="w-full h-full object-cover grayscale-0 transition-transform duration-[8s] group-hover:scale-110" 
                 alt={member.name} 
               />
               
               {/* Internal Text Overlay - Positioned at bottom to show face */}
               <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-6">
                  <div className={`transition-all duration-1000 ${activeIndex === idx ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                     <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 inline-block w-full rounded-none">
                        <h4 className="text-xl font-black uppercase tracking-tight text-white leading-none overflow-hidden whitespace-nowrap border-r-2 border-blue-500 pr-2 inline-block animate-typewriter">
                          {member.name}
                        </h4>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400 mt-2 font-mono">
                          {member.role}
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-typewriter {
          display: inline-block;
          animation: typewriter 1.5s steps(20, end) forwards;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export const LandingPage: React.FC = () => {
  const { view, setView } = useStore();

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 overflow-x-hidden">
      <Header />
      <main>
        {view === 'landing' ? (
          <>
            <Hero />
            <Services />
            
            <section id="story" className="py-24 md:py-40 bg-white dark:bg-slate-950 px-6 border-y border-slate-100 dark:border-slate-800">
              <div className="max-w-4xl mx-auto text-center space-y-12 mb-32">
                <h3 className="text-5xl md:text-9xl font-black tracking-tighter uppercase dark:text-white leading-[0.8]">The Story</h3>
                <p className="text-2xl md:text-5xl text-slate-800 dark:text-slate-400 leading-tight font-black italic tracking-tight">
                  "Founded to meet the urgent need for inclusive developmental care in Masvingo, Defined Domains has grown into a trusted centre providing specialized support for children with autism, trisomy 21, and intellectual disabilities."
                </p>
                <div className="flex justify-center gap-1.5">
                   <div className="w-8 h-1 bg-blue-600"></div>
                   <div className="w-4 h-1 bg-blue-600/40"></div>
                   <div className="w-2 h-1 bg-blue-600/20"></div>
                </div>
              </div>

              {/* Team Board Section */}
              <div className="max-w-7xl mx-auto px-0 md:px-6">
                 <div className="relative rounded-none overflow-hidden shadow-[0_100px_150px_-40px_rgba(0,0,0,0.7)] border-y md:border border-slate-200 dark:border-slate-800 group min-h-[450px] md:min-h-[750px] bg-slate-100 dark:bg-slate-900 flex flex-col">
                    
                    {/* Image Board / Grid */}
                    <div className="flex-1 grid grid-cols-3 md:grid-cols-5 gap-2 p-2">
                      {[
                        "https://i.ibb.co/M5pcJ62x/IMG-20260204-WA0055.jpg",
                        "https://i.ibb.co/zHWJVV5H/IMG-20260204-WA0051.jpg",
                        "https://i.ibb.co/fYYqx68K/IMG-20260204-WA0050.jpg",
                        "https://i.ibb.co/6cVYrRFz/IMG-20260205-WA0025.jpg",
                        "https://i.ibb.co/MkgLPprC/IMG-20260204-WA0052.jpg",
                        "https://i.ibb.co/hxDJ6pP2/IMG-20260204-WA0067.jpg",
                        "https://i.ibb.co/67yg8Cbc/IMG-20260204-WA0054.jpg",
                        "https://i.ibb.co/fGKfyh1s/IMG-20260204-WA0049.jpg",
                        "https://i.ibb.co/yn2GkzR3/IMG-20260204-WA0048.jpg",
                        "https://i.ibb.co/spSVqW8s/definedlogo.png"
                      ].map((img, i) => (
                        <div key={i} className="relative overflow-hidden aspect-square grayscale hover:grayscale-0 transition-all duration-500">
                          <img src={img} alt="Team board" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>

                    {/* Dark fade only at the bottom */}
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none"></div>
                    
                    <div className="absolute bottom-0 left-0 w-full p-8 md:p-16 text-center z-10">
                       <h4 className="text-xl md:text-5xl font-black uppercase tracking-tighter text-white max-w-5xl mx-auto leading-[0.9] drop-shadow-2xl translate-y-4 group-hover:translate-y-0 transition-transform duration-1000">
                          Where compassion meets expertise—meet the team shaping the future of behavioral therapy in Zimbabwe.
                       </h4>
                       <div className="mt-8 flex items-center justify-center gap-4">
                          <div className="h-px w-12 bg-blue-500"></div>
                          <span className="text-[10px] font-mono font-bold text-blue-500 uppercase tracking-[0.5em]">Defined Domain Crew</span>
                          <div className="h-px w-12 bg-blue-500"></div>
                       </div>
                    </div>
                 </div>
              </div>
            </section>

            <TeamCarousel />

          </>
        ) : view === 'shop' ? (
          <div className="max-w-7xl mx-auto pt-40 pb-32">
             <UniformShop />
          </div>
        ) : view === 'tour' ? (
          <SchoolTour />
        ) : null}
      </main>
      <Footer />
    </div>
  );
};
