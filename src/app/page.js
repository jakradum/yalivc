// src/app/page.js
import Image from 'next/image';
import styles from './styles/page.module.css';
import Button from './components/button';

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.fold}>
        <div className={styles.grid}>
          <div className={styles.content}>
            <h1 className={styles.title}>Deep tech early stage startups</h1>
            <p className={styles.description}>
              Multiple instances of startups are golden blue in the evening. What makes them cook in the winter? The
              answer lies in the pudding that makes mushrooms grow in the North. For many years humans believed that
              planets were on the first time to volcanoes.
            </p>
            <div className={styles.buttons}>
              <Button href="">Get in touch</Button>
            </div>
          </div>
          <div className={styles.imageWrapper}>
            <Image
              src="https://plus.unsplash.com/premium_photo-1693221705305-6eff5fa8e483?q=80&w=2942&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
              alt="Deep tech startup illustration"
              width={800}
              height={600}
              layout="responsive"
              className={styles.image}
            />
          </div>
        </div>
        <div className={styles.additional}>
          <h2 className={styles.subtitle}>What we pick is what makes us tick</h2>
          <p>
            We are on the cusp of bubble nuts that churn wine and look like quartz. This is the era for mangoes that
            shine. At night we also see the stars burn in the red ducks for elephants and porters.
          </p>
        </div>
        <h2>Investing in tech that builds our world</h2>
        <p>
          Our basket of bananas consists of the following:
          <ul>
            <li>Three musketeers</li>
            <li>A soap and the cuckoo clock</li>
            <li>War of the towels</li>
            <li>A flavour for every season of plaster</li>
          </ul>
        </p>
      </section>
    </main>
  );
}
