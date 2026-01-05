import { getTeamMemberBySlug, getAllTeamMemberSlugs, getOtherTeamMembers } from '@/lib/sanity-queries';
import { PortableText } from '@portabletext/react';
import teamStyles from './team-profile.module.css';
import Breadcrumb from '../../components/breadcrumb';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../../components/button';
import { notFound } from 'next/navigation';

export const revalidate = 60;

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
  };
}

export default async function TeamMemberPage({ params }) {
  const { slug } = await params;
  const [member, otherMembers] = await Promise.all([
    getTeamMemberBySlug(slug),
    getOtherTeamMembers(slug, 4)
  ]);

  if (!member || !member.enableTeamPage) {
    notFound();
  }

  // Random pattern on each server render (changes every 60s due to revalidate)
  const patternIndex = Math.floor(Math.random() * 7) + 1;

  return (
    <section className={teamStyles.container}>
      <Breadcrumb />

      {/* 2x2 Grid Layout */}
      <div className={teamStyles.profileGrid}>
        {/* Top Left - Photo with pattern background */}
        <div className={teamStyles.photoCell}>
          <div className={`${teamStyles.photoInner} ${teamStyles[`pattern${patternIndex}`]}`}>
            {member.photo && (
              <Image
                src={member.photo}
                alt={member.name}
                width={400}
                height={400}
                className={teamStyles.memberPhoto}
                style={{ objectFit: 'cover' }}
              />
            )}
          </div>
        </div>

        {/* Top Right - About section */}
        <div className={teamStyles.aboutCell}>
          <h1 className={teamStyles.aboutTitle}>About {member.name}</h1>
          <div className={teamStyles.bioText}>
            <p>{member.bio}</p>
          </div>
          {member.personalPhilosophy && (
            <div className={teamStyles.inWordsSection}>
              <h2 className={teamStyles.inWordsTitle}>In {member.name.split(' ')[0]}&apos;s words</h2>
              <div className={teamStyles.inWordsContent}>
                <PortableText value={member.personalPhilosophy} />
              </div>
            </div>
          )}
          {member.linkedIn && (
            <div className={teamStyles.linkedInButton}>
              <Button href={member.linkedIn} color="black" target="_blank">
                View on LinkedIn
              </Button>
            </div>
          )}
        </div>

        {/* Bottom Left - Pull Quote */}
        <div className={teamStyles.quoteCell}>
          {member.pullQuote ? (
            <blockquote className={teamStyles.pullQuote}>
              <p>{member.pullQuote}</p>
              {member.pullQuoteAttribution && (
                <footer className={teamStyles.quoteAttribution}>
                  — {member.pullQuoteAttribution}
                </footer>
              )}
            </blockquote>
          ) : member.personalPhilosophy ? (
            <div className={teamStyles.philosophyContent}>
              <PortableText value={member.personalPhilosophy} />
            </div>
          ) : null}
        </div>

        {/* Bottom Right - Outside of Work */}
        <div className={teamStyles.outsideWorkCell}>
          {member.outsideWork && member.outsideWork.length > 0 && (
            <>
              <h2 className={teamStyles.outsideWorkTitle}>Outside of Work:</h2>
              <ul className={teamStyles.outsideWorkList}>
                {member.outsideWork.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* Recommendation Section */}
      {member.recommendation?.text && (
        <div className={teamStyles.recommendationSection}>
          <h2 className={teamStyles.sectionTitle}>What Others Say</h2>
          <div className={teamStyles.recommendationCard}>
            <div className={teamStyles.recommendationContent}>
              <div className={teamStyles.quoteIcon}>&ldquo;</div>
              <p className={teamStyles.recommendationText}>{member.recommendation.text}</p>
            </div>
            <div className={teamStyles.recommendationAuthor}>
              <span className={teamStyles.authorName}>{member.recommendation.authorName}</span>
              {member.recommendation.authorTitle && (
                <span className={teamStyles.authorTitle}>, {member.recommendation.authorTitle}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Articles Section */}
      {member.articles && member.articles.length > 0 && (
        <div className={teamStyles.articlesSection}>
          <h2 className={teamStyles.sectionTitle}>Articles by {member.name.split(' ')[0]}</h2>
          <ul className={teamStyles.articlesList}>
            {member.articles.map((article, idx) => (
              <li key={idx} className={teamStyles.articleItem}>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={teamStyles.articleLink}
                >
                  <span className={teamStyles.articleTitle}>{article.title}</span>
                  <span className={teamStyles.articleMeta}>
                    {article.publication && <span>{article.publication}</span>}
                    {article.date && (
                      <span className={teamStyles.articleDate}>
                        {new Date(article.date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    )}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* View Others in Team Section */}
      {otherMembers && otherMembers.length > 0 && (
        <div className={teamStyles.otherMembersSection}>
          <h2 className={teamStyles.sectionTitle}>View Others in the Team</h2>
          <div className={teamStyles.otherMembersGrid}>
            {otherMembers.map((otherMember) => (
              <Link
                key={otherMember._id}
                href={`/about-yali/${otherMember.slug.current}`}
                className={teamStyles.otherMemberCard}
              >
                <span className={teamStyles.otherMemberName}>{otherMember.name}</span>
                <span className={teamStyles.otherMemberRole}>{otherMember.role}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Breadcrumb />
    </section>
  );
}
