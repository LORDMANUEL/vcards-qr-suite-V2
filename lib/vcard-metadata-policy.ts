/** Decide if a server may load personal vCard fields for page metadata. */
export function mayReadVCardMetadata(validSignature:boolean,cardActive:boolean,userActive:boolean):boolean {
  return validSignature && cardActive && userActive;
}
