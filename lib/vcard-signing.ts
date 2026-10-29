import { createHmac, timingSafeEqual } from 'node:crypto';
type Keys = { VCARD_SIGNING_SECRET?: string; VCARD_LEGACY_SIGNING_SECRET?: string; NEXTAUTH_SECRET?: string };
function signature(id:string,key:string) { return createHmac('sha256',key).update(id,'utf8').digest('hex'); }
export function signVCardId(id:string,env:Keys=process.env):string {
 const key=env.VCARD_SIGNING_SECRET || env.NEXTAUTH_SECRET;
 if(!key) throw new Error('Falta VCARD_SIGNING_SECRET o NEXTAUTH_SECRET');
 return signature(id,key);
}
export function verifySignedVCard(id:string,provided:string|null|undefined,env:Keys=process.env):boolean {
 if(!provided || !/^[a-fA-F0-9]{64}$/.test(provided)) return false;
 const candidate=Buffer.from(provided,'hex');
 const keys=[env.VCARD_SIGNING_SECRET,env.NEXTAUTH_SECRET,env.VCARD_LEGACY_SIGNING_SECRET]
   .filter((v):v is string=>Boolean(v));
 return [...new Set(keys)].some(key => timingSafeEqual(candidate,Buffer.from(signature(id,key),'hex')));
}
