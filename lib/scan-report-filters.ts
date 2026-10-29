/** Keep counts, byDevice and byDate on exactly the same scan window. */
export function scanReportWhere(query:{from?:Date;to?:Date}):{from?:Date;to?:Date}{
  if(query.from && query.to && query.from>=query.to)throw new Error('Inverted report window');
  return { ...(query.from?{from:query.from}:{}), ...(query.to?{to:query.to}:{}) };
}
