const roles=new Set(['SUPER_ADMIN','ADMIN','IT','MARKETING','MARKETING_MANAGER','SAC','SALES_MANAGER','ADVISOR']);
type Created={ok:true;email:string;name:string;role:string;branchId:string|null;isSystemUser:boolean};
type Bad={ok:false;status:400|403;error:string};
export function secureUserCreation(input:unknown,actorRole:string,actorBranch?:string|null):Created|Bad {
 if(!input||typeof input!=='object'||Array.isArray(input))return {ok:false,status:400,error:'Datos inválidos'};
 const b=input as Record<string,unknown>;
 const email=typeof b.email==='string'?b.email.trim().toLowerCase():'';
 const name=typeof b.name==='string'?b.name.trim():'';
 if(!name||name.length>160||!/^\S+@\S+\.\S+$/.test(email)||email.length>254)return {ok:false,status:400,error:'Nombre o correo inválido'};
 const role=b.role===undefined?'ADVISOR':b.role;
 if(typeof role!=='string'||!roles.has(role))return {ok:false,status:400,error:'Rol inválido'};
 const isSystemUser=b.isSystemUser===undefined?true:b.isSystemUser;
 if(typeof isSystemUser!=='boolean')return {ok:false,status:400,error:'Tipo de usuario inválido'};
 const admin=['ADMIN','IT','SUPER_ADMIN'].includes(actorRole);
 const fullAdmin=actorRole==='SUPER_ADMIN';
 if(!admin && (!['MARKETING','MARKETING_MANAGER','SALES_MANAGER'].includes(actorRole)||isSystemUser||role!=='ADVISOR'))
    return {ok:false,status:403,error:'Permiso insuficiente para crear cuenta'};
 if(!fullAdmin && ['SUPER_ADMIN','ADMIN','IT'].includes(role))return {ok:false,status:403,error:'Solo SUPER_ADMIN puede crear cuentas privilegiadas'};
 const branchId=typeof b.branchId==='string'&&b.branchId.trim()?b.branchId.trim():null;
 if(!admin && (!actorBranch||branchId!==actorBranch))return {ok:false,status:403,error:'Solo puede crear asesores en su sucursal'};
 return {ok:true,email,name,role,branchId,isSystemUser};
}
