import { getCompanyBySlug, getNewsByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
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
      <Breadcrumb customLabel={company.name} />

      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: '2rem',
              marginBottom: '2rem',
              flexWrap: 'nowrap',
            }}
          >
            {company.logo && (
              <div style={{ flexShrink: 0 }}>
                <Image
                  src={urlFor(company.logo).width(120).url()}
                  alt={`${company.name} logo`}
                  width={120}
                  height={120}
                  style={{ objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}
            <h1 style={{ margin: 0, flex: 1 }}>{company.name}</h1>
          </div>

          {/* <p style={{ fontSize: '1.25rem', fontWeight: '500', marginBottom: '1rem' }}>{company.oneLiner}</p> */}

          <div className={styles.paraFlex}>
            <p>{company.detail}</p>
          </div>

          {company.link && (
            <div style={{ marginTop: '2rem' }}>
              <Button href={company.link} color="black" target="_blank">
                Visit Website
              </Button>
            </div>
          )}
        </article>
      </div>

      {news.length > 0 && (
        <section className={styles.sectorsSection} style={{ paddingBottom: 0, marginBottom: '1rem' }}>
          <div className={styles.people}>
            <HeaderFlex title="Related News" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
          </div>

          <div
            className={newsStyles.newsArticles}
            style={{
              gridTemplateColumns: `repeat(${news.length}, 1fr)`,
              marginBottom: 0,
            }}
          >
            {news.map((article) => {
              const date = new Date(article.date);
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.toLocaleString('default', { month: 'short' });
              const year = date.getFullYear();

              return (
                <article key={article._id} className={newsStyles.article}>
                  <p className={newsStyles.articleDate}>{`${day} ${month} ${year}`}</p>
                  <a href={article.url} target="_blank" rel="noopener noreferrer">
                    <p className={newsStyles.articleTitle}>{article.headlineEdited}</p>
                  </a>
                  <p className={newsStyles.articleMeta}>{article.publicationName}</p>
                </article>
              );
            })}
          </div>
        </section>
      )}
    </section>
  );
}
