(function(root){
 const username=v=>String(v||'').trim().toLowerCase();
 function loginEmail(v){const id=username(v);return id.includes('@')?id:/^[a-z][a-z0-9._-]{2,31}$/.test(id)?id+'@teachers.point-party.invalid':null;}
 function mergeMissing(cloud,device){
  const next=JSON.parse(JSON.stringify(cloud||{}));next.roster=next.roster||{};next.classes=next.classes||{};
  const added=[];
  for(const [id,roster] of Object.entries(device?.roster||{}))if(!Object.hasOwn(next.roster,id)){
   next.roster[id]=JSON.parse(JSON.stringify(roster));next.classes[id]=JSON.parse(JSON.stringify(device.classes?.[id]||{}));added.push(id);
  }
  return {data:next,added};
 }
 const api={username,loginEmail,mergeMissing};root.AccountCore=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
