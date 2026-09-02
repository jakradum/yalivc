import styles from './brand.module.css';
import { YALI_CREATURE_INNER } from '../components/yali-creature-paths';

export const metadata = {
  title: 'The Yali | Yali Capital',
  description:
    'The story behind our name and mark: the yali, the leonine guardian creature of South Indian temple sculpture.',
  alternates: {
    canonical: 'https://yali.vc/brand/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const PARTS = [
  { color: '#ebde84', label: "Lion's head" },
  { color: '#d9c668', label: 'Piglike ears and horns' },
  { color: '#b8924a', label: "Elephant's trunk" },
  { color: '#a06038', label: 'Wide fanged mouth' },
  { color: '#922535', label: 'Mane' },
  { color: '#830d35', label: 'Clawed paws' },
];

const FORMS = [
  ['Simha', 'lion head'],
  ['Gaja', 'elephant head or trunk'],
  ['Makara', 'crocodile or makara head'],
  ['Nara', 'human head'],
  ['Mesha', 'ram head'],
  ['Ashwa', 'horse head'],
  ['Mahisha', 'buffalo head'],
];

export default function Brand() {
  return (
    <div className={styles.page}>

      {/* Header band */}
      <div className={styles.heroBand}>
        <div className={styles.tag}>THE YALI</div>
        <h1 className={styles.title}>The story behind our identity</h1>
        <p className={styles.subtitle}>
          Our name and our mark come from the yali, the guardian creature of South Indian temples.
        </p>
      </div>

      <div className={styles.content}>

        {/* The creature */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>The Creature</h2>
          <div className={styles.creatureGrid}>
            <div className={`${styles.artBox} ${styles.artLight}`}>
              <svg
                viewBox="0 0 40 40"
                className={styles.markMono}
                role="img"
                aria-label="The yali mark"
                dangerouslySetInnerHTML={{ __html: YALI_CREATURE_INNER }}
              />
            </div>
            <div className={styles.prose}>
              <p className={styles.body}>
                Outside temples or in their courtyards in Southern India, you will see this composite
                creature carved in stone: holding up the roof, standing guard, or flanking either side
                of the entrance to the sanctum sanctorum. Through rain and shine, and over the better
                part of a thousand years, the yali has stood protecting the deity, the goodness and
                peace inside.
              </p>
              <p className={styles.body}>
                Yali Capital&apos;s mark is adapted from the yali (Sanskrit: <em>vyala</em>): a leonine
                creature with the body of a lion, the trunk of an elephant, and a maned, horned head.
                In temple sculpture it is shown rearing, often over a smaller elephant.
              </p>
            </div>
          </div>
        </section>

        {/* Anatomy */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Anatomy: many beasts, one form</h2>
          <div className={styles.anatomyGrid}>
            <div className={`${styles.artBox} ${styles.artDark}`}>
              <svg
                viewBox="0 0 40 40"
                className={styles.mark}
                role="img"
                aria-label="The yali mark, coloured by anatomical region"
                dangerouslySetInnerHTML={{ __html: YALI_CREATURE_INNER }}
              />
            </div>
            <ul className={styles.legend}>
              {PARTS.map((p) => (
                <li key={p.label} className={styles.legendItem}>
                  <span className={styles.swatch} style={{ background: p.color }} />
                  {p.label}
                </li>
              ))}
            </ul>
          </div>
          <p className={styles.body}>
            The yali is not one fixed animal but a family of forms. The body is always leonine; the
            head names the type:
          </p>
          <div className={styles.formList}>
            {FORMS.map(([name, desc]) => (
              <div key={name} className={styles.formRow}>
                <span className={styles.formName}>{name} vyala</span>
                <span className={styles.formDesc}>lion&apos;s body, {desc}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Sources */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Sources</h2>
          <p className={styles.sourceNote}>
            M.A. Dhaky, <em>The Vyala Figures on the Mediaeval Temples of India</em> (Prithivi
            Prakashan, 1965); Crispin Branfoot, &ldquo;Expanding Form: The Architectural Sculpture of
            the South Indian Temple, ca. 1500-1700,&rdquo; <em>Artibus Asiae</em> 62, no. 2 (2002);
            Sachin Vidyadhar Joshi, &ldquo;Animal Depictions in Medieval Forts of the Deccan and
            Konkan Regions&rdquo; (2023).
          </p>
        </section>

      </div>
    </div>
  );
}
