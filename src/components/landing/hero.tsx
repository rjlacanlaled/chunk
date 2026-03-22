'use client';

import { useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';

export default function LandingHero() {
  const ctxtRef = useRef<HTMLParagraphElement>(null);
  const tc1Ref = useRef<HTMLDivElement>(null);
  const tc2Ref = useRef<HTMLDivElement>(null);
  const tc3Ref = useRef<HTMLDivElement>(null);
  const tc4Ref = useRef<HTMLDivElement>(null);
  const eyeLRef = useRef<SVGCircleElement>(null);
  const eyeRRef = useRef<SVGCircleElement>(null);

  const blink = useCallback(() => {
    const el = eyeLRef.current;
    const er = eyeRRef.current;
    if (!el || !er) return;
    el.style.transform = 'scaleY(0.07)';
    er.style.transform = 'scaleY(0.07)';
    setTimeout(() => {
      el.style.transform = '';
      er.style.transform = '';
    }, 110);
  }, []);

  useEffect(() => {
    const msg = 'I have a presentation Monday, fix that prod bug, call my dentist, finish the report...';
    let i = 0;
    let typingTimeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (i < msg.length && ctxtRef.current) {
        i += 1;
        ctxtRef.current.innerHTML = `${msg.slice(0, i)}<span class="cur"></span>`;
        typingTimeout = setTimeout(type, 36 + Math.random() * 24);
      } else if (ctxtRef.current) {
        ctxtRef.current.textContent = msg;
      }
    };

    const startTyping = setTimeout(type, 2900);

    const cardRefs = [tc1Ref, tc2Ref, tc3Ref, tc4Ref];
    const cardTimeouts = cardRefs.map((ref, idx) => setTimeout(() => {
      if (ref.current) ref.current.classList.add('v');
    }, 3300 + idx * 480));

    const blinkInterval = setInterval(blink, 3800);
    const initialBlink = setTimeout(blink, 1400);

    return () => {
      clearTimeout(startTyping);
      clearTimeout(typingTimeout);
      cardTimeouts.forEach(clearTimeout);
      clearInterval(blinkInterval);
      clearTimeout(initialBlink);
    };
  }, [blink]);

  return (
    <div className="page">
      <div className="bg-glow" />
      <div className="bg-dots" />
      <div className="sp" style={{ width: 6, height: 6, background: '#4945FF', top: '14%', left: '7%', animationDelay: '0s' }} />
      <div className="sp" style={{ width: 4, height: 4, background: '#F5CF0D', top: '28%', left: '13%', animationDelay: '1.3s' }} />
      <div className="sp" style={{ width: 5, height: 5, background: '#9736E8', top: '68%', left: '5%', animationDelay: '.7s' }} />
      <div className="sp" style={{ width: 3, height: 3, background: '#5CB176', top: '18%', left: '38%', animationDelay: '2.1s' }} />
      <div className="sp" style={{ width: 4, height: 4, background: '#4945FF', top: '82%', left: '42%', animationDelay: '.4s' }} />

      <nav className="landing-nav">
        <div className="nlogo">
          <div className="nicon"><span /><span /><span /></div>
          <span className="nword">chunk</span>
        </div>
        <ul className="nlinks">
          <li><a href="#features">Features</a></li>
          <li><a href="#how-it-works">How it Works</a></li>
          <li><a href="#gamification">Gamification</a></li>
        </ul>
        <Link href="/dashboard" className="btn-nav">Start free &rarr;</Link>
      </nav>

      <section className="hero">
        <div className="hl">
          <div className="badge">
            <div className="bdot" />
            <span>AI-first productivity</span>
          </div>
          <h1 className="headline">
            Your to-do app<br />
            is <span className="broken">broken.</span><br />
            <span className="fixed">Chunky fixed it.</span>
          </h1>
          <p className="subhead">
            Meet Chunky — your AI productivity buddy that turns brain dumps into game plans.
            Just chat, and watch the chaos sort itself out.
          </p>
          <div className="ctas">
            <Link href="/dashboard" className="btn-p">Chat with Chunky &rarr;</Link>
            <a href="#how-it-works" className="btn-s">See how it works</a>
          </div>
          <div className="proof">
            <div className="pavs">
              <div className="pav" style={{ background: '#4945FF' }} />
              <div className="pav" style={{ background: '#9736E8' }} />
              <div className="pav" style={{ background: '#5CB176' }} />
              <div className="pav" style={{ background: '#F5CF0D' }} />
            </div>
            <p><strong>2,400+</strong> people already chunking their chaos</p>
          </div>
        </div>

        <div className="hr">
          <div className="tcards">
            <div className="tc" ref={tc1Ref}>
              <div className="tck">
                <svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="ti"><div className="tt">Presentation prep</div><div className="tm">Mon &middot; 2 subtasks</div></div>
              <span className="tp pu">Urgent</span>
            </div>
            <div className="tc" ref={tc2Ref}>
              <div className="tck" style={{ background: '#9736E8' }}>
                <svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="ti"><div className="tt">Fix prod bug</div><div className="tm">Today &middot; critical</div></div>
              <span className="tp pu">Critical</span>
            </div>
            <div className="tc" ref={tc3Ref}>
              <div className="tck" style={{ background: '#5CB176' }}>
                <svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="ti"><div className="tt">Call dentist</div><div className="tm">This week</div></div>
              <span className="tp pg">Normal</span>
            </div>
            <div className="tc" ref={tc4Ref}>
              <div className="tck" style={{ background: '#F5CF0D' }}>
                <svg viewBox="0 0 11 11" fill="none"><path d="M1.5 5.5l3 3 5-5" stroke="#32324D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="ti"><div className="tt">Finish the report</div><div className="tm">Thu &middot; 3 subtasks</div></div>
              <span className="tp pn">Normal</span>
            </div>
          </div>

          <div className="cwrap">
            <svg width="240" height="340" viewBox="0 0 300 440">
              <line x1="150" y1="92" x2="150" y2="50" stroke="#271FE0" strokeWidth="6" strokeLinecap="round" />
              <g className="ant-cube" style={{ transformOrigin: '150px 44px', transformBox: 'fill-box' }}>
                <rect x="134" y="28" width="32" height="26" rx="7" fill="#F5CF0D" />
                <rect x="137" y="31" width="13" height="9" rx="2.5" fill="white" opacity="0.5" />
                <circle cx="168" cy="27" r="5" fill="#9736E8" opacity="0.8" />
              </g>
              <rect x="75" y="90" width="150" height="148" rx="46" fill="#4945FF" />
              <ellipse cx="118" cy="113" rx="40" ry="18" fill="white" opacity="0.05" />
              <circle ref={eyeLRef} className="eye-l" cx="118" cy="162" r="28" fill="white" />
              <circle cx="122" cy="167" r="15" fill="#32324D" />
              <circle cx="112" cy="153" r="9" fill="white" />
              <circle cx="129" cy="173" r="5" fill="white" opacity="0.42" />
              <circle ref={eyeRRef} className="eye-r" cx="182" cy="162" r="28" fill="white" />
              <circle cx="178" cy="167" r="15" fill="#32324D" />
              <circle cx="172" cy="153" r="9" fill="white" />
              <circle cx="189" cy="173" r="5" fill="white" opacity="0.42" />
              <ellipse className="chunky-blush-l" cx="82" cy="197" rx="24" ry="13" fill="#FF9EC4" />
              <ellipse className="chunky-blush-r" cx="218" cy="197" rx="24" ry="13" fill="#FF9EC4" />
              <path d="M 120 210 Q 150 232 180 210" stroke="white" strokeWidth="5.5" strokeLinecap="round" fill="none" />
              <rect x="28" y="232" width="50" height="86" rx="20" fill="#3B37E0" />
              <rect x="222" y="232" width="50" height="86" rx="20" fill="#3B37E0" />
              <circle cx="53" cy="318" r="15" fill="#3B37E0" />
              <circle cx="247" cy="318" r="15" fill="#3B37E0" />
              <rect x="62" y="234" width="176" height="138" rx="32" fill="#4945FF" />
              <rect x="88" y="258" width="124" height="17" rx="5" fill="white" opacity="0.92" />
              <rect x="88" y="279" width="91" height="17" rx="5" fill="white" opacity="0.92" />
              <rect x="88" y="300" width="58" height="17" rx="5" fill="white" opacity="0.92" />
              <rect x="92" y="366" width="46" height="64" rx="18" fill="#3B37E0" />
              <rect x="162" y="366" width="46" height="64" rx="18" fill="#3B37E0" />
              <ellipse cx="115" cy="430" rx="36" ry="14" fill="#32324D" />
              <ellipse cx="185" cy="430" rx="36" ry="14" fill="#32324D" />
            </svg>
          </div>

          <div className="cbub">
            <div className="cutag">You</div>
            <p ref={ctxtRef} />
          </div>
        </div>
      </section>
    </div>
  );
}
