const ROLES=new Set(['SUPER_ADMIN','ADMIN','IT','MARKETING','MARKETING_MANAGER','SAC','SALES_MANAGER','ADVISOR']);
const PROTECTED=new Set(['SUPER_ADMIN','ADMIN','IT']);
type Edit={actorId:string;actorRole:string;targetId:string;currentRole:string;currentSystem:boolean;requestedRole?:unknown;requestedSystem?:unknown;requestedActive?:unknown};
export function validateUserPrivilegeChange(e:Edit):string|null {
 if(e.requestedRole!==undefined && (typeof e.requestedRole!=='string' || !ROLES.has(e.requestedRole)))return 'Rol de usuario inválido';
 if(e.requestedSystem!==undefined && typeof e.requestedSystem!=='boolean')return 'Tipo de cuenta inválido';
 if(e.requestedActive!==undefined && typeof e.requestedActive!=='boolean')return 'Estado de cuenta inválido';
 if(e.actorId===e.targetId && (
   (e.requestedRole!==undefined && e.requestedRole!==e.currentRole) ||
   e.requestedActive===false || (e.requestedSystem!==undefined && e.requestedSystem!==e.currentSystem)
 ))return 'No puede cambiar su propio rol, condición de sistema o desactivar su cuenta';
 if(e.actorRole!=='SUPER_ADMIN' && (PROTECTED.has(e.currentRole) ||
   (typeof e.requestedRole==='string' && PROTECTED.has(e.requestedRole)) ||
   e.currentSystem || e.requestedSystem===true))return 'Solo SUPER_ADMIN administra cuentas privilegiadas';
 return null;
}
