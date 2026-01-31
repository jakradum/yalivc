import { SignIn } from '@clerk/nextjs';
import styles from './sign-in.module.css';
import { Lightlogo } from '../../../components/icons/lightlogo';

export const metadata = {
  title: 'Sign In | Yali Capital LP Portal',
  description: 'Sign in to access the Yali Capital Limited Partners Portal',
};

export default function SignInPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Lightlogo />
        </div>
        <h1 className={styles.title}>LP Partners Portal</h1>
        <p className={styles.subtitle}>Sign in to access quarterly reports and portfolio updates</p>
        <div className={styles.signInWrapper}>
          <SignIn
            appearance={{
              variables: {
                colorPrimary: '#830D35',
                colorBackground: '#ffffff',
                colorText: '#1a1a1a',
                colorTextSecondary: '#666666',
                borderRadius: '8px',
              },
            }}
            forceRedirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
}
