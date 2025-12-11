"use client";

import React, { useEffect, useRef } from 'react';
import { Icons } from './ui/Icons';
import './LandingPage.css'; // Import the specific CSS file
import type { AppView } from '../types';

interface LandingPageProps {
  onNavigate: (page: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const loaderRef = useRef<HTMLDivElement>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const curtainTextRef = useRef<HTMLDivElement>(null);
  const heroTitleRef = useRef<HTMLHeadingElement>(null);
  const timelineProgressRef = useRef<HTMLDivElement>(null);
  const workflowRef = useRef<HTMLElement>(null);
  const intelligenceSectionRef = useRef<HTMLElement>(null);
  const stickyWrapperRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    // --- 1. LOADER ---
    const timer = setTimeout(() => {
      if (loaderRef.current) {
        loaderRef.current.classList.add("loaded");
      }
    }, 2300);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // --- 4. SCROLL REVEAL (Intersection Observer) ---
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("active");
            if (entry.target.classList.contains("intel-card"))
              entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = document.querySelectorAll(".reveal, .intel-card, .step-row");
    elements.forEach((el) => observer.observe(el));

    // Cleanup
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
     // --- 5. PARALLAX & TIMELINE & 6. MOUSE FX & STICKY INTELLIGENCE ---
     const handleScroll = () => {
        const scrolled = window.pageYOffset;
        if (heroTitleRef.current && scrolled < window.innerHeight) {
          heroTitleRef.current.style.transform = `translateY(${scrolled * 0.2}px)`;
        }

        // Sticky logic is handled by CSS (native position: sticky)
        // No JS intervention needed to stick/release.


        if (workflowRef.current && timelineProgressRef.current) {
           const rect = workflowRef.current.getBoundingClientRect();
           const windowHeight = window.innerHeight;
           const startOffset = windowHeight / 2;

           if (rect.top < startOffset && rect.bottom > 0) {
             const percentage = Math.min(
               Math.max(((startOffset - rect.top) / rect.height) * 100, 0),
               100
             );
             timelineProgressRef.current.style.height = `${percentage}%`;
           }
        }
     };

     const handleMouseMove = (e: MouseEvent) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        document.querySelectorAll(".orb").forEach((orb, index) => {
           // Type casting for simple style access
           (orb as HTMLElement).style.transform = `translate(${x * ((index + 1) * 20)}px, ${
              y * ((index + 1) * 20)
            }px)`;
        });
     };

     window.addEventListener("scroll", handleScroll);
     document.addEventListener("mousemove", handleMouseMove);

