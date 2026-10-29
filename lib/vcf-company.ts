/** Corporate brand is the ORG; a branch/city is not an independent company. */
export function vcfCompanyName(branch: {companyName?: string|null;name?:string|null}|null|undefined):string {
 const company=branch?.companyName?.trim();
 if(company)return company;
 return branch?.name?.trim() || 'Contacto digital';
}
