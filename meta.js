const fs=require('fs');
const src=['core','mods1','mods2'].map(f=>fs.readFileSync(`src/${f}.js`,'utf8')).join('\n');
const {MODS,GROUPS}=new Function(src+'\nreturn {MODS,GROUPS};')();
console.log(JSON.stringify({groups:GROUPS,mods:MODS.map(m=>({slug:m.slug,title:m.title,short:m.short,group:m.group,desc:m.desc,seo:m.seo,levels:m.levels.map(l=>l.name)}))}));
