import { useState } from 'react';
import { Button } from '../components/common/ui/Button';
import { Callout } from '../components/common/ui/Callout';
import { Text } from '../components/common/ui/Text';
import { TextField } from '../components/common/ui/TextField';
import { useAuth } from '../contexts/AuthContext';
import styles from './LoginPage.module.css';

export function LoginPage() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ type: 'error', text: 'Please enter your email address.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    const { error } = await signInWithMagicLink(email.trim());

    if (error) {
      setMessage({ type: 'error', text: error });
    } else {
      setMessage({ type: 'success', text: 'Check your email for the login link!' });
    }

    setIsSubmitting(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>My Wardrobe</h1>
        <Text size="2" color="gray" className={styles.subtitle}>
          Sign in to access your wardrobe
        </Text>

        <form onSubmit={handleSubmit} className={styles.form}>
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
            {isSubmitting ? 'Sending...' : 'Send Magic Link'}
          </Button>
        </form>
      </div>
    </div>
  );
}
