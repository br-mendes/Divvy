"use strict";(()=>{var e={};e.id=4253,e.ids=[4253],e.modules={20399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},75147:(e,t,o)=>{o.r(t),o.d(t,{originalPathname:()=>f,patchFetch:()=>x,requestAsyncStorage:()=>u,routeModule:()=>l,serverHooks:()=>m,staticGenerationAsyncStorage:()=>g});var a={};o.r(a),o.d(a,{POST:()=>c});var r=o(49303),n=o(88716),i=o(60670),s=o(87070),d=o(30474),p=o(36119);async function c(e){try{let t=(0,d.f)(),{transactionId:o,userId:a}=await e.json(),{data:r,error:n}=await t.from("transactions").select("*").eq("id",o).single();if(n||!r)throw Error("Transa\xe7\xe3o n\xe3o encontrada");if(r.touserid!==a)return s.NextResponse.json({error:"Apenas o recebedor pode rejeitar."},{status:403});let{error:i}=await t.from("transactions").update({status:"rejected",updatedat:new Date().toISOString()}).eq("id",o);if(i)throw i;let{data:c}=await t.from("userprofiles").select("email").eq("id",r.fromuserid).single(),{data:l}=await t.from("userprofiles").select("fullname, displayname").eq("id",r.touserid).single(),{data:u}=await t.from("divvies").select("name").eq("id",r.divvyid).single(),g=l?.displayname||l?.fullname||"Credor";return await t.from("notifications").insert({user_id:r.fromuserid,divvy_id:r.divvyid,type:"settlement",title:"Pagamento Recusado",message:`${g} recusou seu registro de pagamento de R$ ${r.amount.toFixed(2)}.`,created_at:new Date().toISOString(),is_read:!1}),c?.email&&await (0,p.J2)(c.email,g,r.amount.toFixed(2),u?.name||"Grupo"),s.NextResponse.json({success:!0},{status:200})}catch(e){return s.NextResponse.json({error:e.message},{status:500})}}let l=new r.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/payments/reject/route",pathname:"/api/payments/reject",filename:"route",bundlePath:"app/api/payments/reject/route"},resolvedPagePath:"C:\\Users\\bruno\\Documents\\GitHub\\Divvy\\app\\api\\payments\\reject\\route.ts",nextConfigOutput:"export",userland:a}),{requestAsyncStorage:u,staticGenerationAsyncStorage:g,serverHooks:m}=l,f="/api/payments/reject/route";function x(){return(0,i.patchFetch)({serverHooks:m,staticGenerationAsyncStorage:g})}},36119:(e,t,o)=>{o.d(t,{F1:()=>d,J2:()=>p,hx:()=>i,j1:()=>s,sI:()=>n});var a=o(30805);async function r(e){try{let t=`${(0,a.A)()}/api/send-email`,o=await fetch(t,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(e)}),r=await o.json();if(!o.ok)throw Error(r.error||"Error sending email");return r}catch(e){throw console.error("Email sending failed:",e),e}}async function n(e,t,o,a,n){let i=`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9fafb; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 40px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
          .header { background: #7c3aed; color: white; padding: 30px 20px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .content { padding: 40px 30px; text-align: center; }
          .content p { font-size: 16px; color: #4b5563; margin-bottom: 24px; }
          .button { display: inline-block; padding: 14px 28px; background: #7c3aed; color: white !important; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.2s; }
          .button:hover { background: #6d28d9; }
          .footer { background: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; }
          .qr-container { margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 12px; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Voc\xea foi convidado! 🎉</h1>
          </div>
          <div class="content">
            <p>Ol\xe1!</p>
            <p><strong>${o}</strong> convidou voc\xea para participar do grupo de despesas <strong>"${t}"</strong> no Divvy.</p>
            
            <a href="${a}" class="button">Aceitar Convite</a>
            
            ${n?`
              <div style="margin-top: 30px;">
                <p style="font-size: 14px; margin-bottom: 10px;">Ou escaneie com seu celular:</p>
                <div class="qr-container">
                  <img src="${n}" width="150" height="150" alt="QR Code" style="display: block;" />
                </div>
              </div>
            `:""}
            
            <p style="font-size: 12px; margin-top: 30px;">Este link expira em 7 dias.</p>
          </div>
          <div class="footer">
            <p>\xa9 2026 Divvy. Gest\xe3o inteligente de despesas.</p>
          </div>
        </div>
      </body>
    </html>
  `;return await r({to:e,subject:`${o} convidou voc\xea para ${t} no Divvy`,html:i})}async function i(e,t,o,a,n){let i=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
      <h2 style="color: #1f2937;">Nova despesa em ${t} 💸</h2>
      <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Valor:</strong> <span style="font-size: 18px; color: #059669;">R$ ${o}</span></p>
        <p style="margin: 5px 0;"><strong>Descri\xe7\xe3o:</strong> ${a}</p>
        <p style="margin: 5px 0;"><strong>Pago por:</strong> ${n}</p>
      </div>
      <p style="color: #666; font-size: 14px;">Acesse o app para ver os detalhes e seu saldo atualizado.</p>
    </div>
  `;return await r({to:e,subject:`Nova despesa de R$ ${o} em ${t}`,html:i})}async function s(e,t,o,a){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #1f2937;">Pagamento Enviado 💰</h2>
      <p><strong>${t}</strong> marcou um pagamento de <strong>R$ ${o}</strong> para voc\xea no grupo <strong>${a}</strong>.</p>
      <p>Por favor, verifique se recebeu o valor e confirme no app.</p>
      <div style="margin-top: 20px; padding: 15px; background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; color: #92400e;">
        Acesse o Divvy para confirmar ou recusar.
      </div>
    </div>
  `;return await r({to:e,subject:`${t} enviou R$ ${o} no Divvy`,html:n})}async function d(e,t,o,a){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #059669;">Pagamento Confirmado ✅</h2>
      <p><strong>${t}</strong> confirmou o recebimento do seu pagamento de <strong>R$ ${o}</strong> no grupo <strong>${a}</strong>.</p>
      <p>Sua d\xedvida foi atualizada.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${o} confirmado por ${t}`,html:n})}async function p(e,t,o,a){let n=`
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #dc2626;">Pagamento Recusado ❌</h2>
      <p><strong>${t}</strong> recusou seu registro de pagamento de <strong>R$ ${o}</strong> no grupo <strong>${a}</strong>.</p>
      <p>Entre em contato com o membro para resolver a pend\xeancia.</p>
    </div>
  `;return await r({to:e,subject:`Pagamento de R$ ${o} recusado por ${t}`,html:n})}},30805:(e,t,o)=>{o.d(t,{A:()=>a});let a=()=>{let e=process.env.NEXT_PUBLIC_SITE_URL||process.env.NEXT_PUBLIC_VERCEL_URL||"http://localhost:3000";return(e=e.startsWith("http")?e:`https://${e}`).replace(/\/$/,"")}},30474:(e,t,o)=>{o.d(t,{f:()=>i});var a=o(37857);let r="https://jpgifiumxqzbroejhudc.supabase.co",n=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!r)throw Error("Missing env NEXT_PUBLIC_SUPABASE_URL");if(!n)throw Error("Missing env SUPABASE_SERVICE_ROLE_KEY");let i=()=>(0,a.eI)(r,n,{auth:{autoRefreshToken:!1,persistSession:!1}})}};var t=require("../../../../webpack-runtime.js");t.C(e);var o=e=>t(t.s=e),a=t.X(0,[9276,5972,7857],()=>o(75147));module.exports=a})();