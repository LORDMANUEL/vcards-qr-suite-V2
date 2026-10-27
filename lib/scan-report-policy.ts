/** Full scan logs can contain IP/device details; scope by actual Branch FK. */
export function canReadScanReport(role:string|null|undefined,viewerBranchId:string|null|undefined,cardBranchId:string|null|undefined):boolean{
 if(['ADMIN','IT','SUPER_ADMIN'].includes(role||'')) return true;
 return Boolean(viewerBranchId && cardBranchId && viewerBranchId===cardBranchId);
}
