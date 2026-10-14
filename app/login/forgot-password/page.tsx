'use client';

import { useState } from 'react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'No se pudo procesar la solicitud');
      } else {
        setMessage(data.message || 'Revisa tu correo para continuar.');
      }
    } catch {
      setError('Error de red, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <h1 className="text-2xl font-black text-slate-900">Acceso al sistema</h1>
        <p className="text-sm text-slate-600 mt-2">Ingresa tu correo y te enviaremos una <b>contraseña temporal</b> para ingresar al panel.</p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-bold text-slate-700">Correo</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="usuario@grupoyc.com"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-700 py-2.5 font-bold text-white hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? 'Enviando...' : 'Enviar contraseña temporal'}
          </button>
        </form>

        <a href="/login" className="mt-4 inline-block text-sm font-semibold text-blue-700 hover:underline">Volver a login</a>
      </section>
    </main>
  );
}
