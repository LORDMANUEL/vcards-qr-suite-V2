'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import styles from './login.module.css';

function sanitizePath(pathname: string): string {
  const clean = pathname || '/login';
  if (clean.includes('/login')) return '/login';
  if (clean.includes('/dashboard')) return '/dashboard';
  return clean.startsWith('/') ? clean : '/login';
}

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    // Fix malformed paths like /190.107.136.92:9301/.../login left by bad callback URLs.
    const normalized = sanitizePath(pathname || '/login');
    if (pathname && normalized !== pathname) {
      router.replace(normalized);
    }
  }, [pathname, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!isEmailValid) {
        setError('Ingresa un correo valido');
        setLoading(false);
        return;
      }

      const result = await signIn('credentials', {
        email,
        password,
        otp,
        redirect: false,
        callbackUrl: '/dashboard',
      });

      if (result?.error) {
        setError(result.error);
      } else {
        router.replace('/dashboard');
        router.refresh();
      }
    } catch (err) {
      setError('Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.noise} />
      <div className={styles.glowA} />
      <div className={styles.glowB} />

      <section className={styles.card}>
        <div className={styles.brandBlock}>
          <div className={styles.badge} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1>YUDE VCards</h1>
          <p>Administración empresarial</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email">Correo Electronico</label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="usuario@empresa.com"
              autoComplete="username"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              autoComplete="current-password"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="otp">Codigo autenticador (si aplica)</label>
            <input
              id="otp"
              name="otp"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
            />
          </div>

          {error && <div className={styles.errorBox}>{error}</div>}

          <div className={styles.metaRow}>
            <a href="/login/forgot-password" className={styles.linkBtn}>Olvide mi contrasena</a>
          </div>

          <button type="submit" disabled={loading} className={styles.submitBtn}>
            {loading ? 'Iniciando sesion...' : 'Iniciar sesion'}
          </button>
        </form>

        <div className={styles.footer}>
          <p>Copyright 2026 Grupo Yude Canahuati</p>
          <p>Todos los derechos reservados</p>
        </div>
      </section>
    </main>
  );
}
