import styles from '../../about-yali/about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import { getCategories, getInvestmentPhilosophy } from '@/lib/sanity-queries';
import Breadcrumb from '../../components/breadcrumb';
import { PortableText } from '@portabletext/react';
import CategoryTable from './CategoryTable';

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
    console.log('Categories fetched:', categories.length, categories);
  } catch (error) {
    console.error('Failed to fetch data:', error);
  }
    // Add fallback if no categories
  if (!categories || categories.length === 0) {
    return <div>No categories found</div>;
  }

  const philosophyText = `Each of these ${categories.length} sectors represents a domain where India has the potential to lead globally. Our investments span across these focus areas, where we bring deep technical expertise and industry networks to help founders scale cutting-edge technology companies.`;
  
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
                <p>We invest in deep tech companies building transformative technologies across critical sectors.</p>
                <p>Each sector represents a domain where India has the potential to lead globally.</p>
              </>
            )}
          </div>
        </article>
      </div>

      <section className={styles.sectorsSection}>
        <div className={styles.sectorsHeader}>
          <HeaderFlex title="Sectors we invest in" color="black" desktopMaxWidth={'45%'} mobileMinHeight={'4rem'} />
        </div>
        
         <CategoryTable categories={categories} philosophyText={philosophyText} />
    </section>

      <Breadcrumb />
    </section>
  );
}