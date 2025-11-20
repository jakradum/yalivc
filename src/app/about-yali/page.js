import styles from './about-styles.module.css';
import { Nucleus } from '../components/icons/background svgs/nucleus';
import HeaderFlex from '../components/icons/headerflex';
import TeamDetails from './team-details';
import { getTeamMembers } from '@/lib/sanity-queries';

export const revalidate = 60;

export default async function AboutYali() {
  const teamMembers = await getTeamMembers();

  return (
    <section className={styles.sectionLevel}>
      <div className={styles.mainAbout}>
        <article className={styles.textContent}>
          <h1>Powering India's growth from deep within</h1>
          <div className={styles.paraFlex}>
            <p>
              Our conviction in the potential and success of the deep tech domain comes from our first-hand
              understanding of it. Our experience in founding and operating deep tech companies, along with our
              experience with previous investments in drone and semiconductor tech tells us we can take bets and take
              big ones while at it. At Yali Capital, our focus is on IP-led deep tech companies in the early stages of
              their growth.
            </p>
            <p>
              Yali Capital, headquartered in Bangalore, India, was founded in 2023, with the vision to identify and
              nurture ideas that are poised to lead the next wave of global innovation, and more so in the Indian
              context.
            </p>
            <p>
              Across sectors such as semiconductors, genomics, robotics and AI, our investments are chosen not only with
              their growth in mind but also that of the nation. The team at Yali Capital is armed with an impressive
              track record of successful investment history, and a combined 60 years in the deep tech domain.
            </p>
          </div>
        </article>
        <aside className={styles.mainsecGraphic}>
          <Nucleus />
        </aside>
      </div>
      <section id="team">
        <div className={styles.people}>
          <HeaderFlex
            title="All about the team at Yali Capital"
            color="black"
            desktopMaxWidth={'50%'}
            mobileMinHeight={'10rem'}
          />
        </div>
        <TeamDetails teamMembers={teamMembers} />
      </section>
    </section>
  );
}