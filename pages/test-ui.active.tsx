import { useState } from 'react';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { isValidEmail } from '../utils/format';

export default function TestUIPage() {
  const [email, setEmail] = useState('teste@email.com');
  const [password, setPassword] = useState('password123');

  return (
    <div className="min-h-screen bg-white p-8 space-y-10">
      <section className="space-y-4">
        <h1 className="text-2xl font-bold">Testes de UI</h1>
        <p data-testid="email-valid">
          Email válido: {isValidEmail(email) ? 'true' : 'false'}
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="primary" data-testid="button-primary">Primary</Button>
          <Button variant="secondary" data-testid="button-secondary">Secondary</Button>
          <Button loading data-testid="button-loading">Loading</Button>
          <Button disabled data-testid="button-disabled">Disabled</Button>
        </div>
      </section>

      <section className="space-y-4 max-w-md">
        <h2 className="text-xl font-semibold">Inputs</h2>
        <Input
          id="email-input"
          label="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          helperText="Informe seu email."
          type="email"
          required
          data-testid="input-email"
        />
        <Input
          id="password-input"
          label="Senha"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error="Senha obrigatória"
          type="password"
          showPasswordToggle
          data-testid="input-password"
        />
      </section>
    </div>
  );
}
