
function extractHost(value) {
  if (!value) return '';
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return value.toLowerCase().replace(/^https?:///, '').replace(/:\\d+$/, '');
  }
}
console.log("None:", extractHost(undefined));
console.log("Public URL:", extractHost("http://yctest.hopto.org"));
console.log("Auth URL:", extractHost("http://yctest.hopto.org"));
