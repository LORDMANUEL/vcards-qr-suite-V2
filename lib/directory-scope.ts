/** Only explicit administrators may browse all companies and branches. */
export function scopedDirectoryBranchId(role:string|null|undefined,branchId:string|null|undefined):string|null|undefined{
 if(['ADMIN','IT','SUPER_ADMIN'].includes(role||''))return undefined;
 return branchId || null;
}
export function isScopedDirectoryAllowed(result:string|null|undefined):boolean{return result!==null;}
