import { getTeamMemberBySlug, getAllTeamMemberSlugs, getOtherTeamMembers } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import teamStyles from './team-profile.module.css';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import QuoteMarks from '../../components/icons/background svgs/quotemarks';
import JsonLd from '../../components/JsonLd';

export const revalidate = 60;

function formatCardName(fullName) {
  if (!fullName) return '';
  const nicknameMatch = fullName.match(/^.*?['\u2018\u2019](.+?)['\u2018\u2019]\s*(.+)$/);
  if (nicknameMatch) {
    const nickname = nicknameMatch[1];
    const surname = nicknameMatch[2].trim().split(/\s+/).pop();
    return `${nickname} ${surname}`;
  }
  return fullName;
}

export async function generateStaticParams() {
  const members = await getAllTeamMemberSlugs();
  return members.map((member) => ({
    slug: member.slug,
  }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);

  if (!member) {
    return {
      title: 'Team Member Not Found | Yali Capital',
    };
  }

  return {
    title: `${member.name} | Yali Capital`,
    description: member.oneLiner || `${member.name}, ${member.role} at Yali Capital`,
    alternates: {
      canonical: `https://yali.vc/about-yali/${slug}/`,
    },
    openGraph: {
      title: `${member.name} | Yali Capital`,
      description: member.oneLiner || `${member.name}, ${member.role} at Yali Capital`,
      url: `https://yali.vc/about-yali/${slug}/`,
      type: 'profile',
      ...(member.photo && {
        images: [{ url: member.photo, alt: member.name }],
      }),
    },
    twitter: {
      title: `${member.name} | Yali Capital`,
      description: member.oneLiner || `${member.name}, ${member.role} at Yali Capital`,
      ...(member.photo && { images: [member.photo] }),
    },
  };
}

export default async function TeamMemberPage({ params }) {
  const { slug } = await params;
  const member = await getTeamMemberBySlug(slug);

  if (!member || !member.enableTeamPage) {
    notFound();
  }

  const otherMembers = await getOtherTeamMembers(slug, 8);

  // Random pattern on each server render (changes every 60s due to revalidate)
  const patternIndex = (slug.charCodeAt(0) % 7) + 1;

  const firstName = member.name?.split(' ')[0] ?? 'their';

  // If name contains a nickname in single quotes (e.g. "Ganapathy 'Gani' Subramaniam"),
  // surface the nickname + surname. Otherwise fall back to first name with hyphen-break.
  const nicknameMatch = member.name?.match(/^.*?['\u2018\u2019](.+?)['\u2018\u2019]\s*(.*)$/);
  const nameParts = member.name?.split(/\s+/) ?? [];
  const lastNamePart = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const heroDisplayName = nicknameMatch ? nicknameMatch[1] : firstName;
  const displayName = heroDisplayName.split(' ').map((word, i) => (
    <span key={i} className={teamStyles.heroNameWord}>{word}</span>
  ));

  return (
    <section className={teamStyles.container}>
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Person',
        name: member.name,
        jobTitle: member.role,
        description: member.oneLiner || member.bio,
        url: `https://yali.vc/about-yali/${slug}/`,
        ...(member.photo && { image: member.photo }),
        ...(member.linkedIn && { sameAs: [member.linkedIn] }),
        worksFor: {
          '@type': 'Organization',
          name: 'Yali Capital',
          url: 'https://yali.vc',
        },
      }} />

      {/* ── Section 1: Hero ── */}
      <div className={teamStyles.hero}>
        <div className={`${teamStyles.heroPhoto} ${teamStyles[`pattern${patternIndex}`]}`}>
          {member.photo && (
            <Image
              src={member.photo}
              alt={member.name}
              fill
              className={teamStyles.heroPhotoImg}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          )}
        </div>
        <div className={teamStyles.heroInfo}>
          {member.department && (
            <p className={teamStyles.heroDept}>{`${member.department.charAt(0).toUpperCase()}${member.department.slice(1)} Team`}</p>
          )}
          <h1 className={teamStyles.heroName}>{displayName}</h1>
          {member.linkedIn && (
            <a
              href={member.linkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className={teamStyles.heroLinkedIn}
            >
              LinkedIn ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Section 2: Bio + Sidebar ── */}
      <div className={teamStyles.bioSection}>
        <div className={teamStyles.bioMain}>
          {member.bio && (
            <>
              <span className={teamStyles.sectionLabel}>About</span>
              <div className={teamStyles.bioText}>
                <p>{member.bio}</p>
              </div>
            </>
          )}
          {/* personalNote field does not exist in Sanity — using personalPhilosophy (PortableText) */}
          {member.personalPhilosophy && (
            <div className={teamStyles.inWordsBlock}>
              <span className={teamStyles.sectionLabel}>In {heroDisplayName}&apos;s words</span>
              <div className={teamStyles.inWordsContent}>
                <PortableText value={member.personalPhilosophy} />
              </div>
            </div>
          )}
        </div>
        <div className={teamStyles.bioSidebar}>
          {/* hobbies field does not exist in Sanity — using outsideWork array */}
          {member.outsideWork && member.outsideWork.length > 0 && (
            <>
              <span className={teamStyles.sectionLabel}>Outside of work</span>
              <div className={teamStyles.hobbyTags}>
                {member.outsideWork.map((item, idx) => (
                  <span key={idx} className={teamStyles.hobbyTag}>{item}</span>
                ))}
              </div>
            </>
          )}
          {(member.pullQuote || member.recommendation?.text) && (
            <div className={teamStyles.sidebarQuoteBlock}>
              <span className={teamStyles.sectionLabel}>What others say</span>
              {member.recommendation?.text && (
                <div className={teamStyles.quoteCard}>
                  <QuoteMarks className={teamStyles.quoteMarksBackground} stroke="#830d35" />
                  <div className={teamStyles.quoteCardInner}>
                    <p className={teamStyles.quoteBody}>{member.recommendation.text}</p>
                    <div className={teamStyles.quoteAttribution}>
                      {member.recommendation.authorName && (
                        <span className={teamStyles.quoteAuthorName}>
                          {member.recommendation.authorName}
                        </span>
                      )}
                      {member.recommendation.authorTitle && (
                        <span className={teamStyles.quoteAuthorTitle}>
                          {member.recommendation.authorTitle}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {member.pullQuote && (
                <div className={teamStyles.quoteCard}>
                  <QuoteMarks className={teamStyles.quoteMarksBackground} stroke="#830d35" />
                  <div className={teamStyles.quoteCardInner}>
                    <p className={teamStyles.quoteBody}>{member.pullQuote}</p>
                    {member.pullQuoteAttribution && (
                      <div className={teamStyles.quoteAttribution}>
                        <span className={teamStyles.quoteAuthorName}>
                          {member.pullQuoteAttribution}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Section 4: View Others in the Team ── */}
      {otherMembers && otherMembers.length > 0 && (
        <div className={teamStyles.othersSection}>
          <span className={teamStyles.sectionLabel}>See others in the team</span>
          <div className={teamStyles.othersGrid}>
            {otherMembers.map((other) => (
              <Link
                key={other._id}
                href={`/about-yali/${other.slug.current}`}
                className={`${teamStyles.otherCard} ${other.department !== 'investments' ? teamStyles.otherCardNonInvestments : ''}`}
              >
                <div className={teamStyles.otherCardInfo}>
                  <span className={teamStyles.otherCardName}>{formatCardName(other.name)}</span>
                  <span className={teamStyles.otherCardViewBtn}>View</span>
                </div>
                {other.photo && (
                  <div className={teamStyles.otherCardPhotoWrap}>
                    <Image
                      src={other.photo}
                      alt={other.name}
                      fill
                      className={teamStyles.otherCardPhoto}
                      sizes="90px"
                    />
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

    </section>
  );
}
