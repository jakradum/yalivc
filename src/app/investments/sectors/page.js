import styles from '../../about-yali/about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getCategories, getInvestmentPhilosophy } from '@/lib/sanity-queries';
import Link from 'next/link';
import Breadcrumb from '../../components/breadcrumb';
import { PortableText } from '@portabletext/react';

export const revalidate = 60;

export const metadata = {
  title: 'Investment Sectors | YALI Capital',
  description: 'Explore our investment focus areas across deep tech sectors including AI, genomics, semiconductors, robotics, and more.',
};

export default async function SectorsPage() {
  let categories = [];
  let philosophy = null;

  try {
    [categories, philosophy] = await Promise.all([
      getCategories(),
      getInvestmentPhilosophy()
    ]);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
  
  return (
    <section>
      <Breadcrumb />

      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Investment Focus</h1>
          <div className={styles.paraFlex}>
            {philosophy?.philosophyText ? (
              <PortableText value={philosophy.philosophyText} />
            ) : (
              <>
                <p>We invest in deep tech companies...</p>
                <p>Each sector represents...</p>
              </>
            )}
          </div>
        </article>
      </div>

      <section className={styles.sectorsSection}>
        <div className={styles.sectorsContainer}>
          <div className={styles.sectorsHeader}>
            <HeaderFlex title="Sectors we invest in" color="black" desktopMaxWidth={'45%'} mobileMinHeight={'4rem'} />
          </div>
          <p>
              Each of the {categories.length} sectors below represents a domain where India has the potential to lead globally. Our investments span
              across these focus areas, where we bring deep technical expertise and industry networks to help founders
              scale cutting-edge technology companies.
            </p>
          <div className={styles.sectorsGrid}>
            {categories.map((category) => (
              <Link key={category._id} href={`/investments/sectors/${category.slug.current}`} className={styles.sectorCard}>
                <h3>{category.name}</h3>
                <p>{category.description}</p>
              </Link>
            ))}
           
          </div>
        </div>
      </section>

      <Breadcrumb />
    </section>
  );
}