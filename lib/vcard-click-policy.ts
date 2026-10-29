const allowed = new Set(['tel','email','wa','download','share','sms','web','link','location']);
export type ClickEvent={ok:true;vcardId:string;actionType:string}|{ok:false;error:string};
export function validClickEvent(input:unknown):ClickEvent{
 if(!input || typeof input!=='object' || Array.isArray(input))return {ok:false,error:'JSON inválido'};
 const b=input as Record<string,unknown>;
 if(typeof b.vcardId!=='string'|| !/^[a-zA-Z0-9_-]{8,128}$/.test(b.vcardId))return {ok:false,error:'vcardId inválido'};
 if(typeof b.actionType!=='string'||!allowed.has(b.actionType))return {ok:false,error:'Acción no reconocida'};
 return {ok:true,vcardId:b.vcardId,actionType:b.actionType};
}
