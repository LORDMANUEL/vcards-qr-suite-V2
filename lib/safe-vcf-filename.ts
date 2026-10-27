/** HTTP Content-Disposition filenames must not contain user-controlled headers. */
export function safeVcfFilename(name: string | null | undefined): string {
  const clean = String(name || 'contacto')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9_-]+/g,'-').replace(/^-+|-+$/g,'')
    .slice(0,64).replace(/-+$/g,'');
  return (clean || 'contacto') + '.vcf';
}
