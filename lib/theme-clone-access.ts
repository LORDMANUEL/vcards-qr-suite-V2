/** A scoped designer must not clone other brands' private published themes. */
export function canCloneThemeInCompany(admin:boolean,viewerCompanyId:string|null|undefined,sourceCompanyId:string|null|undefined):boolean {
 if(admin)return true;
 if(!viewerCompanyId)return false;
 return !sourceCompanyId || sourceCompanyId===viewerCompanyId;
}
