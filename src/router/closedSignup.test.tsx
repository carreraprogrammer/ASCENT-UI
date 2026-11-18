import { readFileSync } from 'node:fs';
import { render } from '@testing-library/react';
import { MemoryRouter, Route, Switch } from 'react-router-dom';
import { ClosedSignupRoute, CLOSED_SIGNUP_PATHS } from './closedSignup';

// TCW-8: /register y /signup no sirven formulario; llevan al login, en la app y en el servidor.
test.each(CLOSED_SIGNUP_PATHS)('%s lleva al login', (path) => {
  const view = render(
    <MemoryRouter initialEntries={[path]}>
      <Switch>
        {ClosedSignupRoute()}
        <Route exact path="/login" render={() => <p>pantalla de login</p>} />
        <Route render={() => <p>otra cosa</p>} />
      </Switch>
    </MemoryRouter>,
  );
  expect(view.getByText('pantalla de login')).toBeInTheDocument();
});

test('el servidor redirige las rutas de registro al login', () => {
  const caddy = readFileSync('deploy/Caddyfile', 'utf8');
  expect(caddy).toMatch(/@signup path \/register \/register\/ \/signup \/signup\//);
  expect(caddy).toMatch(/redir @signup \/login 302/);
  expect(caddy.indexOf('redir @signup')).toBeLessThan(caddy.indexOf('try_files'));
});

test('ya no existe la página de registro', () => {
  const router = readFileSync('src/router/AppRouter.tsx', 'utf8');
  expect(router).not.toMatch(/RegisterPage/);
});
