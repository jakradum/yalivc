import { SignUp } from '@clerk/nextjs';
import styles from '../sign-in/sign-in.module.css';
import { Lightlogo } from '../../../components/icons/lightlogo';

export const metadata = {
  title: 'Sign Up | Yali Capital LP Portal',
  description: 'Create an account to access the Yali Capital Limited Partners Portal',
};

export default function SignUpPage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.logoWrapper}>
          <Lightlogo />
        </div>
        <h1 className={styles.title}>LP Partners Portal</h1>
        <p className={styles.subtitle}>Create an account to access portfolio updates</p>
        <div className={styles.signInWrapper}>
          <SignUp
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
