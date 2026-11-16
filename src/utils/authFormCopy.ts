import type { FormSchema } from '../types/form.types';

// ASC-4 fase 1: en el login y el registro de escritorio los campos se leen en español y sin texto del esquema
// (el esquema dinámico de la API trae "Email address", "you@example.com"...). Solo cambia lo que se ve: los
// nombres de los campos, el endpoint y las validaciones siguen siendo los del esquema.
const COPY: Record<string, string> = {
  name: 'Nombre',
  email: 'Correo',
  password: 'Contraseña',
  password_confirmation: 'Confirma tu contraseña',
};

export const localizeAuthSchema = (schema: FormSchema): FormSchema => ({
  ...schema,
  fields: (schema.fields ?? []).map((field) =>
    COPY[field.name] ? { ...field, label: COPY[field.name], placeholder: COPY[field.name] } : field,
  ),
});
