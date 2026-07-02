'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import styles from './for-founders.module.css';

const SECTORS = [
  {
    name: 'Life Sciences',
    body: 'From oncology genomics to drug discovery, we back companies applying computation, biology, and engineering at the intersection of health and deep science.',
    expandedBody: 'We look for ventures where the core breakthrough is molecular, genomic, or systems-level: proprietary platforms that compound over time, not software built on top of existing biology. India is producing world-class scientists. We want to fund them.',
  },
  {
    name: 'Robotics',
    body: 'Physical intelligence: manipulation, locomotion, perception, and the software stacks that make machines capable of operating autonomously in the real world.',
    expandedBody: 'The cost curves for actuators, compute, and sensors are collapsing. The window to build foundational robotics companies is open now. We are looking for teams with deep hardware and control systems expertise, not integrators.',
  },
  {
    name: 'Fabless Semiconductor',
    body: 'Custom silicon: processor IP, specialized accelerators, and chips designed for specific workloads where general-purpose compute is economically or physically impractical.',
    expandedBody: 'India trained the world\'s chip designers. It is time to build companies around that expertise rather than export it. We back fabless ventures at the IP and architecture layer, not chip packaging or distribution.',
  },
  {
    name: 'Artificial Intelligence',
    body: 'AI that creates durable technical advantage: proprietary architectures, training methods, inference optimization, or AI applied to verticals requiring deep domain knowledge.',
    expandedBody: 'We are selective here. The bar is whether the AI is the moat or merely the interface. We are not interested in wrappers. We back companies where the model, the data flywheel, or the inference stack is itself defensible.',
  },
  {
    name: 'Smart Manufacturing',
    body: 'Automation, process intelligence, and precision engineering for industrial production: the software, robotics, and sensing layers that make factories measurably better.',
    expandedBody: 'India\'s manufacturing sector is at an inflection point. We look for companies that embed themselves into production processes in ways that are hard to rip out, creating long-term contractual and switching-cost advantages.',
  },
  {
    name: 'Aerospace and Surveillance',
    body: 'Platforms, payloads, and systems for contested or complex environments: UAVs, imaging, targeting, directed energy, and space-adjacent technologies.',
    expandedBody: 'Defence and aerospace procurement is changing globally. We back companies building dual-use systems with genuine performance advantages, not commodity drones or resellers of foreign platforms.',
  },
];

const CHECKLIST = [
  {
    label: 'You are building in one of Yali\'s six sectors, or meaningfully at the intersection of two',
    weight: 40,
  },
  {
    label: 'You are raising at pre-seed, seed, or Series A',
    weight: 20,
  },
  {
    label: 'The core innovation is in the technology, not just the business model or go-to-market',
    weight: 10,
  },
  {
    label: 'You have defensible IP: a patent, trade secret, or a technical moat that takes years to replicate',
    weight: 10,
  },
  {
    label: 'Your founding team has direct domain expertise in the sector you are entering',
    weight: 10,
  },
  {
    label: 'There is a clear Indian market opportunity, global competitiveness from an Indian base, or both',
    weight: 10,
  },
];

const PHASES = [
  {
    label: 'Submit',
    body: ['Send your deck or a brief note to ', 'pitch@yali.vc', '. Every submission is read by the investments team.'],
  },
  {
    label: 'Screen',
    body: 'We assess thesis fit, stage, and team. If there is alignment, you will hear from us within two weeks.',
  },
  {
    label: 'Meetings',
    body: 'Conversations with the founding team across technology, market, and strategy. No standard format.',
  },
  {
    label: 'Diligence',
    body: 'We go deep on the technical claims, competitive landscape, and unit economics before making a decision.',
  },
  {
    label: 'Investment',
    body: 'We move quickly once conviction is formed. Term sheet, legal, and wire without unnecessary delay.',
  },
];

