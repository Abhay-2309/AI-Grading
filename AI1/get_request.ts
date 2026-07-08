import { gradingRepository } from './src/services/db/repository.ts';

async function run() {
  try {
    const result = await gradingRepository.get('d9db8647-6e85-45b0-a2c6-2fa1f63ddda3');
    console.log('RESULT:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}

run();
