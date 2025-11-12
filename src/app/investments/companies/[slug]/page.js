import { getCompanyBySlug, getNewsByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import styles from '../../../about-yali/about-styles.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);
  
  if (!company) {
    notFound();
  }
  
  const news = await getNewsByCompany(slug);
  
  return (
    <section>
      <Breadcrumb />
      
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <div style={{ marginBottom: '2rem' }}>
            {company.logo && (
              <Image
                src={urlFor(company.logo).width(120).url()}
                alt={`${company.name} logo`}
                width={120}
                height={120}
                style={{ objectFit: 'contain' }}
              />
            )}
          </div>
          
          <h1>{company.name}</h1>
          
          <p style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1rem' }}>
            {company.oneLiner}
          </p>
          
          <div className={styles.paraFlex}>
            <p>{company.detail}</p>
          </div>
          
          {company.link && (
            <div style={{ marginTop: '2rem' }}>
              <Button href={company.link} color="black" external>
                Visit Website
              </Button>
            </div>
          )}
        </article>
      </div>
      
      {news.length > 0 && (
        <section className={styles.sectorsSection}>
          <div className={styles.people}>
            <HeaderFlex
              title="Related News"
              color="black"
              desktopMaxWidth={'50%'}
              mobileMinHeight={'6rem'}
            />
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '2rem 0' }}>
            {news.map((article) => (
              <a 
                key={article._id} 
                href={article.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  display: 'flex',
                  gap: '1.5rem',
                  padding: '1.5rem',
                  background: '#f9f9f9',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  color: 'inherit',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ flexShrink: 0, fontSize: '0.875rem', color: '#666', width: '100px' }}>
                  {new Date(article.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.125rem', fontWeight: 600, color: '#830D35' }}>
                    {article.headlineEdited}
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: '#666', fontStyle: 'italic' }}>
                    {article.publicationName}
                  </p>
                </div>
                {article.isVideo && (
                  <span style={{
                    flexShrink: 0,
                    padding: '0.25rem 0.75rem',
                    background: '#830D35',
                    color: 'white',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    alignSelf: 'flex-start'
                  }}>
                    VIDEO
                  </span>
                )}
              </a>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
