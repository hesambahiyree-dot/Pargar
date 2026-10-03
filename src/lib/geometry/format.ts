const faDigits = "۰۱۲۳۴۵۶۷۸۹";
export function faNum(n:number,digits=1):string { const rounded=Number.isFinite(n)?n:0; const s=new Intl.NumberFormat("en-US",{minimumFractionDigits:0,maximumFractionDigits:digits}).format(rounded); return s.replace(/\d/g,d=>faDigits[Number(d)]??d).replace(".","٫"); }
export function faInt(n:number):string{return faNum(Math.round(n),0)}
export const POINT_NAMES="ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export function nextPointName(existing:string[]):string{const used=new Set(existing);for(const n of POINT_NAMES)if(!used.has(n))return n;for(let i=1;i<40;i++)for(const n of POINT_NAMES){const name=`${n}${i}`;if(!used.has(name))return name;}return `P${existing.length+1}`}
