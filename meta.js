const fs=require('fs');
const src=['core','mods1','mods2','mods3','mods4','mods5','mods6','sheet'].map(f=>fs.readFileSync(`src/${f}.js`,'utf8')).join('\n');
const {MODS,GROUPS,wsBuild}=new Function(src+'\nreturn {MODS,GROUPS,wsBuild};')();
const ws={};
for(const m of MODS) ws['mod:'+m.slug]=wsBuild('mod',m.slug,'mix',20);
for(let g=1;g<=8;g++) ws['grade:m'+g]=wsBuild('grade','m'+g,'g',20);
for(let g=1;g<=6;g++) ws['grade:n'+g]=wsBuild('grade','n'+g,'g',20);
for(let g=1;g<=6;g++) ws['grade:t'+g]=wsBuild('grade','t'+g,'g',20);
console.log(JSON.stringify({groups:GROUPS,ws,mods:MODS.map(m=>({slug:m.slug,title:m.title,short:m.short,group:m.group,grades:m.grades,desc:m.desc,seo:m.seo,levels:m.levels.map(l=>l.name)}))}));