     return () => {
       window.removeEventListener("scroll", handleScroll);
       document.removeEventListener("mousemove", handleMouseMove);
     };
  }, []);

  const handleNavClick = (e: React.MouseEvent, targetId: string) => {
      e.preventDefault();
      const targetSection = document.getElementById(targetId);
      if (!targetSection || !curtainRef.current || !curtainTextRef.current) return;

      curtainTextRef.current.innerText = (e.currentTarget as HTMLElement).innerText;
      curtainRef.current.classList.add("active");

      curtainTextRef.current.animate(
        [
          { opacity: 0, transform: "translateY(50px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 800,
          delay: 300,
          easing: "cubic-bezier(0.19, 1, 0.22, 1)",
          fill: "forwards" as any,
        }
      );

      setTimeout(() => {
        targetSection.scrollIntoView({
          behavior: "auto",
          block: "start",
        });
      }, 700);
      
      setTimeout(() => {
        if(curtainTextRef.current) {
            curtainTextRef.current.animate(
                [
                { opacity: 1, transform: "translateY(0)" },
                { opacity: 0, transform: "translateY(-50px)" },
                ],
                { duration: 400, fill: "forwards" as any }
            );
        }
      }, 1100);
      
      setTimeout(() => {
        if(curtainRef.current) curtainRef.current.classList.remove("active");
      }, 1500);
  };

  const handleOpenCanvas = (e: React.MouseEvent) => {
      e.preventDefault();
      if (!curtainRef.current || !curtainTextRef.current) {
        // Fallback
        onNavigate('app');
        return;
      }
      
      // 1. Set text
      curtainTextRef.current.innerText = "LAUNCHING WORKSPACE";

      // 2. Add 'exit' class (Defined in CSS CHANGE 1)
      // This class covers the screen but DOES NOT animate back to open.
      // It stays black because of the 'forwards' CSS property.
      curtainRef.current.classList.add("exit");

      // 3. Animate Text In
      curtainTextRef.current.animate(
        [
          { opacity: 0, transform: "translateY(50px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 800,
          delay: 300,
          easing: "cubic-bezier(0.19, 1, 0.22, 1)",
          fill: "forwards" as any,
        }
      );

      // 4. Wait for animation to cover screen, then redirect
      // The screen will remain black during this "load" until the new page paints
      setTimeout(() => {
         onNavigate('app');
      }, 2000);
  };

  return (
    <div className="landing-page-root">
        <div className="ambient-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        </div>

        {/* LOADER */}
        <div className="loader-container" id="loader" ref={loaderRef}>
        <div className="shutter shutter-top"></div>
        <div className="shutter shutter-bottom"></div>
        <div className="loader-content">
            <div className="loader-logo">Aether Canvas</div>
            <div className="loader-bar-bg"><div className="loader-bar-fill"></div></div>
        </div>
        </div>

        {/* TRANSITION CURTAIN */}
        <div className="transition-curtain" id="curtain" ref={curtainRef}>
        <div className="curtain-text" id="curtainText" ref={curtainTextRef}>Section Name</div>
        </div>

        <nav>
        <a href="#" className="nav-logo">AETHER</a>
        <div className="nav-links">
            <a className="nav-item" onClick={(e) => handleNavClick(e, 'intelligence')}>Intelligence</a>
            <a className="nav-item" onClick={(e) => handleNavClick(e, 'workflow')}>Workflow</a>
            <a className="nav-item" onClick={(e) => handleNavClick(e, 'vision')}>Vision</a>
        </div>
        </nav>

        <section className="hero" id="home">
        <div className="hero-badge">AI-Native Note Taking</div>
        <h1 className="hero-title" id="heroTitle" ref={heroTitleRef}>Thinking,<br />Evolved.</h1>
        <p className="hero-sub">
            Where your thoughts become structured reality. Aether Canvas connects
            the dots between your ideas automatically.
        </p>
        
        <a href="#" className="hero-cta" id="openCanvasBtn" onClick={handleOpenCanvas}>Open Canvas</a>
        <div className="scroll-down">↓</div>
        </section>

        {/* INTELLIGENCE SECTION */}
        <section id="intelligence" className="intelligence-section reveal" ref={intelligenceSectionRef}>
        <div className="sticky-wrapper" ref={stickyWrapperRef}>
            <h2 className="section-title">Agentic<br />Intelligence</h2>
            <p
            style={{
                color: 'var(--text-muted)',
                paddingLeft: '2rem',
                maxWidth: '400px',
                fontSize: '1.1rem',
                lineHeight: '1.6',
            }}
            >
            Our agents don't just store text. They read, understand, and link your
            concepts across time and space.
            <br /><br />Experience a second brain that actually thinks.
            </p>
        </div>
        <div className="content-stream">
            <div className="intel-card">
            <img
                src="https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=2565&auto=format&fit=crop"
                className="intel-card-bg"
                alt="AI Neural Network"
            />
            <div className="intel-card-overlay"></div>
            <div className="intel-content">
                <h3>Context Awareness</h3>
                <p>
                Draft a messy paragraph, and watch Aether rewrite it into a
                structured proposal, highlighting action items automatically.
                </p>
            </div>
            </div>
            <div className="intel-card">
            <img
                src="https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=2670&auto=format&fit=crop"
                className="intel-card-bg"
                alt="Data Synthesis"
            />
            <div className="intel-card-overlay"></div>
            <div className="intel-content">
                <h3>From Chaos to Clarity</h3>
                <p>
                Generate, summarize, extract infromation from your notes and
                create flashcards on the fly.
                </p>
            </div>
            </div>
            <div className="intel-card">
            <img
                src="https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=2574&auto=format&fit=crop"
                className="intel-card-bg"
                alt="Knowledge Graph"
            />
            <div className="intel-card-overlay"></div>
            <div className="intel-content">
                <h3>Knowledge Graph</h3>
                <p>
                Visualize any data. See how a data points connect for far better
                understanding and recall.
                </p>
            </div>
            </div>
        </div>
        </section>

        {/* WORKFLOW SECTION */}
        <section id="workflow" className="reveal" ref={workflowRef}>
        <h2
            className="section-title"
            style={{ textAlign: 'center', border: 'none', marginBottom: '2rem' }}
        >
            Seamless Flow
        </h2>

        <div className="timeline-container">
            <div className="timeline-line"></div>
            <div className="timeline-progress" id="timelineProgress" ref={timelineProgressRef}></div>

            {/* STEP 1 (Left) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card">
                <span className="step-number">01</span>
                <h3>Add Your Content</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Upload notes, images, or datasets seamlessly.
                </p>
                <div className="tag-container">
                    <span className="tag">Paste text</span>
                    <span className="tag">Drop files</span>
                    <span className="tag">Import Data</span>
                    
                </div>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>

            {/* STEP 2 (Right) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card">
                <span className="step-number">02</span>
                <h3>Ask Anything</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Chat naturally with your knowledge base.
                </p>
                <div className="chat-bubble">“Explain this connection”</div>
                <div
                    className="chat-bubble"
                    style={{ background: 'rgba(0, 219, 222, 0.15)' }}
                >
                    “Visualize this dataset”
                </div>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>

            {/* STEP 3 (Left) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card" style={{ borderColor: 'var(--accent-primary)' }}>
                <span className="step-number">03</span>
                <h3>AI Context Sync</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    The system analyzes everything together.
                </p>
                <ul className="step-list">
                    <li>✦ Text Analysis</li>
                    <li>✦ Image Recognition</li>
                    <li>✦ Agentic Knowledge Sharing</li>
                </ul>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>

            {/* STEP 4 (Right) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card">
                <span className="step-number">04</span>
                <h3>Structured Insights</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Instant transformations of raw data.
                </p>
                <div className="tag-container">
                    <span className="tag">Summaries</span>
                    <span className="tag">Breakdowns</span>
                    <span className="tag">Diagrams</span>
                </div>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>

            {/* STEP 5 (Left) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card">
                <span className="step-number">05</span>
                <h3>Pin & Organize</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Build topic-wise understanding.
                </p>
                <ul className="step-list">
                    <li>📌 Pin notes to board</li>
                    <li>📂 Auto-organize by AI</li>
                </ul>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>

            {/* STEP 6 (Right) */}
            <div className="step-row">
            <div className="step-content">
                <div className="step-card">
                <span className="step-number">06</span>
                <h3>Visual Learning</h3>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    Generate study aids with one click.
                </p>
                <div className="tag-container">
                    <span className="tag" style={{ borderColor: 'var(--accent-secondary)' }}
                    >Concept Illustrations</span
                    >
                    <span className="tag" style={{ borderColor: 'var(--accent-secondary)' }}
                    >Flashcards</span
                    >
                </div>
                </div>
            </div>
            <div className="step-marker"></div>
            <div className="step-empty-space"></div>
            </div>
        </div>
        </section>

        {/* VISION SECTION */}
        <section id="vision" className="reveal">
        <h2
            className="section-title"
            style={{ border: 'none', textAlign: 'center', padding: '0' }}
        >
            The Future of Thought
        </h2>
        <div
            style={{
            width: '1px',
            height: '100px',
            background: 'linear-gradient(to bottom, var(--accent-primary), transparent)',
            margin: '2rem 0',
            }}
        ></div>
        <p
            style={{
            textAlign: 'center',
            maxWidth: '600px',
            color: 'var(--text-muted)',
            fontSize: '1.2rem',
            lineHeight: '1.6',
            }}
        >
            We are building a canvas where the friction between having an idea and
            executing it is zero. Aether is not a tool; it is an extension of your
            mind.
        </p>
        </section>

        <footer>
        <div className="footer-logo">AETHER</div>
        </footer>
    </div>
  );
};
