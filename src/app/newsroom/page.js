import styles from '../about-yali/about styles.module.css';
import HeaderFlex from '../components/icons/headerflex';
import { NewsSVG } from '../components/icons/background svgs/newsSVG';
import NewsSection from '../components/news section';
import { NewsComponent } from './news component';

export default function Newsroom() {
    return (
      <section className={styles.sectionLevel}>
        <div className={styles.mainAbout}>
          <article className={styles.textContent}>
            <h1>The latest from Yali Capital</h1>
            <div className={styles.paraFlex}>
              <p>
                We continue to look for deep tech companies across sectors to invest in. We have rolled out an ₹810 crore
                fund (about $100 mn) to back companies in India. Our optimism about the success of Indian deep
                tech companies fuels our commitment to fostering innovation and unlocking the next wave of growth in the
                region.
              </p>
            </div>
          </article>
          <aside className={styles.mainsecGraphic}>
            <NewsSVG />
          </aside>
        </div>
        <section id="team">
          <div className={styles.people}>
            <HeaderFlex title="About us in the news" color="black" desktopMaxWidth={'40%'} mobileMaxWidth={'90%'}/>
          </div>
          <NewsComponent />
        </section>
      </section>
    );
  }