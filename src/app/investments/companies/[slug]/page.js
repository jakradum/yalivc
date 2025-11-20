import { getCompanyBySlug, getNewsByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';
import additionalStyles from './additionalStyles.module.css';


export const revalidate = 60;

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const news = await getNewsByCompany(slug);
const sortedNews = [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
  return (
    <section>
      <Breadcrumb />

      <div className={additionalStyles.mainAbout}>
        <article className={styles.textContent}>
          <div className={styles.companyHeader}>
            {company.logo && (
              <div className={styles.logoContainer}>
                <Image
                  src={urlFor(company.logo).width(120).url()}
                  alt={`${company.name} logo`}
                  width={120}
                  height={120}
                  style={{ objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}
            <h1 className={additionalStyles.companyName}>{company.name}</h1>
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
              marginBottom: 0,
            }}
          >
            {sortedNews.map((article) => {
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
      <Breadcrumb />
    </section>
  );
}
