/** Detailed network identifiers are available only to authorized admins. */
export function redactScanDetails<T extends {ipAddress?:string|null;userAgent?:string|null}>(
  scan:T, administrator:boolean
):T {
  if(administrator)return scan;
  return {...scan,ipAddress:null,userAgent:null};
}
