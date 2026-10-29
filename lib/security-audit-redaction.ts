/** Audit event describes the failure, never stores the submitted HMAC. */
export function safeSignatureAudit(type:'HMAC_MISMATCH'|'SIGNATURE_REQUIRED'):{
 type:'HMAC_MISMATCH'|'SIGNATURE_REQUIRED';reason:string
} {
 return {type,reason:type==='HMAC_MISMATCH'?'signature_invalid':'missing_signature'};
}
