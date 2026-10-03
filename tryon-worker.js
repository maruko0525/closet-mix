const TRYON_MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

export default {
  async fetch(request, env) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    };
    if (request.method === 'OPTIONS') return new Response(null,{status:204,headers:cors});
    const u = new URL(request.url);
    if (request.method === 'GET') return json({ok:true,service:'CLOSET MIX AI TRY-ON',version:'V6',aiBinding:!!env.AI,model:TRYON_MODEL},200,cors);
    if (request.method !== 'POST' || u.pathname !== '/tryon') return json({ok:false,error:'POST /tryon を使用してください。'},404,cors);
    try {
      if (!env.AI) throw new Error('Workers AI binding「AI」がありません。');
      const body = await request.json();
      const images = Array.isArray(body.images) ? body.images.slice(0,4) : [];
      if (images.length < 2) return json({ok:false,error:'服画像を2枚以上送ってください。'},400,cors);
      const items = Array.isArray(body.items) ? body.items.slice(0,4) : [];
      const form = new FormData();
      for (let i=0;i<images.length;i++) {
        const blob = dataUrlToBlob(images[i]);
        form.append(`input_image_${i}`, blob, `garment-${i}.jpg`);
      }
      const itemText = items.map((x,i)=>`image ${i}: ${x.category||'garment'}, brand ${x.brand||'unknown'}, color ${x.color||'unknown'}, ${x.memo||''}`).join('\n');
      form.append('prompt', `Create a realistic clean fashion e-commerce virtual try-on image. Put ALL garments from the reference images onto ONE neutral faceless matte-white full-body shop mannequin, front view, standing naturally in a minimal warm light-gray studio. Preserve each garment's actual color, pattern, graphics, silhouette and distinctive details as faithfully as possible. Fit and drape the garments naturally on the mannequin: outerwear over tops, tops on torso, pants/skirt at waist and legs, shoes on feet, bag as accessory. Do not invent extra clothing, logos, text, accessories, or layers. Do not show separate product photos. The final image must look like one mannequin is genuinely wearing the selected outfit, with realistic folds, scale, overlap, sleeves, waist and hems. Full body centered, catalog photography, no human face, no text.\n\nReference mapping:\n${itemText}`);
      form.append('width','768'); form.append('height','1024'); form.append('guidance','4');
      const fr = new Response(form);
      const resp = await env.AI.run(TRYON_MODEL,{multipart:{body:fr.body,contentType:fr.headers.get('content-type')}});
      const b64 = resp?.image || resp?.result?.image;
      if (!b64) throw new Error('画像生成結果を取得できませんでした。');
      return json({ok:true,image:`data:image/jpeg;base64,${b64}`,model:TRYON_MODEL},200,cors);
    } catch(e) {
      console.error('TRYON V6 ERROR',e?.stack||e?.message||String(e));
      return json({ok:false,error:'AI試着画像の生成中にエラーが発生しました。',details:e?.message||String(e)},500,cors);
    }
  }
};
function dataUrlToBlob(s){
  if(typeof s!=='string'||!/^data:image\//.test(s)) throw new Error('画像形式が正しくありません。');
  const [head,b64]=s.split(','); const type=(head.match(/^data:([^;]+)/)||[])[1]||'image/jpeg';
  const bin=atob(b64); const arr=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++)arr[i]=bin.charCodeAt(i); return new Blob([arr],{type});
}
function json(data,status,cors){return new Response(JSON.stringify(data),{status,headers:{...cors,'Content-Type':'application/json; charset=UTF-8'}})}
