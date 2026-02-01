import { useState } from 'react';
import { Button } from '../components/common/ui/Button';
import { Callout } from '../components/common/ui/Callout';
import { Text } from '../components/common/ui/Text';
import { TextField } from '../components/common/ui/TextField';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { sendOtp, verifyOtp } = useAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await sendOtp(email.trim());

    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the login code!' });
      setStep('code');
    }

    setIsSubmitting(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      setMessage({ type: 'error', text: 'Please enter the code from your email.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await verifyOtp(email.trim(), code.trim());

    if (error) {
      setMessage({ type: 'error', text: error });
    }

    setIsSubmitting(false);
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setMessage(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Wardrobe</h1>
        <Text size="2" color="gray" className={styles.subtitle}>
          Sign in to access your wardrobe
        </Text>

        {step === 'email' ? (
          <form onSubmit={handleSendCode} className={styles.form}>
            <div className={styles.field}>
              <Text as="label" size="2" weight="bold">
                Email
              </Text>
              <TextField.Root size="3">
                <TextField.Input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </TextField.Root>
            </div>

            {message && (
              <Callout.Root color={message.type === 'success' ? 'green' : 'red'} size="1">
                <Callout.Text>{message.text}</Callout.Text>
              </Callout.Root>
            )}

            <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Sending...' : 'Send Login Code'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyCode} className={styles.form}>
            <Text size="2" color="gray">
              Enter the 6-digit code sent to <strong>{email}</strong>
            </Text>

            <div className={styles.field}>
              <Text as="label" size="2" weight="bold">
                Code
              </Text>
              <TextField.Root size="3">
                <TextField.Input
                  type="text"
                  name="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  required
                />
              </TextField.Root>
            </div>

            {message && (
              <Callout.Root color={message.type === 'success' ? 'green' : 'red'} size="1">
                <Callout.Text>{message.text}</Callout.Text>
              </Callout.Root>
            )}

            <Button type="submit" className={styles.submitButton} disabled={isSubmitting}>
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </Button>

            <button type="button" className={styles.backLink} onClick={handleBackToEmail}>
              Use a different email
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
