import landingStyles from './landing page styles/landingscroll.module.css'
import { DottedLogoGraphic } from './components/icons/graphic bg';
import { ViewfinderIcon } from './components/icons/small icons/viewfinder icon';
import { Graphicfg } from './components/icons/graphicfg';

export default function Home() {
  return (
    <main>
      {/* Landing scroll */}
      <section className={landingStyles.heroSection}>
        <aside className={landingStyles.contentWrapper}>
          <div className={landingStyles.headingBox}>
            <p>
              We believe the next wave of large-scale innovation will have roots in deep tech. With investments across
              sectors like Semiconductors, Robotics, Genomics, Aerospace, and AI, we're helping India's startups build
              for the future, and we're only getting started.
            </p>
            <div className={landingStyles.headerFlex}>
              <ViewfinderIcon />
              <h1>
               Taking Indian deep tech to new heights. One investment at a time.
              </h1>
              <ViewfinderIcon />
            </div>
          </div>
        </aside>
        <aside className={landingStyles.graphicWrapper}>
          <div className={landingStyles.graphicFg}>
            <Graphicfg/>
          </div>
          <div className={landingStyles.dottedLogo}>
            <DottedLogoGraphic />
          </div>
        </aside>
      </section>

      {/* Mission statement scroll */}
      <section></section>
    </main>
  );
}