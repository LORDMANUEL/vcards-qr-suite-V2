type Actor={admin:boolean;companyId:string|null};
type Theme={companyId:string|null;category:string;isActive?:boolean};
export function canReadTheme(actor:Actor,theme:Theme):boolean {
 return actor.admin || Boolean(actor.companyId && (
   theme.companyId===actor.companyId || (theme.companyId===null && theme.isActive===true)
 ));
}
export function canWriteTheme(actor:Actor,theme:Theme):boolean {
 return actor.admin || Boolean(actor.companyId && theme.companyId===actor.companyId);
}
