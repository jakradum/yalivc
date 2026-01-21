import styles from './press-downloads.module.css';
import aboutStyles from '../../about-yali/about-styles.module.css';
import HeaderFlex from '../../components/icons/headerflex';
import Breadcrumb from '../../components/breadcrumb';
import { getCategories, getTeamMembers } from '@/lib/sanity-queries';
import PressDownloadsClient from './PressDownloadsClient';

export const metadata = {
  title: 'Press Downloads | Yali Capital - Media Resources',
  description: 'Download official Yali Capital media assets including logos, team photos, and press materials. Resources for journalists and media covering our deep tech venture capital investments.',
  keywords: 'Yali Capital press kit, media downloads, VC logo download, press materials, media resources',
};

export const revalidate = 60;

export default async function PressDownloads() {
  const [categories, teamMembers] = await Promise.all([
    getCategories(),
    getTeamMembers()
  ]);

  return (
    <section className={styles.container}>
      <Breadcrumb />

      <div className={aboutStyles.people}>
        <HeaderFlex
          title="Media Download Centre"
          color="black"
          desktopMaxWidth={'60%'}
          mobileMaxWidth={'90%'}
        />
      </div>
      <p className={styles.subtitle}>
        Resources for journalists and media covering Yali Capital.
      </p>

      <PressDownloadsClient categories={categories} teamMembers={teamMembers} />
    </section>
  );
}
