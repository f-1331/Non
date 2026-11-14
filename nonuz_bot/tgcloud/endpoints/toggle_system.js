import { EndpointError } from 'sdk';
import { isSystemActive, setSystemActive, isOwner } from '../lib/system.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  const owner = await isOwner(user);

  if (!owner) {
    throw new EndpointError('Ruxsat etilmagan', { code: 'UNAUTHORIZED' });
  }

  const newStatus = typeof input?.active === 'boolean' ? input.active : !(await isSystemActive());
  await setSystemActive(newStatus);

  return {
    success: true,
    active: newStatus
  };
}
