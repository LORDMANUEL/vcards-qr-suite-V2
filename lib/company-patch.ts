/** Strict partial Company patch: omitted fields preserve previous corporate state. */
export type CompanyPatch={name?:string;slug?:string|null;logoUrl?:string|null;primaryColor?:string;secondaryColor?:string};
export function companyPatch(value:unknown):CompanyPatch|null{
 if(!value || typeof value!=='object'||Array.isArray(value))return null;
 const b=value as Record<string,unknown>, out:CompanyPatch={};
 if(b.name!==undefined){if(typeof b.name!=='string'||!b.name.trim()||b.name.trim().length>160)return null;out.name=b.name.trim();}
 if(b.slug!==undefined){if(b.slug!==null && typeof b.slug!=='string')return null;out.slug=b.slug===null?null:String(b.slug).trim()||null;}
 if(b.logoUrl!==undefined){if(b.logoUrl!==null && typeof b.logoUrl!=='string')return null;out.logoUrl=b.logoUrl===null?null:String(b.logoUrl).trim()||null;}
 for(const field of ['primaryColor','secondaryColor'] as const){if(b[field]!==undefined){if(typeof b[field]!=='string'||!/^#[0-9a-fA-F]{6}$/.test(String(b[field])))return null;out[field]=b[field] as string;}}
 return Object.keys(out).length?out:null;
}
