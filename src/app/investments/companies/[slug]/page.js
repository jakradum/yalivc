import { getCompanyBySlug } from '@/lib/sanity-queries';
import { urlFor } from '@/lib/sanity-image';
import styles from '../../../about-yali/about-styles.module.css';
import Breadcrumb from '../../../components/breadcrumb';
import Image from 'next/image';
import Link from 'next/link';
import Button from '../../../components/button';
import { notFound } from 'next/navigation';

export const revalidate = 60;

export default async function CompanyPage({ params }) {
  const company = await getCompanyBySlug(params.slug);
  
  if (!company) {
    notFound();
  }

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
    </section>
  );
}