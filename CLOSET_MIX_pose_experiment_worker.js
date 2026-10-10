/* CLOSET MIX — SEPARATE EXPERIMENTAL WORKER ONLY. Do not deploy over production. */
const VERSION='OUTFIT-POSE-EXPERIMENT-1';
const MODEL='@cf/black-forest-labs/flux-2-klein-4b';
const ROOT='https://raw.githubusercontent.com/maruko0525/closet-mix/main/poses/';
const POSES=['A01_EXTREME_S.jpg','A02_FACE_FRAME.jpg','A03_BROKEN_CONTRAPPOSTO.jpg','A06_CROSS_TWIST.jpg','A09_ELBOW_CROWN.jpg','A10_DIAGONAL_KING.jpg','A11_CHEST_OPEN_TWIST.jpg','A13_DOUBLE_ARC.jpg','A15_ULTIMATE_SCULPTURE.jpg','B02_FACE_FRAME_ALT.jpg','B04_BACK_ARCH.jpg','B06_CROSS_TWIST_ALT.jpg','B09_ELBOW_CROWN_ALT.jpg','B13_DOUBLE_ARC_ALT.jpg','B14_IMPOSSIBLE_BALANCE.jpg'];
const CORS={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
const json=(o,status=200)=>new Response(JSON.stringify(o),{status,headers:{...CORS,'Content-Type':'application/json'}});
function blob(data){const m=String(data||'').match(/^data:(image\/[\w.+-]+);base64,(.+)$/s);if(!m)throw Error('画像形式が不正です');const raw=atob(m[2]);const bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return new Blob([bytes],{type:m[1]})}
export default {async fetch(req,env){
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers:CORS});
 if(req.method==='GET')return json({ok:true,version:VERSION,aiBinding:!!env.AI,poses:POSES});
 if(req.method!=='POST'||new URL(req.url).pathname!=='/tryon')return json({ok:false,error:'POST /tryon only'},405);
 try{
  if(!env.AI)throw Error('AI binding が未設定です');
  const data=await req.json();const pose=POSES.includes(data.pose)?data.pose:POSES[0];
  if(!Array.isArray(data.images)||data.images.length<2||!data.outfit)throw Error('上の服、パンツ、組み合わせ画像が必要です');
  const r=await fetch(ROOT+encodeURIComponent(pose));if(!r.ok)throw Error('ポーズ画像の取得に失敗: '+r.status);
  const reference=await r.blob();if(!reference.type.startsWith('image/'))throw Error('ポーズ画像が画像形式ではありません');
  const top=data.items?.[0]||{},bottom=data.items?.[1]||{};
  const prompt=`Create one photorealistic full-body fashion mannequin image. IMAGE 0 is the ONLY pose and mannequin reference. Preserve its exact head, arm, elbow, hand, hip, knee and foot positions, black mannequin surface and full-body framing. IMAGE 1 is the original UPPER garment, IMAGE 2 is the original PANTS, IMAGE 3 is an outfit layout reference (it may contain photographic backgrounds; ignore those backgrounds). Dress the mannequin in both original garments. UPPER garment: ${String(top.category||'long-sleeved outerwear').slice(0,90)}, ${String(top.color||'use photo').slice(0,90)}. PANTS: ${String(bottom.category||'full-length trousers').slice(0,90)}, ${String(bottom.color||'use photo').slice(0,90)}. CRITICAL: both arms must be fully covered by the original upper garment's LONG SLEEVES from shoulders through elbows to wrists; no sleeveless garment, no rolled sleeves, no exposed forearms. CRITICAL: both legs must wear FULL-LENGTH TROUSERS from waist to ankles; never shorts, never exposed thighs or knees, never omit the pants. Do not alter the jacket color or denim color. Do not add a shirt, tank top, accessories, or extra clothing. Keep the original garment colors, seams, pockets and proportions. Preserve the pose even when the arm is raised. Plain light gray studio background, no text, single mannequin, realistic catalog photography.`;
  const form=new FormData();form.append('prompt',prompt);form.append('input_image_0',reference,'POSE.jpg');form.append('input_image_1',blob(data.images[0]),'TOP.jpg');form.append('input_image_2',blob(data.images[1]),'PANTS.jpg');form.append('input_image_3',blob(data.outfit),'OUTFIT.jpg');form.append('width','768');form.append('height','1024');
  const multipart=new Response(form);
  const result=await env.AI.run(MODEL,{multipart:{body:multipart.body,contentType:multipart.headers.get('content-type')}});
  let image=result?.image;if(typeof image!=='string'||!image)throw Error('AIが画像を返しませんでした');if(!image.startsWith('data:'))image='data:image/jpeg;base64,'+image;
  return json({ok:true,version:VERSION,pose,image});
 }catch(e){console.error(e);return json({ok:false,version:VERSION,error:e.message||String(e)},500)}
 }};
