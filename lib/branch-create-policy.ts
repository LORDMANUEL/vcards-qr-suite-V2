/** Company is mandatory for new branches; imported orphan branches are reconciled separately. */
export type ValidRegistration = { ok:true; companyId:string; name:string; city:string } | {ok:false;error:string};
export function validBranchRegistration(body: unknown): ValidRegistration {
 if(!body || typeof body!=='object' || Array.isArray(body)) return {ok:false,error:'Datos de sucursal inválidos'};
 const b=body as Record<string,unknown>;
 if(typeof b.companyId!=='string'||!b.companyId.trim()) return {ok:false,error:'Seleccione una empresa válida'};
 if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>120) return {ok:false,error:'Nombre de sucursal requerido (máximo 120 caracteres)'};
 if(typeof b.city!=='string'||!b.city.trim()||b.city.trim().length>100) return {ok:false,error:'Ciudad requerida (máximo 100 caracteres)'};
 return {ok:true,companyId:b.companyId.trim(),name:b.name.trim(),city:b.city.trim()};
}
