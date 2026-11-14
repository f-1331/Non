import { EndpointError } from 'sdk';
import { isSystemActive, isOwner } from '../lib/system.js';

export default async function (input, ctx) {
  const user = ctx.initData?.user;
  const active = await isSystemActive();
  const owner = await isOwner(user);

  return {
    active,
    isOwner: owner
  };
}
