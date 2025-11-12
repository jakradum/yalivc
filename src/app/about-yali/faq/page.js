import { getFAQs } from '@/lib/sanity-queries';
import Breadcrumb from '../../components/breadcrumb';
import FAQ from '../../components/FAQ';
import styles from '@/app/contact/contact.module.css';

export const revalidate = 60;

export const metadata = {
  title: 'FAQ | YALI Capital',
  description: 'Frequently asked questions about YALI Capital.',
};

export default async function FAQPage() {
  const companyFAQs = await getFAQs('company');
  
  return (
    <>
      <Breadcrumb />
      <div className={styles.pageContainer}>
        <section className={styles.faqSection}>
          <FAQ 
            title="About YALI Capital" 
            description="Learn more about who we are and what drives our investment philosophy."
            faqs={companyFAQs}
          />
        </section>
        
        <section className={styles.dividerSection}>
          <p>
            Have more questions? <a href="/contact">Contact us</a> for additional information.
          </p>
        </section>
      </div>
    </>
  );
}