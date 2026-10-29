import { canBulkImportVcards,canManageSystemUsers } from './permissions';
type Policy={ok:true;kind:'all'|'system'|'vcard';branchId?:string}|{ok:false;status:400|403;error:string};
export function usersDirectoryPolicy(kind:string,role:string,branchId?:string|null):Policy {
 if(!['all','system','vcard'].includes(kind)) return {ok:false,status:400,error:'Tipo de directorio desconocido'};
 const admin=canManageSystemUsers(role);
 if((kind==='system'||kind==='all')&&!admin) return {ok:false,status:403,error:'No autorizado para usuarios de sistema'};
 if(kind==='vcard'&&!canBulkImportVcards(role))return {ok:false,status:403,error:'Sin permisos para ver asesores'};
 if(!admin&&!branchId)return {ok:false,status:403,error:'Sin sucursal asignada'};
 return {ok:true,kind:kind as 'all'|'system'|'vcard',...(admin?{}:{branchId:branchId!})};
}
