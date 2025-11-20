import { getCompanyBySlug, getContentByCompany } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import styles from '../../../about-yali/about-styles.module.css';
import newsStyles from '../../../newsroom/newscomponent.module.css';
import HeaderFlex from '../../../components/icons/headerflex';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';
import { client } from '@/lib/sanity';

export const revalidate = 60;

async function getBlogPostsByCompany(companySlug) {
  return client.fetch(
    `*[_type == "blogPost" && status == "published" && references(*[_type=="company" && slug.current == $slug]._id)] | order(publishedAt desc) {
      _id,
      title,
      slug,
      publishedAt,
      contentType
    }`,
    { slug: companySlug }
  );
}

export default async function CompanyPage({ params }) {
  const { slug } = await params;
  const company = await getCompanyBySlug(slug);

  if (!company) {
    notFound();
  }

  const allContent = await getContentByCompany(slug);

  return (
    <section>
      <Breadcrumb />

      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '2rem', margin: '2rem', flexWrap: 'wrap' }}>
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
            <h1 style={{ margin: 0, flex: 1, wordBreak: 'break-word' }}>{company.name}</h1>
          </div>

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

      {allContent.length > 0 && (
        <section className={styles.sectorsSection} style={{ paddingBottom: 0, marginBottom: '1rem' }}>
          <div className={styles.people}>
            <HeaderFlex title="Related Content" color="black" desktopMaxWidth={'40%'} mobileMinHeight={'6rem'} />
          </div>

          <div className={newsStyles.newsArticles}>
            {allContent.map((item) => {
              const date = new Date(item.date);
              const day = date.getDate().toString().padStart(2, '0');
              const month = date.toLocaleString('default', { month: 'short' });
              const year = date.getFullYear();

              return (
                <article key={item._id} className={newsStyles.article}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <p className={newsStyles.articleDate}>{`${day} ${month} ${year}`}</p>
                    <span style={{ 
                      fontSize: '0.75rem', 
                      fontWeight: '600',
                      color: '#830D35',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}>
                      {item.type}
                    </span>
                  </div>
                  <a 
                    href={item.url} 
                    target={item.isExternal ? "_blank" : undefined}
                    rel={item.isExternal ? "noopener noreferrer" : undefined}
                  >
                    <p className={newsStyles.articleTitle}>{item.title}</p>
                  </a>
                  <p className={newsStyles.articleMeta}>{item.source}</p>
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