const BEST_PRACTICES = [
  {
    heading: 'Lead with the technology',
    body: 'What have you built that did not exist before? The technical insight is the most important slide in your deck.',
  },
  {
    heading: 'Be specific about the moat',
    body: 'Patents, trade secrets, proprietary data, unique expertise: name what makes your position hard to replicate.',
  },
  {
    heading: 'Show domain depth',
    body: 'Why are you and your co-founders the right people to build this? Prior research, patents, or industry experience matter here.',
  },
  {
    heading: 'Size the market from the bottom up',
    body: 'We need to understand the specific buyer, use case, and path to revenue.',
  },
  {
    heading: 'State your ask clearly',
    body: 'How much are you raising, at what structure, and what will it get you to?',
  },
];

function SectorCard({ sector, companies }) {
  const [open, setOpen] = useState(false);
  const hasCompanies = companies && companies.length > 0;

  return (
    <div
      className={styles.sectorCard}
      onClick={() => setOpen((o) => !o)}
    >
      <div className={styles.sectorCardHeader}>
        <h3 className={styles.sectorName}>{sector.name}</h3>
        <span className={`${styles.sectorToggle} ${open ? styles.sectorToggleOpen : ''}`}>+</span>
      </div>
      <p className={styles.sectorBody}>{sector.body}</p>

      {open && (
        <div className={styles.sectorExpanded}>
          {hasCompanies ? (
            <>
              <span className={styles.portfolioLabel}>From our portfolio</span>
              <div className={styles.companyList}>
                {companies.map((c) => {
                  const initials = c.name
                    .split(' ')
                    .map((w) => w[0])
                    .join('')
                    .slice(0, 3)
                    .toUpperCase();

                  const inner = (
                    <>
                      {c.logo ? (
                        <Image
                          src={c.logo}
                          alt={c.name}
                          width={36}
                          height={36}
                          className={styles.companyLogo}
                          unoptimized
                        />
                      ) : (
                        <div className={styles.companyLogoPlaceholder}>{initials}</div>
                      )}
                      <div>
                        <h3 className={styles.companyName}>{c.name}</h3>
                        <p className={styles.companyWhy}>{c.oneLiner}</p>
                      </div>
                    </>
                  );

                  if (c.enableCompanyPage && c.slug && c.categorySlug) {
                    return (
                      <Link
                        key={c.name}
                        href={`/investments/${c.categorySlug}/${c.slug}`}
                        className={styles.companyEntry}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inner}
                      </Link>
                    );
                  }
                  return (
                    <div key={c.name} className={styles.companyEntry}>
                      {inner}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <p className={styles.expandedBodyText}>{sector.expandedBody}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ChecklistSection() {
  const [checked, setChecked] = useState(new Set());

  const toggle = (i) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  const score = [...checked].reduce((sum, i) => sum + CHECKLIST[i].weight, 0);
  const qualified = score >= 75;

  return (
    <div>
      <div className={styles.checklist}>
        <div className={styles.checklistHeader}>
          <h3 className={styles.checklistTitle}>Quick fit check</h3>
          <span className={styles.checklistHint}>Check the boxes that apply to your company</span>
        </div>
        {CHECKLIST.map((item, i) => {
          const isChecked = checked.has(i);
          return (
            <div
              key={i}
              className={`${styles.checklistItem} ${isChecked ? styles.checklistItemChecked : ''}`}
              onClick={() => toggle(i)}
            >
              <div className={`${styles.checkbox} ${isChecked ? styles.checkboxChecked : ''}`}>
                {isChecked && <span className={styles.checkmark}>&#10003;</span>}
              </div>
              <span className={`${styles.checklistText} ${isChecked ? styles.checklistTextChecked : ''}`}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
      <div className={`${styles.scoreCta} ${qualified ? styles.scoreCtaVisible : ''}`}>
        <div className={styles.scoreCtaInner}>
          <div>
            <h3 className={styles.scoreCtaHeading}>You look like a fit.</h3>
            <p className={styles.scoreCtaBody}>Send us your deck. Every pitch is reviewed by the team.</p>
          </div>
          <a href="mailto:pitch@yali.vc" className={styles.scoreCtaButton}>
            pitch@yali.vc
          </a>
        </div>
      </div>
    </div>
  );
}

function PhaseBox({ phase, num }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className={styles.phaseBox}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className={`${styles.phaseHeader} ${hovered ? styles.phaseHeaderHovered : ''}`}>
        <small className={`${styles.phaseNum} ${hovered ? styles.phaseNumHovered : ''}`}>
          {String(num).padStart(2, '0')}
        </small>
        <h3 className={styles.phaseLabel}>{phase.label}</h3>
      </div>
      <div className={`${styles.phaseBody} ${hovered ? styles.phaseBodyHovered : ''}`}>
        <p className={styles.phaseBodyText}>
          {Array.isArray(phase.body) ? (
            <>
              {phase.body[0]}
              <a href="mailto:pitch@yali.vc" className={styles.phaseEmail}>{phase.body[1]}</a>
              {phase.body[2]}
            </>
          ) : phase.body}
        </p>
      </div>
    </div>
  );
}

export default function ForFoundersClient({ companiesBySector }) {
  return (
    <main className={styles.page}>
      {/* Hero */}
      <section className={styles.hero}>
        <small className={styles.heroLabel}>For Founders</small>
        <h1 className={styles.heroTitle}>Pitch to Yali</h1>
        <p className={styles.heroBody}>
          We back founders working at the frontier of deep tech in India. We invest at seed
          and pre-Series A and operate as active partners through the build. Every pitch that
          comes in is reviewed by the investments team. If there is thesis alignment, we will
          be in touch.
        </p>
      </section>

      <hr className={styles.divider} />

      {/* Our Thesis */}
      <section className={styles.section}>
        <small className={styles.sectionLabel}>Our Thesis</small>
        <p className={styles.sectionIntro}>
          We invest exclusively in deep tech: companies where the core competitive advantage
          is a technical breakthrough. Click a sector to see how we think and who we have backed.
        </p>
        <div className={styles.sectorGrid}>
          {SECTORS.map((sector) => (
            <SectorCard
              key={sector.name}
              sector={sector}
              companies={companiesBySector[sector.name]}
            />
          ))}
        </div>
        <ChecklistSection />
      </section>

      <hr className={styles.divider} />

      {/* How We Evaluate */}
      <section className={styles.section}>
        <small className={styles.sectionLabel}>How We Evaluate</small>
        <p className={styles.sectionIntro}>
          Our process is designed to be direct and respectful of your time. We do not run
          long evaluation cycles. If we are moving forward, you will know it.
        </p>
        <div className={styles.phaseRow}>
          {PHASES.map((phase, i) => (
            <div key={phase.label} className={styles.phaseWrap}>
              <PhaseBox phase={phase} num={i + 1} />
              {i < PHASES.length - 1 && (
                <div className={styles.phaseArrow}>&#8250;</div>
              )}
            </div>
          ))}
        </div>
      </section>

      <hr className={styles.divider} />

      {/* CTA Band */}
      <div className={styles.mainCta}>
        <p className={styles.mainCtaText}>
          Ready to pitch? Send us a deck or a brief note about what you are building.
        </p>
        <a href="mailto:pitch@yali.vc" className={styles.mainCtaButton}>
          pitch@yali.vc
        </a>
      </div>

      <hr className={styles.divider} />

      {/* What makes a strong pitch */}
      <section className={styles.section}>
        <small className={styles.sectionLabel}>What Makes a Strong Pitch</small>
        <div className={styles.bestGrid}>
          {BEST_PRACTICES.map((item, i) => (
            <div key={i} className={styles.bestCard}>
              <div className={styles.bestCardHeader}>
                <small className={styles.bestNum}>{String(i + 1).padStart(2, '0')}</small>
                <h3 className={styles.bestHeading}>{item.heading}</h3>
              </div>
              <p className={styles.bestBody}>{item.body}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
