type ThemeRecord = {id:string;companyId:string|null;category:string};
type ThemeRequest = {id:string;category:string};
export function themeAssignmentAllowed(records:ThemeRecord[],requested:ThemeRequest[],companyId:string):boolean {
  const found=new Map(records.map(t=>[t.id,t]));
  return requested.every(r=>{
    const theme=found.get(r.id);
    return Boolean(theme && theme.category===r.category && (!theme.companyId || theme.companyId===companyId));
  });
}
