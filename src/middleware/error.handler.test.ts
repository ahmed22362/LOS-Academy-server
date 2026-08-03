import assert from 'node:assert/strict';
import { handleDuplicateFieldsDB } from './error.handler';

assert.equal(
  handleDuplicateFieldsDB({ fields: { email: 'student@example.com' } }).message,
  'The email is already in use. Please use another email.',
);
assert.equal(
  handleDuplicateFieldsDB({}).message,
  'This value is already in use. Please use another value.',
);
