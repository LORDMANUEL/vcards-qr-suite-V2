type CompanyThemeRecord={id:string;category:string;companyId:string|null};
export function isUnusedCompanyTheme(themes:CompanyThemeRecord[], ids:string[], companiesUsing:number, branchesUsing:number):boolean {
 if(themes.length!==ids.length || companiesUsing!==0 || branchesUsing!==0) return false;
 return themes.every(theme=>theme.category==='VCARD' && !theme.companyId && ids.includes(theme.id));
}
