import { Redirect, Route } from 'react-router-dom';

// TCW-8: el registro está cerrado. Estas rutas no sirven formulario: llevan al login. El servidor (deploy/Caddyfile)
// hace lo mismo antes de servir la app.
export const CLOSED_SIGNUP_PATHS = ['/register', '/signup'];

export const ClosedSignupRoute = () => (
  <Route exact path={CLOSED_SIGNUP_PATHS} render={() => <Redirect to="/login" />} />
);
