/** A QR event must prove the signed public token; direct visits remain legacy compatible. */
export function scanRequiresValidSignature(scanMethod:string):boolean{return scanMethod==='QR';}
